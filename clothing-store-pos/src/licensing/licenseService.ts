import { showWarningToast } from '@/lib/toast';

const MOCK_LICENSE_KEY = 'VALID-LICENSE-KEY';
const MOCK_EXPIRY_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days from now

export const checkLicense = async (): Promise<{ isValid: boolean; expiryDate: Date | null }> => {
  // In a real application, this would involve an API call to a licensing server.
  // For now, we'll use a mock implementation.
  const licenseKey = localStorage.getItem('licenseKey');
  if (licenseKey === MOCK_LICENSE_KEY) {
    const expiryDate = new Date(localStorage.getItem('licenseExpiry') || MOCK_EXPIRY_DATE);
    return { isValid: true, expiryDate };
  }
  return { isValid: false, expiryDate: null };
};

export const handleLicenseExpiry = (expiryDate: Date) => {
  const now = new Date();
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysDiff <= 0) {
    // Deactivate features
    showErrorToast('Your license has expired. Please renew your license to continue using all features.');
  } else if (daysDiff <= 7) {
    showWarningToast(`Your license will expire in ${daysDiff} days.`);
  }
};
