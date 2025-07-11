import { create } from 'zustand';
import { Product } from '@/pos/types';

export type DiscountType = 'percentage' | 'fixed';

export interface CartItem extends Product {
  transactionQuantity: number;
  transactionPrice: number; // Price per unit at time of sale
  originalLineTotal: number; // Qty * Price (before item discount)
  itemDiscountType?: DiscountType;
  itemDiscountValue?: number; // Percentage (0-100) or fixed amount
  itemDiscountAmount: number; // Calculated discount amount for the line
  lineTotal: number; // Qty * Price - ItemDiscountAmount
}

interface CartState {
  items: CartItem[];
  invoiceDiscountType: DiscountType | null;
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number; // Calculated overall invoice discount amount

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, newQuantity: number) => void;
  applyItemDiscount: (productId: string, type: DiscountType, value: number) => void;
  removeItemDiscount: (productId: string) => void;
  applyInvoiceDiscount: (type: DiscountType, value: number) => void;
  removeInvoiceDiscount: () => void;
  clearCart: () => void;

  getSubtotalBeforeInvoiceDiscount: () => number; // Sum of all lineTotals (after item discounts)
  getCalculatedInvoiceDiscount: () => number; // Based on subtotalBeforeInvoiceDiscount
  getSubtotalAfterInvoiceDiscount: () => number;
  getTax: (taxRate?: number) => number; // Tax applied on subtotalAfterInvoiceDiscount
  getGrandTotal: (taxRate?: number) => number;
}

const DEFAULT_TAX_RATE = 0.14; // Default 14% VAT

const calculateItemDiscountAmount = (originalLineTotal: number, type?: DiscountType, value?: number): number => {
  if (!type || value === undefined || value < 0) return 0;
  if (type === 'percentage') {
    return originalLineTotal * (Math.min(Math.max(value, 0), 100) / 100);
  }
  // Fixed amount, ensure it doesn't exceed original line total
  return Math.min(value, originalLineTotal);
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  invoiceDiscountType: null,
  invoiceDiscountValue: 0,
  invoiceDiscountAmount: 0,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        const newTransactionQuantity = existingItem.transactionQuantity + quantity;
        const originalLineTotal = newTransactionQuantity * existingItem.transactionPrice;
        const itemDiscountAmount = calculateItemDiscountAmount(
          originalLineTotal,
          existingItem.itemDiscountType,
          existingItem.itemDiscountValue
        );
        const updatedItems = state.items.map((item) =>
          item.id === product.id
            ? {
                ...item,
                transactionQuantity: newTransactionQuantity,
                originalLineTotal,
                itemDiscountAmount,
                lineTotal: originalLineTotal - itemDiscountAmount,
              }
            : item
        );
        return { ...state, items: updatedItems };
      } else {
        const transactionPrice = product.sellingPrice;
        const originalLineTotal = quantity * transactionPrice;
        // New items have no discount by default
        const itemDiscountAmount = 0;
        const newItem: CartItem = {
          ...product,
          transactionQuantity: quantity,
          transactionPrice,
          originalLineTotal,
          itemDiscountType: undefined,
          itemDiscountValue: undefined,
          itemDiscountAmount,
          lineTotal: originalLineTotal - itemDiscountAmount,
        };
        return { ...state, items: [...state.items, newItem] };
      }
    });
    get()._recalculateInvoiceDiscount(); // Recalculate invoice discount whenever items change
  },

  removeItem: (productId) => {
    set((state) => ({
      ...state,
      items: state.items.filter((item) => item.id !== productId),
    }));
    get()._recalculateInvoiceDiscount();
  },

  updateItemQuantity: (productId, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeItem(productId); // This already calls _recalculateInvoiceDiscount
      return;
    }
    set((state) => ({
      ...state,
      items: state.items.map((item) => {
        if (item.id === productId) {
          const originalLineTotal = newQuantity * item.transactionPrice;
          const itemDiscountAmount = calculateItemDiscountAmount(
            originalLineTotal,
            item.itemDiscountType,
            item.itemDiscountValue
          );
          return {
            ...item,
            transactionQuantity: newQuantity,
            originalLineTotal,
            itemDiscountAmount,
            lineTotal: originalLineTotal - itemDiscountAmount,
          };
        }
        return item;
      }),
    }));
    get()._recalculateInvoiceDiscount();
  },

  applyItemDiscount: (productId, type, value) => {
    set(state => ({
      ...state,
      items: state.items.map(item => {
        if (item.id === productId) {
          const itemDiscountAmount = calculateItemDiscountAmount(item.originalLineTotal, type, value);
          return {
            ...item,
            itemDiscountType: type,
            itemDiscountValue: value,
            itemDiscountAmount,
            lineTotal: item.originalLineTotal - itemDiscountAmount,
          };
        }
        return item;
      }),
    }));
    get()._recalculateInvoiceDiscount();
  },

  removeItemDiscount: (productId) => {
    set(state => ({
      ...state,
      items: state.items.map(item => {
        if (item.id === productId && item.itemDiscountType) {
          return {
            ...item,
            itemDiscountType: undefined,
            itemDiscountValue: undefined,
            itemDiscountAmount: 0,
            lineTotal: item.originalLineTotal, // Revert to original line total
          };
        }
        return item;
      }),
    }));
    get()._recalculateInvoiceDiscount();
  },

  applyInvoiceDiscount: (type, value) => {
    set(state => ({ ...state, invoiceDiscountType: type, invoiceDiscountValue: value }));
    get()._recalculateInvoiceDiscount();
  },

  removeInvoiceDiscount: () => {
    set(state => ({ ...state, invoiceDiscountType: null, invoiceDiscountValue: 0, invoiceDiscountAmount: 0 }));
  },

  clearCart: () => {
    set({ items: [], invoiceDiscountType: null, invoiceDiscountValue: 0, invoiceDiscountAmount: 0 });
  },

  // Internal helper to recalculate invoice discount
  _recalculateInvoiceDiscount: () => {
    set(state => {
      const subtotal = state.items.reduce((sum, item) => sum + item.lineTotal, 0);
      let newInvoiceDiscountAmount = 0;
      if (state.invoiceDiscountType && state.invoiceDiscountValue > 0) {
        if (state.invoiceDiscountType === 'percentage') {
          newInvoiceDiscountAmount = subtotal * (Math.min(Math.max(state.invoiceDiscountValue, 0), 100) / 100);
        } else { // Fixed
          newInvoiceDiscountAmount = Math.min(state.invoiceDiscountValue, subtotal);
        }
      }
      return { ...state, invoiceDiscountAmount: newInvoiceDiscountAmount };
    });
  },

  getSubtotalBeforeInvoiceDiscount: () => {
    return get().items.reduce((sum, item) => sum + item.lineTotal, 0);
  },

  getCalculatedInvoiceDiscount: () => {
    // This getter ensures the invoiceDiscountAmount is up-to-date based on current items and invoice discount settings.
    // However, the actual calculation is now primarily handled by _recalculateInvoiceDiscount and stored.
    return get().invoiceDiscountAmount;
  },

  getSubtotalAfterInvoiceDiscount: () => {
    const subtotal = get().getSubtotalBeforeInvoiceDiscount();
    const invoiceDiscount = get().getCalculatedInvoiceDiscount();
    return subtotal - invoiceDiscount;
  },

  getTax: () => {
    // Import mockProductTypes here or pass it in if it becomes dynamic
    // For now, direct import for simplicity with mock data
    const { mockProductTypes } = require('@/pos/mockData'); // Using require for conditional/local scope import

    const items = get().items;
    let totalTax = 0;

    items.forEach(item => {
      let itemTaxRate = DEFAULT_TAX_RATE; // Start with default

      if (item.productTypeId) {
        const productType = mockProductTypes.find((pt: any) => pt.id === item.productTypeId); // Add 'any' type for pt temporarily
        if (productType && typeof productType.taxRate === 'number') {
          itemTaxRate = productType.taxRate;
        } else if (typeof item.taxRate === 'number') { // Fallback to product's own taxRate
          itemTaxRate = item.taxRate;
        }
      } else if (typeof item.taxRate === 'number') { // Fallback to product's own taxRate if no productTypeId
        itemTaxRate = item.taxRate;
      }

      // Tax is typically calculated on the price after item discounts but before invoice discounts.
      // Each item's lineTotal already reflects item-level discounts.
      // The subtotalAfterInvoiceDiscount is the sum of these lineTotals minus invoice discount.
      // So, we need to calculate tax per item based on its lineTotal,
      // then sum them up. This sum is the total tax.
      // The invoice discount is applied to the sum of (lineTotal + itemTaxOnLineTotal).
      // This logic is getting complex and might need a larger refactor later for full accuracy
      // regarding when invoice discount is applied (before or after tax).
      // Current: Tax is on (Sum of lineTotals - InvoiceDiscount)
      // New: Tax is Sum of (Tax on individual lineTotals)

      // For now, let's adjust to sum individual taxes based on their lineTotals.
      // This means tax is calculated BEFORE invoice-level discount.
      // If tax should be AFTER invoice discount, the approach needs to distribute the invoice discount proportionally.
      // The plan mentions "Tax applied on subtotalAfterInvoiceDiscount" in the old CartState.
      // Let's stick to that for now but use item-specific rates. This means we need to find an *average* weighted tax rate.
      // OR, the definition of subtotalAfterInvoiceDiscount needs to be pre-tax.

      // Simpler approach for now: Calculate tax on each item's lineTotal, then sum it up.
      // This implies invoice discount is applied on the pre-tax subtotal.
      const taxForItem = item.lineTotal * itemTaxRate;
      totalTax += taxForItem;
    });

    // If the requirement is that the invoice discount applies to the subtotal *before* tax,
    // and then the *total tax amount* is calculated based on the *discounted subtotal* using varied rates,
    // that's more complex. It would require calculating a weighted average tax rate based on the
    // composition of the cart *after item discounts* but *before invoice discounts*, then applying that
    // weighted average rate to the `subtotalAfterInvoiceDiscount`.

    // Let's re-evaluate: The current getTax applies a single rate to subtotalAfterInvoiceDiscount.
    // To adapt this with minimal change to overall flow:
    // 1. Calculate subtotalAfterInvoiceDiscount (as is). This is the final taxable base.
    // 2. For each item, determine its proportion of the original subtotal (sum of lineTotals).
    // 3. Distribute the subtotalAfterInvoiceDiscount to items based on these proportions.
    // 4. Apply the item-specific tax rate to its proportional share of subtotalAfterInvoiceDiscount.
    // This seems overly complex for this stage.

    // Sticking to the plan's initial hint: "Tax applied on subtotalAfterInvoiceDiscount"
    // but using item-specific rates means we need a weighted average tax rate.
    const subtotalBeforeInvoiceDiscount = get().getSubtotalBeforeInvoiceDiscount();
    if (subtotalBeforeInvoiceDiscount === 0) return 0; // No items, no tax.

    let weightedTaxSum = 0;
    items.forEach(item => {
      let itemTaxRate = DEFAULT_TAX_RATE;
      if (item.productTypeId) {
        const productType = mockProductTypes.find((pt: any) => pt.id === item.productTypeId);
        if (productType && typeof productType.taxRate === 'number') {
          itemTaxRate = productType.taxRate;
        } else if (typeof item.taxRate === 'number') {
          itemTaxRate = item.taxRate;
        }
      } else if (typeof item.taxRate === 'number') {
        itemTaxRate = item.taxRate;
      }
      weightedTaxSum += item.lineTotal * itemTaxRate; // item.lineTotal is after item discount
    });

    const effectiveWeightedTaxRate = weightedTaxSum / subtotalBeforeInvoiceDiscount;
    const finalTaxableAmount = get().getSubtotalAfterInvoiceDiscount();

    return finalTaxableAmount * effectiveWeightedTaxRate;
  },

  getGrandTotal: () => {
    const subtotalAfterInvoiceDiscount = get().getSubtotalAfterInvoiceDiscount();
    const tax = get().getTax(); // No longer takes taxRate argument
    return subtotalAfterInvoiceDiscount + tax;
  },
}));

export default useCartStore;
