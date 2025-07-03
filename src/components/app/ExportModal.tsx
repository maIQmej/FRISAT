
'use client';

import { useEffect, useState } from 'react';
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
import { Wifi, Usb, HardDrive, Loader2, CheckCircle, FileText, FileSpreadsheet, Search, XCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';
type USBStatus = 'idle' | 'checking' | 'found' | 'not_found';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filesToExport?: string[];
}

const formBaseSchema = {
  exportMethod: z.enum(['wifi', 'usb']),
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


export function ExportModal({ open, onOpenChange, filesToExport = [] }: ExportModalProps) {
  const { config } = useApp();
  const { t } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [usbStatus, setUsbStatus] = useState<USBStatus>('idle');
  const { toast } = useToast();

  const isMultiExport = filesToExport.length > 1;
  const singleFileName = filesToExport.length > 0 ? filesToExport[0] : config.fileName;

  const singleFileForm = useForm<SingleFileFormValues>({
    resolver: zodResolver(singleFileFormSchema),
    defaultValues: {
      exportMethod: 'wifi',
      fileName: singleFileName,
      includeDate: true,
      exportPath: '/mediciones/wifi/',
    },
  });

  const multiFileForm = useForm<MultiFileFormValues>({
    resolver: zodResolver(multiFileFormSchema),
    defaultValues: {
      exportMethod: 'wifi',
      exportPath: '/mediciones/exportacion_masiva/',
    },
  });

  const form = isMultiExport ? multiFileForm : singleFileForm;
  const watchedExportMethod = form.watch('exportMethod');

  useEffect(() => {
    if (open) {
      singleFileForm.reset({
        exportMethod: 'wifi',
        fileName: singleFileName,
        includeDate: true,
        exportPath: '/mediciones/wifi/',
      });
      multiFileForm.reset({
        exportMethod: 'wifi',
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
    let finalName = watchedFileName || config.fileName;
    if (watchedIncludeDate) {
      const now = new Date();
      const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      finalName = `${finalName}_${dateString}`;
    }
    return `${finalName}.xlsx`;
  };

  const handleDetectUsb = () => {
    setUsbStatus('checking');
    setTimeout(() => {
        setUsbStatus(Math.random() > 0.3 ? 'found' : 'not_found');
    }, 1500);
  };

  const handleExport = (values: SingleFileFormValues | MultiFileFormValues) => {
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

    return (
        <div className="space-y-4">
            {watchedExportMethod === 'wifi' && (
              <>
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
                 <FormField control={form.control} name="exportPath" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('networkPath')}</FormLabel>
                      <FormControl><Input {...field} disabled={exportState !== 'idle'} /></FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('finalFileName')}:</span>
                  <span className="text-sm font-mono truncate">{getFinalFilename()}</span>
                </div>
              </>
            )}
            {watchedExportMethod === 'usb' && (
                 <>
                    <FormField control={form.control} name="fileName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('fileName')}</FormLabel>
                        <FormControl><Input {...field} disabled={exportState !== 'idle' || usbStatus !== 'found'} /></FormControl>
                        <FormMessage/>
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="includeDate" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={exportState !== 'idle' || usbStatus !== 'found'} /></FormControl>
                        <FormLabel className="font-normal">{t('includeDate')}</FormLabel>
                        </FormItem>
                    )}
                    />
                 </>
            )}
        </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg"
        onInteractOutside={(e) => { if (exportState === 'exporting') e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>{isMultiExport ? t('multiExportTitle') : t('exportTitle')}</DialogTitle>
          <DialogDescription>{isMultiExport ? t('multiExportDesc').replace('{count}', filesToExport.length.toString()) : t('exportDesc')}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form id="export-form" onSubmit={form.handleSubmit(handleExport)} className="space-y-4">
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
                        className="grid grid-cols-2 gap-4"
                        disabled={exportState !== 'idle'}
                      >
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
            
            <Separator/>

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
            
        <DialogFooter className="sm:justify-between gap-2 pt-4">
            {exportState === 'success' || exportState === 'error' ? (
                <Button variant="outline" onClick={handleClose}>
                    {t('close')}
                </Button>
            ) : <Button type="button" variant="ghost" onClick={handleClose} disabled={exportState === 'exporting'}>{t('cancel')}</Button>}
            
            <Button form="export-form" type="submit" disabled={exportState !== 'idle' || (watchedExportMethod === 'usb' && usbStatus !== 'found')}>
                {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? t('exported') : (watchedExportMethod === 'usb' ? t('exportToUSB') : t('exportToWifi'))}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
