

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '../ui/table';
import { Clock, Hash } from 'lucide-react';
import type { SensorDataPoint } from '../../lib/types';
import { useTranslation } from '../../hooks/useTranslation';

interface DataPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataPoint: SensorDataPoint | null;
  dataPointIndex: number | null;
  activeSensors: string[];
}

export function DataPointModal({ open, onOpenChange, dataPoint, dataPointIndex, activeSensors }: DataPointModalProps) {
  const { t } = useTranslation();

  if (!dataPoint || dataPointIndex === null) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{t('dataPointModalTitle')}</DialogTitle>
          <DialogDescription>{t('dataPointModalDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center space-x-3 rounded-md border p-4">
                <Hash className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('sampleNumber')}</p>
                  <p className="font-semibold text-lg">{dataPointIndex + 1}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-4">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('dataPointTime')}</p>
                  <p className="font-semibold text-lg">{dataPoint.time.toFixed(2)}s</p>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sensor')}</TableHead>
                  <TableHead className="text-right">{t('dataPointValue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSensors.map(sensorKey => {
                  const sensorValue = dataPoint[sensorKey];
                  return (
                    <TableRow key={sensorKey}>
                      <TableCell className="font-medium">{t('sensor')} {parseInt(sensorKey.replace('sensor', ''))}</TableCell>
                      <TableCell className="text-right font-mono">
                        {typeof sensorValue === 'number' ? sensorValue.toFixed(2) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter className="p-6 border-t bg-secondary/40 sm:justify-start">
          <Button onClick={() => onOpenChange(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    