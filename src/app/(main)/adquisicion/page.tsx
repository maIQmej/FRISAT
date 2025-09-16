

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { SensorChart } from '../../../components/app/SensorChart';
import { ExportModal } from '../../../components/app/ExportModal';
import { DataPointModal } from '../../../components/app/DataPointModal';
import type { SensorDataPoint, AcquisitionState } from '../../../lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Wind, RotateCw, HardDrive, Database, Home, Sigma, FileText, Clock, Timer, PlayCircle, Settings, AlertCircle, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/use-toast';
import { saveExportedFiles } from '../../../actions/saveExport';
import { generateCsvContent } from '../../../lib/csv-utils';
import { Separator } from '../../../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { usePredictionWebSocket } from '../../../hooks/usePredictionWebSocket';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { PredictionCard } from '../../../components/app/PredictionCard';

export default function AdquisicionPage() {
  const router = useRouter();
  const { config, setSensorData, sensorData, setAcquisitionState, acquisitionState, regimen, setRegimen, resetApp, startTimestamp, language, setStartTimestamp } = useApp();
  const { t, t_regimen } = useTranslation();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const dataAcquisitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDataPointModalOpen, setIsDataPointModalOpen] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<SensorDataPoint | null>(null);
  const [selectedDataPointIndex, setSelectedDataPointIndex] = useState<number | null>(null);
  const [chartGroups, setChartGroups] = useState<string[][]>([]);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  const sensorDataRef = useRef<SensorDataPoint[]>([]);
  sensorDataRef.current = sensorData;

  const activeSensors = useMemo(() => 
    Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key), 
  [config.sensors]);

  const { lastPrediction, connectionStatus, error: wsError } = usePredictionWebSocket({
    n_sensors: activeSensors.length,
    hop: 30, // Make this configurable if needed
    enabled: acquisitionState === 'running'
  });
  
  useEffect(() => {
    if (lastPrediction?.label) {
      setRegimen(lastPrediction.label);
    }
  }, [lastPrediction, setRegimen]);

  const totalPlannedSamples = useMemo(
    () => Math.floor(config.acquisitionTime * config.samplesPerSecond) + 1,
    [config.acquisitionTime, config.samplesPerSecond]
  );

  const testStats = useMemo(() => {
    if (!sensorData || sensorData.length < 2) {
      return [];
    }
    
    return activeSensors.map((key) => {
      const values = sensorData.map(p => p[key]).filter((v): v is number => typeof v === 'number' && isFinite(v));

      if (values.length < 2) {
        return {
          key,
          label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`,
          mean: "N/A",
          stdDev: "N/A",
          min: "N/A",
          max: "N/A",
        };
      }

      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      const stdDev = Math.sqrt(
        values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (count > 1 ? count - 1 : 1)
      );

      return {
        key,
        label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`,
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
      };
    });
  }, [sensorData, activeSensors, t]);

  useEffect(() => {
    if (!['running', 'completed', 'stopped', 'ready'].includes(acquisitionState)) {
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

  const finalizeAcquisition = (endState: 'completed' | 'stopped') => {
    setAcquisitionState(endState);
  };
  
  useEffect(() => {
    if (acquisitionState !== 'running') {
      return;
    }
    
    setChartGroups(activeSensors.length > 0 ? [activeSensors] : []);
    setSensorData([]);
    elapsedTimeRef.current = 0;
    setElapsedTime(0);
    setRegimen('indeterminado');

    const generateDataPoint = (time: number): SensorDataPoint => {
      const point: SensorDataPoint = {
        time: parseFloat(time.toFixed(2)),
      };
      const values: number[] = [];
      activeSensors.forEach(sensorKey => {
        const sensorValue = parseFloat((Math.random() * 5 + Math.sin(time * (activeSensors.indexOf(sensorKey) + 1))).toFixed(2));
        point[sensorKey] = sensorValue;
        values.push(sensorValue);
      });
      // Send data to WebSocket
      if (lastPrediction?.send) {
        lastPrediction.send({ type: 'SAMPLES', values });
      }
      return point;
    };

    const dataIntervalTime = 1000 / config.samplesPerSecond;
    dataAcquisitionIntervalRef.current = setInterval(() => {
        const newTime = elapsedTimeRef.current + (1 / config.samplesPerSecond);
        elapsedTimeRef.current = newTime;

        if (newTime >= config.acquisitionTime) {
            clearInterval(dataAcquisitionIntervalRef.current!);
            dataAcquisitionIntervalRef.current = null;

            const finalPoint = generateDataPoint(config.acquisitionTime);
            setSensorData(prev => [...prev, finalPoint]);
            setElapsedTime(config.acquisitionTime);
            setProgress(100);

            finalizeAcquisition('completed');
        } else {
            const newDataPoint = generateDataPoint(newTime);
            setSensorData(prev => [...prev, newDataPoint]);
            setElapsedTime(newTime);
            setProgress((newTime / config.acquisitionTime) * 100);
        }
    }, dataIntervalTime);

    return () => {
      if (dataAcquisitionIntervalRef.current) clearInterval(dataAcquisitionIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquisitionState]);
  
  useEffect(() => {
    const autoSave = async () => {
      if (!isAutoSaved && (acquisitionState === 'completed' || acquisitionState === 'stopped') && sensorData.length > 0) {
        setIsAutoSaved(true);
        const csvContent = generateCsvContent(config, sensorData, startTimestamp, t, regimen);
        const fileToSave = {
          fileName: `${config.fileName}.csv`,
          csvContent: csvContent
        };

        try {
          const result = await saveExportedFiles([fileToSave]);
          if (result.success) {
            toast({
              title: t('autoSaveSuccessTitle'),
              description: t('autoSaveSuccessDesc').replace('{fileName}', fileToSave.fileName)
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          toast({
            title: t('autoSaveErrorTitle'),
            description: (error as Error).message,
            variant: 'destructive',
          });
        }
      }
    };
    autoSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquisitionState, sensorData]);


  const handleStop = () => {
    if (dataAcquisitionIntervalRef.current) {
      clearInterval(dataAcquisitionIntervalRef.current);
      dataAcquisitionIntervalRef.current = null;
    }
    finalizeAcquisition('stopped');
  };

  const sensorColors: { [key: string]: string } = {
    sensor1: 'chart-1',
    sensor2: 'chart-2',
    sensor3: 'chart-3',
    sensor4: 'chart-4',
    sensor5: 'chart-5',
  };

  const isAcquisitionFinished = acquisitionState === 'completed' || acquisitionState === 'stopped';
  const isAcquisitionRunning = acquisitionState === 'running';
  const isAcquisitionReady = acquisitionState === 'ready';

  const activeSensorsCount = activeSensors.length;
  const finalTime = sensorData.at(-1)?.time.toFixed(2) || '0.00';
  const formattedStartTime = startTimestamp ? startTimestamp.toLocaleString(language) : t('notAvailable');
  
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
  
  const handleDataPointClick = (dataPoint: SensorDataPoint, index: number) => {
    setSelectedDataPoint(dataPoint);
    setSelectedDataPointIndex(index);
    setIsDataPointModalOpen(true);
  };

  const handleStartAcquisitionClick = () => {
    setStartTimestamp(new Date());
    setAcquisitionState('running');
  };

  const renderAcquisitionReady = () => {
    const activeSensorsText = activeSensors
      .map((key) => `${t('sensor')} ${parseInt(key.replace('sensor', '', 10))}`)
      .join(', ');
      
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{t('readyToStartTitle')}</CardTitle>
            <CardDescription>{t('readyToStartDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-left text-sm sm:grid-cols-2">
                <div className="flex items-center space-x-3 rounded-md border p-3 sm:col-span-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('fileNameLabel')}</p>
                    <p className="font-semibold">{config.fileName}.csv</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <Timer className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('acqTimeLabel')}</p>
                    <p className="font-semibold">{config.acquisitionTime} {t('seconds')}</p>
                  </div>
                </div>
                 <div className="flex items-center space-x-3 rounded-md border p-3">
                  <Sigma className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('samplesPerSecondLabel')}</p>
                    <p className="font-semibold">{config.samplesPerSecond} Hz</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-md border p-3 sm:col-span-2">
                  <Database className="h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('activeSensorsLabel')}</p>
                    <p className="font-semibold">{activeSensorsText || t('none')}</p>
                  </div>
                </div>
              </div>
              <Separator />
               <Button size="lg" className="h-16 w-full text-lg" onClick={handleStartAcquisitionClick}>
                <PlayCircle className="mr-2 h-6 w-6" />
                {t('startAcq')}
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderAcquisitionInProgress = () => (
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
      <PredictionCard prediction={lastPrediction} connectionStatus={connectionStatus} wsError={wsError} />
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
  );

  const renderAcquisitionFinished = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="text-2xl">{t('resultsTitle')}</CardTitle>
            <CardDescription>{t('resultsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-3 rounded-md border p-4 sm:col-span-2">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('fileNameLabel')}</p>
                <p className="font-semibold">{config.fileName}.csv</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('startTime')}</p>
                <p className="font-semibold">{formattedStartTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('durationLabel')}</p>
                <p className="font-semibold">{finalTime}s / {config.acquisitionTime}s</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Sigma className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('totalSamplesLabel')}</p>
                <p className="font-semibold">{sensorData.length * activeSensorsCount} / {totalPlannedSamples * activeSensorsCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Timer className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('activeSensorsLabel')}</p>
                <p className="font-semibold">{activeSensorsCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4 sm:col-span-2">
              <Wind className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('flowRegimeLabel')}</p>
                <p className="font-semibold capitalize">{t_regimen(regimen)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>{t('testStatistics')}</CardTitle>
            <CardDescription>{t('testStatisticsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('sensor')}</TableHead>
                        <TableHead className="text-right">{t('statMean')}</TableHead>
                        <TableHead className="text-right">{t('statStdDev')}</TableHead>
                        <TableHead className="text-right">{t('statMin')}</TableHead>
                        <TableHead className="text-right">{t('statMax')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {testStats.map((stat) => (
                        <TableRow key={stat.key}>
                            <TableCell className="font-medium">{stat.label}</TableCell>
                            <TableCell className="text-right font-mono">{stat.mean}</TableCell>
                            <TableCell className="text-right font-mono">{stat.stdDev}</TableCell>
                            <TableCell className="text-right font-mono">{stat.min}</TableCell>
                            <TableCell className="text-right font-mono">{stat.max}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="grid flex-grow grid-cols-1 gap-4">
      {activeSensors.map((sensorKey, index) => (
          <SensorChart
            key={sensorKey}
            title={`${t('sensor')} ${parseInt(sensorKey.replace('sensor', ''))}`}
            data={sensorData}
            dataKeys={[sensorKey]}
            colors={sensorColors}
            onDrop={() => {}} // No-op
            onDataPointClick={handleDataPointClick}
          />
        ))}
      </div>
    </div>
  );

  const getCardTitle = () => {
    if (isAcquisitionFinished) return t('acqFinished');
    if (isAcquisitionRunning) return t('acqInProgress');
    if (isAcquisitionReady) return t('acqReady');
    return t('acqTitle');
  };

  const getCardDescription = () => {
    if (isAcquisitionFinished) return t('acqFinishedDesc');
    if (isAcquisitionRunning) return `${t('acqInProgressDesc')} ${(config.acquisitionTime - elapsedTime).toFixed(1)}s`;
    if (isAcquisitionReady) return t('acqReadyDesc');
    return '';
  }

  const renderContent = () => {
    if (isAcquisitionReady) return renderAcquisitionReady();
    if (isAcquisitionFinished) return renderAcquisitionFinished();
    if (isAcquisitionRunning) return renderAcquisitionInProgress();
    return null;
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <Card className="flex flex-grow flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{getCardTitle()}</CardTitle>
                <CardDescription>{getCardDescription()}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isAcquisitionFinished ? (
                  <>
                    <Button variant="outline" onClick={handleNewTest}>
                      <RotateCw className="mr-2 h-4 w-4" /> {t('newTest')}
                    </Button>
                    <Button onClick={handleDownload}>
                      <HardDrive className="mr-2 h-4 w-4" /> {t('downloadData')}
                    </Button>
                     <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <Home className="h-4 w-4" />
                        <span className="sr-only">{t('home')}</span>
                      </Button>
                  </>
                ) : isAcquisitionRunning ? (
                  <Button variant="destructive" onClick={handleStop}>
                    {t('stopAcq')}
                  </Button>
                ) : isAcquisitionReady ? (
                  <Button variant="outline" onClick={() => router.push('/configuracion')}>
                    <Settings className="mr-2 h-4 w-4" /> {t('reconfigure')}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col gap-4">
            {isAcquisitionRunning && <Progress value={progress} />}
            {renderContent()}
          </CardContent>
        </Card>
      </div>
      
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
