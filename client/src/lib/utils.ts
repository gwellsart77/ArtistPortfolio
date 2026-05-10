import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null, isInCents: boolean = false): string {
  // Return an empty string if amount is null, undefined, or zero
  if (amount === null || amount === undefined || amount === 0) {
    return '';
  }
  
  // Convert cents to dollars if needed
  const dollarAmount = isInCents ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollarAmount);
}
