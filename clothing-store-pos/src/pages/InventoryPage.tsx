import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircleIcon, SearchIcon, UploadIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import { mockProducts } from '@/pos/mockData';
import { Product } from '@/pos/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Dialog components
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const ITEMS_PER_PAGE = 10;

// Sub-component for Add/Edit Product Dialog
interface ProductFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (productData: Omit<Product, 'id'> | Product) => void; // Omit id for new, Product for edit
  productToEdit?: Product | null;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({ isOpen, setIsOpen, onSave, productToEdit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '', sku: '', category: '', purchasePrice: 0, sellingPrice: 0,
    stockQuantity: 0, lowStockThreshold: 0, barcode: '', taxRate: 0.14, imageUrl: ''
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      // Reset for new product
      setFormData({
        name: '', sku: '', category: '', purchasePrice: 0, sellingPrice: 0,
        stockQuantity: 0, lowStockThreshold: 0, barcode: '', taxRate: 0.14, imageUrl: ''
      });
    }
  }, [productToEdit, isOpen]); // Reset form when dialog opens or productToEdit changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation can be added here
    if (!formData.name || !formData.sku || !formData.category) {
        alert(t('fillRequiredFields')); // Example: "Please fill all required fields."
        return;
    }
    onSave(productToEdit ? { ...formData, id: productToEdit.id } : formData);
    setIsOpen(false);
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productToEdit ? t('editProductTitle') : t('addNewProductTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Form Fields */}
          <div><Label htmlFor="name">{t('productName')}</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required className={commonInputClass} /></div>
          <div><Label htmlFor="sku">{t('sku')}</Label><Input id="sku" name="sku" value={formData.sku} onChange={handleChange} required className={commonInputClass} /></div>
          <div><Label htmlFor="category">{t('category')}</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required className={commonInputClass} /></div>
          <div><Label htmlFor="barcode">{t('barcodeOptional')}</Label><Input id="barcode" name="barcode" value={formData.barcode || ''} onChange={handleChange} className={commonInputClass} /></div>
          <div><Label htmlFor="sellingPrice">{t('sellingPrice')}</Label><Input id="sellingPrice" name="sellingPrice" type="number" value={formData.sellingPrice} onChange={handleChange} required min="0" step="0.01" className={commonInputClass} /></div>
          <div><Label htmlFor="purchasePrice">{t('purchasePriceOptional')}</Label><Input id="purchasePrice" name="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" className={commonInputClass} /></div>
          <div><Label htmlFor="stockQuantity">{t('stockQuantity')}</Label><Input id="stockQuantity" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required min="0" step="1" className={commonInputClass} /></div>
          <div><Label htmlFor="lowStockThreshold">{t('lowStockThresholdOptional')}</Label><Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold || 0} onChange={handleChange} min="0" step="1" className={commonInputClass} /></div>
          <div><Label htmlFor="taxRate">{t('taxRatePercentage')}</Label><Input id="taxRate" name="taxRate" type="number" value={formData.taxRate * 100} onChange={(e) => setFormData(prev => ({...prev, taxRate: parseFloat(e.target.value) / 100 || 0}))} min="0" step="0.01" placeholder="e.g., 14 for 14%" className={commonInputClass} /></div>
          <div className="md:col-span-2"><Label htmlFor="imageUrl">{t('imageUrlOptional')}</Label><Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className={commonInputClass} /></div>

          <DialogFooter className="md:col-span-2 mt-4">
            <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
            <Button type="submit">{productToEdit ? t('saveChanges') : t('addProduct')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const InventoryPage: React.FC = () => {
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isViewDetailDialogOpen, setIsViewDetailDialogOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);


  // Filtered and paginated products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedFilter = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      product.sku.toLowerCase().includes(lowercasedFilter) ||
      product.category.toLowerCase().includes(lowercasedFilter)
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t('inventoryManagement')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => alert(t('featureComingSoon'))} >
            <UploadIcon className="mr-2 h-4 w-4" />
            {t('importProducts')}
          </Button>
          <Button onClick={() => { setProductToEdit(null); setIsProductFormOpen(true); }}>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            {t('addNewProduct')}
          </Button>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchInventoryPlaceholder')}
            className="pl-8 w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        {/* Add filter dropdowns here later if needed, e.g., for category */}
      </div>

      {/* Inventory Table */}
      <div className="bg-background p-0 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('productName')}</TableHead>
              <TableHead>{t('sku')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead className="text-right">{t('price')}</TableHead>
              <TableHead className="text-center">{t('stockQuantity')}</TableHead>
              <TableHead className="text-center">{t('lowStockThreshold')}</TableHead>
              <TableHead className="text-center">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell
                  className="font-medium cursor-pointer hover:underline"
                  onClick={() => {
                    setProductToView(product);
                    setIsViewDetailDialogOpen(true);
                  }}
                >
                  {product.name}
                </TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">{product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell className="text-center">{product.stockQuantity}</TableCell>
                <TableCell className="text-center">{product.lowStockThreshold || '-'}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-1 h-8 w-8"
                    onClick={() => {
                      setProductToEdit(product);
                      setIsProductFormOpen(true);
                    }}
                  >
                    <Edit2Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80 h-8 w-8"
                    onClick={() => {
                      if (confirm(t('confirmDeleteProduct', { productName: product.name }))) {
                        setProducts(prev => prev.filter(p => p.id !== product.id));
                      }
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paginatedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchTerm ? t('noProductsFound') : t('noInventoryItems')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {t('previousPage')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('pageNumber', { currentPage, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('nextPage')}
            </Button>
        </div>
      )}

      <ProductFormDialog
        isOpen={isProductFormOpen}
        setIsOpen={setIsProductFormOpen}
        onSave={(productData) => {
          if (productToEdit) { // Editing existing product
            setProducts(prevProducts =>
              prevProducts.map(p => p.id === productToEdit.id ? { ...p, ...productData } as Product : p)
            );
          } else { // Adding new product
            const newProductWithId: Product = {
              ...(productData as Omit<Product, 'id'>), // Ensure it's the Omit type for new
              id: uuidv4(),
            };
            setProducts(prevProducts => [newProductWithId, ...prevProducts]);
          }
          setProductToEdit(null); // Reset productToEdit after save
          // In a real app, you'd also send this to a backend.
        }}
        productToEdit={productToEdit}
      />
      <ViewProductDialog
        isOpen={isViewDetailDialogOpen}
        setIsOpen={setIsViewDetailDialogOpen}
        product={productToView}
      />
    </div>
  );
};

// ViewProductDialog component
interface ViewProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({ isOpen, setIsOpen, product }) => {
  const { t } = useTranslation();

  if (!product) return null;

  const detailItem = (labelKey: string, value?: string | number | null) => (
    value || value === 0 ? (
      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-dashed">
        <dt className="text-sm font-medium text-muted-foreground">{t(labelKey)}</dt>
        <dd className="text-sm col-span-2">{labelKey === 'taxRatePercentage' && typeof value === 'number' ? `${(value * 100).toFixed(0)}%` : value}</dd>
      </div>
    ) : null
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('productDetailsTitle')}: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {product.imageUrl && (
            <div className="flex justify-center mb-4">
              <img src={product.imageUrl} alt={product.name} className="max-w-xs max-h-48 rounded-md object-contain border" />
            </div>
          )}
          <dl>
            {detailItem('productName', product.name)}
            {detailItem('sku', product.sku)}
            {detailItem('category', product.category)}
            {detailItem('barcodeOptional', product.barcode)}
            {detailItem('sellingPrice', `${t('currencyEGP')} ${product.sellingPrice.toFixed(2)}`)}
            {detailItem('purchasePriceOptional', `${t('currencyEGP')} ${product.purchasePrice.toFixed(2)}`)}
            {detailItem('stockQuantity', product.stockQuantity)}
            {detailItem('lowStockThresholdOptional', product.lowStockThreshold)}
            {detailItem('taxRatePercentage', product.taxRate)}
          </dl>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default InventoryPage;
