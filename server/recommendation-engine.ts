import { db } from "./db";
import { 
  userPreferences, 
  userArtInteractions, 
  artSimilarity, 
  artworks, 
  products,
  type UserPreferences,
  type InsertUserPreferences,
  type InsertUserArtInteractions,
  type InsertArtSimilarity 
} from "@shared/schema";
import { eq, desc, and, or, inArray, sql, gt, lt } from "drizzle-orm";
import { recommendationCache, memoizeQuery } from "./utils/memory-optimizer";

export class RecommendationEngine {
  
  // Track user interaction with artwork
  async trackInteraction(data: InsertUserArtInteractions) {
    try {
      await db.insert(userArtInteractions).values(data);
      
      // Update user preferences based on interaction
      await this.updateUserPreferences(data.sessionId, data.artworkId, data.interactionType);
      
      return { success: true };
    } catch (error) {
      console.error("Error tracking interaction:", error);
      return { success: false, error };
    }
  }

  // Update user preferences based on interactions
  private async updateUserPreferences(sessionId: string, artworkId: number, interactionType: string) {
    try {
      // Get artwork details
      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId));

      if (!artwork) return;

      // Get or create user preferences
      let [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.sessionId, sessionId));

      if (!preferences) {
        [preferences] = await db
          .insert(userPreferences)
          .values({
            sessionId,
            favoriteCategories: [],
            priceRange: {},
            artStyles: [],
            colorPreferences: [],
            mediumPreferences: []
          })
          .returning();
      }

      // Calculate interaction weight (purchase > cart_add > like > view)
      const weights = {
        purchase: 1.0,
        cart_add: 0.7,
        like: 0.5,
        view: 0.1
      };
      const weight = weights[interactionType as keyof typeof weights] || 0.1;

      // Update favorite categories
      const categories = Array.isArray(preferences.favoriteCategories) 
        ? preferences.favoriteCategories as string[]
        : [];
      
      const categoryIndex = categories.findIndex((cat: any) => cat.category === artwork.category);
      if (categoryIndex >= 0) {
        categories[categoryIndex].score += weight;
      } else {
        categories.push({ category: artwork.category, score: weight });
      }

      // Update price range preferences
      const priceRange = preferences.priceRange as any || {};
      if (artwork.price) {
        priceRange.minSeen = Math.min(priceRange.minSeen || artwork.price, artwork.price);
        priceRange.maxSeen = Math.max(priceRange.maxSeen || artwork.price, artwork.price);
        priceRange.averageInteracted = (priceRange.averageInteracted || 0) * 0.9 + artwork.price * 0.1;
      }

      // Update medium preferences
      const mediums = Array.isArray(preferences.mediumPreferences)
        ? preferences.mediumPreferences as string[]
        : [];
      
      const mediumIndex = mediums.findIndex((med: any) => med.medium === artwork.medium);
      if (mediumIndex >= 0) {
        mediums[mediumIndex].score += weight;
      } else {
        mediums.push({ medium: artwork.medium, score: weight });
      }

      // Save updated preferences
      await db
        .update(userPreferences)
        .set({
          favoriteCategories: categories,
          priceRange,
          mediumPreferences: mediums,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.sessionId, sessionId));

    } catch (error) {
      console.error("Error updating user preferences:", error);
    }
  }

  // Get personalized recommendations
  async getRecommendations(sessionId: string, limit: number = 6) {
    try {
      console.log("🔍 DEBUG: Getting recommendations for sessionId:", sessionId, "limit:", limit);
      
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.sessionId, sessionId));

      console.log("🔍 DEBUG: Found user preferences:", !!preferences);

      if (!preferences) {
        // Return trending/featured artworks for new users
        console.log("🔍 DEBUG: No preferences found, getting trending recommendations");
        return this.getTrendingRecommendations(limit);
      }

      // Get user's interaction history
      const interactions = await db
        .select()
        .from(userArtInteractions)
        .where(eq(userArtInteractions.sessionId, sessionId))
        .orderBy(desc(userArtInteractions.createdAt))
        .limit(50);

      const viewedArtworkIds = interactions.map(i => i.artworkId);

      // Get category-based recommendations
      const categoryRecommendations = await this.getCategoryBasedRecommendations(
        preferences, 
        viewedArtworkIds, 
        Math.ceil(limit * 0.6)
      );

      // Get similarity-based recommendations
      const similarityRecommendations = await this.getSimilarityBasedRecommendations(
        viewedArtworkIds, 
        Math.ceil(limit * 0.4)
      );

      // Combine and deduplicate
      const combined = [...categoryRecommendations, ...similarityRecommendations];
      const unique = combined.filter((artwork, index, self) => 
        index === self.findIndex(a => a.id === artwork.id)
      );

      console.log("🔍 DEBUG: Personalized recommendations found:", unique.length);

      // If we don't have enough personalized recommendations, fill with featured/trending artworks
      if (unique.length < limit) {
        console.log("🔍 DEBUG: Not enough personalized recommendations, filling with featured artworks");
        const remainingLimit = limit - unique.length;
        const usedIds = unique.map(a => a.id);
        const featuredArtworks = await this.getTrendingRecommendations(remainingLimit, usedIds);
        console.log("🔍 DEBUG: Featured artworks found:", featuredArtworks.length);
        
        // Add featured artworks to the combined array
        const allRecommendations = [...unique, ...featuredArtworks];
        
        console.log("🔍 DEBUG: Final recommendations count:", allRecommendations.length);
        return allRecommendations.slice(0, limit);
      }

      console.log("🔍 DEBUG: Returning personalized recommendations:", unique.length);
      return unique.slice(0, limit);

    } catch (error) {
      console.error("Error getting recommendations:", error);
      return this.getTrendingRecommendations(limit);
    }
  }

  // Get recommendations based on user's favorite categories
  private async getCategoryBasedRecommendations(
    preferences: UserPreferences, 
    excludeIds: number[], 
    limit: number
  ) {
    try {
      const categories = Array.isArray(preferences.favoriteCategories)
        ? (preferences.favoriteCategories as any[])
        : [];

      if (categories.length === 0) {
        return this.getTrendingRecommendations(limit);
      }

      // Sort categories by score and get top categories
      const topCategories = categories
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => c.category);

      const recommendations = await db
        .select()
        .from(artworks)
        .where(
          and(
            inArray(artworks.category, topCategories),
            eq(artworks.available, true),
            excludeIds.length > 0 ? sql`${artworks.id} NOT IN (${sql.join(excludeIds, sql`, `)})` : sql`true`
          )
        )
        .orderBy(desc(artworks.featured), sql`RANDOM()`)
        .limit(limit);

      return recommendations;

    } catch (error) {
      console.error("Error getting category recommendations:", error);
      return [];
    }
  }

  // Get recommendations based on artwork similarity
  private async getSimilarityBasedRecommendations(viewedArtworkIds: number[], limit: number) {
    try {
      if (viewedArtworkIds.length === 0) {
        return [];
      }

      // Get most recently viewed artworks (last 5)
      const recentViews = viewedArtworkIds.slice(0, 5);

      const similarArtworks = await db
        .select({
          artwork: artworks,
          similarity: artSimilarity.similarityScore
        })
        .from(artSimilarity)
        .innerJoin(artworks, eq(artworks.id, artSimilarity.artworkId2))
        .where(
          and(
            inArray(artSimilarity.artworkId1, recentViews),
            gt(artSimilarity.similarityScore, 0.7),
            eq(artworks.available, true),
            sql`${artworks.id} NOT IN (${sql.join(viewedArtworkIds, sql`, `)})`
          )
        )
        .orderBy(desc(artSimilarity.similarityScore))
        .limit(limit);

      return similarArtworks.map(s => s.artwork);

    } catch (error) {
      console.error("Error getting similarity recommendations:", error);
      return [];
    }
  }

  // Get trending/featured recommendations for new users
  private async getTrendingRecommendations(limit: number, excludeIds: number[] = []) {
    try {
      console.log("🔍 DEBUG: Getting trending recommendations, limit:", limit, "excluding:", excludeIds.length);
      
      const whereConditions = [eq(artworks.available, true)];
      
      // Add exclusion condition if there are IDs to exclude
      if (excludeIds.length > 0) {
        whereConditions.push(sql`${artworks.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`);
      }
      
      const trending = await db
        .select({
          id: artworks.id,
          status: artworks.status,
          title: artworks.title,
          description: artworks.description,
          category: artworks.category,
          year: artworks.year,
          medium: artworks.medium,
          dimensions: artworks.dimensions,
          price: artworks.price,
          imageUrl: artworks.imageUrl,
          featured: artworks.featured,
          available: artworks.available,
          displayOrder: artworks.displayOrder,
          isLimitedEdition: artworks.isLimitedEdition,
          editionSize: artworks.editionSize,
          editionsSold: artworks.editionsSold,
          artistName: artworks.artistName,
          limitedEditionPrice: artworks.limitedEditionPrice,
          limitedEditionAvailable: artworks.limitedEditionAvailable,
          seoTitle: artworks.seoTitle,
          seoDescription: artworks.seoDescription,
          altText: artworks.altText,
          createdAt: artworks.createdAt
        })
        .from(artworks)
        .where(and(...whereConditions))
        .orderBy(desc(artworks.featured), sql`RANDOM()`)
        .limit(limit);

      console.log("🔍 DEBUG: Found trending artworks:", trending.length);
      if (trending.length > 0) {
        console.log("🔍 DEBUG: Sample trending artwork:", {
          id: trending[0].id,
          title: trending[0].title,
          available: trending[0].available,
          featured: trending[0].featured
        });
      }

      return trending;

    } catch (error) {
      console.error("Error getting trending recommendations:", error);
      return [];
    }
  }

  // Get "Because you viewed X" recommendations
  async getBecauseYouViewedRecommendations(artworkId: number, limit: number = 4) {
    try {
      const similar = await db
        .select({
          artwork: artworks,
          similarity: artSimilarity.similarityScore
        })
        .from(artSimilarity)
        .innerJoin(artworks, eq(artworks.id, artSimilarity.artworkId2))
        .where(
          and(
            eq(artSimilarity.artworkId1, artworkId),
            gt(artSimilarity.similarityScore, 0.6),
            eq(artworks.available, true)
          )
        )
        .orderBy(desc(artSimilarity.similarityScore))
        .limit(limit);

      return similar.map(s => s.artwork);

    } catch (error) {
      console.error("Error getting 'because you viewed' recommendations:", error);
      return [];
    }
  }

  // Build similarity matrix (run periodically)
  async buildSimilarityMatrix() {
    try {
      console.log("Building art similarity matrix...");
      
      const allArtworks = await db
        .select()
        .from(artworks)
        .where(eq(artworks.available, true));

      // Clear existing similarities
      await db.delete(artSimilarity);

      const similarities: InsertArtSimilarity[] = [];

      for (let i = 0; i < allArtworks.length; i++) {
        for (let j = i + 1; j < allArtworks.length; j++) {
          const artwork1 = allArtworks[i];
          const artwork2 = allArtworks[j];

          const score = this.calculateSimilarityScore(artwork1, artwork2);
          const factors = this.getSimilarityFactors(artwork1, artwork2);

          if (score > 0.3) { // Only store meaningful similarities
            similarities.push({
              artworkId1: artwork1.id,
              artworkId2: artwork2.id,
              similarityScore: score,
              factors
            });

            // Add reverse relationship
            similarities.push({
              artworkId1: artwork2.id,
              artworkId2: artwork1.id,
              similarityScore: score,
              factors
            });
          }
        }
      }

      // Batch insert similarities
      if (similarities.length > 0) {
        const batchSize = 1000;
        for (let i = 0; i < similarities.length; i += batchSize) {
          const batch = similarities.slice(i, i + batchSize);
          await db.insert(artSimilarity).values(batch);
        }
      }

      console.log(`Built similarity matrix with ${similarities.length} relationships`);
      return { success: true, relationships: similarities.length };

    } catch (error) {
      console.error("Error building similarity matrix:", error);
      return { success: false, error };
    }
  }

  // Calculate similarity score between two artworks
  private calculateSimilarityScore(artwork1: any, artwork2: any): number {
    let score = 0;
    let factors = 0;

    // Category similarity (weight: 0.4)
    if (artwork1.category === artwork2.category) {
      score += 0.4;
    }
    factors++;

    // Medium similarity (weight: 0.3)
    if (artwork1.medium === artwork2.medium) {
      score += 0.3;
    }
    factors++;

    // Price similarity (weight: 0.2)
    if (artwork1.price && artwork2.price) {
      const priceDiff = Math.abs(artwork1.price - artwork2.price);
      const avgPrice = (artwork1.price + artwork2.price) / 2;
      const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
      score += priceScore * 0.2;
    }
    factors++;

    // Year similarity (weight: 0.1)
    if (artwork1.year && artwork2.year) {
      const yearDiff = Math.abs(parseInt(artwork1.year) - parseInt(artwork2.year));
      const yearScore = Math.max(0, 1 - (yearDiff / 10)); // Normalize by decade
      score += yearScore * 0.1;
    }
    factors++;

    return score / factors;
  }

  // Get factors that make artworks similar
  private getSimilarityFactors(artwork1: any, artwork2: any): any {
    const factors: any = {};

    if (artwork1.category === artwork2.category) {
      factors.category = artwork1.category;
    }

    if (artwork1.medium === artwork2.medium) {
      factors.medium = artwork1.medium;
    }

    if (artwork1.price && artwork2.price) {
      const priceDiff = Math.abs(artwork1.price - artwork2.price);
      if (priceDiff < (artwork1.price + artwork2.price) * 0.2) {
        factors.priceRange = 'similar';
      }
    }

    return factors;
  }

  // Get user preferences for analytics
  async getUserPreferences(sessionId: string) {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.sessionId, sessionId));

      return preferences || null;

    } catch (error) {
      console.error("Error getting user preferences:", error);
      return null;
    }
  }
}

export const recommendationEngine = new RecommendationEngine();