'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Lightbulb, Link, ListChecks } from 'lucide-react';
import type { AnalyzeSensorDataOutput } from '@/ai/flows/analyze-sensor-data';

interface AnalysisResultProps {
  result: AnalyzeSensorDataOutput;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ListChecks className="h-6 w-6 text-primary" />
          <CardTitle>Resumen del Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      {result.anomalies && result.anomalies.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Anomalías Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Tiempo (s)</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.anomalies.map((anomaly, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{anomaly.sensor}</TableCell>
                    <TableCell>{anomaly.time}</TableCell>
                    <TableCell>{anomaly.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {result.correlations && result.correlations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Link className="h-6 w-6 text-blue-500" />
            <CardTitle>Correlaciones Encontradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensores</TableHead>
                  <TableHead>Descripción de la Correlación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.correlations.map((corr, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{corr.sensors.join(', ')}</TableCell>
                    <TableCell>{corr.correlation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          <CardTitle>Perspectivas Predictivas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.predictiveInsights}</p>
        </CardContent>
      </Card>
    </div>
  );
}
