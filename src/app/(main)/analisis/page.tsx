'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeSensorData } from '@/ai/flows/analyze-sensor-data';
import { AnalysisResult } from '@/components/app/AnalysisResult';
import type { SensorDataPoint } from '@/lib/types';

export default function AnalisisPage() {
  const router = useRouter();
  const {
    config,
    sensorData,
    acquisitionState,
    analysisState,
    setAnalysisState,
    analysisResult,
    setAnalysisResult,
  } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    // Allow access if data is present, regardless of acquisition state
    if (sensorData.length === 0) {
      toast({
        title: 'Sin Datos',
        description: 'No hay datos para analizar. Realice una adquisición primero.',
        variant: 'destructive'
      });
      router.replace('/configuracion');
    }
  }, [sensorData, acquisitionState, router, toast]);

  const handleAnalyze = async () => {
    setAnalysisState('loading');
    setAnalysisResult(null);

    // Transform data for AI
    const aiSensorData = sensorData.map(d => {
        const transformed: Record<string, number> = {
            tiempo: d.time,
            muestrasPorSegundo: config.samplesPerSecond
        };
        for (const key in d) {
            if (key !== 'time' && key.startsWith('sensor')) {
                transformed[key] = d[key];
            }
        }
        return transformed;
    });

    try {
      const result = await analyzeSensorData({
        sensorData: aiSensorData,
        nombreArchivo: config.fileName,
      });
      setAnalysisResult(result);
      setAnalysisState('success');
      toast({
        title: 'Análisis Completo',
        description: 'La IA ha procesado los datos exitosamente.',
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAnalysisState('error');
      toast({
        title: 'Error de Análisis',
        description: 'No se pudo completar el análisis con IA. Intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis con Inteligencia Artificial</CardTitle>
          <CardDescription>
            Utilice el poder de la IA para extraer información valiosa, detectar anomalías y encontrar correlaciones en los datos de sus sensores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysisState !== 'success' && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 p-12 text-center">
              <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Listo para Analizar</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Presione el botón para iniciar el análisis de los {sensorData.length} puntos de datos.
              </p>
              <Button onClick={handleAnalyze} disabled={analysisState === 'loading'}>
                {analysisState === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  'Analizar Datos'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {analysisState === 'success' && analysisResult && (
        <>
          <AnalysisResult result={analysisResult} />
          <div className="text-center">
             <Button onClick={handleAnalyze} disabled={analysisState === 'loading'}>
                {analysisState === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reintentando...
                  </>
                ) : (
                  'Volver a Analizar'
                )}
              </Button>
          </div>
        </>
      )}

      {analysisState === 'error' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Error en el Análisis</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-destructive">Ocurrió un error al intentar analizar los datos.</p>
            <Button onClick={handleAnalyze} className="mt-4">
              Reintentar Análisis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
