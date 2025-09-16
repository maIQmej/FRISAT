
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Prediction } from '../../hooks/usePredictionWebSocket';
import { useTranslation } from '../../hooks/useTranslation';
import { Wind } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RegimenType } from '../../lib/types';

interface PredictionCardProps {
  prediction: Prediction | null;
  connectionStatus: string;
  wsError: string | null;
}

const LABELS: RegimenType[] = ['LAMINAR', 'TRANSITION', 'TURBULENT'];

export function PredictionCard({ prediction, connectionStatus, wsError }: PredictionCardProps) {
  const { t, t_regimen } = useTranslation();

  if (!prediction?.label) {
    return (
        <Card className="flex flex-col items-center justify-center min-h-[240px]">
             <CardHeader className="flex flex-col items-center justify-center p-4 text-center">
                <Wind className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">{t('flowRegime')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
                <p className="text-2xl font-bold capitalize">{t_regimen('indeterminado')}</p>
                <div className='text-center mt-2'>
                    <span className={cn('text-xs px-2 py-1 rounded-full', {
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': connectionStatus === 'connecting',
                        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': connectionStatus === 'connected',
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300': connectionStatus === 'disconnected',
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': connectionStatus === 'error',
                    })}>
                    {t(connectionStatus)}
                    </span>
                    {wsError && <p className='text-xs text-destructive mt-1'>{wsError}</p>}
                </div>
            </CardContent>
        </Card>
    );
  }

  const formattedProbs = (prediction.probs || []).map((prob, index) => ({
    label: LABELS[index],
    value: prob * 100,
  }));

  const dominantRegimen = prediction.label;

  return (
    <Card className="min-h-[240px]">
      <CardHeader className="pb-2">
        <CardTitle>Predicción: {t_regimen(dominantRegimen)}</CardTitle>
        <CardDescription>Ventana: {prediction.window}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {formattedProbs.map(({ label, value }) => (
            <li key={label} className="flex items-center justify-between text-sm">
              <span className={cn("font-medium", label === dominantRegimen ? "text-primary" : "text-muted-foreground")}>
                {t_regimen(label)}
              </span>
              <div className="flex items-baseline">
                <span className={cn("font-semibold font-mono", label === dominantRegimen ? "text-foreground" : "text-muted-foreground")}>
                  {value.toFixed(2)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
