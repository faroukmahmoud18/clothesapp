import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ARIMA from 'arima';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SalesChart from './SalesChart';

interface SalesForecastProps {
  salesData: number[];
}

const SalesForecast: React.FC<SalesForecastProps> = ({ salesData }) => {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState<number[] | null>(null);

  const handleForecast = () => {
    const arima = new ARIMA({ p: 1, d: 0, q: 1, P: 0, D: 0, Q: 0, S: 12 });
    arima.train(salesData);
    const [pred, errors] = arima.predict(12);
    setForecast(pred);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('salesForecast')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleForecast}>{t('generateForecast')}</Button>
        {forecast && (
          <div className="mt-4">
            <SalesChart
              data={{
                labels: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
                datasets: [
                  {
                    label: t('forecastedSales'),
                    data: forecast,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  },
                ],
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesForecast;
