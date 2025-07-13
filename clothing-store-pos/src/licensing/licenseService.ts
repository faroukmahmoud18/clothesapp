import { showWarningToast, showErrorToast } from '@/lib/toast';

export const checkLicense = async (): Promise<{ isValid: boolean; expiryDate: Date | null }> => {
  const licenseKey = localStorage.getItem('licenseKey');
  if (!licenseKey) {
    return { isValid: false, expiryDate: null };
  }

  try {
    const response = await fetch('http://localhost:3001/validate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await response.json();
    if (data.isValid) {
      localStorage.setItem('licenseExpiry', data.expiryDate);
    }
    return data;
  } catch (error) {
    console.error('Failed to validate license:', error);
    showErrorToast('Failed to validate license. Please check your internet connection.');
    return { isValid: false, expiryDate: null };
  }
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
