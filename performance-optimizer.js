#!/usr/bin/env node

/**
 * Performance Optimization Tool
 * Analyzes bundle size, finds unused components, and optimizes assets
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Starting performance optimization analysis...\n');

const optimizations = [];
let bundleSizeIssues = 0;
let unusedAssets = 0;

// 1. Analyze Bundle Size
console.log('📦 Analyzing bundle composition...');
try {
  // Check if we have large dependencies that could be tree-shaken
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const heavyDeps = [
    '@radix-ui', 'framer-motion', 'recharts', 'stripe', 
    'cloudinary', 'nodemailer', 'bcryptjs'
  ];
  
  const installedHeavyDeps = Object.keys(packageJson.dependencies || {})
    .filter(dep => heavyDeps.some(heavy => dep.includes(heavy)));
  
  if (installedHeavyDeps.length > 0) {
    optimizations.push(`✅ Heavy dependencies found: ${installedHeavyDeps.join(', ')}`);
    optimizations.push(`💡 Consider lazy loading for: ${installedHeavyDeps.slice(0, 3).join(', ')}`);
  }
} catch (error) {
  optimizations.push('⚠️  Could not analyze package.json');
}

// 2. Find Unused Shadcn Components
console.log('🔍 Scanning for unused UI components...');
try {
  const uiComponentsDir = 'client/src/components/ui';
  const uiComponents = fs.readdirSync(uiComponentsDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => file.replace('.tsx', ''));
  
  const usedComponents = new Set();
  
  // Scan all source files for component usage
  const scanDir = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.includes('node_modules')) {
        scanDir(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for component imports and usage
          uiComponents.forEach(component => {
            const componentName = component.charAt(0).toUpperCase() + component.slice(1);
            if (content.includes(componentName) || content.includes(`/${component}`)) {
              usedComponents.add(component);
            }
          });
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
  };
  
  scanDir('client/src');
  
  const unusedUIComponents = uiComponents.filter(comp => !usedComponents.has(comp));
  
  if (unusedUIComponents.length > 0) {
    optimizations.push(`📉 Found ${unusedUIComponents.length} unused UI components:`);
    unusedUIComponents.slice(0, 5).forEach(comp => {
      optimizations.push(`   • ${comp}.tsx`);
    });
    unusedAssets += unusedUIComponents.length;
    
    if (unusedUIComponents.length > 5) {
      optimizations.push(`   • ... and ${unusedUIComponents.length - 5} more`);
    }
  } else {
    optimizations.push('✅ All UI components are being used');
  }
} catch (error) {
  optimizations.push('⚠️  Could not scan UI components directory');
}

// 3. Check for Large Static Assets
console.log('🖼️  Analyzing static assets...');
try {
  const checkAssetDir = (dir) => {
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const largeAssets = [];
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        largeAssets.push(...checkAssetDir(fullPath));
      } else if (file.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          const sizeInMB = stats.size / (1024 * 1024);
          
          if (sizeInMB > 1) { // Files larger than 1MB
            largeAssets.push({
              path: fullPath,
              size: sizeInMB.toFixed(2)
            });
          }
        } catch (err) {
          // Skip files that can't be analyzed
        }
      }
    }
    
    return largeAssets;
  };
  
  const assetDirs = ['public', 'attached_assets'];
  let allLargeAssets = [];
  
  assetDirs.forEach(dir => {
    allLargeAssets.push(...checkAssetDir(dir));
  });
  
  if (allLargeAssets.length > 0) {
    optimizations.push(`📊 Found ${allLargeAssets.length} large assets (>1MB):`);
    allLargeAssets.slice(0, 3).forEach(asset => {
      optimizations.push(`   • ${asset.path} (${asset.size}MB)`);
    });
    bundleSizeIssues += allLargeAssets.length;
    
    optimizations.push('💡 Consider image optimization or lazy loading');
  } else {
    optimizations.push('✅ No large static assets found');
  }
} catch (error) {
  optimizations.push('⚠️  Could not analyze static assets');
}

// 4. Check TypeScript Compilation Performance
console.log('⚡ Checking TypeScript performance...');
try {
  const tsconfigPath = 'tsconfig.json';
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    const perfOptimizations = [];
    
    if (!tsconfig.compilerOptions?.incremental) {
      perfOptimizations.push('Enable incremental compilation');
    }
    if (!tsconfig.compilerOptions?.skipLibCheck) {
      perfOptimizations.push('Enable skipLibCheck');
    }
    if (tsconfig.compilerOptions?.strict !== true) {
      perfOptimizations.push('Consider enabling strict mode for better optimization');
    }
    
    if (perfOptimizations.length > 0) {
      optimizations.push('⚡ TypeScript performance suggestions:');
      perfOptimizations.forEach(opt => {
        optimizations.push(`   • ${opt}`);
      });
    } else {
      optimizations.push('✅ TypeScript configuration optimized');
    }
  }
} catch (error) {
  optimizations.push('⚠️  Could not analyze TypeScript configuration');
}

// 5. Database Query Performance Check
console.log('🗄️  Checking database query patterns...');
try {
  const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
  
  const queryIssues = [];
  
  // Check for N+1 query patterns
  if (routesContent.includes('forEach') && routesContent.includes('await')) {
    queryIssues.push('Potential N+1 queries in loops');
  }
  
  // Check for missing pagination
  if (routesContent.includes('db.select()') && !routesContent.includes('limit(')) {
    queryIssues.push('Consider adding pagination to large result sets');
  }
  
  // Check for indexing hints
  if (routesContent.includes('eq(') || routesContent.includes('where(')) {
    queryIssues.push('Verify database indexes for WHERE clauses');
  }
  
  if (queryIssues.length > 0) {
    optimizations.push('🗄️  Database optimization opportunities:');
    queryIssues.forEach(issue => {
      optimizations.push(`   • ${issue}`);
    });
  } else {
    optimizations.push('✅ Database queries appear optimized');
  }
} catch (error) {
  optimizations.push('⚠️  Could not analyze database queries');
}

// Display Results
console.log('\n📋 Performance Optimization Results:');
console.log('=' .repeat(60));

optimizations.forEach(opt => {
  console.log(`  ${opt}`);
});

console.log('\n📊 Performance Summary:');
console.log(`  📦 Bundle optimization opportunities: ${bundleSizeIssues}`);
console.log(`  🗑️  Unused assets found: ${unusedAssets}`);
console.log(`  ⚡ Performance improvements available: ${optimizations.filter(o => o.includes('💡')).length}`);

// Recommendations
console.log('\n🎯 Immediate Action Items:');

if (unusedAssets > 0) {
  console.log('  1. Remove unused UI components to reduce bundle size');
}

if (bundleSizeIssues > 0) {
  console.log('  2. Optimize or compress large static assets');
}

console.log('  3. Implement lazy loading for heavy components');
console.log('  4. Add compression middleware (✅ Already implemented!)');
console.log('  5. Consider code splitting for admin vs public routes');

console.log('\n💡 Next steps:');
console.log('  • Run this analysis weekly during development');
console.log('  • Monitor bundle size with build tools');
console.log('  • Profile database queries in production');
console.log('  • Set up performance monitoring');