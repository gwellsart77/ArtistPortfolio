import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number;
  type?: string;       // Product type: "originals", "prints", "merchandise"
  addedAt?: number;    // Timestamp when the item was added to cart
  expiresAt?: number;  // Timestamp when the item will be removed from cart (for original paintings)
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  addItemWithQuantity: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  checkExpiredItems: () => void; // Function to check for expired original paintings
  getTimeRemaining: (id: number) => number | null; // Get remaining time in seconds for an item
  hasExpiredItems: boolean; // Flag to track if there are recently expired items
  setHasExpiredItems: (value: boolean) => void; // Function to reset the flag
  recentlyExpiredItems: string[]; // Names of recently expired items
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasExpiredItems: false,
      recentlyExpiredItems: [],
      
      setHasExpiredItems: (value) => set({ hasExpiredItems: value }),
      
      addItem: (newItem) => set((state) => {
        const existingItemIndex = state.items.findIndex(
          (item) => item.id === newItem.id
        );
        
        if (existingItemIndex !== -1) {
          // If the item already exists, update the quantity
          const updatedItems = [...state.items];
          updatedItems[existingItemIndex].quantity += 1;
          return { ...state, items: updatedItems };
        } else {
          const now = Date.now();
          let expiresAt = undefined;
          
          // Set expiration time for original paintings (15 minutes)
          if (newItem.type === 'originals') {
            expiresAt = now + (15 * 60 * 1000); // 15 minutes in milliseconds
          }
          
          // Add a new item with quantity 1
          return { 
            ...state,
            items: [...state.items, { 
              ...newItem, 
              quantity: 1,
              addedAt: now,
              expiresAt: expiresAt
            }] 
          };
        }
      }),
      
      addItemWithQuantity: (newItem, quantity) => set((state) => {
        if (quantity <= 0) return state; // Guard against invalid quantities
        
        const existingItemIndex = state.items.findIndex(
          (item) => item.id === newItem.id
        );
        
        if (existingItemIndex !== -1) {
          // If the item already exists, add the new quantity
          const updatedItems = [...state.items];
          updatedItems[existingItemIndex].quantity += quantity;
          return { ...state, items: updatedItems };
        } else {
          const now = Date.now();
          let expiresAt = undefined;
          
          // Set expiration time for original paintings (15 minutes)
          if (newItem.type === 'originals') {
            expiresAt = now + (15 * 60 * 1000); // 15 minutes in milliseconds
          }
          
          // Add a new item with the specified quantity
          return { 
            ...state,
            items: [...state.items, { 
              ...newItem, 
              quantity,
              addedAt: now,
              expiresAt: expiresAt
            }] 
          };
        }
      }),
      
      removeItem: (id) => set((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== id)
      })),
      
      updateQuantity: (id, quantity) => set((state) => ({
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      })),
      
      clearCart: () => set({ items: [] }),
      
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      subtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      // Check for expired original paintings and remove them
      checkExpiredItems: () => {
        const { items } = get();
        const now = Date.now();
        const expiredItems = items.filter(
          item => item.expiresAt && item.expiresAt < now
        );
        
        // Remove expired items
        if (expiredItems.length > 0) {
          // Update the server about expired items to unblock inventory
          expiredItems.forEach(item => {
            fetch('/api/cart/release-reservation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: item.id })
            }).catch(err => console.error('Failed to release reservation:', err));
          });
          
          // Track the expired item names for notification
          const expiredItemNames = expiredItems.map(item => item.title);
          
          // Remove the items from the cart
          set(state => ({
            ...state,
            items: state.items.filter(item => !(item.expiresAt && item.expiresAt < now)),
            hasExpiredItems: true,
            recentlyExpiredItems: expiredItemNames
          }));
        }
      },
      
      // Return remaining time in seconds or null if no expiry
      getTimeRemaining: (id) => {
        const item = get().items.find(item => item.id === id);
        if (!item || !item.expiresAt) return null;
        
        const now = Date.now();
        const remaining = item.expiresAt - now;
        
        return remaining > 0 ? Math.floor(remaining / 1000) : 0;
      }
    }),
    {
      name: 'gabe-wells-cart',
      partialize: (state) => ({
        items: state.items,
        // Don't persist these UI state flags
        hasExpiredItems: false,
        recentlyExpiredItems: []
      }),
      // Set storage to localStorage to share cart between tabs
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
