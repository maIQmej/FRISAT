'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { SensorChart } from '../../../components/app/SensorChart';
import { ExportModal } from '../../../components/app/ExportModal';
import { DataPointModal } from '../../../components/app/DataPointModal';
import type { SensorDataPoint, AcquisitionState, RegimenType } from '../../../lib/types';
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
import { startMeasurementRun, saveMeasurementToDatabase } from '../../../actions/saveExport';
import { generateCsvContent } from '../../../lib/csv-utils';
import { Separator } from '../../../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { usePredictionWebSocket } from '../../../hooks/usePredictionWebSocket';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { PredictionCard } from '../../../components/app/PredictionCard';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
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

  // Estado para controlar la finalización
  const [pendingFinalization, setPendingFinalization] = useState<{
    status: 'idle' | 'pending';
    endState?: 'completed' | 'stopped';
  }>({ status: 'idle' });

  // Función para solicitar la finalización
  const requestFinalization = (endState: 'completed' | 'stopped') => {
    setPendingFinalization({ status: 'pending', endState });
  };

  // Efecto para manejar la finalización después de que el estado se haya actualizado
  useEffect(() => {
    if (pendingFinalization.status === 'pending' && pendingFinalization.endState) {
      const finalize = async () => {
        try {
          console.log('Iniciando proceso de finalización con estado:', pendingFinalization.endState);
          
          // Actualizar el estado de la adquisición
          setAcquisitionState(pendingFinalization.endState);
          
          // Asegurarse de que el progreso esté al 100% si se completó
          if (pendingFinalization.endState === 'completed') {
            setProgress(100);
            setElapsedTime(config.acquisitionTime);
          }
          
          // Verificar que tengamos un runId y datos para guardar
          if (!currentRunId) {
            throw new Error('No hay un ID de run activo');
          }
          
          if (sensorData.length === 0) {
            throw new Error('No hay datos para guardar');
          }
          
          console.log(`Guardando ${sensorData.length} puntos de datos en la base de datos...`);
          
          // Preparar metadatos
          const metadata = {
            start_time: startTimestamp?.toISOString() || new Date().toISOString(),
            duration_sec: config.acquisitionTime,
            sampling_hz: config.samplesPerSecond,
            total_samples: sensorData.length,
            dominant_regimen: regimen,
            sensors: config.sensors,
            classes: ['LAMINAR', 'TRANSITION', 'TURBULENT'],
            min_timestamp: startTimestamp?.toISOString() || new Date().toISOString(),
            max_timestamp: new Date().toISOString(),
            status: pendingFinalization.endState,
            sensor1: config.sensors.sensor1,
            sensor2: config.sensors.sensor2,
            sensor3: config.sensors.sensor3,
            sensor4: config.sensors.sensor4,
            sensor5: config.sensors.sensor5,
            model_version: '1.0',
            normalization_version: '1.0',
            file_name: config.fileName,
          };
          
          // Preparar header
          const header = ['time', ...activeSensors];
          
          // Guardar en la base de datos
          const result = await saveMeasurementToDatabase({
            runId: currentRunId,
            rows: [...sensorData], // Hacer una copia para asegurar la inmutabilidad
            header,
            meta: metadata
          });
          
          if (result.success) {
            console.log('Medición guardada exitosamente');
            
            // Mostrar toast de éxito
            toast({
              title: '¡Éxito!',
              description: 'La medición se ha guardado correctamente',
              variant: 'default',
            });
            
            // Actualizar el historial
            const event = new CustomEvent('historyUpdate');
            window.dispatchEvent(event);
            
            setIsAutoSaved(true);
          } else {
            throw new Error(result.message || 'No se pudo guardar la medición');
          }
        } catch (error) {
          console.error('Error durante la finalización:', error);
          toast({
            title: 'Error',
            description: 'Ocurrió un error al finalizar la medición: ' + 
              (error instanceof Error ? error.message : 'Error desconocido'),
            variant: 'destructive',
          });
        } finally {
          // Limpiar el estado de finalización
          setPendingFinalization({ status: 'idle' });
        }
      };
      
      // Ejecutar la finalización
      finalize();
    }
  }, [pendingFinalization, sensorData, currentRunId]);

  // Función para manejar la detención manual
  const handleStop = () => {
    if (dataAcquisitionIntervalRef.current) {
      clearInterval(dataAcquisitionIntervalRef.current);
      dataAcquisitionIntervalRef.current = null;
    }
    
    // Solicitar finalización con estado 'stopped'
    requestFinalization('stopped');
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

  const getRegimenBadgeVariant = (regimen: RegimenType): BadgeProps["variant"] => {
    switch(regimen) {
      case 'LAMINAR': return 'laminar';
      case 'TRANSITION': return 'transition';
      case 'TURBULENT': return 'turbulent';
      case 'INDETERMINADO':
      case 'indeterminado':
      default: return 'secondary';
    }
  }

  const renderAcquisitionReady = () => {
    const activeSensorsText = activeSensors
      .map((key) => `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`)
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
      <PredictionCard prediction={lastPrediction || undefined} connectionStatus={connectionStatus} wsError={wsError} />
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
                <Badge 
                  variant={getRegimenBadgeVariant(regimen)}
                  className="text-base capitalize"
                >
                  {t_regimen(regimen)}
                </Badge>
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

  useEffect(() => {
    if (acquisitionState !== 'running') return;

    console.log('Iniciando adquisición...');
    
    // Inicializar estado
    setChartGroups(activeSensors.length > 0 ? [activeSensors] : []);
    setSensorData([]);
    elapsedTimeRef.current = 0;
    setElapsedTime(0);
    setRegimen('indeterminado');
    setIsAutoSaved(false);
    
    // Función para generar un punto de datos
    const generateDataPoint = (time: number): SensorDataPoint => {
      const point: SensorDataPoint = { time: parseFloat(time.toFixed(2)) };
      const values: number[] = [];
      
      activeSensors.forEach(sensorKey => {
        const sensorValue = parseFloat(
          (Math.random() * 5 + Math.sin(time * (activeSensors.indexOf(sensorKey) + 1))).toFixed(2)
        );
        point[sensorKey] = sensorValue;
        values.push(sensorValue);
      });
      
      // Enviar datos al WebSocket si está disponible
      if (lastPrediction?.send) {
        try {
          lastPrediction.send({ type: 'SAMPLES', values });
        } catch (error) {
          console.error('Error sending data to WebSocket:', error);
        }
      }
      
      return point;
    };

    let isRunning = true;
    let intervalId: NodeJS.Timeout | null = null;

    const startAcquisition = async () => {
      // Iniciar un nuevo run en la base de datos
      const startRun = async () => {
        try {
          const metadata = {
            sampling_hz: config.samplesPerSecond,
            duration_sec: config.acquisitionTime,
            sensor1: config.sensors.sensor1,
            sensor2: config.sensors.sensor2,
            sensor3: config.sensors.sensor3,
            sensor4: config.sensors.sensor4,
            sensor5: config.sensors.sensor5,
            model_version: '1.0',
            normalization_version: '1.0',
            file_name: config.fileName,
          };
          
          const result = await startMeasurementRun(metadata);
          if (result.success && result.runId) {
            console.log('Run iniciado con ID:', result.runId);
            setCurrentRunId(result.runId);
            setStartTimestamp(new Date());
            return true;
          } else {
            throw new Error(result.message || 'No se pudo iniciar la medición');
          }
        } catch (error) {
          console.error('Error al iniciar la medición:', error);
          toast({
            title: 'Error',
            description: 'No se pudo iniciar la medición: ' + 
              (error instanceof Error ? error.message : 'Error desconocido'),
            variant: 'destructive',
          });
          setAcquisitionState('ready');
          return false;
        }
      };

      const runStarted = await startRun();
      if (!runStarted) return;

      const dataIntervalTime = 1000 / config.samplesPerSecond;
      let currentTime = 0;
      
      intervalId = setInterval(() => {
        if (!isRunning) return;
        
        currentTime += 1 / config.samplesPerSecond;
        currentTime = parseFloat(currentTime.toFixed(6));
        
        if (currentTime >= config.acquisitionTime) {
          // Limpiar el intervalo
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          
          // Asegurarse de que el último punto se añada correctamente
          const finalPoint = generateDataPoint(config.acquisitionTime);
          
          // Actualizar el estado con el último punto
          setSensorData(prev => [...prev, finalPoint]);
          
          // Solicitar finalización con estado 'completed'
          requestFinalization('completed');
        } else {
          // Añadir nuevo punto de datos
          const newDataPoint = generateDataPoint(currentTime);
          setSensorData(prev => [...prev, newDataPoint]);
          setElapsedTime(currentTime);
          setProgress((currentTime / config.acquisitionTime) * 100);
        }
      }, dataIntervalTime);

      // Guardar referencia al intervalo
      dataAcquisitionIntervalRef.current = intervalId;
    };

    startAcquisition();

    // Limpieza cuando el componente se desmonte o cambie el estado de adquisición
    return () => {
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (dataAcquisitionIntervalRef.current === intervalId) {
        dataAcquisitionIntervalRef.current = null;
      }
    };
  }, [acquisitionState, config.samplesPerSecond, config.acquisitionTime, activeSensors]);

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
