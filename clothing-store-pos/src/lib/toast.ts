// @/lib/toast.ts
import toast from 'react-hot-toast';
import i18n from '@/i18n'; // Import the initialized i18n instance

// Type definition for i18next's TFunctionOptions to allow for better type checking.
// This might need to be adjusted based on the specific version of i18next.
// A simpler approach is to just use `any` if strict typing isn't necessary here.
type I18nOptions = Parameters<typeof i18n.t>[1];

/**
 * Displays a success toast notification with a translated message.
 * @param messageKey The i18n key for the message.
 * @param options Optional i18n interpolation/options object.
 */
export const showSuccessToast = (messageKey: string, options?: I18nOptions): void => {
  const translatedMessage = i18n.t(messageKey, options);
  toast.success(translatedMessage);
};

/**
 * Displays an error toast notification with a translated message.
 * @param messageKey The i18n key for the message.
 * @param options Optional i18n interpolation/options object.
 */
export const showErrorToast = (messageKey: string, options?: I18nOptions): void => {
  const translatedMessage = i18n.t(messageKey, options);
  toast.error(translatedMessage, {
    // Optionally, make errors stay longer
    duration: 5000,
  });
};

/**
 * Displays a standard informational toast notification with a translated message.
 * @param messageKey The i18n key for the message.
 * @param options Optional i18n interpolation/options object.
 */
export const showInfoToast = (messageKey: string, options?: I18nOptions): void => {
  const translatedMessage = i18n.t(messageKey, options);
  toast(translatedMessage);
};

// Example usage:
// import { showSuccessToast, showErrorToast } from '@/lib/toast';
//
// showSuccessToast('customerForm.successRegistered', { name: 'John Doe' });
// showErrorToast('errorDateFromAfterDateTo');
