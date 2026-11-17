import { useState, useEffect } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { displayTitle } from "@/lib/product-display";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const [, navigate] = useLocation();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    subtotal, 

    checkExpiredItems,
    hasExpiredItems,
    setHasExpiredItems,
    recentlyExpiredItems
  } = useCart();
  const [, setForceUpdate] = useState({});
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);

  // Check for expired items every second
  useEffect(() => {
    if (!isOpen) return;
    
    // Check expired items immediately when cart opens
    checkExpiredItems();
    
    // Then set up interval to check every second
    const intervalId = setInterval(() => {
      checkExpiredItems();
      // Force component update to refresh timers
      setForceUpdate({});
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isOpen, checkExpiredItems]);
  
  // Show expiration dialog when items expire
  useEffect(() => {
    if (hasExpiredItems && recentlyExpiredItems.length > 0) {
      setShowExpirationDialog(true);
      // Reset the flag after showing dialog
      setHasExpiredItems(false);
    }
  }, [hasExpiredItems, recentlyExpiredItems, setHasExpiredItems]);

  // Disable body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-8 text-left">
          <SheetTitle className="font-serif text-3xl font-medium">Your cart</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mb-8">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-serif text-2xl text-[#1b1a18]">Your cart is empty</p>
              <button
                type="button"
                onClick={() => { onClose(); window.location.href = '/shop'; }}
                className="mt-4 text-xs uppercase tracking-[0.14em] border-b border-[#8b6b3e] pb-1 text-[#1b1a18]"
              >
                Visit the shop
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(quantity) =>
                  updateQuantity(item.id, quantity)
                }
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <>
            <div className="border-t border-neutral-200 pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <Button 
                className="rounded-none h-12 bg-[#1b1a18] hover:bg-black text-white uppercase tracking-[0.16em] text-xs transition-colors"
                onClick={() => {
                  onClose();
                  window.location.href = '/checkout';
                }}
              >
                Checkout
              </Button>
              <Button
                variant="outline"
                className="rounded-none h-12 border-[#1b1a18] bg-transparent hover:bg-white uppercase tracking-[0.16em] text-xs transition-colors"
                onClick={onClose}
              >
                Keep browsing
              </Button>
              <Button
                variant="ghost"
                className="text-xs text-[#6e6a63] hover:text-[#1b1a18] mt-1 h-auto"
                onClick={clearCart}
              >
                Clear cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
      
      {/* Expiration Dialog for Timed Out Original Paintings */}
      <Dialog open={showExpirationDialog} onOpenChange={setShowExpirationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700 text-xl">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Time Limit Expired
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              <div className="space-y-4">
                <p><strong>Notice:</strong> The following original painting(s) have been removed from your cart due to the 15-minute time limit expiring:</p>
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                  <ul className="list-disc pl-5 text-red-700 space-y-1">
                    {recentlyExpiredItems.map((title, index) => (
                      <li key={index} className="font-medium">{title}</li>
                    ))}
                  </ul>
                </div>
                <p>
                  Original paintings have a 15-minute reservation time to ensure 
                  all customers have a fair opportunity to purchase unique artwork.
                </p>
                <p className="font-medium">
                  These items have been returned to inventory and are now available for purchase again.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-4">
            <Button 
              variant="secondary"
              className="sm:w-auto w-full"
              onClick={() => {
                setShowExpirationDialog(false);
                navigate("/shop");
              }}
            >
              Return to Shop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

interface CartItemProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  // Get time remaining for original paintings
  const { getTimeRemaining } = useCart();
  const timeRemaining = item.type === 'originals' ? getTimeRemaining(item.id) : null;
  

  
  return (
    <div className="flex border-b border-neutral-200 pb-4">
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-20 h-20 object-contain bg-[#efede8] mr-4"
      />
      <div className="flex-1">
        <h4 className="font-serif text-lg leading-snug">{displayTitle(item.title)}</h4>
        
        {/* Originals are held in the cart for 15 minutes */}
        {item.type === 'originals' && timeRemaining !== null && (
          <p className={`mt-1 text-xs ${timeRemaining < 120 ? 'text-[#8b3a2e]' : 'text-[#6e6a63]'}`} role="timer">
            Held for you · {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} left
          </p>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            <span className="mr-3">{formatCurrency(item.price)}</span>
            {item.type !== 'originals' && <div className="flex items-center border border-neutral-300 rounded">
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onUpdateQuantity(item.quantity + 1)}
              >
                +
              </Button>
            </div>}
          </div>
          <Button
            variant="ghost"
            className="text-sm text-neutral-700 hover:text-red-600 p-1 h-auto"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
