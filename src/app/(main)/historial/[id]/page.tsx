
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SensorChart } from '@/components/app/SensorChart';
import { ArrowLeft, HardDrive, Timer, Sigma, Wind, SlidersHorizontal, Home, Clock } from 'lucide-react';
import { ExportModal } from '@/components/app/ExportModal';
import { DataPointModal } from '@/components/app/DataPointModal';
import type { SensorDataPoint, RegimenType, Configuration } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { getHistoryEntry, type HistoryDetail } from '@/actions/getHistory';
import { Skeleton } from '@/components/ui/skeleton';

const sensorColors: { [key: string]: string } = {
  sensor1: 'chart-1',
  sensor2: 'chart-2',
  sensor3: 'chart-3',
  sensor4: 'chart-4',
  sensor5: 'chart-5',
};

export default function HistorialDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { t, t_regimen } = useTranslation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDataPointModalOpen, setIsDataPointModalOpen] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<SensorDataPoint | null>(null);
  const [selectedDataPointIndex, setSelectedDataPointIndex] = useState<number | null>(null);
  const [testData, setTestData] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const testId = params.id ? decodeURIComponent(params.id as string) : null;
  
  useEffect(() => {
    if (testId) {
      const fetchTestData = async () => {
        setLoading(true);
        const data = await getHistoryEntry(testId);
        setTestData(data);
        setLoading(false);
      };
      fetchTestData();
    }
  }, [testId]);
  
  const handleDataPointClick = (dataPoint: SensorDataPoint, index: number) => {
    setSelectedDataPoint(dataPoint);
    setSelectedDataPointIndex(index);
    setIsDataPointModalOpen(true);
  };
  
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate || isoDate === 'N/A') return 'N/A';
    try {
        return new Date(isoDate).toLocaleString();
    } catch (e) {
        return isoDate; // fallback
    }
  };
  
  if (loading) {
      return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-72" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-60 w-full" /></CardContent></Card>
        </div>
      );
  }

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
  
  const activeSensors = Object.keys(testData.sensorData[0] || {}).filter(k => k.startsWith('sensor'));
  const totalPlannedSamples = (parseInt(testData.duration) * testData.samplesPerSecond) + 1;

  const exportConfig: Configuration = {
    fileName: testData.fileName,
    acquisitionTime: parseInt(testData.duration),
    samplesPerSecond: testData.samplesPerSecond,
    sensors: {
      sensor1: activeSensors.includes('sensor1'),
      sensor2: activeSensors.includes('sensor2'),
      sensor3: activeSensors.includes('sensor3'),
      sensor4: activeSensors.includes('sensor4'),
      sensor5: activeSensors.includes('sensor5'),
    }
  };

  const startTimestamp = testData ? new Date(testData.date) : null;

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
            <p className="text-muted-foreground">{formatDisplayDate(testData.date)}</p>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('startTime')}</p>
                <p className="font-semibold">{formatDisplayDate(testData.date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('duration')}</p>
                <p className="font-semibold">{testData.duration}</p>
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
                <p className="font-semibold">{testData.totalSamples} / {totalPlannedSamples * activeSensors.length}</p>
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
            {activeSensors.map(sensorKey => (
              <SensorChart
                key={sensorKey}
                title={`${t('sensor')} ${parseInt(sensorKey.replace('sensor', ''))}`}
                data={testData.sensorData}
                dataKeys={[sensorKey]}
                colors={sensorColors}
                onDrop={() => {}} // No-op for historical view
                onDataPointClick={handleDataPointClick}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <ExportModal 
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        filesToExport={[testData.fileName]}
        sensorData={testData.sensorData}
        config={exportConfig}
        startTimestamp={startTimestamp}
        regimen={testData.regimen}
      />
      <DataPointModal
        open={isDataPointModalOpen}
        onOpenChange={setIsDataPointModalOpen}
        dataPoint={selectedDataPoint}
        dataPointIndex={selectedDataPointIndex}
        activeSensors={activeSensors}
      />
    </>
  );
}
