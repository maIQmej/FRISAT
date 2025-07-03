'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SensorChart } from '@/components/app/SensorChart';
import type { SensorDataPoint } from '@/lib/types';

export default function AdquisicionPage() {
  const router = useRouter();
  const { config, setSensorData, setAcquisitionState, acquisitionState } = useApp();
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
    const totalSteps = config.acquisitionTime * config.samplesPerSecond;
    const intervalTime = 1000 / config.samplesPerSecond;

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
          return newTime;
        });
      }, intervalTime);
    };

    const generateDataPoint = (time: number): SensorDataPoint => {
      const point: SensorDataPoint = { time: parseFloat(time.toFixed(2)) };
      activeSensors.forEach(sensorKey => {
        point[sensorKey] = parseFloat((Math.random() * 5 + Math.sin(time * (activeSensors.indexOf(sensorKey) + 1))).toFixed(2));
      });
      return point;
    };
    
    setLocalSensorData([generateDataPoint(0)]);
    runAcquisition();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config, router, setAcquisitionState, setSensorData, activeSensors]);

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
    <div className="container mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adquisición en Proceso</CardTitle>
          <CardDescription>
            Monitoreando datos de sensores en tiempo real. Tiempo restante: {(config.acquisitionTime - elapsedTime).toFixed(1)}s
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <div className="text-center">
            <Button variant="destructive" onClick={handleStop}>Detener Adquisición</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {activeSensors.map((sensorKey, index) => (
          <SensorChart
            key={sensorKey}
            title={`Sensor ${index + 1}`}
            data={localSensorData}
            dataKey={sensorKey}
            color={sensorColors[sensorKey]}
          />
        ))}
      </div>
    </div>
  );
}
