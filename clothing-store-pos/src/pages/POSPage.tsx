import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Removed PlusCircleIcon, PercentIcon from lucide-react import
// Added BarcodeIcon
import { SearchIcon, UserCircle2Icon, Settings2Icon, DollarSignIcon, Trash2Icon, PlusIcon, MinusIcon, TagIcon, Barcode as BarcodeIcon } from 'lucide-react';
// Remove direct import of mockProducts
import { Product, PaymentMethod } from '@/pos/types'; // Added PaymentMethod
import * as syncService from '@/sync/syncService'; // Import syncService
import { useCartStore, CartItem, DiscountType } from '@/store/cartStore'; // Import cart store and DiscountType
// Removed DialogTrigger from dialog import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // Assuming Label is already added
import * as printerService from '@/printing/printerService'; // Import printer service
import { useAuthStore } from '@/store/authStore'; // To get current user/branch if needed for invoice

// DiscountDialog component (can be moved to a separate file later if it grows)
interface DiscountDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onApplyDiscount: (type: DiscountType, value: number) => void;
  currentItemName?: string; // Optional, for item discount title
}

const DiscountDialog: React.FC<DiscountDialogProps> = ({ isOpen, setIsOpen, onApplyDiscount, currentItemName }) => {
  const { t } = useTranslation();
  const [discountType, setDiscountType] = React.useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = React.useState<string>('');

  const handleApply = () => {
    const value = parseFloat(discountValue);
    if (!isNaN(value) && value >= 0) {
      onApplyDiscount(discountType, value);
      setIsOpen(false);
      setDiscountValue(''); // Reset for next use
    } else {
      // Basic validation feedback
      alert(t('invalidDiscountValue'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentItemName
              ? t('applyDiscountToItem', { itemName: currentItemName })
              : t('applyInvoiceDiscount')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup defaultValue="percentage" onValueChange={(value: string) => setDiscountType(value as DiscountType)} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="r1" />
              <Label htmlFor="r1">{t('percentageDiscount')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="r2" />
              <Label htmlFor="r2">{t('fixedAmountDiscount')}</Label>
            </div>
          </RadioGroup>
          <Input
            id="discountValue"
            type="number"
            placeholder={discountType === 'percentage' ? t('enterPercentage') : t('enterFixedAmount')}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleApply}>{t('applyDiscount')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const POSPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [barcodeInputValue, setBarcodeInputValue] = React.useState('');
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  const [allProducts, setAllProducts] = React.useState<Product[]>([]); // Holds all fetched products
  const [searchResults, setSearchResults] = React.useState<Product[]>([]); // For display, filtered from allProducts
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Cart store integration
  const cartItems = useCartStore((state) => state.items);
  const addItemToCart = useCartStore((state) => state.addItem);
  const removeItemFromCart = useCartStore((state) => state.removeItem);
  const updateItemQuantityInCart = useCartStore((state) => state.updateItemQuantity);
  const applyItemDiscount = useCartStore((state) => state.applyItemDiscount);
  const removeItemDiscount = useCartStore((state) => state.removeItemDiscount);
  const applyInvoiceDiscount = useCartStore((state) => state.applyInvoiceDiscount);
  const removeInvoiceDiscount = useCartStore((state) => state.removeInvoiceDiscount);
  const invoiceDiscountType = useCartStore((state) => state.invoiceDiscountType);
  const invoiceDiscountValue = useCartStore((state) => state.invoiceDiscountValue);

  const subtotalBeforeInvoiceDiscount = useCartStore((state) => state.getSubtotalBeforeInvoiceDiscount());
  const calculatedInvoiceDiscountAmount = useCartStore((state) => state.getCalculatedInvoiceDiscount());
  const subtotalAfterInvoiceDiscount = useCartStore((state) => state.getSubtotalAfterInvoiceDiscount());
  const tax = useCartStore((state) => state.getTax());
  const grandTotal = useCartStore((state) => state.getGrandTotal());

  // State for discount dialog
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = React.useState(false);
  const [discountTarget, setDiscountTarget] = React.useState<{ type: 'item' | 'invoice'; itemId?: string; itemName?: string }>({ type: 'invoice' });

  // State for Payment Dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  const [printingStatus, setPrintingStatus] = React.useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const currentUser = useAuthStore((state) => state.currentUser); // Get current user
  const currentBranch = useAuthStore((state) => state.availableBranches.find(b => b.id === state.currentBranchId)); // Get current branch details


  // Fetch all products on component mount
  React.useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProducts = await syncService.getProducts();
        setAllProducts(fetchedProducts);
        setSearchResults(fetchedProducts); // Initially, search results show all products
      } catch (err) {
        console.error("POSPage: Failed to fetch products:", err);
        setError(t('failedToLoadProducts')); // Ensure this translation exists
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductsData();
  }, [t]);

  // Product search logic - now filters allProducts
  React.useEffect(() => {
    if (!isLoading) { // Only filter if not loading and allProducts is populated
      if (searchTerm.trim() === '') {
        setSearchResults(allProducts);
      } else {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = allProducts.filter(product =>
          product.name.toLowerCase().includes(lowercasedFilter) ||
          product.sku.toLowerCase().includes(lowercasedFilter) ||
          (product.barcode && product.barcode.toLowerCase().includes(lowercasedFilter))
        );
        setSearchResults(filtered);
      }
    }
  }, [searchTerm, allProducts, isLoading]);

  const handleAddToCart = (product: Product) => {
    addItemToCart(product, 1); // Add 1 quantity by default
  };

  // Auto-focus barcode input on mount and after cart clear
  React.useEffect(() => {
    if (!isLoading) { // Also ensure not loading before focusing
      barcodeInputRef.current?.focus();
    }
  }, [cartItems.length === 0, isLoading]);

  const handleBarcodeScan = () => {
    if (!barcodeInputValue.trim()) return;

    const scannedBarcode = barcodeInputValue.trim();
    const productFound = allProducts.find(p => p.barcode === scannedBarcode); // Search in allProducts

    if (productFound) {
      addItemToCart(productFound, 1); // addItemToCart handles existing items by incrementing quantity
      setBarcodeInputValue(''); // Clear input after successful scan
    } else {
      // TODO: Implement a more user-friendly notification (e.g., toast)
      alert(t('productNotFoundWithBarcode', { barcode: scannedBarcode }));
      // Optionally, clear the input or let user correct it
      // setBarcodeInputValue('');
    }
    barcodeInputRef.current?.focus(); // Always refocus after attempting a scan
  };

  // Basic loading and error display for POSPage product fetching
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">{t('loadingProducts')}...</div>; // Ensure translation exists
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-destructive">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-muted/40 p-4 gap-4">
      {/* Top Bar: Barcode, Search, Customer, Settings */}
      <header className="flex items-center gap-4 bg-background p-3 rounded-lg shadow">
        <div className="relative flex-grow-[2]"> {/* Barcode input takes more space */}
          <BarcodeIcon className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            ref={barcodeInputRef}
            type="text"
            placeholder={t('scanBarcodePlaceholder')} // Add this translation
            className="pl-10 w-full text-base py-2.5" // Increased padding and text size
            value={barcodeInputValue}
            onChange={(e) => setBarcodeInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeScan();
              }
            }}
          />
        </div>
        <div className="relative flex-grow"> {/* Search input takes less space now */}
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('posSearchPlaceholder')}
            className="pl-8 w-full" // Standard size
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <UserCircle2Icon className="h-5 w-5" />
          <span className="sr-only">{t('selectCustomer')}</span>
        </Button>
        <Button variant="outline" size="icon">
          <Settings2Icon className="h-5 w-5" />
          <span className="sr-only">{t('posSettings')}</span>
        </Button>
      </header>

      {/* Main Content: Product Area and Cart Area */}
      <main className="flex flex-1 gap-4 overflow-hidden">
        {/* Product Area (Left/Main) */}
        <section className="flex-1 bg-background p-4 rounded-lg shadow overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">{t('products')}</h2>
          {searchResults.length === 0 && searchTerm.trim() !== '' ? (
            <div className="text-center text-muted-foreground py-8">{t('noProductsFound')}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map((product) => (
                <Card
                  key={product.id}
                  className="flex flex-col items-center p-3 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleAddToCart(product)}
                >
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/80?text=No+Image'}
                    alt={product.name}
                    className="w-20 h-20 object-cover mb-2 rounded-md"
                  />
                  <p className="text-xs font-medium text-center h-10 leading-tight overflow-hidden"> {/* Fixed height for name */}
                    {product.name}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {t('currencyEGP')} {product.sellingPrice.toFixed(2)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Cart/Invoice Area (Right Sidebar) */}
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-background p-4 rounded-lg shadow gap-4">
          <Card className="flex-1 flex flex-col overflow-hidden"> {/* Ensure card itself can flex */}
            <CardHeader>
              <CardTitle>{t('currentOrder')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0"> {/* Allow content to scroll */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5 whitespace-nowrap">{t('item')}</TableHead>
                    <TableHead className="w-1/5 text-center">{t('qty')}</TableHead>
                    <TableHead className="w-1/5 text-right">{t('price')}</TableHead>
                    <TableHead className="w-1/5 text-right">{t('total')}</TableHead>
                    <TableHead className="w-auto p-1 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item: CartItem) => ( // Added type for item
                      <TableRow key={item.id}>
                        <TableCell className="font-medium py-1.5 text-xs">
                          {item.name}
                          {item.itemDiscountValue && item.itemDiscountValue > 0 && (
                            <div className="text-xs text-destructive/80">
                              ({item.itemDiscountType === 'percentage' ? `${item.itemDiscountValue}%` : `${t('currencyEGP')} ${item.itemDiscountValue.toFixed(2)}`} {t('discountApplied')})
                              <Button variant="link" size="xs" className="p-0 h-auto ml-1 text-destructive" onClick={() => removeItemDiscount(item.id)}>Remove</Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-1.5 text-xs">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateItemQuantityInCart(item.id, item.transactionQuantity - 1)}> <MinusIcon className="h-3 w-3" /> </Button>
                            <span>{item.transactionQuantity}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateItemQuantityInCart(item.id, item.transactionQuantity + 1)}> <PlusIcon className="h-3 w-3" /> </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-1.5 text-xs">{item.transactionPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-1.5 text-xs">{item.lineTotal.toFixed(2)}</TableCell>
                        <TableCell className="p-1 text-center space-x-0.5">
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600" onClick={() => { setDiscountTarget({ type: 'item', itemId: item.id, itemName: item.name }); setIsDiscountDialogOpen(true); }}> <TagIcon className="h-4 w-4" /> </Button>
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => removeItemFromCart(item.id)}> <Trash2Icon className="h-4 w-4" /> </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t('cartEmpty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {cartItems.length > 0 && (
              <CardFooter className="flex flex-col gap-2 border-t pt-4 mt-auto">
                <div className="flex justify-between w-full text-sm">
                  <span>{t('subtotalBeforeDiscount')}</span>
                  <span>{subtotalBeforeInvoiceDiscount.toFixed(2)}</span>
                </div>

                {/* Invoice Discount Section */}
                <div className="flex justify-between items-center w-full text-sm">
                  <Button variant="link" className="p-0 h-auto text-blue-500" onClick={() => { setDiscountTarget({ type: 'invoice' }); setIsDiscountDialogOpen(true); }}>
                    {invoiceDiscountType ? t('editInvoiceDiscount') : t('addInvoiceDiscount')}
                  </Button>
                  {calculatedInvoiceDiscountAmount > 0 && (
                     <span className="text-destructive">
                       (-{calculatedInvoiceDiscountAmount.toFixed(2)})
                       {invoiceDiscountType === 'percentage' && ` (${invoiceDiscountValue}%)`}
                       <Button variant="link" size="xs" className="p-0 h-auto ml-1 text-destructive" onClick={() => removeInvoiceDiscount()}>Remove</Button>
                     </span>
                  )}
                </div>
                 {calculatedInvoiceDiscountAmount > 0 && (
                   <div className="flex justify-between w-full text-sm font-semibold">
                     <span>{t('subtotalAfterDiscount')}</span>
                     <span>{subtotalAfterInvoiceDiscount.toFixed(2)}</span>
                   </div>
                 )}
                <div className="flex justify-between w-full text-sm">
                  <span>{t('tax')} ({DEFAULT_TAX_RATE*100}%)</span>
                  <span>{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full text-lg font-semibold">
                  <span>{t('grandTotal')}</span>
                  <span>{grandTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-2" size="lg" onClick={() => setIsPaymentDialogOpen(true)} disabled={cartItems.length === 0}>
                  <DollarSignIcon className="mr-2 h-5 w-5" /> {t('proceedToPayment')}
                </Button>
              </CardFooter>
            )}
          </Card>
        </aside>
      </main>
      <DiscountDialog
        isOpen={isDiscountDialogOpen}
        setIsOpen={setIsDiscountDialogOpen}
        onApplyDiscount={(type, value) => {
          if (discountTarget.type === 'item' && discountTarget.itemId) {
            applyItemDiscount(discountTarget.itemId, type, value);
          } else if (discountTarget.type === 'invoice') {
            applyInvoiceDiscount(type, value);
          }
        }}
        currentItemName={discountTarget.itemName}
      />
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        setIsOpen={setIsPaymentDialogOpen}
        totalAmount={grandTotal}
        onConfirmPayment={async (paymentDetails) => { // Made async
          // Basic Invoice Generation
          const invoicePayload = { // Renamed to avoid conflict with Invoice type if imported directly
            id: `INV-${Date.now()}`, // Simple unique ID
            items: cartItems.map(item => ({
              productId: item.id,
              productName: item.name,
              quantity: item.transactionQuantity,
              unitPrice: item.transactionPrice,
              originalLineTotal: item.originalLineTotal,
              itemDiscountType: item.itemDiscountType,
              itemDiscountValue: item.itemDiscountValue,
              itemDiscountAmount: item.itemDiscountAmount,
              lineTotal: item.lineTotal,
              // Tax per item could be calculated here if item.taxRate exists and is used
            })),
            subtotalBeforeInvoiceDiscount: subtotalBeforeInvoiceDiscount,
            invoiceDiscountType: invoiceDiscountType,
            invoiceDiscountValue: invoiceDiscountValue,
            invoiceDiscountAmount: calculatedInvoiceDiscountAmount,
            subtotalAfterInvoiceDiscount: subtotalAfterInvoiceDiscount,
            taxTotal: tax,
            grandTotal: grandTotal,
            paymentMethods: [{ method: paymentDetails.method, amount: paymentDetails.amountPaid }],
            amountPaid: paymentDetails.amountPaid,
            changeDue: paymentDetails.method === PaymentMethod.CASH && paymentDetails.tendered ? paymentDetails.tendered - grandTotal : 0,
            tenderedAmount: paymentDetails.tendered,
            createdAt: new Date(), // Use Date object, printer service can format
            cashierId: currentUser?.id,
            branchId: currentBranch?.id,
            // Required by Invoice type, ensure it's set
            status: 'completed' as 'completed' | 'pending' | 'voided' | 'parked', // Cast to satisfy type for now
          };

          // Attempt to save the sale via syncService (mocked for now)
          try {
            await syncService.submitSale(invoicePayload); // Does not return the payload currently
            console.log("Sale submitted via syncService, Invoice Data:", JSON.stringify(invoicePayload, null, 2));
          } catch (e) {
            console.error("Failed to submit sale via syncService", e);
            // Decide if this failure should prevent receipt printing or clearing cart
          }

          alert(t('saleCompletedSuccessfully') + `\nInvoice ID: ${invoicePayload.id}`); // Simple feedback

          // Attempt to print receipt
          setPrintingStatus('printing');
          // TODO: Show "Printing..." message to user
          try {
            // Ensure printer is initialized before attempting to print
            // This could be done once when the POS page loads or before opening payment dialog
            // For simplicity here, let's assume printerService.initializePrinter() is called elsewhere or handles it.
            // A more robust way:
            // const printerReady = await printerService.initializePrinter();
            // if (!printerReady) {
            //   alert(t('printerErrors.printerNotReadyError'));
            //   setPrintingStatus('error');
            //   // Still clear cart and close dialog? Or allow retry?
            //   clearCart();
            //   setIsPaymentDialogOpen(false);
            //   return;
            // }

            const printSuccess = await printerService.printReceipt(invoicePayload);
            if (printSuccess) {
              setPrintingStatus('success');
              // TODO: Show "Receipt printed" message briefly
            } else {
              setPrintingStatus('error');
              alert(t('printerErrors.printingFailedError')); // Generic error
            }
          } catch (error) {
            console.error("Printing error:", error);
            setPrintingStatus('error');
            alert(t('printerErrors.printingFailedError'));
          } finally {
            // TODO: Reset printing status to 'idle' after a delay or user action for feedback messages
            // setTimeout(() => setPrintingStatus('idle'), 3000);
          }

          clearCart();
          setIsPaymentDialogOpen(false);
          barcodeInputRef.current?.focus(); // Focus barcode input for next sale
        }}
      />
      {/* TODO: Add a small UI element to display printingStatus feedback */}
    </div>
  );
};

// Add a default tax rate constant if not already defined in cartStore or elsewhere accessible
const DEFAULT_TAX_RATE = 0.14;


// PaymentDialog component
interface PaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalAmount: number;
  onConfirmPayment: (paymentDetails: { method: PaymentMethod; amountPaid: number; tendered?: number }) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, setIsOpen, totalAmount, onConfirmPayment }) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH); // Default to Cash
  const [amountTendered, setAmountTendered] = React.useState<string>('');
  const [changeDue, setChangeDue] = React.useState<number>(0);

  React.useEffect(() => {
    if (selectedMethod === PaymentMethod.CASH) {
      const tendered = parseFloat(amountTendered);
      if (!isNaN(tendered) && tendered >= totalAmount) {
        setChangeDue(tendered - totalAmount);
      } else {
        setChangeDue(0);
      }
    } else {
      setChangeDue(0); // No change for non-cash methods initially
    }
  }, [amountTendered, totalAmount, selectedMethod]);

  React.useEffect(() => { // Reset amount tendered if totalAmount changes or dialog opens
    if (isOpen) {
      if (selectedMethod === PaymentMethod.CASH) {
        setAmountTendered(totalAmount.toFixed(2)); // Pre-fill for cash
      } else {
        setAmountTendered(''); // Clear for non-cash methods
      }
    }
  }, [totalAmount, isOpen, selectedMethod]);


  const handleConfirm = () => {
    let paymentDetails: { method: PaymentMethod; amountPaid: number; tendered?: number };

    if (selectedMethod === PaymentMethod.CASH) {
      const tendered = parseFloat(amountTendered);
      if (isNaN(tendered) || tendered < totalAmount) {
        alert(t('amountTenderedTooLow')); // Basic validation
        return;
      }
      paymentDetails = {
        method: selectedMethod,
        amountPaid: totalAmount,
        tendered: tendered,
      };
    } else { // For CARD and DEFERRED
      paymentDetails = {
        method: selectedMethod,
        amountPaid: totalAmount,
        // tendered is not applicable
      };
    }

    onConfirmPayment(paymentDetails);
    setIsOpen(false);
    // Reset state for next time dialog opens
    setSelectedMethod(PaymentMethod.CASH); // Default back to cash
    setAmountTendered('');
    setChangeDue(0);
  };

  const isConfirmDisabled = () => {
    if (selectedMethod === PaymentMethod.CASH) {
      const tendered = parseFloat(amountTendered);
      return isNaN(tendered) || tendered < totalAmount;
    }
    // No specific disabled condition for CARD or DEFERRED based on input here
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('processPayment')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">{t('totalDue')}</p>
            <p className="text-3xl font-bold">{t('currencyEGP')} {totalAmount.toFixed(2)}</p>
          </div>

          <RadioGroup
            defaultValue={PaymentMethod.CASH}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="flex justify-around"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PaymentMethod.CASH} id="pm_cash" />
              <Label htmlFor="pm_cash">{t('paymentMethodCash')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PaymentMethod.CARD} id="pm_card" />
              <Label htmlFor="pm_card">{t('paymentMethodCard')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PaymentMethod.DEFERRED} id="pm_deferred" />
              <Label htmlFor="pm_deferred">{t('paymentMethodDeferred')}</Label> {/* Add this translation */}
            </div>
          </RadioGroup>

          {selectedMethod === PaymentMethod.CASH && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="amountTendered">{t('amountTendered')}</Label>
              <Input
                id="amountTendered"
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
                min={totalAmount.toString()} // Ensure tendered is at least total
              />
              {parseFloat(amountTendered) >= totalAmount && (
                <div className="text-right text-sm text-muted-foreground">
                  {t('changeDue')}: {t('currencyEGP')} {changeDue.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled()}>
            {t('confirmPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default POSPage;

// Add translations for i18n:
// posSearchPlaceholder: "Search products by name, SKU, or barcode..."
// selectCustomer: "Select Customer"
// posSettings: "POS Settings"
// products: "Products"
// currentOrder: "Current Order"
// item: "Item"
// qty: "Qty"
// total: "Total"
// cartEmpty: "Your cart is empty."
// subtotal: "Subtotal"
// tax: "Tax"
// grandTotal: "Grand Total"
// proceedToPayment: "Proceed to Payment"
