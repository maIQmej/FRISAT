
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Clock } from 'lucide-react';
import type { SensorDataPoint } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';

interface DataPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataPoint: SensorDataPoint | null;
  activeSensors: string[];
}

export function DataPointModal({ open, onOpenChange, dataPoint, activeSensors }: DataPointModalProps) {
  const { t } = useTranslation();

  if (!dataPoint) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dataPointModalTitle')}</DialogTitle>
          <DialogDescription>{t('dataPointModalDesc')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-3 rounded-md border p-4 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('dataPointTime')}</p>
              <p className="font-semibold text-lg">{dataPoint.time.toFixed(2)}s</p>
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
              {activeSensors.map(sensorKey => (
                <TableRow key={sensorKey}>
                  <TableCell className="font-medium">{t('sensor')} {parseInt(sensorKey.replace('sensor', ''))}</TableCell>
                  <TableCell className="text-right font-mono">{dataPoint[sensorKey]?.toFixed(2) ?? 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
