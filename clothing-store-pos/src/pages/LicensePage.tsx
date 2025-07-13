import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkLicense } from '@/licensing/licenseService';
import { showErrorToast } from '@/lib/toast';

const LicensePage: React.FC = () => {
  const { t } = useTranslation();
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState('');

  const handleCheckLicense = async () => {
    if (licenseKey) {
      localStorage.setItem('licenseKey', licenseKey);
      const { isValid, expiryDate } = await checkLicense();
      if (isValid) {
        setLicenseStatus(`Valid until ${new Date(expiryDate).toLocaleDateString()}`);
      } else {
        setLicenseStatus('Invalid license key');
      }
    } else {
      showErrorToast('Please enter a license key.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t('licenseManagement')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('enterLicenseKey')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
            />
            <Button onClick={handleCheckLicense}>{t('activateLicense')}</Button>
          </div>
          {licenseStatus && <p>{licenseStatus}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicensePage;
