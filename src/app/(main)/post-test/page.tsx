'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, RotateCw, Sigma, Timer, FileText, Wind } from 'lucide-react';
import { useEffect } from 'react';
import type { RegimenType } from '@/lib/types';

export default function PostTestPage() {
  const router = useRouter();
  const { config, sensorData, acquisitionState, resetApp, regimen, setRegimen } = useApp();

  useEffect(() => {
    if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
      router.replace('/configuracion');
    }
  }, [acquisitionState, router]);

  useEffect(() => {
    // Simulate processing and set regimen result when page loads after a test
    if (acquisitionState === 'completed' || acquisitionState === 'stopped') {
      const results: RegimenType[] = ['flujo laminar', 'turbulento', 'en la frontera'];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      setRegimen(randomResult);
    }
  }, [acquisitionState, setRegimen]);
  
  if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
    return null; 
  }

  const activeSensorsCount = Object.values(config.sensors).filter(Boolean).length;

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Resumen de la Medición</CardTitle>
          <CardDescription>La adquisición ha finalizado. Aquí están los detalles y resultados.</CardDescription>
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
        </CardContent>
        <CardFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={resetApp}>
            <RotateCw className="mr-2 h-4 w-4" /> Nueva Configuración
          </Button>
          <Button onClick={() => router.push('/exportacion')}>
            <HardDrive className="mr-2 h-4 w-4" /> Exportar Datos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
