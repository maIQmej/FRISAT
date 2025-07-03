'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SensorDataPoint } from '@/lib/types';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface SensorChartProps {
  title: string;
  data: SensorDataPoint[];
  dataKey: string;
  color: string;
}

export function SensorChart({ title, data, dataKey, color }: SensorChartProps) {
  const chartConfig = {
    value: {
      label: title,
      color: `hsl(${color})`,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
              content={<ChartTooltipContent indicator="line" labelKey="value" />}
            />
            <Area
              dataKey={dataKey}
              type="monotone"
              fill={`var(--color-value)`}
              fillOpacity={0.4}
              stroke={`var(--color-value)`}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
