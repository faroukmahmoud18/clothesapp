import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  translation: {
    login: 'Login',
    pos: 'POS',
    inventory: 'Inventory',
    loginPage: 'Login Page',
    posPage: 'Point of Sale',
    inventoryPage: 'Inventory Management',
    loginTitle: 'Login to your Account',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    loginFailed: 'Invalid username or password.',
    logout: 'Logout',
    unauthorizedAccessTitle: "Access Denied",
    unauthorizedAccessMessage: "You do not have the necessary permissions to view this page.",
    unauthorizedContactAdmin: "If you believe this is an error, please contact your administrator.",
    goBack: "Go Back",
    goToHomepage: "Go to Homepage",
    // POS Page translations
    posSearchPlaceholder: "Search products by name, SKU, or barcode...",
    selectCustomer: "Select Customer",
    posSettings: "POS Settings",
    products: "Products",
    currentOrder: "Current Order",
    item: "Item",
    qty: "Qty",
    price: "Price", // New key
    total: "Total",
    cartEmpty: "Your cart is empty.",
    subtotal: "Subtotal",
    tax: "Tax",
    grandTotal: "Grand Total",
    proceedToPayment: "Proceed to Payment",
    noProductsFound: "No products found matching your search.",
    currencyEGP: "EGP", // Or just use "ج.م" directly in Arabic file
    scanBarcodePlaceholder: "Scan Barcode or Enter Code...",
    productNotFoundWithBarcode: "Product not found with barcode: {{barcode}}",
    // Discount translations
    discountApplied: "discount applied",
    applyDiscountToItem: "Apply Discount to {{itemName}}",
    applyInvoiceDiscount: "Apply Invoice Discount",
    percentageDiscount: "Percentage",
    fixedAmountDiscount: "Fixed Amount",
    enterPercentage: "Enter % (e.g., 10 for 10%)",
    enterFixedAmount: "Enter amount",
    cancel: "Cancel",
    applyDiscount: "Apply Discount",
    invalidDiscountValue: "Invalid discount value. Please enter a positive number.",
    subtotalBeforeDiscount: "Subtotal (Before Invoice Discount)",
    addInvoiceDiscount: "Add Invoice Discount",
    editInvoiceDiscount: "Edit Invoice Discount",
    subtotalAfterDiscount: "Subtotal (After Invoice Discount)",
    // Payment Dialog translations
    processPayment: "Process Payment",
    totalDue: "Total Due",
    paymentMethodCash: "Cash",
    paymentMethodCard: "Card",
    paymentMethodDeferred: "Deferred",
    amountTendered: "Amount Tendered",
    changeDue: "Change Due",
    confirmPayment: "Confirm Payment",
    amountTenderedTooLow: "Amount tendered is less than total due.",
    saleCompletedSuccessfully: "Sale completed successfully!",
    // Inventory Page translations
    inventoryManagement: "Inventory Management",
    importProducts: "Import Products",
    addNewProduct: "Add New Product",
    searchInventoryPlaceholder: "Search by name, SKU, category...",
    productName: "Product Name",
    sku: "SKU",
    category: "Category",
    stockQuantity: "Stock Qty",
    lowStockThreshold: "Low Stock Threshold",
    actions: "Actions",
    noInventoryItems: "No inventory items found.",
    previousPage: "Previous",
    nextPage: "Next",
    pageNumber: "Page {{currentPage}} of {{totalPages}}",
    // Product Form Dialog translations
    editProductTitle: "Edit Product",
    addNewProductTitle: "Add New Product",
    barcodeOptional: "Barcode (Optional)",
    sellingPrice: "Selling Price",
    purchasePriceOptional: "Purchase Price (Optional)",
    lowStockThresholdOptional: "Low Stock Threshold (Optional)",
    taxRatePercentage: "Tax Rate (%)",
    imageUrlOptional: "Image URL (Optional)",
    saveChanges: "Save Changes",
    addProduct: "Add Product",
    fillRequiredFields: "Please fill all required fields (Name, SKU, Category).",
    featureComingSoon: "Feature coming soon!",
    confirmDeleteProduct: "Are you sure you want to delete the product \"{{productName}}\"?",
    // View Product Details Dialog translations
    productDetailsTitle: "Product Details",
    close: "Close",
    // Product Form Dialog specific for product type & tax
    productType: "Product Type",
    selectProductType: "Select Product Type...",
    productTaxRateOptional: "Product's Own Tax Rate (%) (Optional)",
    taxRatePlaceholder: "e.g., 14 for 14%",
    taxRateNote: "Used if Product Type has no tax or no type is selected. Overridden by Product Type's tax.",
    // ViewProductDialog Barcode Generation
    generateBarcodeButton: "Generate Barcode",
    generatedBarcodeTitle: "Barcode for",
    noBarcodeOrSku: "Product has no barcode or SKU to generate a barcode from.",
    // Sync Service related messages
    failedToLoadProducts: "Failed to load products. Please try again later.",
    loadingProducts: "Loading products...",
    failedToDeleteProduct: "Failed to delete product. Please try again.",
    failedToUpdateProduct: "Failed to update product. Please try again.",
    failedToSaveProduct: "Failed to save product. Please try again."
    // Add more translations as needed
  },
};

// Arabic translations
const arTranslations = {
  translation: {
    login: 'تسجيل الدخول',
    pos: 'نقطة البيع',
    inventory: 'إدارة المخزون',
    loginPage: 'صفحة تسجيل الدخول',
    posPage: 'نقطة البيع',
    inventoryPage: 'إدارة المخزون',
    loginTitle: 'تسجيل الدخول إلى حسابك',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    loginFailed: 'اسم المستخدم أو كلمة المرور غير صالحة.',
    logout: 'تسجيل الخروج',
    unauthorizedAccessTitle: "الوصول مرفوض",
    unauthorizedAccessMessage: "ليس لديك الأذونات اللازمة لعرض هذه الصفحة.",
    unauthorizedContactAdmin: "إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بالمسؤول.",
    goBack: "العودة",
    goToHomepage: "الذهاب إلى الصفحة الرئيسية",
    // POS Page translations (Arabic)
    posSearchPlaceholder: "ابحث عن المنتجات بالاسم أو الرمز أو الباركود...",
    selectCustomer: "اختر العميل",
    posSettings: "إعدادات نقطة البيع",
    products: "المنتجات",
    currentOrder: "الطلب الحالي",
    item: "الصنف",
    qty: "الكمية",
    price: "السعر", // New key
    total: "الإجمالي",
    cartEmpty: "عربة التسوق فارغة.",
    subtotal: "المجموع الفرعي",
    tax: "الضريبة",
    grandTotal: "المجموع الكلي",
    proceedToPayment: "الدفع",
    noProductsFound: "لم يتم العثور على منتجات تطابق بحثك.",
    currencyEGP: "ج.م",
    scanBarcodePlaceholder: "امسح الباركود أو أدخل الرمز...",
    productNotFoundWithBarcode: "لم يتم العثور على منتج بالباركود: {{barcode}}",
    // Discount translations (Arabic)
    discountApplied: "خصم مطبق",
    applyDiscountToItem: "تطبيق خصم على {{itemName}}",
    applyInvoiceDiscount: "تطبيق خصم على الفاتورة",
    percentageDiscount: "نسبة مئوية",
    fixedAmountDiscount: "مبلغ ثابت",
    enterPercentage: "أدخل النسبة % (مثال: 10 لـ 10%)",
    enterFixedAmount: "أدخل المبلغ",
    cancel: "إلغاء",
    applyDiscount: "تطبيق الخصم",
    invalidDiscountValue: "قيمة الخصم غير صالحة. يرجى إدخال رقم موجب.",
    subtotalBeforeDiscount: "المجموع الفرعي (قبل خصم الفاتورة)",
    addInvoiceDiscount: "إضافة خصم للفاتورة",
    editInvoiceDiscount: "تعديل خصم الفاتورة",
    subtotalAfterDiscount: "المجموع الفرعي (بعد خصم الفاتورة)",
    // Payment Dialog translations (Arabic)
    processPayment: "إتمام الدفع",
    totalDue: "المبلغ الإجمالي المستحق",
    paymentMethodCash: "نقداً",
    paymentMethodCard: "بطاقة",
    paymentMethodDeferred: "آجل",
    amountTendered: "المبلغ المدفوع",
    changeDue: "الباقي",
    confirmPayment: "تأكيد الدفع",
    amountTenderedTooLow: "المبلغ المدفوع أقل من الإجمالي المستحق.",
    saleCompletedSuccessfully: "تمت عملية البيع بنجاح!",
    // Inventory Page translations (Arabic)
    inventoryManagement: "إدارة المخزون",
    importProducts: "استيراد المنتجات",
    addNewProduct: "إضافة منتج جديد",
    searchInventoryPlaceholder: "البحث بالاسم، رمز SKU، الفئة...",
    productName: "اسم المنتج",
    sku: "SKU",
    category: "الفئة",
    stockQuantity: "كمية المخزون",
    lowStockThreshold: "حد المخزون المنخفض",
    actions: "الإجراءات",
    noInventoryItems: "لم يتم العثور على عناصر في المخزون.",
    previousPage: "السابق",
    nextPage: "التالي",
    pageNumber: "صفحة {{currentPage}} من {{totalPages}}",
    // Product Form Dialog translations (Arabic)
    editProductTitle: "تعديل المنتج",
    addNewProductTitle: "إضافة منتج جديد",
    barcodeOptional: "الباركود (اختياري)",
    sellingPrice: "سعر البيع",
    purchasePriceOptional: "سعر الشراء (اختياري)",
    lowStockThresholdOptional: "حد المخزون المنخفض (اختياري)",
    taxRatePercentage: "نسبة الضريبة (%)",
    imageUrlOptional: "رابط الصورة (اختياري)",
    saveChanges: "حفظ التغييرات",
    addProduct: "إضافة منتج",
    fillRequiredFields: "يرجى ملء جميع الحقول المطلوبة (الاسم، SKU، الفئة).",
    featureComingSoon: "الميزة قيد التطوير!",
    confirmDeleteProduct: "هل أنت متأكد أنك تريد حذف المنتج \"{{productName}}\"؟",
    // View Product Details Dialog translations (Arabic)
    productDetailsTitle: "تفاصيل المنتج",
    close: "إغلاق",
    // Product Form Dialog specific for product type & tax (Arabic)
    productType: "نوع المنتج",
    selectProductType: "اختر نوع المنتج...",
    productTaxRateOptional: "نسبة ضريبة المنتج الخاصة (%) (اختياري)",
    taxRatePlaceholder: "مثال: 14 لـ 14%",
    taxRateNote: "تُستخدم إذا لم يكن لنوع المنتج ضريبة أو لم يتم اختيار نوع. يتم تجاوزها بضريبة نوع المنتج.",
    // ViewProductDialog Barcode Generation (Arabic)
    generateBarcodeButton: "إنشاء باركود",
    generatedBarcodeTitle: "باركود لـ",
    noBarcodeOrSku: "لا يوجد باركود أو SKU للمنتج لإنشاء باركود منه.",
    // Sync Service related messages (Arabic)
    failedToLoadProducts: "فشل تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقًا.",
    loadingProducts: "جاري تحميل المنتجات...",
    failedToDeleteProduct: "فشل حذف المنتج. يرجى المحاولة مرة أخرى.",
    failedToUpdateProduct: "فشل تحديث المنتج. يرجى المحاولة مرة أخرى.",
    failedToSaveProduct: "فشل حفظ المنتج. يرجى المحاولة مرة أخرى."
    // Add more translations as needed
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    debug: true, // Enable debug mode for development
    fallbackLng: 'en', // Fallback language if detection fails
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    resources: {
      en: enTranslations,
      ar: arTranslations,
    },
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // Caches a language choice in localStorage
      caches: ['localStorage'],
    }
  });

export default i18n;
