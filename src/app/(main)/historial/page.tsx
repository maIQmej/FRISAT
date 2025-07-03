'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

const mockHistory = [
  { id: 1, fileName: 'prueba_motor_caliente', date: '2024-07-29 10:30', duration: '60s', sensors: 3, regimen: 'turbulento' },
  { id: 2, fileName: 'test_flujo_laminar_01', date: '2024-07-29 09:15', duration: '30s', sensors: 2, regimen: 'flujo laminar' },
  { id: 3, fileName: 'medicion_valvula_fria', date: '2024-07-28 15:00', duration: '120s', sensors: 5, regimen: 'en la frontera' },
  { id: 4, fileName: 'ensayo_largo_duracion', date: '2024-07-28 11:45', duration: '300s', sensors: 4, regimen: 'turbulento' },
];

export default function HistorialPage() {
  return (
    <div className="container mx-auto max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pruebas</CardTitle>
          <CardDescription>
            Explore y administre todas las mediciones realizadas anteriormente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Archivo</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-center">Sensores</TableHead>
                <TableHead>Régimen Detectado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.fileName}</TableCell>
                  <TableCell>{test.date}</TableCell>
                  <TableCell>{test.duration}</TableCell>
                  <TableCell className="text-center">{test.sensors}</TableCell>
                  <TableCell>
                    <Badge variant={
                      test.regimen === 'flujo laminar' ? 'default' : 
                      test.regimen === 'turbulento' ? 'destructive' : 'secondary'
                    } className="capitalize">{test.regimen}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalles</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
