'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SensorChart } from '@/components/app/SensorChart';
import { ResultsModal } from '@/components/app/ResultsModal';
import { ExportModal } from '@/components/app/ExportModal';
import type { SensorDataPoint, RegimenType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wind, RotateCw, HardDrive, Database, Home } from 'lucide-react';

export default function AdquisicionPage() {
  const router = useRouter();
  const { config, setSensorData, sensorData, setAcquisitionState, acquisitionState, regimen, setRegimen, resetApp } = useApp();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localSensorData, setLocalSensorData] = useState<SensorDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [chartGroups, setChartGroups] = useState<string[][]>([]);

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
    
    setChartGroups(activeSensors.map(key => [key]));

    const intervalTime = 1000 / config.samplesPerSecond;

    const generateDataPoint = (time: number): SensorDataPoint => {
      const point: SensorDataPoint = { time: parseFloat(time.toFixed(2)) };
      activeSensors.forEach(sensorKey => {
        point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (activeSensors.indexOf(sensorKey) + 1))).toFixed(2));
      });
      return point;
    };

    const simulateRegimen = () => {
      const results: RegimenType[] = ['flujo laminar', 'turbulento', 'en la frontera'];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      setRegimen(randomResult);
    };
    
    const runAcquisition = () => {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1 / config.samplesPerSecond;
          if (newTime >= config.acquisitionTime) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setProgress(100);
            setLocalSensorData(prevData => {
              const finalData = [...prevData, generateDataPoint(newTime)];
              setSensorData(finalData);
              return finalData;
            });
            setAcquisitionState('completed');
            
            const finalRegimenResults: RegimenType[] = ['flujo laminar', 'turbulento', 'en la frontera'];
            const finalRandomResult = finalRegimenResults[Math.floor(Math.random() * finalRegimenResults.length)];
            setRegimen(finalRandomResult);
            
            setIsResultsModalOpen(true);
            return config.acquisitionTime;
          }

          setLocalSensorData(prevData => [...prevData, generateDataPoint(newTime)]);
          setProgress((newTime / config.acquisitionTime) * 100);
          
          simulateRegimen();
          
          return newTime;
        });
      }, intervalTime);
    };
    
    setLocalSensorData([generateDataPoint(0)]);
    runAcquisition();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [acquisitionState, config, activeSensors, setAcquisitionState, setRegimen, setSensorData]);

  useEffect(() => {
    if (localSensorData.length > 0) {
      setSensorData(localSensorData);
    }
  }, [localSensorData, setSensorData]);

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

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <Card className="flex flex-grow flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{isAcquisitionFinished ? 'Adquisición Finalizada' : 'Adquisición en Proceso'}</CardTitle>
                <CardDescription>
                  {isAcquisitionFinished 
                    ? 'La recolección de datos ha terminado.'
                    : `Monitoreando datos de sensores en tiempo real. Tiempo restante: ${(config.acquisitionTime - elapsedTime).toFixed(1)}s`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isAcquisitionFinished ? (
                  <>
                    <Button variant="outline" onClick={handleNewTest}>
                      <RotateCw className="mr-2 h-4 w-4" /> Nueva Prueba
                    </Button>
                    <Button variant="secondary" onClick={handleHistory}>
                      <Database className="mr-2 h-4 w-4" /> Ver Historial
                    </Button>
                    <Button onClick={handleDownload}>
                      <HardDrive className="mr-2 h-4 w-4" /> Descargar Datos
                    </Button>
                     <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Inicio</span>
                      </Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={handleStop}>
                    Detener Adquisición
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col gap-4">
            <Progress value={progress} />
            <div className="grid flex-grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chartGroups.map((group) => {
                const primaryKey = group[0];
                const title = group.map(key => `Sensor ${parseInt(key.replace('sensor', ''))}`).join(' & ');
                return (
                  <SensorChart
                    key={primaryKey}
                    title={title}
                    data={localSensorData}
                    dataKeys={group}
                    colors={sensorColors}
                    onDrop={handleDrop}
                    onDoubleClick={() => handleSeparate(group)}
                  />
                );
              })}
              <Card className="flex flex-col items-center justify-center min-h-[240px]">
                <CardHeader className="flex flex-col items-center justify-center p-4 text-center">
                  <Wind className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-2">Régimen de Flujo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold capitalize text-center">{regimen}</p>
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
      />
      
      <ExportModal 
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </>
  );
}
