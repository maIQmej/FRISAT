'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SensorChart } from '@/components/app/SensorChart';
import type { SensorDataPoint, RegimenType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wind } from 'lucide-react';

export default function AdquisicionPage() {
  const router = useRouter();
  const { config, setSensorData, setAcquisitionState, acquisitionState, regimen, setRegimen } = useApp();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localSensorData, setLocalSensorData] = useState<SensorDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeSensors = useMemo(() => 
    Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key), 
  [config.sensors]);

  useEffect(() => {
    if (acquisitionState !== 'running') {
      router.replace('/configuracion');
    }
  }, [acquisitionState, router]);
  
  useEffect(() => {
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
            setAcquisitionState('completed');
            setSensorData(prevData => [...prevData, generateDataPoint(newTime)]);
            router.push('/post-test');
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
  }, [config, router, setAcquisitionState, setSensorData, activeSensors, setRegimen]);

  useEffect(() => {
    setSensorData(localSensorData);
  }, [localSensorData, setSensorData]);

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setAcquisitionState('stopped');
    router.push('/post-test');
  };

  const sensorColors: { [key: string]: string } = {
    sensor1: 'chart-1',
    sensor2: 'chart-2',
    sensor3: 'chart-3',
    sensor4: 'chart-4',
    sensor5: 'chart-5',
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="flex flex-grow flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Adquisición en Proceso</CardTitle>
              <CardDescription>
                Monitoreando datos de sensores en tiempo real. Tiempo restante: {(config.acquisitionTime - elapsedTime).toFixed(1)}s
              </CardDescription>
            </div>
            <Button variant="destructive" onClick={handleStop}>Detener Adquisición</Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-grow flex-col gap-4">
          <Progress value={progress} />
          <div className="grid flex-grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSensors.map((sensorKey, index) => (
              <SensorChart
                key={sensorKey}
                title={`Sensor ${index + 1}`}
                data={localSensorData}
                dataKey={sensorKey}
                color={sensorColors[sensorKey]}
              />
            ))}
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
  );
}