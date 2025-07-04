
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
import { HardDrive, Loader2, CheckCircle, FileText, FileSpreadsheet, Save, Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Configuration, SensorDataPoint, RegimenType, Language } from '@/lib/types';
import { saveExportedFiles } from '@/actions/saveExport';
import { getHistoryEntry } from '@/actions/getHistory';
import JSZip from 'jszip';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filesToExport?: string[];
  sensorData?: SensorDataPoint[];
  config?: Configuration;
  startTimestamp?: Date | null;
  regimen?: RegimenType;
}

const formBaseSchema = {
  exportMethod: z.enum(['server', 'download']),
};

const singleFileFormSchema = z.object({
  ...formBaseSchema,
  fileName: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  includeDate: z.boolean(),
});

type SingleFileFormValues = z.infer<typeof singleFileFormSchema>;

const multiFileFormSchema = z.object({
  ...formBaseSchema,
});

type MultiFileFormValues = z.infer<typeof multiFileFormSchema>;

const generateCsvContent = (
    config: Configuration,
    sensorData: SensorDataPoint[],
    startTimestamp: Date | null,
    language: Language,
    t: (key: string) => string,
    regimen?: RegimenType
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
    if (regimen) {
      csv += `"dominantRegimen","${regimen}"\n`;
    }
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


export function ExportModal({ open, onOpenChange, filesToExport = [], sensorData = [], config: propConfig, startTimestamp, regimen: propRegimen }: ExportModalProps) {
  const { config: appConfig, language, regimen: appRegimen } = useApp();
  const config = propConfig || appConfig;
  const regimen = propRegimen || appRegimen;
  const { t } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const { toast } = useToast();

  const isMultiExport = filesToExport.length > 1;
  const singleFileName = filesToExport.length > 0 ? filesToExport[0] : config.fileName;

  const singleFileForm = useForm<SingleFileFormValues>({
    resolver: zodResolver(singleFileFormSchema),
    defaultValues: {
      exportMethod: 'server',
      fileName: singleFileName,
      includeDate: true,
    },
  });

  const multiFileForm = useForm<MultiFileFormValues>({
    resolver: zodResolver(multiFileFormSchema),
    defaultValues: {
      exportMethod: 'server',
    },
  });

  const form = isMultiExport ? multiFileForm : singleFileForm;

  useEffect(() => {
    if (open) {
      singleFileForm.reset({
        exportMethod: 'server',
        fileName: singleFileName,
        includeDate: true,
      });
      multiFileForm.reset({
        exportMethod: 'server',
      });
      setExportState('idle');
    }
  }, [open, singleFileName, filesToExport, singleFileForm, multiFileForm]);

  
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

  const handleExport = async (values: SingleFileFormValues | MultiFileFormValues) => {
    setExportState('exporting');
    
    if (values.exportMethod === 'server') {
        const toastDescription = isMultiExport
          ? t('exportingMultipleToastDesc').replace('{count}', filesToExport.length.toString())
          : `${t('exportingToastDesc')} "${(values as SingleFileFormValues).fileName}"`;
        toast({ title: t('exportingToastTitle'), description: toastDescription });
        
        const filesToSave: { fileName: string; csvContent: string }[] = [];
        if (isMultiExport) {
            for (const fileName of filesToExport) {
                const entryData = await getHistoryEntry(`${fileName}.csv`);
                if (entryData) {
                    const activeSensors = Object.keys(entryData.sensorData[0] || {}).filter(k => k.startsWith('sensor'));
                    const reconstructedConfig: Configuration = {
                        fileName: entryData.fileName,
                        acquisitionTime: parseInt(entryData.duration),
                        samplesPerSecond: entryData.samplesPerSecond,
                        sensors: {
                            sensor1: activeSensors.includes('sensor1'),
                            sensor2: activeSensors.includes('sensor2'),
                            sensor3: activeSensors.includes('sensor3'),
                            sensor4: activeSensors.includes('sensor4'),
                            sensor5: activeSensors.includes('sensor5'),
                        }
                    };
                    const fileStartTimestamp = new Date(entryData.date);
                    const csvContent = generateCsvContent(reconstructedConfig, entryData.sensorData, fileStartTimestamp, language, t, entryData.regimen);
                    filesToSave.push({ fileName: `${entryData.fileName}.csv`, csvContent });
                }
            }
        } else {
            const fileName = getFinalFilename();
            const currentConfig = { ...config, fileName: (values as SingleFileFormValues).fileName };
            const csvContent = generateCsvContent(currentConfig, sensorData, startTimestamp, language, t, regimen);
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
    } else if (values.exportMethod === 'download') {
        toast({ title: t('exportingToastTitle'), description: t('preparingDownload') });

        try {
            if (isMultiExport) {
                const zip = new JSZip();
                for (const fileName of filesToExport) {
                    const entryData = await getHistoryEntry(`${fileName}.csv`);
                    if (entryData) {
                        const activeSensors = Object.keys(entryData.sensorData[0] || {}).filter(k => k.startsWith('sensor'));
                        const reconstructedConfig: Configuration = {
                            fileName: entryData.fileName,
                            acquisitionTime: parseInt(entryData.duration),
                            samplesPerSecond: entryData.samplesPerSecond,
                            sensors: {
                                sensor1: activeSensors.includes('sensor1'),
                                sensor2: activeSensors.includes('sensor2'),
                                sensor3: activeSensors.includes('sensor3'),
                                sensor4: activeSensors.includes('sensor4'),
                                sensor5: activeSensors.includes('sensor5'),
                            }
                        };
                        const fileStartTimestamp = new Date(entryData.date);
                        const csvContent = generateCsvContent(reconstructedConfig, entryData.sensorData, fileStartTimestamp, language, t, entryData.regimen);
                        zip.file(`${entryData.fileName}.csv`, csvContent);
                    }
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `FRISAT_Export_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } else {
                const fileName = getFinalFilename();
                const currentConfig = { ...config, fileName: (values as SingleFileFormValues).fileName };
                const csvContent = generateCsvContent(currentConfig, sensorData, startTimestamp, language, t, regimen);
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }

            setExportState('success');
            toast({ title: t('exportSuccessToastTitle'), description: t('downloadSuccessToastDesc') });
        } catch (error) {
            setExportState('error');
            toast({ title: t('exportErrorToastTitle'), description: (error as Error).message, variant: 'destructive' });
        }
    }
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
        </div>
       )
    }

    return (
        <div className="space-y-4">
            <FormField control={form.control} name="fileName" render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('fileName')}</FormLabel>
                    <FormControl><Input {...field} disabled={exportState !== 'idle'} /></FormControl>
                    <FormMessage/>
                </FormItem>
                )}
            />
            <FormField control={form.control} name="includeDate" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={exportState !== 'idle'} /></FormControl>
                    <FormLabel className="font-normal">{t('includeDate')}</FormLabel>
                </FormItem>
                )}
            />
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('finalFileName')}:</span>
              <span className="text-sm font-mono truncate">{getFinalFilename()}</span>
            </div>
        </div>
    )
  }

  const getExportButtonText = () => {
    const { exportMethod } = form.getValues();
    if (exportMethod === 'server') {
        return isMultiExport ? t('exportAllToServer') : t('exportToServer');
    }
    if (exportMethod === 'download') {
        return isMultiExport ? t('downloadSelected') : t('downloadData');
    }
    return t('export');
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
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
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
                              htmlFor="download"
                              className={cn("flex items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", exportState !== 'idle' && "cursor-not-allowed opacity-50")}
                            >
                              <RadioGroupItem value="download" id="download" className="sr-only" />
                              <Download className="h-5 w-5" />
                              {t('downloadToComputer')}
                            </Label>
                          </RadioGroup>
                       </FormControl>
                    </FormItem>
                  )}
                />
                
                {renderContent()}

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
            
            <Button form="export-form" type="submit" disabled={exportState !== 'idle'}>
                {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? t('exported') : getExportButtonText()}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
