import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">{t('unauthorizedAccessTitle')}</CardTitle>
          <CardDescription>{t('unauthorizedAccessMessage')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <img src="/assets/icons/shield-alert-icon.svg" alt="Unauthorized Access" className="mx-auto h-24 w-24 text-destructive" />
          {/* Replace with an actual SVG or image if available, or use a Shadcn icon component if added */}
          <p className="text-muted-foreground">
            {t('unauthorizedContactAdmin')}
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t('goBack')}
            </Button>
            <Button asChild>
              <Link to="/pos">{t('goToHomepage')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;

// Suggested translations for i18n.ts:
// en: {
//   unauthorizedAccessTitle: "Access Denied",
//   unauthorizedAccessMessage: "You do not have the necessary permissions to view this page.",
//   unauthorizedContactAdmin: "If you believe this is an error, please contact your administrator.",
//   goBack: "Go Back",
//   goToHomepage: "Go to Homepage"
// }
// ar: {
//   unauthorizedAccessTitle: "الوصول مرفوض",
//   unauthorizedAccessMessage: "ليس لديك الأذونات اللازمة لعرض هذه الصفحة.",
//   unauthorizedContactAdmin: "إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بالمسؤول.",
//   goBack: "العودة",
//   goToHomepage: "الذهاب إلى الصفحة الرئيسية"
// }
