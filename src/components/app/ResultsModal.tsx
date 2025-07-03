'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { HardDrive, RotateCw, Sigma, Timer, FileText, Wind } from 'lucide-react';
import type { Configuration, SensorDataPoint, RegimenType } from '@/lib/types';

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Configuration;
  sensorData: SensorDataPoint[];
  regimen: RegimenType;
}

export function ResultsModal({ open, onOpenChange, config, sensorData, regimen }: ResultsModalProps) {
  const router = useRouter();
  const { resetApp } = useApp();

  const handleNewConfiguration = () => {
    onOpenChange(false);
    resetApp();
  };
  
  const handleExport = () => {
    onOpenChange(false);
    router.push('/exportacion');
  };

  const activeSensorsCount = Object.values(config.sensors).filter(Boolean).length;
  const finalTime = sensorData.at(-1)?.time.toFixed(2) || '0.00';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Resumen de la Medición</DialogTitle>
          <DialogDescription>La adquisición ha finalizado. Aquí están los detalles y resultados.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre Archivo</p>
                <p className="font-semibold">{config.fileName}.xlsx</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="font-semibold">{finalTime}s / {config.acquisitionTime}s</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Sigma className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Muestras</p>
                <p className="font-semibold">{sensorData.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sensores Activos</p>
                <p className="font-semibold">{activeSensorsCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4 sm:col-span-2">
              <Wind className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Régimen de Flujo</p>
                <p className="font-semibold capitalize">{regimen}</p>
              </div>
            </div>
          </div>
          <div className="text-center pt-4">
            <p className="text-lg">¿Qué desea hacer ahora?</p>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={handleNewConfiguration}>
            <RotateCw className="mr-2 h-4 w-4" /> Nueva Configuración
          </Button>
          <Button onClick={handleExport}>
            <HardDrive className="mr-2 h-4 w-4" /> Exportar Datos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
