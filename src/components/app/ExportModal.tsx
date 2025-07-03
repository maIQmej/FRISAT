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
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Usb, HardDrive, Loader2, CheckCircle, X } from 'lucide-react';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { config } = useApp();
  const [exportMethod, setExportMethod] = useState<'wifi' | 'usb'>('wifi');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const { toast } = useToast();

  const handleExport = () => {
    setExportState('exporting');
    toast({
      title: 'Exportando Datos',
      description: `Iniciando exportación como "${config.fileName}.xlsx" vía ${exportMethod === 'wifi' ? 'WiFi' : 'USB'}.`,
    });

    // Mock export process
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      if (isSuccess) {
        setExportState('success');
        toast({
          title: 'Exportación Exitosa',
          description: 'Los datos han sido exportados correctamente.',
        });
      } else {
        setExportState('error');
        toast({
          title: 'Error de Exportación',
          description: `No se pudo exportar vía ${exportMethod}. Verifique la conexión.`,
          variant: 'destructive',
        });
      }
    }, 2500);
  };
  
  const handleClose = () => {
    if (exportState !== 'exporting') {
      onOpenChange(false);
      // Reset state after closing animation
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
          <DialogTitle>Exportar Datos</DialogTitle>
          <DialogDescription>
            Seleccione un método para exportar los datos de la medición en formato Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base">Método de Exportación</Label>
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
              {exportState === 'exporting' && <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p>Exportando...</p></div>}
              {exportState === 'success' && <div className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" /><p>¡Exportado con éxito!</p></div>}
              {exportState === 'error' && <p className="text-destructive">Error en la exportación. Intente de nuevo.</p>}
             </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            {exportState === 'success' || exportState === 'error' ? (
                <Button variant="outline" onClick={handleClose}>
                    Cerrar
                </Button>
            ) : <div/>}
            <Button onClick={handleExport} disabled={exportState === 'exporting' || exportState === 'success'}>
                {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exportState === 'success' ? <CheckCircle className="mr-2 h-4 w-4" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {exportState === 'success' ? 'Exportado' : 'Exportar'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
