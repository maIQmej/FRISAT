'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { HardDrive, RotateCw, Sigma, Timer, FileText, Wind, Database, Clock } from 'lucide-react';
import type { Configuration, SensorDataPoint, RegimenType } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Configuration;
  sensorData: SensorDataPoint[];
  regimen: RegimenType;
  onTriggerExport: () => void;
  startTimestamp: Date | null;
}

export function ResultsModal({ open, onOpenChange, config, sensorData, regimen, onTriggerExport, startTimestamp }: ResultsModalProps) {
  const router = useRouter();
  const { resetApp, acquisitionState, language } = useApp();
  const { t, t_regimen } = useTranslation();

  const totalPlannedSamples = Math.floor(config.acquisitionTime * config.samplesPerSecond) + 1;

  const activeSensors = useMemo(() => 
    Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key), 
  [config.sensors]);
  
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

  const handleNewTest = () => {
    onOpenChange(false);
    resetApp();
    router.push('/configuracion');
  };
  
  const handleDownload = () => {
    onTriggerExport();
  };

  const handleHistory = () => {
    onOpenChange(false);
    router.push('/historial');
  };

  const activeSensorsCount = activeSensors.length;
  const finalTime = sensorData.at(-1)?.time.toFixed(2) || '0.00';
  const formattedStartTime = startTimestamp ? startTimestamp.toLocaleString(language) : t('notAvailable');
  
  if (acquisitionState !== 'completed' && acquisitionState !== 'stopped') {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">{t('resultsTitle')}</DialogTitle>
          <DialogDescription>{t('resultsDesc')}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3 rounded-md border p-4 sm:col-span-2">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('fileNameLabel')}</p>
                  <p className="font-semibold">{config.fileName}.xlsx</p>
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
            
            <Separator />

            <div>
              <h3 className="text-lg font-medium">{t('testStatistics')}</h3>
              <p className="text-sm text-muted-foreground">{t('testStatisticsDesc')}</p>
              <Table className="mt-4">
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
            </div>

            <div className="text-center pt-4">
              <p className="text-lg">{t('whatNext')}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3 shrink-0 p-6 border-t">
          <Button variant="outline" onClick={handleNewTest}>
            <RotateCw className="mr-2 h-4 w-4" /> {t('newTest')}
          </Button>
          <Button variant="secondary" onClick={handleHistory}>
            <Database className="mr-2 h-4 w-4" /> {t('viewHistory')}
          </Button>
          <Button onClick={handleDownload}>
            <HardDrive className="mr-2 h-4 w-4" /> {t('downloadData')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
