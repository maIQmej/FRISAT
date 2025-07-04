
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SensorChart } from '@/components/app/SensorChart';
import { ResultsModal } from '@/components/app/ResultsModal';
import { ExportModal } from '@/components/app/ExportModal';
import { DataPointModal } from '@/components/app/DataPointModal';
import type { SensorDataPoint, RegimenType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wind, RotateCw, HardDrive, Database, Home, Sigma } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdquisicionPage() {
  const router = useRouter();
  const { config, setSensorData, sensorData, setAcquisitionState, acquisitionState, regimen, setRegimen, resetApp, startTimestamp } = useApp();
  const { t, t_regimen } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDataPointModalOpen, setIsDataPointModalOpen] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<SensorDataPoint | null>(null);
  const [selectedDataPointIndex, setSelectedDataPointIndex] = useState<number | null>(null);
  const [chartGroups, setChartGroups] = useState<string[][]>([]);

  const totalPlannedSamples = useMemo(
    () => Math.floor(config.acquisitionTime * config.samplesPerSecond) + 1,
    [config.acquisitionTime, config.samplesPerSecond]
  );

  const activeSensors = useMemo(() => 
    Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key), 
  [config.sensors]);

  useEffect(() => {
    if (acquisitionState !== 'running' && acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
      router.replace('/configuracion');
    }
  }, [acquisitionState, router]);
  
  const handleDrop = (sourceKey: string, targetKey: string) => {
    setChartGroups(prevGroups => {
      const sourceGroup = prevGroups.find(g => g.includes(sourceKey));
      const targetGroup = prevGroups.find(g => g.includes(targetKey));
  
      if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) {
        return prevGroups;
      }
  
      const nextGroups = prevGroups.filter(g => g !== sourceGroup);
  
      return nextGroups.map(g => {
        if (g === targetGroup) {
          return [...g, ...sourceGroup];
        }
        return g;
      });
    });
  };

  const handleSeparate = (groupToSeparate: string[]) => {
    if (groupToSeparate.length <= 1) return;

    setChartGroups(prevGroups => {
      const otherGroups = prevGroups.filter(g => g !== groupToSeparate);
      const newSingleGroups = groupToSeparate.map(key => [key]);
      return [...otherGroups, ...newSingleGroups];
    });
  };

  useEffect(() => {
    if (acquisitionState !== 'running') {
      return;
    }
    
    setChartGroups(activeSensors.length > 0 ? [activeSensors] : []);

    const intervalTime = 1000 / config.samplesPerSecond;

    const generateDataPoint = (time: number): SensorDataPoint => {
      const point: SensorDataPoint = {
        time: parseFloat(time.toFixed(2)),
      };

      const results: RegimenType[] = ['flujo laminar', 'turbulento'];
      point.regimen = results[Math.floor(Math.random() * results.length)];

      activeSensors.forEach(sensorKey => {
        point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (activeSensors.indexOf(sensorKey) + 1))).toFixed(2));
      });
      return point;
    };

    const runAcquisition = () => {
      elapsedTimeRef.current = 0;
      setElapsedTime(0);
      const initialDataPoint = generateDataPoint(0);
      setSensorData([initialDataPoint]);
      setRegimen(initialDataPoint.regimen || 'indeterminado');
      
      const interval = setInterval(() => {
        const newTime = elapsedTimeRef.current + (1 / config.samplesPerSecond);
        elapsedTimeRef.current = newTime;

        if (newTime >= config.acquisitionTime) {
          clearInterval(interval);
          intervalRef.current = null;
          
          const finalDataPoint = generateDataPoint(config.acquisitionTime);
          
          setSensorData(prevData => [...prevData, finalDataPoint]);

          setElapsedTime(config.acquisitionTime);
          setProgress(100);
          setRegimen(finalDataPoint.regimen || 'indeterminado');
          setAcquisitionState('completed');
          setIsResultsModalOpen(true);
        } else {
          const newDataPoint = generateDataPoint(newTime);
          setSensorData(prevData => [...prevData, newDataPoint]);
          setElapsedTime(newTime);
          setProgress((newTime / config.acquisitionTime) * 100);
          setRegimen(newDataPoint.regimen || 'indeterminado');
        }
      }, intervalTime);
      intervalRef.current = interval;
    };
    
    runAcquisition();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [acquisitionState, config, activeSensors, setAcquisitionState, setRegimen, setSensorData]);

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setAcquisitionState('stopped');
    setIsResultsModalOpen(true);
  };

  const sensorColors: { [key: string]: string } = {
    sensor1: 'chart-1',
    sensor2: 'chart-2',
    sensor3: 'chart-3',
    sensor4: 'chart-4',
    sensor5: 'chart-5',
  };

  const isAcquisitionFinished = acquisitionState === 'completed' || acquisitionState === 'stopped';
  
  const handleNewTest = () => {
    resetApp();
    router.push('/configuracion');
  };
  
  const handleDownload = () => {
    setIsExportModalOpen(true);
  };

  const handleHistory = () => {
    router.push('/historial');
  };
  
  const handleTriggerExport = () => {
    setIsResultsModalOpen(false);
    setIsExportModalOpen(true);
  }

  const handleDataPointClick = (dataPoint: SensorDataPoint, index: number) => {
    setSelectedDataPoint(dataPoint);
    setSelectedDataPointIndex(index);
    setIsDataPointModalOpen(true);
  };

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <Card className="flex flex-grow flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{isAcquisitionFinished ? t('acqFinished') : t('acqInProgress')}</CardTitle>
                <CardDescription>
                  {isAcquisitionFinished 
                    ? t('acqFinishedDesc')
                    : `${t('acqInProgressDesc')} ${(config.acquisitionTime - elapsedTime).toFixed(1)}s`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isAcquisitionFinished ? (
                  <>
                    <Button variant="outline" onClick={handleNewTest}>
                      <RotateCw className="mr-2 h-4 w-4" /> {t('newTest')}
                    </Button>
                    <Button variant="secondary" onClick={handleHistory}>
                      <Database className="mr-2 h-4 w-4" /> {t('viewHistory')}
                    </Button>
                    <Button onClick={handleDownload}>
                      <HardDrive className="mr-2 h-4 w-4" /> {t('downloadData')}
                    </Button>
                     <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <Home className="h-4 w-4" />
                        <span className="sr-only">{t('home')}</span>
                      </Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={handleStop}>
                    {t('stopAcq')}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col gap-4">
            <Progress value={progress} />
            <div className="grid flex-grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {chartGroups.map((group, groupIndex) => {
                const primaryKey = group[0];
                const title = group.length > 1 ? t('sensorSelection') : `${t('sensor')} ${parseInt(primaryKey.replace('sensor', ''))}`;
                return (
                  <SensorChart
                    key={`${primaryKey}-${groupIndex}`}
                    title={title}
                    data={sensorData}
                    dataKeys={group}
                    colors={sensorColors}
                    onDrop={handleDrop}
                    onDoubleClick={() => handleSeparate(group)}
                    onDataPointClick={handleDataPointClick}
                  />
                );
              })}
              <Card className="flex flex-col items-center justify-center min-h-[240px]">
                <CardHeader className="flex flex-col items-center justify-center p-4 text-center">
                  <Wind className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-2">{t('flowRegime')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold capitalize text-center">{t_regimen(regimen)}</p>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center justify-center min-h-[240px]">
                <CardHeader className="flex flex-col items-center justify-center p-4 text-center">
                  <Sigma className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-2">{t('totalSamplesLabel')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-center">
                  <p className="text-2xl font-bold">
                    {sensorData.length * activeSensors.length} / {totalPlannedSamples * activeSensors.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResultsModal
        open={isResultsModalOpen}
        onOpenChange={setIsResultsModalOpen}
        config={config}
        sensorData={sensorData}
        regimen={regimen}
        onTriggerExport={handleTriggerExport}
        startTimestamp={startTimestamp}
      />
      
      <ExportModal 
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        filesToExport={[config.fileName]}
        sensorData={sensorData}
        config={config}
        startTimestamp={startTimestamp}
        regimen={regimen}
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
