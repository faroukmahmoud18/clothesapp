export interface Product {
  id: string;
  name: string;
  sku: string; // Stock Keeping Unit
  barcode?: string; // EAN, UPC, etc.
  category: string;
  purchasePrice: number; // For COGS, not typically shown on POS
  sellingPrice: number;
  stockQuantity: number; // For inventory management, POS might check this
  lowStockThreshold?: number;
  taxRate?: number; // e.g., 0.14 for 14% VAT, could be product specific
  imageUrl?: string; // Optional image for display
}

export interface InvoiceItem {
  productId: string;
  productName: string; // Denormalized for easy display on invoice
  quantity: number;
  unitPrice: number; // Selling price at the time of sale
  lineTotal: number; // quantity * unitPrice (before item discount)
  discountAmount?: number; // Discount applied to this specific item
  taxAmount?: number; // Tax for this line item
  finalLineTotal: number; // Line total after item discount and including tax
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  DEFERRED = 'Deferred', // e.g., store credit, on account
  POINTS = 'Loyalty Points',
}

export interface Invoice {
  id: string; // Unique invoice ID (e.g., timestamp-based or UUID)
  items: InvoiceItem[];
  subtotal: number; // Sum of finalLineTotal for all items before invoice-level discount
  invoiceDiscountAmount?: number; // Discount applied to the whole invoice
  taxTotal: number; // Total tax for the invoice
  grandTotal: number; // Final amount due
  paymentMethods: Array<{ method: PaymentMethod; amount: number }>;
  amountPaid: number;
  changeDue?: number;
  createdAt: Date;
  cashierId?: string; // User ID of the cashier
  branchId?: string; // Branch where the sale occurred
  customerId?: string; // Optional customer linked to the sale
  status: 'pending' | 'completed' | 'voided' | 'parked';
}

// For product search results or quick add
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProductQuickSearchResult extends Pick<Product, 'id' | 'name' | 'sellingPrice' | 'barcode' | 'sku' | 'stockQuantity'> {}
