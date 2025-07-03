'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Usb, HardDrive, Loader2, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export default function ExportacionPage() {
  const router = useRouter();
  const { config, sensorData, acquisitionState } = useApp();
  const [exportMethod, setExportMethod] = useState<'wifi' | 'usb'>('wifi');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const { toast } = useToast();

  useEffect(() => {
    if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
      router.replace('/configuracion');
    }
  }, [acquisitionState, router]);

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
  
  if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Datos</CardTitle>
          <CardDescription>
            Seleccione un método para exportar los datos de la medición en formato Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
             <div className="rounded-lg border p-4 text-center">
              {exportState === 'exporting' && <><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-2">Exportando...</p></>}
              {exportState === 'success' && <><CheckCircle className="mx-auto h-8 w-8 text-green-500" /><p className="mt-2">¡Exportado con éxito!</p></>}
              {exportState === 'error' && <><p className="mt-2 text-destructive">Error en la exportación.</p></>}
             </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleExport} disabled={exportState === 'exporting'}>
            {exportState === 'exporting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <HardDrive className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
