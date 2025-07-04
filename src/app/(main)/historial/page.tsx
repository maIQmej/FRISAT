
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, ArrowLeft, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ExportModal } from '@/components/app/ExportModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RegimenType } from '@/lib/types';

const mockHistory = [
  { id: 1, fileName: 'prueba_motor_caliente', date: '2024-07-29 10:30', duration: '60s', sensors: 3, regimen: 'turbulento', samplesPerSecond: 10 },
  { id: 2, fileName: 'test_flujo_laminar_01', date: '2024-07-29 09:15', duration: '30s', sensors: 2, regimen: 'flujo laminar', samplesPerSecond: 5 },
  { id: 3, fileName: 'medicion_valvula_fria', date: '2024-07-28 15:00', duration: '120s', sensors: 5, regimen: 'en la frontera', samplesPerSecond: 20 },
  { id: 4, fileName: 'ensayo_largo_duracion', date: '2024-07-28 11:45', duration: '300s', sensors: 4, regimen: 'turbulento', samplesPerSecond: 50 },
  { id: 5, fileName: 'verificacion_rapida', date: '2024-07-27 18:00', duration: '15s', sensors: 1, regimen: 'flujo laminar', samplesPerSecond: 100 },
] as const;

type MockHistoryItem = typeof mockHistory[number];
const regimenTypes: RegimenType[] = ['flujo laminar', 'turbulento', 'en la frontera', 'indeterminado'];

export default function HistorialPage() {
  const router = useRouter();
  const { t, t_regimen } = useTranslation();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filterText, setFilterText] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filesToExport, setFilesToExport] = useState<string[]>([]);

  const filteredHistory = useMemo(() => {
    return mockHistory
      .filter(test =>
        test.fileName.toLowerCase().includes(filterText.toLowerCase())
      )
      .filter(test => 
        regimeFilter === 'all' || test.regimen === regimeFilter
      );
  }, [filterText, regimeFilter]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRows(filteredHistory.map(test => test.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleDownloadSelected = () => {
    const selectedTests = mockHistory.filter(test => selectedRows.includes(test.id));
    setFilesToExport(selectedTests.map(t => t.fileName));
    setIsExportModalOpen(true);
  };

  const numSelected = selectedRows.length;
  const numTotal = filteredHistory.length;

  return (
    <div className="container mx-auto max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('historyTitle')}</CardTitle>
              <CardDescription>{t('historyDesc')}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToHome')}
            </Button>
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
              {filteredHistory.length > 0 ? filteredHistory.map((test) => (
                <TableRow key={test.id} data-state={selectedRows.includes(test.id) ? "selected" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(test.id)}
                      onCheckedChange={checked => handleSelectRow(test.id, !!checked)}
                      aria-label={`Select row ${test.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{test.fileName}</TableCell>
                  <TableCell>{test.date}</TableCell>
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
                      <Link href={`/historial/${test.id}`}>
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
