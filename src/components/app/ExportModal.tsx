
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Usb, HardDrive, Loader2, CheckCircle, FileText, FileSpreadsheet, Search, XCircle, Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Configuration, SensorDataPoint, RegimenType, Language } from '@/lib/types';
import JSZip from 'jszip';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';
type USBStatus = 'idle' | 'checking' | 'found' | 'not_found';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filesToExport?: string[];
  sensorData?: SensorDataPoint[];
  config?: Configuration;
  startTimestamp?: Date | null;
}

const formBaseSchema = {
  exportMethod: z.enum(['wifi', 'usb', 'direct']),
  exportPath: z.string().optional(),
};

const singleFileFormSchema = z.object({
  ...formBaseSchema,
  fileName: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  includeDate: z.boolean(),
}).refine(data => data.exportMethod === 'wifi' ? !!data.exportPath && data.exportPath.length > 0 : true, {
  message: 'La ruta es requerida para exportación WiFi',
  path: ['exportPath'],
});

type SingleFileFormValues = z.infer<typeof singleFileFormSchema>;

const multiFileFormSchema = z.object({
  ...formBaseSchema,
}).refine(data => data.exportMethod === 'wifi' ? !!data.exportPath && data.exportPath.length > 0 : true, {
  message: 'La ruta es requerida para exportación WiFi',
  path: ['exportPath'],
});

type MultiFileFormValues = z.infer<typeof multiFileFormSchema>;

const UsbDetector = ({ usbStatus, onDetect, onRetry }: { usbStatus: USBStatus, onDetect: () => void, onRetry: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-md border p-4">
      <Label className='font-semibold'>{t('usbExportMethod')}</Label>
      <div className="flex flex-col items-center justify-center text-center min-h-[100px]">
        {usbStatus === 'idle' && (
          <Button onClick={onDetect} className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            {t('detectUSBDevice')}
          </Button>
        )}
        {usbStatus === 'checking' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('detectingUSB')}</span>
          </div>
        )}
        {usbStatus === 'not_found' && (
          <div className="text-destructive space-y-2">
            <XCircle className="mx-auto h-8 w-8" />
            <div>
              <p className="font-semibold">{t('usbNotFound')}</p>
              <p className="text-xs">{t('usbNotFoundDesc')}</p>
            </div>
            <Button onClick={onRetry} variant="outline" size="sm">{t('retry')}</Button>
          </div>
        )}
        {usbStatus === 'found' && (
          <div className="text-green-600 dark:text-green-500 space-y-1">
            <CheckCircle className="mx-auto h-8 w-8" />
            <p className="font-semibold">{t('usbFound')}</p>
            <p className="text-sm font-mono text-muted-foreground">/mnt/FRISAT_DRIVE</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data and generator for multi-file export
const mockHistory = [
  { id: 1, fileName: 'prueba_motor_caliente', date: '2024-07-29 10:30', duration: 60, sensors: ['sensor1', 'sensor2', 'sensor3'], regimen: 'turbulento' as RegimenType, samplesPerSecond: 10 },
  { id: 2, fileName: 'test_flujo_laminar_01', date: '2024-07-29 09:15', duration: 30, sensors: ['sensor1', 'sensor2'], regimen: 'flujo laminar' as RegimenType, samplesPerSecond: 5 },
  { id: 3, fileName: 'medicion_valvula_fria', date: '2024-07-28 15:00', duration: 120, sensors: ['sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5'], regimen: 'en la frontera' as RegimenType, samplesPerSecond: 20 },
  { id: 4, fileName: 'ensayo_largo_duracion', date: '2024-07-28 11:45', duration: 300, sensors: ['sensor1', 'sensor2', 'sensor3', 'sensor4'], regimen: 'turbulento' as RegimenType, samplesPerSecond: 50 },
  { id: 5, fileName: 'verificacion_rapida', date: '2024-07-27 18:00', duration: 15, sensors: ['sensor1'], regimen: 'flujo laminar' as RegimenType, samplesPerSecond: 100 },
];

const generateMockSensorData = (duration: number, samplesPerSecond: number, sensors: readonly string[] | string[], overallRegimen: RegimenType): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const totalSamples = duration * samplesPerSecond;
  for (let i = 0; i <= totalSamples; i++) {
    const time = i / samplesPerSecond;
    const point: SensorDataPoint = {
      time: parseFloat(time.toFixed(2)),
      regimen: overallRegimen,
    };
    sensors.forEach((sensorKey, index) => {
      point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (index + 1) * 0.5)).toFixed(2));
    });
    data.push(point);
  }
  return data;
};

const generateCsvContent = (
    config: Configuration,
    sensorData: SensorDataPoint[],
    startTimestamp: Date | null,
    language: Language,
    t: (key: string) => string,
    t_regimen: (regimen: RegimenType) => string
) => {
    let csv = '\uFEFF';

    const activeSensors = Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key);

    const testStats = activeSensors.map((key) => {
        const values = sensorData.map(p => p[key]).filter((v): v is number => typeof v === 'number' && isFinite(v));
        if (values.length < 2) {
            return { key, label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`, mean: "N/A", stdDev: "N/A", min: "N/A", max: "N/A" };
        }
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / count;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (count > 1 ? count - 1 : 1));
        return { key, label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`, mean: mean.toFixed(2), stdDev: stdDev.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    });

    // --- Section 1: Test Summary ---
    csv += `"${t('testSummary')}"\n`;
    csv += `"${t('parameter')}","${t('value')}"\n`;
    csv += `"${t('fileNameLabel')}","${config.fileName}.csv"\n`;
    if (startTimestamp) {
        csv += `"${t('startTime')}","${startTimestamp.toLocaleString(language)}"\n`;
    }
    csv += `"${t('durationLabel')}","${sensorData.at(-1)?.time.toFixed(2) || '0'}s"\n`;
    csv += `"${t('samplesPerSecondLabel')}","${config.samplesPerSecond} Hz"\n`;
    csv += '\n';

    // --- Section 2: Test Statistics ---
    csv += `"${t('testStatistics')}"\n`;
    const statHeaders = [t('sensor'), t('statMean'), t('statStdDev'), t('statMin'), t('statMax')];
    csv += `${statHeaders.map(h => `"${h}"`).join(',')}\n`;
    testStats.forEach(stat => {
        const row = [`"${stat.label}"`, `"${stat.mean}"`, `"${stat.stdDev}"`, `"${stat.min}"`, `"${stat.max}"`];
        csv += `${row.join(',')}\n`;
    });
    csv += '\n';

    // --- Section 3: Raw Data ---
    csv += `"${t('collectedData')}"\n`;
    const dataHeaders = ['time', ...activeSensors, 'regimen'];
    const displayHeaders = [`"${t('sampleNumber')}"`, ...dataHeaders.map(h => {
        if (h.startsWith('sensor')) {
            return `"${t('sensor')} ${h.replace('sensor', '')}"`;
        }
        return `"${h}"`;
    })];
    csv += `${displayHeaders.join(',')}\n`;

    sensorData.forEach((point, index) => {
        const rowData = dataHeaders.map(header => {
            const value = point[header];
            if (header === 'regimen' && typeof value === 'string') {
                return `"${t_regimen(value as RegimenType)}"`;
            }
            if (typeof value === 'number') {
                return value.toString();
            }
            return `"${value ?? ''}"`;
        });
        const fullRow = [index + 1, ...rowData];
        csv += `${fullRow.join(',')}\n`;
    });

    return csv;
};


export function ExportModal({ open, onOpenChange, filesToExport = [], sensorData = [], config: propConfig, startTimestamp }: ExportModalProps) {
  const { config: appConfig, language } = useApp();
  const config = propConfig || appConfig;
  const { t, t_regimen } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [usbStatus, setUsbStatus] = useState<USBStatus>('idle');
  const { toast } = useToast();

  const isMultiExport = filesToExport.length > 1;
  const singleFileName = filesToExport.length > 0 ? filesToExport[0] : config.fileName;

  const singleFileForm = useForm<SingleFileFormValues>({
    resolver: zodResolver(singleFileFormSchema),
    defaultValues: {
      exportMethod: 'direct',
      fileName: singleFileName,
      includeDate: true,
      exportPath: '/mediciones/wifi/',
    },
  });

  const multiFileForm = useForm<MultiFileFormValues>({
    resolver: zodResolver(multiFileFormSchema),
    defaultValues: {
      exportMethod: 'direct',
      exportPath: '/mediciones/exportacion_masiva/',
    },
  });

  const form = isMultiExport ? multiFileForm : singleFileForm;
  const watchedExportMethod = form.watch('exportMethod');

  useEffect(() => {
    if (open) {
      singleFileForm.reset({
        exportMethod: 'direct',
        fileName: singleFileName,
        includeDate: true,
        exportPath: '/mediciones/wifi/',
      });
      multiFileForm.reset({
        exportMethod: 'direct',
        exportPath: '/mediciones/exportacion_masiva/',
      });
      setExportState('idle');
      setUsbStatus('idle');
    }
  }, [open, singleFileName, filesToExport, singleFileForm, multiFileForm]);

  useEffect(() => {
    setUsbStatus('idle');
  }, [watchedExportMethod]);
  
  const watchedFileName = singleFileForm.watch('fileName');
  const watchedIncludeDate = singleFileForm.watch('includeDate');

  const getFinalFilename = (extension: 'xlsx' | 'csv' = 'xlsx') => {
    let finalName = watchedFileName || config.fileName;
    if (watchedIncludeDate) {
      const now = new Date();
      const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      finalName = `${finalName}_${dateString}`;
    }
    return `${finalName}.${extension}`;
  };

  const handleDirectDownload = () => {
    const fileName = getFinalFilename('csv');
    const csvContent = generateCsvContent(config, sensorData, startTimestamp, language, t, t_regimen);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleMultiDirectDownload = async () => {
    const zip = new JSZip();
    const filesToProcess = mockHistory.filter(test => filesToExport.includes(test.fileName));
    
    for (const test of filesToProcess) {
      const testConfig: Configuration = {
        fileName: test.fileName,
        acquisitionTime: test.duration,
        samplesPerSecond: test.samplesPerSecond,
        sensors: {
          sensor1: test.sensors.includes('sensor1'),
          sensor2: test.sensors.includes('sensor2'),
          sensor3: test.sensors.includes('sensor3'),
          sensor4: test.sensors.includes('sensor4'),
          sensor5: test.sensors.includes('sensor5'),
        }
      };
      const testSensorData = generateMockSensorData(test.duration, test.samplesPerSecond, test.sensors, test.regimen);
      const testStartTimestamp = new Date(test.date);
      
      const csvContent = generateCsvContent(testConfig, testSensorData, testStartTimestamp, language, t, t_regimen);
      zip.file(`${test.fileName}.csv`, csvContent);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(zipBlob);
    link.href = url;
    link.download = `FRISAT_Export_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDetectUsb = () => {
    setUsbStatus('checking');
    setTimeout(() => {
        setUsbStatus(Math.random() > 0.3 ? 'found' : 'not_found');
    }, 1500);
  };

  const handleExport = (values: SingleFileFormValues | MultiFileFormValues) => {
    if (values.exportMethod === 'direct') {
      if (isMultiExport) {
        handleMultiDirectDownload();
        toast({ title: t('exportSuccessToastTitle'), description: t('multiExportDownloadToastDesc').replace('{count}', filesToExport.length.toString()) });
      } else {
        handleDirectDownload();
        toast({ title: t('exportSuccessToastTitle'), description: `${t('downloadedFile')} "${getFinalFilename('csv')}"` });
      }
      onOpenChange(false);
      return;
    }
    
    if (values.exportMethod === 'usb' && usbStatus !== 'found') {
      toast({ title: t('exportErrorToastTitle'), description: t('exportErrorUSB'), variant: 'destructive' });
      return;
    }
    
    setExportState('exporting');
    const toastDescription = isMultiExport
      ? t('exportingMultipleToastDesc').replace('{count}', filesToExport.length.toString())
      : `${t('exportingToastDesc')} "${getFinalFilename()}" via ${values.exportMethod === 'wifi' ? 'WiFi' : 'USB'}.`;
    
    toast({
      title: t('exportingToastTitle'),
      description: toastDescription,
    });
    
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      if (isSuccess) {
        setExportState('success');
        toast({ title: t('exportSuccessToastTitle'), description: t('exportSuccessToastDesc') });
      } else {
        setExportState('error');
        toast({ title: t('exportErrorToastTitle'), description: t('exportErrorToastDesc'), variant: 'destructive' });
      }
    }, 2500);
  };
  
  const handleClose = () => {
    if (exportState !== 'exporting') {
      onOpenChange(false);
    }
  };

  const renderContent = () => {
    if (isMultiExport) {
       return (
        <div className="space-y-4">
            <Label>{t('filesToExport')}</Label>
            <ScrollArea className="h-32 w-full rounded-md border p-2">
              <ul className="space-y-1">
                {filesToExport.map((file, index) => (
                  <li key={index} className="text-sm font-mono truncate flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    {file}.xlsx
                  </li>
                ))}
              </ul>
            </ScrollArea>
             {watchedExportMethod === 'wifi' && (
                <FormField
                  control={multiFileForm.control}
                  name="exportPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('networkPath')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={exportState !== 'idle'} />
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
              )}
        </div>
       )
    }

    const finalNameExt = watchedExportMethod === 'direct' ? 'csv' : 'xlsx';

    return (
        <div className="space-y-4">
            {watchedExportMethod !== 'direct' && watchedExportMethod !== 'usb' && (
              <>
                <FormField control={form.control} name="exportPath" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('networkPath')}</FormLabel>
                      <FormControl><Input {...field} disabled={exportState !== 'idle'} /></FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
              </>
            )}

            {(watchedExportMethod === 'direct' || watchedExportMethod === 'usb' || watchedExportMethod === 'wifi') && (
              <>
                <FormField control={form.control} name="fileName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fileName')}</FormLabel>
                      <FormControl><Input {...field} disabled={exportState !== 'idle' || (watchedExportMethod === 'usb' && usbStatus !== 'found')} /></FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="includeDate" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={exportState !== 'idle' || (watchedExportMethod === 'usb' && usbStatus !== 'found')} /></FormControl>
                      <FormLabel className="font-normal">{t('includeDate')}</FormLabel>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('finalFileName')}:</span>
              <span className="text-sm font-mono truncate">{getFinalFilename(finalNameExt)}</span>
            </div>
        </div>
    )
  }

  const getExportButtonText = () => {
    switch (watchedExportMethod) {
      case 'direct': return isMultiExport ? t('exportToZip') : t('exportToDirect');
      case 'usb': return t('exportToUSB');
      case 'wifi': return t('exportToWifi');
      default: return t('export');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg flex flex-col max-h-[90vh] p-0"
        onInteractOutside={(e) => { if (exportState === 'exporting') e.preventDefault(); }}
      >
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{isMultiExport ? t('multiExportTitle') : t('exportTitle')}</DialogTitle>
          <DialogDescription>{isMultiExport ? t('multiExportDesc').replace('{count}', filesToExport.length.toString()) : t('exportDesc')}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form id="export-form" onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="exportMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t('exportMethod')}</FormLabel>
                       <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                            disabled={exportState !== 'idle'}
                          >
                            <Label
                              htmlFor="direct"
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                exportState !== 'idle' && "cursor-not-allowed opacity-50"
                              )}
                            >
                              <RadioGroupItem value="direct" id="direct" className="sr-only" />
                              <Download className="h-5 w-5" />
                              {t('directExportMethod')}
                            </Label>
                            <Label
                              htmlFor="wifi"
                              className={cn("flex items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", exportState !== 'idle' && "cursor-not-allowed opacity-50")}
                            >
                              <RadioGroupItem value="wifi" id="wifi" className="sr-only" />
                              <Wifi className="h-5 w-5" />
                              {t('wifiExportMethod')}
                            </Label>
                            <Label
                              htmlFor="usb"
                              className={cn("flex items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", exportState !== 'idle' && "cursor-not-allowed opacity-50")}
                            >
                              <RadioGroupItem value="usb" id="usb" className="sr-only" />
                              <Usb className="h-5 w-5" />
                              {t('usbExportMethod')}
                            </Label>
                          </RadioGroup>
                       </FormControl>
                    </FormItem>
                  )}
                />
                
                {renderContent()}

                {watchedExportMethod === 'usb' && (
                  <UsbDetector usbStatus={usbStatus} onDetect={handleDetectUsb} onRetry={handleDetectUsb} />
                )}

                {exportState !== 'idle' && (
                  <div className="rounded-lg border p-4 text-center min-h-[80px] flex items-center justify-center">
                    {exportState === 'exporting' && <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p>{t('exporting')}</p></div>}
                    {exportState === 'success' && <div className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" /><p>{t('exportedSuccess')}</p></div>}
                    {exportState === 'error' && <p className="text-destructive">{t('exportError')}</p>}
                  </div>
                )}

              </form>
            </Form>
          </div>
        </div>
            
        <DialogFooter className="shrink-0 sm:justify-between gap-2 p-6 border-t">
            {exportState === 'success' || exportState === 'error' ? (
                <Button variant="outline" onClick={handleClose}>
                    {t('close')}
                </Button>
            ) : <Button type="button" variant="ghost" onClick={handleClose} disabled={exportState === 'exporting'}>{t('cancel')}</Button>}
            
            <Button form="export-form" type="submit" disabled={exportState !== 'idle' || (watchedExportMethod === 'usb' && usbStatus !== 'found')}>
                {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? t('exported') : getExportButtonText()}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
