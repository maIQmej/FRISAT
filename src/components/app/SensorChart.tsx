
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SensorDataPoint } from '@/lib/types';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';
import { Separator } from '../ui/separator';

interface SensorChartProps {
  title: string;
  data: SensorDataPoint[];
  dataKeys: string[];
  colors: { [key: string]: string };
  onDrop: (sourceKey: string, targetKey: string) => void;
  onDoubleClick?: () => void;
}

export function SensorChart({ title, data, dataKeys, colors, onDrop, onDoubleClick }: SensorChartProps) {
  const { t } = useTranslation();
  
  const chartConfig = dataKeys.reduce((config, key) => {
    config[key] = {
      label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`,
      color: `hsl(var(--${colors[key]}))`,
    };
    return config;
  }, {} as any);
  
  const primaryKey = dataKeys[0];

  const stats = useMemo(() => {
    if (!data || data.length < 2 || dataKeys.length !== 1) {
      return null;
    }
    const key = dataKeys[0];
    const values = data.map(p => p[key]).filter((v): v is number => typeof v === 'number' && isFinite(v));

    if (values.length < 2) {
      return null;
    }

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Sample standard deviation
    const stdDev = Math.sqrt(
      values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (count - 1)
    );

    return {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
    };
  }, [data, dataKeys]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('sourceKey', primaryKey);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'border-2');
    const sourceKey = e.dataTransfer.getData('sourceKey');
    if (sourceKey && sourceKey !== primaryKey) {
      onDrop(sourceKey, primaryKey);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'border-2');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'border-2');
  };

  return (
    <Card 
      draggable 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDoubleClick={onDoubleClick}
      className="cursor-grab active:cursor-grabbing transition-all border-2 border-transparent flex flex-col"
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ChartContainer config={chartConfig} className="h-[160px] w-full flex-grow">
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {dataKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={`var(--color-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
              />
            ))}
          </AreaChart>
        </ChartContainer>

        {stats && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
                <h4 className="font-medium text-muted-foreground">{t('statistics')}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex justify-between"><span>{t('statMean')}:</span> <span className="font-semibold tabular-nums">{stats.mean}</span></div>
                    <div className="flex justify-between"><span>{t('statStdDev')}:</span> <span className="font-semibold tabular-nums">{stats.stdDev}</span></div>
                    <div className="flex justify-between"><span>{t('statMin')}:</span> <span className="font-semibold tabular-nums">{stats.min}</span></div>
                    <div className="flex justify-between"><span>{t('statMax')}:</span> <span className="font-semibold tabular-nums">{stats.max}</span></div>
                </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
