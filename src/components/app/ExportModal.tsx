
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
import { Wifi, Usb, HardDrive, Loader2, CheckCircle, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Separator } from '../ui/separator';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  exportMethod: z.enum(['wifi', 'usb']),
  fileName: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  includeDate: z.boolean(),
  exportPath: z.string().min(1, 'La ruta es requerida'),
});

type ExportFormValues = z.infer<typeof formSchema>;

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { config } = useApp();
  const { t } = useTranslation();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const { toast } = useToast();

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exportMethod: 'wifi',
      fileName: config.fileName,
      includeDate: true,
      exportPath: '/mediciones/',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        exportMethod: 'wifi',
        fileName: config.fileName,
        includeDate: true,
        exportPath: '/mediciones/',
      });
      setExportState('idle');
    }
  }, [open, config.fileName, form]);
  
  const watchedFileName = form.watch('fileName');
  const watchedIncludeDate = form.watch('includeDate');

  const getFinalFilename = () => {
    let finalName = watchedFileName || config.fileName;
    if (watchedIncludeDate) {
      const now = new Date();
      const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      finalName = `${finalName}_${dateString}`;
    }
    return `${finalName}.xlsx`;
  };

  const handleExport = (values: ExportFormValues) => {
    setExportState('exporting');
    const finalFileName = getFinalFilename();
    toast({
      title: t('exportingToastTitle'),
      description: `${t('exportingToastDesc')} "${finalFileName}" via ${values.exportMethod === 'wifi' ? 'WiFi' : 'USB'}.`,
    });

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      if (isSuccess) {
        setExportState('success');
        toast({
          title: t('exportSuccessToastTitle'),
          description: t('exportSuccessToastDesc'),
        });
      } else {
        setExportState('error');
        toast({
          title: t('exportErrorToastTitle'),
          description: t('exportErrorToastDesc'),
          variant: 'destructive',
        });
      }
    }, 2500);
  };
  
  const handleClose = () => {
    if (exportState !== 'exporting') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onInteractOutside={(e) => {
        if (exportState === 'exporting') {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>{t('exportTitle')}</DialogTitle>
          <DialogDescription>{t('exportDesc')}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
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
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        disabled={exportState !== 'idle'}
                      >
                        <Label
                          htmlFor="wifi"
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <RadioGroupItem value="wifi" id="wifi" className="sr-only" />
                          <Wifi className="mb-3 h-8 w-8" />
                          WiFi
                        </Label>
                        <Label
                          htmlFor="usb"
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <RadioGroupItem value="usb" id="usb" className="sr-only" />
                          <Usb className="mb-3 h-8 w-8" />
                          USB
                        </Label>
                      </RadioGroup>
                   </FormControl>
                </FormItem>
              )}
            />
            
            <Separator/>
            
            <h4 className="text-base font-medium">{t('exportSettings')}</h4>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fileName')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={exportState !== 'idle'} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="includeDate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={exportState !== 'idle'}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{t('includeDate')}</FormLabel>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="exportPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('destinationPath')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={exportState !== 'idle'} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('finalFileName')}:</span>
                <span className="text-sm font-mono truncate">{getFinalFilename()}</span>
              </div>
            </div>

            {exportState !== 'idle' && (
              <div className="rounded-lg border p-4 text-center min-h-[80px] flex items-center justify-center">
                {exportState === 'exporting' && <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p>{t('exporting')}</p></div>}
                {exportState === 'success' && <div className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" /><p>{t('exportedSuccess')}</p></div>}
                {exportState === 'error' && <p className="text-destructive">{t('exportError')}</p>}
              </div>
            )}
            
            <DialogFooter className="sm:justify-between gap-2 pt-4">
              {exportState === 'success' || exportState === 'error' ? (
                  <Button variant="outline" onClick={handleClose}>
                      {t('close')}
                  </Button>
              ) : <Button type="button" variant="ghost" onClick={handleClose}>{t('cancel')}</Button>}
              <Button type="submit" disabled={exportState === 'exporting' || exportState === 'success'}>
                  {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                  {exportState === 'success' ? t('exported') : t('export')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
