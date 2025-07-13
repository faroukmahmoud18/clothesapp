import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ARIMA from 'arima';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SalesChart from './SalesChart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SalesForecastProps {
  salesData: number[];
}

const SalesForecast: React.FC<SalesForecastProps> = ({ salesData }) => {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState<number[] | null>(null);
  const [p, setP] = useState(1);
  const [d, setD] = useState(0);
  const [q, setQ] = useState(1);
  const [P, setP_] = useState(0);
  const [D, setD_] = useState(0);
  const [Q, setQ_] = useState(0);
  const [S, setS] = useState(12);
  const [predictCount, setPredictCount] = useState(12);

  const handleForecast = () => {
    const arima = new ARIMA({ p, d, q, P, D, Q, S });
    arima.train(salesData);
    const [pred, errors] = arima.predict(predictCount);
    setForecast(pred);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('salesForecast')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>p</Label>
            <Input type="number" value={p} onChange={(e) => setP(Number(e.target.value))} />
          </div>
          <div>
            <Label>d</Label>
            <Input type="number" value={d} onChange={(e) => setD(Number(e.target.value))} />
          </div>
          <div>
            <Label>q</Label>
            <Input type="number" value={q} onChange={(e) => setQ(Number(e.target.value))} />
          </div>
          <div>
            <Label>P</Label>
            <Input type="number" value={P} onChange={(e) => setP_(Number(e.target.value))} />
          </div>
          <div>
            <Label>D</Label>
            <Input type="number" value={D} onChange={(e) => setD_(Number(e.target.value))} />
          </div>
          <div>
            <Label>Q</Label>
            <Input type="number" value={Q} onChange={(e) => setQ_(Number(e.target.value))} />
          </div>
          <div>
            <Label>S</Label>
            <Input type="number" value={S} onChange={(e) => setS(Number(e.target.value))} />
          </div>
          <div>
            <Label>Predict Count</Label>
            <Input type="number" value={predictCount} onChange={(e) => setPredictCount(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={handleForecast} className="mt-4">{t('generateForecast')}</Button>
        {forecast && (
          <div className="mt-4">
            <SalesChart
              data={{
                labels: Array.from({ length: predictCount }, (_, i) => `Month ${i + 1}`),
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
