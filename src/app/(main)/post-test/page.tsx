'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, HardDrive, RotateCw, Sigma, Timer, FileText } from 'lucide-react';
import { useEffect } from 'react';

export default function PostTestPage() {
  const router = useRouter();
  const { config, sensorData, acquisitionState, resetApp } = useApp();

  useEffect(() => {
    if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
      router.replace('/configuracion');
    }
  }, [acquisitionState, router]);
  
  if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
    return null; 
  }

  const activeSensorsCount = Object.values(config.sensors).filter(Boolean).length;

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Resumen de la Medición</CardTitle>
          <CardDescription>La adquisición ha finalizado. Aquí están los detalles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <p className="font-semibold">{sensorData.at(-1)?.time.toFixed(2) || 0}s / {config.acquisitionTime}s</p>
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
          </div>
          <div className="text-center pt-4">
            <p className="text-lg">¿Qué desea hacer ahora?</p>
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={resetApp}>
            <RotateCw className="mr-2 h-4 w-4" /> Nueva Configuración
          </Button>
          <Button onClick={() => router.push('/analisis')}>
            <BrainCircuit className="mr-2 h-4 w-4" /> Analizar con IA
          </Button>
          <Button onClick={() => router.push('/exportacion')}>
            <HardDrive className="mr-2 h-4 w-4" /> Exportar Datos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
