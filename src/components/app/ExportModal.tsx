

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Loader2, CheckCircle, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { ScrollArea } from '../ui/scroll-area';
import type { Configuration, SensorDataPoint, RegimenType } from '../../lib/types';
import { getHistoryEntry } from '../../actions/getHistory';
import { generateCsvContent } from '../../lib/csv-utils';
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

const singleFileFormSchema = z.object({
  fileName: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  includeDate: z.boolean(),
});

type SingleFileFormValues = z.infer<typeof singleFileFormSchema>;

const multiFileFormSchema = z.object({});

type MultiFileFormValues = z.infer<typeof multiFileFormSchema>;

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
      fileName: singleFileName,
      includeDate: false,
    },
  });

  const multiFileForm = useForm<MultiFileFormValues>({
    resolver: zodResolver(multiFileFormSchema),
  });

  const form = isMultiExport ? multiFileForm : singleFileForm;

  useEffect(() => {
    if (open) {
      singleFileForm.reset({
        fileName: singleFileName,
        includeDate: false,
      });
      multiFileForm.reset({});
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
                    const csvContent = generateCsvContent(reconstructedConfig, entryData.sensorData, fileStartTimestamp, t, entryData.regimen);
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
            const csvContent = generateCsvContent(currentConfig, sensorData, startTimestamp, t, regimen);
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
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
    } catch (error) {
        setExportState('error');
        toast({ title: t('exportErrorToastTitle'), description: (error as Error).message, variant: 'destructive' });
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
    return isMultiExport ? t('downloadSelected') : t('downloadData');
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg flex flex-col max-h-[90vh] p-0"
        onInteractOutside={(e) => { if (exportState === 'exporting') e.preventDefault(); }}
      >
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{isMultiExport ? t('multiExportTitle') : t('exportTitle')}</DialogTitle>
          {isMultiExport ? <DialogDescription>{t('multiExportDesc').replace('{count}', filesToExport.length.toString())}</DialogDescription> : <DialogDescription>{t('exportDesc')}</DialogDescription>}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form id="export-form" onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
                
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
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? t('exported') : getExportButtonText()}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
