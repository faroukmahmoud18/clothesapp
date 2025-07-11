// @/reports/types.ts

import { PaymentMethod, Product } from '@/pos/types';

// === Sales Reports ===

export interface SalesReportMetrics {
  totalInvoices: number;
  totalItemsSold: number;
  totalDiscounts: number; // Sum of item discounts + invoice discounts
  totalTax: number;
  totalNetSales: number; // Subtotal (after all discounts) but before tax
  totalGrossSales: number; // Grand total sum (after tax)
}

export interface PaymentMethodSummary {
  method: PaymentMethod | string; // string for potential other methods not in enum
  totalAmount: number;
  transactionCount: number;
}

export interface DailySalesReportData extends SalesReportMetrics {
  date: string; // YYYY-MM-DD
  paymentMethodBreakdown: PaymentMethodSummary[];
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  sku: string;
  totalQuantitySold: number;
  totalValueSold: number; // Based on selling price at time of sale
}

export interface SalesSummaryReportData extends SalesReportMetrics {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  paymentMethodBreakdown: PaymentMethodSummary[];
  topSellingProducts?: TopSellingProduct[]; // Optional for this milestone
}

// === Inventory Reports ===

export interface InventoryReportItem extends Product {
  totalValueAtCost: number;
  totalValueAtSellingPrice: number;
}

export interface CurrentInventoryReportData {
  generatedAt: string; // ISO Date string
  totalItems: number;
  totalUniqueProducts: number;
  overallTotalValueAtCost: number;
  overallTotalValueAtSellingPrice: number;
  items: InventoryReportItem[];
  // Potentially add lowStockItems list here later if not a separate report
  // lowStockItems?: Product[];
}

// Could also include:
// - Profit reports (would need accurate cost price per sale item)
// - Category performance reports
// - etc. for future milestones
