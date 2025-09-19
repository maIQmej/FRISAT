

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '../../../components/ui/checkbox';
import { ArrowLeft, Download, Search, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../hooks/useTranslation';
import { ExportModal } from '../../../components/app/ExportModal';
import { DirectDownloadButton } from '../../../components/app/DirectDownloadButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { RegimenType } from '../../../lib/types';
import { useHistory } from '../../../hooks/useHistory';
import type { HistoryEntry } from '../../../actions/getHistory';
import { Skeleton } from '../../../components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal } from 'lucide-react';

const regimenTypes: RegimenType[] = ['LAMINAR', 'TRANSITION', 'TURBULENT', 'indeterminado'];

export default function HistorialPage() {
  const router = useRouter();
  const { t, t_regimen } = useTranslation();
  const { history, loading, error, refetch } = useHistory();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Filtros
  const [filterText, setFilterText] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filesToExport, setFilesToExport] = useState<string[]>([]);

  const fetchHistory = async () => {
    setSelectedRows([]);
    await refetch();
  };

  const filteredHistory = useMemo(() => {
    return history
      .filter(test =>
        test.fileName.toLowerCase().includes(filterText.toLowerCase())
      )
      .filter(test => 
        regimeFilter === 'all' || test.regimen === regimeFilter
      )
      .filter(test => {
        if (!startDate && !endDate) return true;
        try {
            const testDate = new Date(test.date);
            if (startDate && testDate < startDate) {
                return false;
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (testDate > endOfDay) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
      });
  }, [history, filterText, regimeFilter, startDate, endDate]);

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

  const clearFilters = () => {
      setFilterText('');
      setRegimeFilter('all');
      setStartDate(undefined);
      setEndDate(undefined);
  }

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

  const getRegimenBadgeVariant = (regimen: RegimenType): BadgeProps["variant"] => {
    switch(regimen) {
      case 'LAMINAR': return 'laminar';
      case 'TRANSITION': return 'transition';
      case 'TURBULENT': return 'turbulent';
      case 'INDETERMINADO':
      case 'indeterminado':
      default: return 'secondary';
    }
  }

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
            <div className="flex w-full flex-col sm:flex-row sm:w-auto sm:flex-grow gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('filterByFileName')}
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>

               <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className='w-full sm:w-auto shrink-0'>
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        {t('filterByDate')}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-sm sm:w-[400px] p-4" align="start">
                    <div className="space-y-4">
                        <p className="font-medium text-sm">{t('filterByDate')}</p>
                         <div className="grid gap-2">
                            <DatePicker date={startDate} setDate={setStartDate} placeholder={t('startDate')} />
                            <DatePicker date={endDate} setDate={setEndDate} placeholder={t('endDate')} />
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
                         <Button variant="ghost" size="sm" onClick={clearFilters} className='w-full'>
                            <X className="mr-2 h-4 w-4" />
                            Limpiar filtros
                        </Button>
                    </div>
                </PopoverContent>
               </Popover>

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
                <TableHead className="text-center">Acciones</TableHead>
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
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-red-500">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length > 0 ? filteredHistory.map((test) => (
                <TableRow key={test.id} data-state={selectedRows.includes(test.id) ? "selected" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(test.id)}
                      onCheckedChange={checked => handleSelectRow(test.id, !!checked)}
                      aria-label={`Select row ${test.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/historial/${encodeURIComponent(test.id)}`} className="hover:underline">
                      {test.fileName}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDisplayDate(test.date)}</TableCell>
                  <TableCell>{test.duration}</TableCell>
                  <TableCell className="text-center">{test.sensors}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getRegimenBadgeVariant(test.regimen)} 
                      className="capitalize"
                    >
                      {t_regimen(test.regimen)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DirectDownloadButton 
                      runId={test.id} 
                      fileName={test.fileName}
                    />
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
