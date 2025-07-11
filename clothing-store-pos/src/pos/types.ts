export interface Product {
  id: string;
  name: string;
  sku: string; // Stock Keeping Unit
  barcode?: string; // EAN, UPC, etc.
  category: string; // Consider normalizing to categoryId if categories become complex
  purchasePrice: number; // Cost price of the product (for COGS)
  sellingPrice: number;
  stockQuantity: number; // Current stock level
  lowStockThreshold?: number; // Threshold for low stock alerts
  taxRate?: number; // Default tax rate for this product, e.g., 0.14 for 14%. Can be overridden by ProductType tax.
  imageUrl?: string; // Optional image for display

  // New fields from plan:
  productTypeId?: string; // ID linking to a ProductType (for specific tax rates, etc.)
  supplierId?: string;    // ID linking to a Supplier
  lastStocktakeDate?: string; // ISO date string, e.g., "2023-10-26T10:00:00Z"
  notes?: string;         // Additional notes about the product
  branchId?: string;      // ID linking to the Branch this specific stock item belongs to (for multi-branch inventory)
}

// Represents different types of products, which might have specific tax rates
export interface ProductType {
  id: string;
  name: string;
  taxRate: number; // Specific tax rate for this product type, overrides product.taxRate if present
  // Potentially other type-specific fields
}

// Represents a supplier
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Represents a store branch
export interface Branch {
  id: string;
  name: string;
  location?: string;
  contactPhone?: string;
  ipAddress?: string; // For local network identification if needed
  // Add other relevant branch details: e.g., tax ID, specific settings
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
