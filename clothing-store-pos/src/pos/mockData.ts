import { Product, ProductType, Supplier } from './types';

// Mock Product Types
export const mockProductTypes: ProductType[] = [
  { id: 'pt_apparel', name: 'Apparel', taxRate: 0.14 },
  { id: 'pt_accessories', name: 'Accessories', taxRate: 0.14 },
  { id: 'pt_footwear', name: 'Footwear', taxRate: 0.18 }, // Example of different tax rate
  { id: 'pt_services', name: 'Services', taxRate: 0.00 }, // e.g., Alterations
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  { id: 'sup_localtex', name: 'Local Textiles Inc.', contactPerson: 'Mr. Ahmed', email: 'ahmed@localtex.com', phone: '01234567890' },
  { id: 'sup_globalwear', name: 'Global Wear Co.', contactPerson: 'Ms. Sarah', email: 'sarah@globalwear.com', phone: '01122334455' },
  { id: 'sup_fastfashion', name: 'Fast Fashion Supply', contactPerson: 'Mr. John', email: 'john@fastfashion.com', phone: '01001001000' },
];


export const mockProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'Men\'s Classic T-Shirt - White',
    sku: 'MTS001-WH',
    barcode: '1234567890123',
    category: 'Men/Apparel/T-Shirts',
    purchasePrice: 80, // Cost price
    sellingPrice: 150,
    stockQuantity: 50,
    lowStockThreshold: 10,
    taxRate: 0.14, // Default product tax, can be overridden by productTypeId's taxRate
    imageUrl: 'https://via.placeholder.com/100?text=White+T-Shirt',
    productTypeId: 'pt_apparel',
    supplierId: 'sup_localtex',
    lastStocktakeDate: '2023-01-15T10:00:00Z',
    notes: 'High quality cotton.',
    branchId: 'branch_001',
  },
  {
    id: 'prod_002',
    name: 'Men\'s Classic T-Shirt - Black',
    sku: 'MTS001-BK',
    barcode: '1234567890124',
    category: 'Men/Apparel/T-Shirts',
    purchasePrice: 80,
    sellingPrice: 150,
    stockQuantity: 45,
    lowStockThreshold: 10,
    taxRate: 0.14,
    imageUrl: 'https://via.placeholder.com/100?text=Black+T-Shirt',
    productTypeId: 'pt_apparel',
    supplierId: 'sup_localtex',
    lastStocktakeDate: '2023-01-15T10:00:00Z',
    notes: 'Also available in blue and grey.',
    branchId: 'branch_001',
  },
  {
    id: 'prod_003',
    name: 'Women\'s Slim Fit Jeans - Blue',
    sku: 'WSJ002-BL',
    barcode: '1234567890125',
    category: 'Women/Apparel/Jeans',
    purchasePrice: 250,
    sellingPrice: 450,
    stockQuantity: 30,
    lowStockThreshold: 5,
    taxRate: 0.14,
    imageUrl: 'https://via.placeholder.com/100?text=Blue+Jeans',
    productTypeId: 'pt_apparel',
    supplierId: 'sup_globalwear',
    lastStocktakeDate: '2023-02-01T10:00:00Z',
    notes: 'Popular item, reorder soon.',
    branchId: 'branch_001',
  },
  {
    id: 'prod_004',
    name: 'Leather Belt - Brown',
    sku: 'ACC003-BR',
    barcode: '1234567890126',
    category: 'Accessories/Belts',
    purchasePrice: 120,
    sellingPrice: 280,
    stockQuantity: 60,
    lowStockThreshold: 15,
    taxRate: 0.14,
    imageUrl: 'https://via.placeholder.com/100?text=Leather+Belt',
    productTypeId: 'pt_accessories',
    supplierId: 'sup_fastfashion',
    notes: 'Genuine leather.',
    branchId: 'branch_001',
  },
  {
    id: 'prod_005',
    name: 'Sports Cap - Red',
    sku: 'ACC004-RD',
    barcode: '1234567890127',
    category: 'Accessories/Caps',
    purchasePrice: 60,
    sellingPrice: 120,
    stockQuantity: 75,
    lowStockThreshold: 20,
    // taxRate: 0.0, // Example: if this specific cap is tax-exempt
    // productTypeId could also point to a tax-exempt type
    productTypeId: 'pt_accessories', // Assuming accessories generally have 14% tax
    supplierId: 'sup_fastfashion',
    lastStocktakeDate: '2023-03-10T10:00:00Z',
    branchId: 'branch_001',
  },
  {
    id: 'prod_006',
    name: 'Kids Summer Dress - Floral',
    sku: 'KSD005-FL',
    barcode: '1234567890128',
    category: 'Kids/Apparel/Dresses',
    purchasePrice: 150,
    sellingPrice: 320,
    stockQuantity: 25,
    lowStockThreshold: 5,
    taxRate: 0.14,
    imageUrl: 'https://via.placeholder.com/100?text=Floral+Dress',
    productTypeId: 'pt_apparel',
    supplierId: 'sup_globalwear',
    branchId: 'branch_001',
  }
];
