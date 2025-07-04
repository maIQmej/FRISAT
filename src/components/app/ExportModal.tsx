
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
import { Wifi, Usb, HardDrive, Loader2, CheckCircle, FileText, FileSpreadsheet, Search, XCircle, Save } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Configuration, SensorDataPoint, RegimenType, Language } from '@/lib/types';
import { saveExportedFiles } from '@/actions/saveExport';

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
  exportMethod: z.enum(['wifi', 'usb', 'server']),
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

// Mock data and generator for multi-file export from History
const mockHistoryForExport: {
    [key: string]: {
        config: Configuration;
        sensorData: SensorDataPoint[];
        startTimestamp: Date;
    }
} = {};

const generateMockDataForFileName = (fileName: string) => {
    if (mockHistoryForExport[fileName]) return mockHistoryForExport[fileName];

    const duration = 30 + Math.random() * 120;
    const samplesPerSecond = [5, 10, 20, 50][Math.floor(Math.random() * 4)];
    const numSensors = 1 + Math.floor(Math.random() * 5);
    const sensorKeys = Array.from({ length: numSensors }, (_, i) => `sensor${i + 1}`);
    const regimen = (['flujo laminar', 'turbulento'] as const)[Math.floor(Math.random() * 2)];
    
    const config: Configuration = {
        fileName,
        acquisitionTime: duration,
        samplesPerSecond,
        sensors: {
            sensor1: sensorKeys.includes('sensor1'),
            sensor2: sensorKeys.includes('sensor2'),
            sensor3: sensorKeys.includes('sensor3'),
            sensor4: sensorKeys.includes('sensor4'),
            sensor5: sensorKeys.includes('sensor5'),
        }
    };

    const sensorData: SensorDataPoint[] = [];
    const totalSamples = duration * samplesPerSecond;
    for (let i = 0; i <= totalSamples; i++) {
        const time = i / samplesPerSecond;
        const point: SensorDataPoint = {
        time: parseFloat(time.toFixed(2)),
        regimen: regimen,
        };
        sensorKeys.forEach((sensorKey, index) => {
        point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (index + 1) * 0.5)).toFixed(2));
        });
        sensorData.push(point);
    }
    
    const startTimestamp = new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 5);

    mockHistoryForExport[fileName] = { config, sensorData, startTimestamp };
    return mockHistoryForExport[fileName];
}

const generateCsvContent = (
    config: Configuration,
    sensorData: SensorDataPoint[],
    startTimestamp: Date | null,
    language: Language,
    t: (key: string) => string
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

    csv += `"${t('testSummary')}"\n`;
    csv += `"${t('parameter')}","${t('value')}"\n`;
    csv += `"${t('fileNameLabel')}","${config.fileName}.csv"\n`;
    if (startTimestamp) {
        csv += `"startTime","${startTimestamp.toISOString()}"\n`;
    }
    csv += `"durationLabel","${sensorData.at(-1)?.time.toFixed(2) || '0'}s"\n`;
    csv += `"samplesPerSecondLabel","${config.samplesPerSecond} Hz"\n`;
    csv += '\n';

    csv += `"${t('testStatistics')}"\n`;
    const statHeaders = [t('sensor'), t('statMean'), t('statStdDev'), t('statMin'), t('statMax')];
    csv += `${statHeaders.map(h => `"${h}"`).join(',')}\n`;
    testStats.forEach(stat => {
        const row = [`"${stat.label}"`, `"${stat.mean}"`, `"${stat.stdDev}"`, `"${stat.min}"`, `"${stat.max}"`];
        csv += `${row.join(',')}\n`;
    });
    csv += '\n';
    
    const dataHeaders = ['time', ...activeSensors, 'regimen'];
    csv += `"#RAW_HEADERS",${dataHeaders.join(',')}\n`;

    csv += `"${t('collectedData')}"\n`;
    const displayHeaders = [`"${t('sampleNumber')}"`, `"${t('time')}"`, ...activeSensors.map(h => `"${t('sensor')} ${h.replace('sensor', '')}"`), `"${t('flowRegime')}"`];
    csv += `${displayHeaders.join(',')}\n`;

    sensorData.forEach((point, index) => {
        const rowData = dataHeaders.map(header => {
            const value = point[header];
            if (typeof value === 'number') {
                return value.toFixed(2);
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
  const { t } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [usbStatus, setUsbStatus] = useState<USBStatus>('idle');
  const { toast } = useToast();

  const isMultiExport = filesToExport.length > 1;
  const singleFileName = filesToExport.length > 0 ? filesToExport[0] : config.fileName;

  const singleFileForm = useForm<SingleFileFormValues>({
    resolver: zodResolver(singleFileFormSchema),
    defaultValues: {
      exportMethod: 'server',
      fileName: singleFileName,
      includeDate: true,
      exportPath: '/mediciones/wifi/',
    },
  });

  const multiFileForm = useForm<MultiFileFormValues>({
    resolver: zodResolver(multiFileFormSchema),
    defaultValues: {
      exportMethod: 'server',
      exportPath: '/mediciones/exportacion_masiva/',
    },
  });

  const form = isMultiExport ? multiFileForm : singleFileForm;
  const watchedExportMethod = form.watch('exportMethod');

  useEffect(() => {
    if (open) {
      singleFileForm.reset({
        exportMethod: 'server',
        fileName: singleFileName,
        includeDate: true,
        exportPath: '/mediciones/wifi/',
      });
      multiFileForm.reset({
        exportMethod: 'server',
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

  const getFinalFilename = () => {
    let finalName = isMultiExport ? '' : watchedFileName || config.fileName;
    if (!isMultiExport && watchedIncludeDate) {
      const now = new Date();
      const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      finalName = `${finalName}_${dateString}`;
    }
    return `${finalName}.csv`;
  };

  const handleDetectUsb = () => {
    setUsbStatus('checking');
    setTimeout(() => {
        setUsbStatus('found');
    }, 1500);
  };

  const handleExport = async (values: SingleFileFormValues | MultiFileFormValues) => {
    if (values.exportMethod === 'usb' && usbStatus !== 'found') {
      toast({ title: t('exportErrorToastTitle'), description: t('exportErrorUSB'), variant: 'destructive' });
      return;
    }

    setExportState('exporting');
    const toastDescription = isMultiExport
      ? t('exportingMultipleToastDesc').replace('{count}', filesToExport.length.toString())
      : `${t('exportingToastDesc')} "${(values as SingleFileFormValues).fileName}" via ${values.exportMethod === 'wifi' ? 'WiFi' : values.exportMethod === 'usb' ? 'USB' : t('serverExportMethod') }.`;
    
    toast({
      title: t('exportingToastTitle'),
      description: toastDescription,
    });
    
    if (values.exportMethod === 'server') {
      const filesToSave: { fileName: string; csvContent: string }[] = [];
      if (isMultiExport) {
        for (const fileName of filesToExport) {
            const mockData = generateMockDataForFileName(fileName);
            const csvContent = generateCsvContent(mockData.config, mockData.sensorData, mockData.startTimestamp, language, t);
            filesToSave.push({ fileName: `${fileName}.csv`, csvContent });
        }
      } else {
        const fileName = getFinalFilename();
        const currentConfig = { ...config, fileName: (values as SingleFileFormValues).fileName };
        const csvContent = generateCsvContent(currentConfig, sensorData, startTimestamp, language, t);
        filesToSave.push({ fileName, csvContent });
      }

      try {
        const result = await saveExportedFiles(filesToSave);
        if (result.success) {
          setExportState('success');
          const successDesc = isMultiExport ? t('multiExportSaveToastDesc').replace('{count}', filesToSave.length.toString()) : t('savedFile').replace('{fileName}', filesToSave[0].fileName);
          toast({ title: t('exportSuccessToastTitle'), description: successDesc });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        setExportState('error');
        toast({ title: t('exportErrorToastTitle'), description: (error as Error).message, variant: 'destructive' });
      }
      return;
    }

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
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
                    {file}.csv
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

    return (
        <div className="space-y-4">
            {watchedExportMethod === 'wifi' && (
              <FormField control={form.control} name="exportPath" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('networkPath')}</FormLabel>
                    <FormControl><Input {...field} disabled={exportState !== 'idle'} /></FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
            )}

            {(watchedExportMethod === 'server' || watchedExportMethod === 'usb' || watchedExportMethod === 'wifi') && (
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
              <span className="text-sm font-mono truncate">{getFinalFilename()}</span>
            </div>
        </div>
    )
  }

  const getExportButtonText = () => {
    switch (watchedExportMethod) {
      case 'server': return isMultiExport ? t('exportAllToServer') : t('exportToServer');
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
                              htmlFor="server"
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                exportState !== 'idle' && "cursor-not-allowed opacity-50"
                              )}
                            >
                              <RadioGroupItem value="server" id="server" className="sr-only" />
                              <Save className="h-5 w-5" />
                              {t('serverExportMethod')}
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
