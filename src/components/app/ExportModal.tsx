
'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Usb, HardDrive, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { config } = useApp();
  const { t } = useTranslation();
  const [exportMethod, setExportMethod] = useState<'wifi' | 'usb'>('wifi');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const { toast } = useToast();

  const handleExport = () => {
    setExportState('exporting');
    toast({
      title: t('exportingToastTitle'),
      description: `${t('exportingToastDesc')} "${config.fileName}.xlsx" via ${exportMethod === 'wifi' ? 'WiFi' : 'USB'}.`,
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
      setTimeout(() => {
        setExportState('idle');
      }, 300);
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
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base">{t('exportMethod')}</Label>
            <RadioGroup
              value={exportMethod}
              onValueChange={(value: 'wifi' | 'usb') => setExportMethod(value)}
              className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2"
              disabled={exportState === 'exporting'}
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
          </div>
          {exportState !== 'idle' && (
             <div className="rounded-lg border p-4 text-center min-h-[80px] flex items-center justify-center">
              {exportState === 'exporting' && <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p>{t('exporting')}</p></div>}
              {exportState === 'success' && <div className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" /><p>{t('exportedSuccess')}</p></div>}
              {exportState === 'error' && <p className="text-destructive">{t('exportError')}</p>}
             </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            {exportState === 'success' || exportState === 'error' ? (
                <Button variant="outline" onClick={handleClose}>
                    {t('close')}
                </Button>
            ) : <div/>}
            <Button onClick={handleExport} disabled={exportState === 'exporting' || exportState === 'success'}>
                {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? t('exported') : t('export')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
