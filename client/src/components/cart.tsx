import { useState, useEffect } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { X, ShoppingBag, Trash2, CreditCard, Clock, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetClose,
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
        <SheetHeader className="flex items-center justify-between mb-8">
          <SheetTitle className="text-2xl font-serif">Your Cart</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" className="text-2xl p-1 h-auto">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="space-y-6 mb-8">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-700 text-lg">Your cart is empty</p>
              <p className="text-neutral-500 mt-2">
                Browse our shop to find beautiful artwork and merchandise.
              </p>
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
                className="bg-[#b8860b] hover:bg-opacity-90 text-white py-3 uppercase tracking-wider text-sm transition duration-200"
                onClick={() => {
                  onClose();
                  window.location.href = '/checkout';
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                className="border-primary hover:border-[#b8860b] hover:text-[#b8860b] py-3 uppercase tracking-wider text-sm transition duration-200"
                onClick={onClose}
              >
                Continue Shopping
              </Button>
              <Button
                variant="ghost"
                className="text-neutral-600 hover:text-red-600 mt-2"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
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
        className="w-20 h-20 object-cover mr-4"
      />
      <div className="flex-1">
        <h4 className="font-medium">{item.title}</h4>
        
        {/* Timer for original paintings */}
        {item.type === 'originals' && (
          <div className="bg-amber-100 border-2 border-amber-500 p-3 my-2 rounded-md">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="text-lg">TIME LIMITED!</span>
            </div>
            
            <div className="mt-2 text-sm">
              Original paintings must be purchased within 15 minutes or they'll be removed from your cart.
            </div>
            
            {timeRemaining !== null && (
              <div className="mt-2 flex justify-center">
                <div className="bg-white px-4 py-2 rounded-full font-mono font-bold border border-amber-400 text-amber-800">
                  {timeRemaining < 60 
                    ? <span className="text-red-600 animate-pulse">⚠️ {timeRemaining} seconds left!</span> 
                    : <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining</span>}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            <span className="mr-3">{formatCurrency(item.price)}</span>
            <div className="flex items-center border border-neutral-300 rounded">
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
            </div>
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
