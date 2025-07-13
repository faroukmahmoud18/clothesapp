import React from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/pos/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TriangleAlertIcon } from 'lucide-react';
import * as syncService from '@/sync/syncService';

interface InventoryAlertsProps {
  products: Product[];
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ products }) => {
  const { t } = useTranslation();

  const lowStockProducts = products.filter(p => p.stockQuantity <= (p.lowStockThreshold || 0));

  const [slowMovingProducts, setSlowMovingProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const fetchSlowMovingProducts = async () => {
      const products = await syncService.getSlowMovingProducts(30);
      setSlowMovingProducts(products);
    };
    fetchSlowMovingProducts();
  }, []);

  if (lowStockProducts.length === 0 && slowMovingProducts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TriangleAlertIcon className="mr-2 h-5 w-5 text-destructive" />
          {t('inventoryAlerts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length > 0 && (
          <div>
            <h3 className="font-semibold">{t('lowStockItems')}</h3>
            <ul className="list-disc list-inside">
              {lowStockProducts.map(p => (
                <li key={p.id}>
                  {p.name} ({t('stock')}: {p.stockQuantity}, {t('threshold')}: {p.lowStockThreshold})
                </li>
              ))}
            </ul>
          </div>
        )}
        {slowMovingProducts.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">{t('slowMovingItems')}</h3>
            <ul className="list-disc list-inside">
              {slowMovingProducts.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryAlerts;
