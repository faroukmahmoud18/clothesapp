// @/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // For date inputs
import { Label } from '@/components/ui/label'; // For date input labels
import * as syncService from '@/sync/syncService';
import * as exportService from '@/reports/exportService'; // Import export service
import { DailySalesReportData, SalesSummaryReportData, CurrentInventoryReportData, PaymentMethodSummary } from '@/reports/types'; // Import PaymentMethodSummary
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // For displaying data
import { useAuthStore } from '@/store/authStore'; // To get current branch for filtering
import { FileDownIcon } from 'lucide-react'; // For export buttons

// Helper to format date to YYYY-MM-DD for input type="date"
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const currentBranchId = useAuthStore((state) => state.currentBranchId);


  // State for report data
  const [reportData, setReportData] = useState<DailySalesReportData | SalesSummaryReportData | CurrentInventoryReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for date pickers
  const todayStr = formatDateForInput(new Date());
  const [dailySaleDate, setDailySaleDate] = useState<string>(todayStr);
  const [summaryDateFrom, setSummaryDateFrom] = useState<string>(todayStr);
  const [summaryDateTo, setSummaryDateTo] = useState<string>(todayStr);

  const handleFetchReport = async () => {
    if (!activeReport) return;

    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      let data;
      switch (activeReport) {
        case 'dailySales':
          data = await syncService.getDailySalesReport(dailySaleDate, currentBranchId || undefined);
          break;
        case 'salesSummary':
          if (new Date(summaryDateFrom) > new Date(summaryDateTo)) {
            setError(t('errorDateFromAfterDateTo')); // Add translation
            setIsLoading(false);
            return;
          }
          data = await syncService.getSalesSummaryReport(summaryDateFrom, summaryDateTo, currentBranchId || undefined);
          break;
        case 'inventory':
          data = await syncService.getCurrentInventoryReport(currentBranchId || undefined);
          break;
        default:
          setIsLoading(false);
          return;
      }
      setReportData(data);
    } catch (err: any) {
      console.error(`Failed to fetch ${activeReport} report:`, err);
      setError(t('errorFetchingReport', { reportName: t(`${activeReport}ReportTitle`), error: err.message })); // Add translation
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch report when activeReport or relevant dates change
  // We'll call handleFetchReport via a button click instead of auto-running on date change for now.

  const handleExportToExcel = () => {
    if (!reportData || !activeReport) return;

    let dataToExport: any[] = [];
    const fileName = `${activeReport}_${new Date().toISOString().split('T')[0]}`;

    if(activeReport === 'dailySales' || activeReport === 'salesSummary') {
      const data = reportData as SalesSummaryReportData;
      // Flatten data for Excel
      dataToExport = [
        { Metric: t('totalSales'), Value: data.totalGrossSales.toFixed(2) },
        { Metric: t('totalNetSales'), Value: data.totalNetSales.toFixed(2) },
        { Metric: t('totalInvoices'), Value: data.totalInvoices },
        { Metric: t('totalItemsSold'), Value: data.totalItemsSold },
        { Metric: t('totalDiscounts'), Value: data.totalDiscounts.toFixed(2) },
        { Metric: t('totalTax'), Value: data.totalTax.toFixed(2) },
        {}, // Spacer row
        { Metric: t('paymentMethodsBreakdown') },
        ...data.paymentMethodBreakdown.map(pm => ({
          Metric: t(pm.method, { ns: 'paymentMethods', defaultValue: pm.method }),
          Value: pm.totalAmount.toFixed(2),
          Transactions: pm.count,
        })),
      ];
    } else if (activeReport === 'inventory') {
      const data = reportData as CurrentInventoryReportData;
      dataToExport = data.items.map(item => ({
        [t('sku')]: item.sku,
        [t('productName')]: item.name,
        [t('category')]: item.category,
        [t('stockQuantity')]: item.stockQuantity,
        [t('purchasePriceOptional')]: item.purchasePrice.toFixed(2),
        [t('sellingPrice')]: item.sellingPrice.toFixed(2),
        [t('totalValueCost')]: item.totalValueAtCost.toFixed(2),
        [t('totalValueSelling')]: item.totalValueAtSellingPrice.toFixed(2),
      }));
    }

    exportService.exportToExcel(dataToExport, fileName);
  };

  const handleExportToPdf = () => {
    if (!reportData || !activeReport) return;

    const title = t(`${activeReport}ReportTitle`);
    const fileName = `${active_report}_${new Date().toISOString().split('T')[0]}`;
    let headers: string[] = [];
    let body: any[][] = [];

    if(activeReport === 'dailySales' || activeReport === 'salesSummary') {
      const data = reportData as SalesSummaryReportData;
      // For PDF, we can create a summary section and then tables
      // For simplicity here, we'll create a table for payment methods
      headers = [t('paymentMethod'), t('totalAmount'), t('transactionCount')];
      body = data.paymentMethodBreakdown.map(pm => [
        t(pm.method, { ns: 'paymentMethods', defaultValue: pm.method }),
        pm.totalAmount.toFixed(2),
        pm.count
      ]);
      // TODO: Add summary KPIs to PDF body as well
    } else if (activeReport === 'inventory') {
      const data = reportData as CurrentInventoryReportData;
      headers = [t('sku'), t('productName'), t('stockQuantity'), t('totalValueCost')];
      body = data.items.map(item => [
        item.sku,
        item.name,
        item.stockQuantity,
        item.totalValueAtCost.toFixed(2),
      ]);
    }

    exportService.exportToPdf(title, headers, body, fileName);
  };

  // useEffect(() => {
  //   if (activeReport) {
  //     handleFetchReport();
  //   }
  // }, [activeReport, dailySaleDate, summaryDateFrom, summaryDateTo, currentBranchId]);


  const renderReportContent = () => {
    if (isLoading) return <p>{t('loadingReportData')}</p>; // Add translation
    if (error) return <p className="text-destructive">{error}</p>;
    if (!reportData) return <p>{t('noDataForReport')}</p>; // Add translation

    if (activeReport === 'dailySales' && reportData) {
      const data = reportData as DailySalesReportData;
      return (
        <div>
          <p>{t('reportForDate', { date: data.date })}</p> {/* Add translation */}
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('summaryMetrics')}</h3> {/* Add translation */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <Card><CardHeader><CardTitle>{t('totalSales')}</CardTitle></CardHeader><CardContent>{data.totalGrossSales.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalNetSales')}</CardTitle></CardHeader><CardContent>{data.totalNetSales.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalInvoices')}</CardTitle></CardHeader><CardContent>{data.totalInvoices}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalItemsSold')}</CardTitle></CardHeader><CardContent>{data.totalItemsSold}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalDiscounts')}</CardTitle></CardHeader><CardContent>{data.totalDiscounts.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalTax')}</CardTitle></CardHeader><CardContent>{data.totalTax.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
          </div>
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('paymentMethodsBreakdown')}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('paymentMethod')}</TableHead> {/* Add translation */}
                <TableHead className="text-right">{t('totalAmount')}</TableHead> {/* Add translation */}
                <TableHead className="text-right">{t('transactionCount')}</TableHead> {/* Add translation */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.paymentMethodBreakdown.length > 0 ? data.paymentMethodBreakdown.map((pm, index) => (
                <TableRow key={index}>
                  <TableCell>{t(pm.method, { ns: 'paymentMethods', defaultValue: pm.method })}</TableCell> {/* Assuming payment methods might need translation */}
                  <TableCell className="text-right">{pm.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{pm.count}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center">{t('noPaymentData')}</TableCell></TableRow> /* Add translation */
              )}
            </TableBody>
          </Table>
        </div>
      );
    }
    if (activeReport === 'salesSummary' && reportData) {
      const data = reportData as SalesSummaryReportData;
       return (
        <div>
          <p>{t('reportForPeriod', { dateFrom: data.dateFrom, dateTo: data.dateTo })}</p>
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('summaryMetrics')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <Card><CardHeader><CardTitle>{t('totalSales')}</CardTitle></CardHeader><CardContent>{data.totalGrossSales.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalNetSales')}</CardTitle></CardHeader><CardContent>{data.totalNetSales.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalInvoices')}</CardTitle></CardHeader><CardContent>{data.totalInvoices}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalItemsSold')}</CardTitle></CardHeader><CardContent>{data.totalItemsSold}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalDiscounts')}</CardTitle></CardHeader><CardContent>{data.totalDiscounts.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalTax')}</CardTitle></CardHeader><CardContent>{data.totalTax.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
          </div>
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('paymentMethodsBreakdown')}</h3>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('paymentMethod')}</TableHead>
                <TableHead className="text-right">{t('totalAmount')}</TableHead>
                <TableHead className="text-right">{t('transactionCount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.paymentMethodBreakdown.length > 0 ? data.paymentMethodBreakdown.map((pm, index) => (
                <TableRow key={index}>
                  <TableCell>{t(pm.method, { ns: 'paymentMethods', defaultValue: pm.method })}</TableCell>
                  <TableCell className="text-right">{pm.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{pm.count}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center">{t('noPaymentData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {/* TODO: Table for top selling products if data.topSellingProducts exists */}
        </div>
      );
    }
     if (activeReport === 'inventory' && reportData) {
      const data = reportData as CurrentInventoryReportData;
      return (
        <div>
          <p>{t('reportGeneratedAt', { date: new Date(data.generatedAt).toLocaleString() })}</p> {/* Add translation */}
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('inventorySummary')}</h3> {/* Add translation */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card><CardHeader><CardTitle>{t('totalUniqueProducts')}</CardTitle></CardHeader><CardContent>{data.totalUniqueProducts}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalStockItems')}</CardTitle></CardHeader><CardContent>{data.totalItems}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalInventoryValueCost')}</CardTitle></CardHeader><CardContent>{data.overallTotalValueAtCost.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
            <Card><CardHeader><CardTitle>{t('totalInventoryValueSelling')}</CardTitle></CardHeader><CardContent>{data.overallTotalValueAtSellingPrice.toFixed(2)} {t('currencyEGP')}</CardContent></Card>
          </div>
          <h3 className="font-semibold text-lg mt-4 mb-2">{t('inventoryItemsDetail')}</h3> {/* Add translation */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sku')}</TableHead>
                <TableHead>{t('productName')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead className="text-right">{t('stockQuantity')}</TableHead>
                <TableHead className="text-right">{t('purchasePriceOptional')}</TableHead>
                <TableHead className="text-right">{t('sellingPrice')}</TableHead>
                <TableHead className="text-right">{t('totalValueCost')}</TableHead> {/* Add translation */}
                <TableHead className="text-right">{t('totalValueSelling')}</TableHead> {/* Add translation */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length > 0 ? data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.stockQuantity}</TableCell>
                  <TableCell className="text-right">{item.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.totalValueAtCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.totalValueAtSellingPrice.toFixed(2)}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="text-center">{t('noInventoryItems')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      );
    }
    return <p>{t('selectAReportToView')}</p>;
  };


  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('reportsPageTitle')}</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={() => { setActiveReport('dailySales'); setReportData(null); }} variant={activeReport === 'dailySales' ? 'default' : 'outline'}>
          {t('dailySalesReportButton')}
        </Button>
        <Button onClick={() => { setActiveReport('salesSummary'); setReportData(null); }} variant={activeReport === 'salesSummary' ? 'default' : 'outline'}>
          {t('salesSummaryReportButton')}
        </Button>
        <Button onClick={() => { setActiveReport('inventory'); setReportData(null); }} variant={activeReport === 'inventory' ? 'default' : 'outline'}>
          {t('inventoryReportButton')}
        </Button>
      </section>

      {/* Date Pickers and Filter Section */}
      <section className="mb-6 p-4 border rounded-lg bg-card">
        {activeReport === 'dailySales' && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="dailySaleDate">{t('selectDate')}</Label> {/* Add translation */}
            <Input type="date" id="dailySaleDate" value={dailySaleDate} onChange={(e) => setDailySaleDate(e.target.value)} className="max-w-xs"/>
            <Button onClick={handleFetchReport} className="mt-2 w-fit">{t('generateReportButton')}</Button> {/* Add translation */}
          </div>
        )}
        {activeReport === 'salesSummary' && (
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 items-end">
            <div className="flex-grow">
              <Label htmlFor="summaryDateFrom">{t('dateFrom')}</Label> {/* Add translation */}
              <Input type="date" id="summaryDateFrom" value={summaryDateFrom} onChange={(e) => setSummaryDateFrom(e.target.value)} />
            </div>
            <div className="flex-grow">
              <Label htmlFor="summaryDateTo">{t('dateTo')}</Label> {/* Add translation */}
              <Input type="date" id="summaryDateTo" value={summaryDateTo} onChange={(e) => setSummaryDateTo(e.target.value)} />
            </div>
            <Button onClick={handleFetchReport} className="mt-2 md:mt-0 w-full md:w-fit">{t('generateReportButton')}</Button>
          </div>
        )}
         {activeReport === 'inventory' && (
             <Button onClick={handleFetchReport} className="w-fit">{t('generateReportButton')}</Button>
         )}
      </section>

      <section>
        {activeReport ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t(`${activeReport}ReportTitle`)}</CardTitle>
              {reportData && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={isLoading}>
                    <FileDownIcon className="mr-2 h-4 w-4"/> {t('exportToExcelButton')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportToPdf} disabled={isLoading}>
                    <FileDownIcon className="mr-2 h-4 w-4"/> {t('exportToPdfButton')}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderReportContent()}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>{t('selectAReportToView')}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReportsPage;
