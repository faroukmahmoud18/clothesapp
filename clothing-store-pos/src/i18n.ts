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
    amountTendered: "Amount Tendered",
    changeDue: "Change Due",
    confirmPayment: "Confirm Payment",
    amountTenderedTooLow: "Amount tendered is less than total due.",
    saleCompletedSuccessfully: "Sale completed successfully!"
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
    amountTendered: "المبلغ المدفوع",
    changeDue: "الباقي",
    confirmPayment: "تأكيد الدفع",
    amountTenderedTooLow: "المبلغ المدفوع أقل من الإجمالي المستحق.",
    saleCompletedSuccessfully: "تمت عملية البيع بنجاح!"
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
