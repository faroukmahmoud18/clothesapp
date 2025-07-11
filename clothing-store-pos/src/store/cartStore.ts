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

  getTax: (taxRate = DEFAULT_TAX_RATE) => {
    const taxableAmount = get().getSubtotalAfterInvoiceDiscount(); // Tax on final discounted subtotal
    return taxableAmount * taxRate;
  },

  getGrandTotal: (taxRate = DEFAULT_TAX_RATE) => {
    const subtotalAfterInvoiceDiscount = get().getSubtotalAfterInvoiceDiscount();
    const tax = get().getTax(taxRate);
    return subtotalAfterInvoiceDiscount + tax;
  },
}));

export default useCartStore;
