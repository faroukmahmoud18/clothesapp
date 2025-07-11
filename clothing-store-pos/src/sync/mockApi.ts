// @/sync/mockApi.ts

import { Product, Invoice } from '@/pos/types';
import { Customer } from '@/customers/types'; // Import Customer type
import { mockProducts } from '@/pos/mockData'; // Using existing mock products as our "database"
import { v4 as uuidv4 } from 'uuid';

// Simulate a network delay
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

let localMockProducts: Product[] = JSON.parse(JSON.stringify(mockProducts)); // Deep copy to simulate a mutable DB

// --- Product API ---

export const fetchProducts = async (): Promise<Product[]> => {
  await networkDelay(300);
  console.log('[MockAPI] fetchProducts called');
  return Promise.resolve(JSON.parse(JSON.stringify(localMockProducts))); // Return a deep copy
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  await networkDelay(150);
  console.log(`[MockAPI] fetchProductById called for ID: ${id}`);
  const product = localMockProducts.find(p => p.id === id);
  return Promise.resolve(product ? JSON.parse(JSON.stringify(product)) : undefined);
};

export const createProduct = async (productData: Omit<Product, 'id' | 'branchId'>): Promise<Product> => {
  await networkDelay(400);
  console.log('[MockAPI] createProduct called with data:', productData);
  const newProduct: Product = {
    ...productData,
    id: uuidv4(),
    // Assuming productData might not have branchId, assign a default or handle as needed
    // For now, let's assume it should be part of a more complete productData payload in a real scenario
    // or default it if system context (e.g. current branch) is available here.
    // For this mock, we'll require it to be part of the creation payload or add a default.
    // Let's assume for now it might come with productData or be added by a higher level service.
    // If not provided, we could default it:
    branchId: productData.branchId || 'branch_001', // Example default
  };
  localMockProducts.push(newProduct);
  return Promise.resolve(JSON.parse(JSON.stringify(newProduct)));
};

export const updateProduct = async (productId: string, productUpdateData: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> => {
  await networkDelay(400);
  console.log(`[MockAPI] updateProduct called for ID: ${productId} with data:`, productUpdateData);
  const productIndex = localMockProducts.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    localMockProducts[productIndex] = { ...localMockProducts[productIndex], ...productUpdateData };
    return Promise.resolve(JSON.parse(JSON.stringify(localMockProducts[productIndex])));
  }
  return Promise.resolve(undefined); // Not found
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  await networkDelay(300);
  console.log(`[MockAPI] deleteProduct called for ID: ${productId}`);
  const initialLength = localMockProducts.length;
  localMockProducts = localMockProducts.filter(p => p.id !== productId);
  return Promise.resolve(localMockProducts.length < initialLength);
};


// --- Sales API ---
// For now, just a simple mock. In a real app, this would be much more complex.
const mockRecordedSales: Invoice[] = [];

export const recordSale = async (saleData: Invoice): Promise<Invoice> => {
  await networkDelay(500);
  console.log('[MockAPI] recordSale called with data:', saleData);
  // Simulate saving the sale. In a real backend, you'd validate, process, etc.
  const newSaleRecord = { ...saleData, id: saleData.id || uuidv4() }; // Ensure it has an ID
  mockRecordedSales.push(newSaleRecord);
  return Promise.resolve(JSON.parse(JSON.stringify(newSaleRecord)));
};

export const fetchSales = async (params?: { branchId?: string; dateFrom?: string; dateTo?: string }): Promise<Invoice[]> => {
  await networkDelay(300);
  console.log('[MockAPI] fetchSales called with params:', params);
  // Basic filtering example (can be expanded)
  let sales = mockRecordedSales;
  if (params?.branchId) {
    sales = sales.filter(s => s.branchId === params.branchId);
  }
  // Add date filtering if needed
  return Promise.resolve(JSON.parse(JSON.stringify(sales)));
};


// Utility to reset mock data if needed for testing or specific scenarios
export const resetMockProducts = () => {
  console.log('[MockAPI] Resetting mock products to initial state.');
  localMockProducts = JSON.parse(JSON.stringify(mockProducts));
};

export const resetMockSales = () => {
  console.log('[MockAPI] Resetting mock sales.');
  mockRecordedSales.length = 0; // Clears the array
};

// --- Customer API ---
let localMockCustomers: Customer[] = []; // Initialize empty or with some mock data

export const fetchCustomers = async (searchQuery?: string): Promise<Customer[]> => {
  await networkDelay(250);
  console.log('[MockAPI] fetchCustomers called, query:', searchQuery);
  let customers = JSON.parse(JSON.stringify(localMockCustomers));
  if (searchQuery) {
    const sq = searchQuery.toLowerCase();
    customers = customers.filter((c: Customer) =>
      c.name.toLowerCase().includes(sq) ||
      c.phone.includes(sq) ||
      (c.memberCode && c.memberCode.toLowerCase().includes(sq)) ||
      (c.email && c.email.toLowerCase().includes(sq))
    );
  }
  return Promise.resolve(customers);
};

export const fetchCustomerById = async (id: string): Promise<Customer | undefined> => {
  await networkDelay(100);
  console.log(`[MockAPI] fetchCustomerById called for ID: ${id}`);
  const customer = localMockCustomers.find(c => c.id === id);
  return Promise.resolve(customer ? JSON.parse(JSON.stringify(customer)) : undefined);
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  await networkDelay(350);
  console.log('[MockAPI] createCustomer called with data:', customerData);
  const now = new Date().toISOString();
  const newCustomer: Customer = {
    ...customerData,
    id: uuidv4(),
    loyaltyPoints: 0,
    createdAt: now,
    updatedAt: now,
    memberCode: customerData.memberCode || `MC-${Date.now() % 100000}`, // Simple mock member code
  };
  localMockCustomers.push(newCustomer);
  return Promise.resolve(JSON.parse(JSON.stringify(newCustomer)));
};

export const updateCustomer = async (customerId: string, customerUpdateData: Partial<Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'updatedAt'>>): Promise<Customer | undefined> => {
  await networkDelay(350);
  console.log(`[MockAPI] updateCustomer called for ID: ${customerId} with data:`, customerUpdateData);
  const customerIndex = localMockCustomers.findIndex(c => c.id === customerId);
  if (customerIndex !== -1) {
    localMockCustomers[customerIndex] = {
      ...localMockCustomers[customerIndex],
      ...customerUpdateData,
      updatedAt: new Date().toISOString(), // Always update timestamp
    };
    return Promise.resolve(JSON.parse(JSON.stringify(localMockCustomers[customerIndex])));
  }
  return Promise.resolve(undefined); // Not found
};

// Specific endpoint for loyalty points might exist, or it could be part of general updateCustomer
export const updateCustomerLoyaltyPointsApi = async (customerId: string, newPointsTotal: number): Promise<Customer | undefined> => {
    await networkDelay(200);
    console.log(`[MockAPI] updateCustomerLoyaltyPointsApi for ID: ${customerId}, new points: ${newPointsTotal}`);
    const customerIndex = localMockCustomers.findIndex(c => c.id === customerId);
    if (customerIndex !== -1) {
        localMockCustomers[customerIndex].loyaltyPoints = newPointsTotal;
        localMockCustomers[customerIndex].updatedAt = new Date().toISOString();
        return Promise.resolve(JSON.parse(JSON.stringify(localMockCustomers[customerIndex])));
    }
    return Promise.resolve(undefined);
};


export const resetMockCustomers = () => {
  console.log('[MockAPI] Resetting mock customers.');
  localMockCustomers = [];
};
