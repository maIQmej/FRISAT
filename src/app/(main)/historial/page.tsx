
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, ArrowLeft, Download, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ExportModal } from '@/components/app/ExportModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RegimenType } from '@/lib/types';
import { getHistory, type HistoryEntry } from '@/actions/getHistory';
import { Skeleton } from '@/components/ui/skeleton';

const regimenTypes: RegimenType[] = ['flujo laminar', 'turbulento', 'en la frontera', 'indeterminado'];

export default function HistorialPage() {
  const router = useRouter();
  const { t, t_regimen } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filesToExport, setFilesToExport] = useState<string[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    setSelectedRows([]);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history
      .filter(test =>
        test.fileName.toLowerCase().includes(filterText.toLowerCase())
      )
      .filter(test => 
        regimeFilter === 'all' || test.regimen === regimeFilter
      );
  }, [history, filterText, regimeFilter]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(filteredHistory.map(test => test.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleDownloadSelected = () => {
    const selectedFileNames = selectedRows.map(id => id.replace('.csv', ''));
    setFilesToExport(selectedFileNames);
    setIsExportModalOpen(true);
  };

  const numSelected = selectedRows.length;
  const numTotal = filteredHistory.length;
  
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate || isoDate === 'N/A') return 'N/A';
    try {
        return new Date(isoDate).toLocaleString();
    } catch (e) {
        return isoDate;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('historyTitle')}</CardTitle>
              <CardDescription>{t('historyDesc')}</CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={fetchHistory} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToHome')}
                </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex w-full flex-col sm:flex-row sm:w-auto sm:flex-grow gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('filterByFileName')}
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-[240px]">
                <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('filterByRegime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allRegimes')}</SelectItem>
                    {regimenTypes.map(regimen => (
                        <SelectItem key={regimen} value={regimen}>{t_regimen(regimen)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {numSelected > 0 && (
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {t('numSelected').replace('{count}', numSelected.toString())}
                </span>
                <Button onClick={handleDownloadSelected}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('downloadSelected')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={numSelected === numTotal && numTotal > 0 ? true : (numSelected > 0 ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>{t('fileName')}</TableHead>
                <TableHead>{t('dateAndTime')}</TableHead>
                <TableHead>{t('duration')}</TableHead>
                <TableHead className="text-center">{t('sensors')}</TableHead>
                <TableHead>{t('detectedRegime')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-1/4 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredHistory.length > 0 ? filteredHistory.map((test) => (
                <TableRow key={test.id} data-state={selectedRows.includes(test.id) ? "selected" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(test.id)}
                      onCheckedChange={checked => handleSelectRow(test.id, !!checked)}
                      aria-label={`Select row ${test.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{test.fileName}</TableCell>
                  <TableCell>{formatDisplayDate(test.date)}</TableCell>
                  <TableCell>{test.duration}</TableCell>
                  <TableCell className="text-center">{test.sensors}</TableCell>
                  <TableCell>
                    <Badge variant={
                      test.regimen === 'flujo laminar' ? 'default' : 
                      test.regimen === 'turbulento' ? 'destructive' : 'secondary'
                    } className="capitalize">{t_regimen(test.regimen)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/historial/${encodeURIComponent(test.id)}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">{t('viewDetails')}</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ExportModal 
        open={isExportModalOpen} 
        onOpenChange={setIsExportModalOpen} 
        filesToExport={filesToExport} 
      />
    </div>
  );
}
