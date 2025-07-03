
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SensorChart } from '@/components/app/SensorChart';
import { ArrowLeft, HardDrive, Timer, Sigma, Wind, SlidersHorizontal, Home } from 'lucide-react';
import { ExportModal } from '@/components/app/ExportModal';
import type { SensorDataPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

const mockHistory = [
  { id: 1, fileName: 'prueba_motor_caliente', date: '2024-07-29 10:30', duration: 60, sensors: ['sensor1', 'sensor2', 'sensor3'], regimen: 'turbulento', samplesPerSecond: 10 },
  { id: 2, fileName: 'test_flujo_laminar_01', date: '2024-07-29 09:15', duration: 30, sensors: ['sensor1', 'sensor2'], regimen: 'flujo laminar', samplesPerSecond: 5 },
  { id: 3, fileName: 'medicion_valvula_fria', date: '2024-07-28 15:00', duration: 120, sensors: ['sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5'], regimen: 'en la frontera', samplesPerSecond: 20 },
  { id: 4, fileName: 'ensayo_largo_duracion', date: '2024-07-28 11:45', duration: 300, sensors: ['sensor1', 'sensor2', 'sensor3', 'sensor4'], regimen: 'turbulento', samplesPerSecond: 50 },
] as const;

const sensorColors: { [key: string]: string } = {
  sensor1: 'chart-1',
  sensor2: 'chart-2',
  sensor3: 'chart-3',
  sensor4: 'chart-4',
  sensor5: 'chart-5',
};

const generateMockSensorData = (duration: number, samplesPerSecond: number, sensors: string[]): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const totalSamples = duration * samplesPerSecond;
  for (let i = 0; i <= totalSamples; i++) {
    const time = i / samplesPerSecond;
    const point: SensorDataPoint = { time: parseFloat(time.toFixed(2)) };
    sensors.forEach((sensorKey, index) => {
      point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (index + 1) * 0.5)).toFixed(2));
    });
    data.push(point);
  }
  return data;
};

export default function HistorialDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { t, t_regimen } = useTranslation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const testId = params.id ? parseInt(params.id as string, 10) : null;
  const testData = useMemo(() => testId ? mockHistory.find(t => t.id === testId) : null, [testId]);
  
  const sensorData = useMemo(() => {
    if (!testData) return [];
    return generateMockSensorData(testData.duration, testData.samplesPerSecond, testData.sensors);
  }, [testData]);

  if (!testData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CardTitle>{t('testNotFound')}</CardTitle>
        <p className="text-muted-foreground mt-2">{t('testNotFoundDesc')}</p>
        <Button onClick={() => router.push('/historial')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToHistory')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/historial')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold">{testData.fileName}</h1>
            <p className="text-muted-foreground">{testData.date}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant="outline" onClick={() => router.push('/')}>
              <Home className="mr-2 h-4 w-4" /> {t('home')}
            </Button>
            <Button onClick={() => setIsExportModalOpen(true)}>
              <HardDrive className="mr-2 h-4 w-4" /> {t('downloadData')}
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('testSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('duration')}</p>
                <p className="font-semibold">{testData.duration}s</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <SlidersHorizontal className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('sampling')}</p>
                <p className="font-semibold">{testData.samplesPerSecond} Hz</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Sigma className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('totalSamplesLabel')}</p>
                <p className="font-semibold">{sensorData.length}</p>
              </div>
            </div>
             <div className="flex items-center space-x-3 rounded-md border p-4">
              <Wind className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('detectedRegime')}</p>
                <Badge variant={
                  testData.regimen === 'flujo laminar' ? 'default' : 
                  testData.regimen === 'turbulento' ? 'destructive' : 'secondary'
                } className="capitalize text-base">{t_regimen(testData.regimen)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('sensorData')}</CardTitle>
            <CardDescription>{t('sensorDataDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {testData.sensors.map(sensorKey => (
              <SensorChart
                key={sensorKey}
                title={`${t('sensor')} ${parseInt(sensorKey.replace('sensor', ''))}`}
                data={sensorData}
                dataKeys={[sensorKey]}
                colors={sensorColors}
                onDrop={() => {}} // No-op for historical view
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <ExportModal 
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </>
  );
}
