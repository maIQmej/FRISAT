'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Configuration } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  acquisitionTime: z.coerce.number().min(1, 'Debe ser al menos 1 segundo').max(3600, 'No puede exceder 1 hora'),
  samplesPerSecond: z.coerce.number().min(1, 'Mínimo 1 muestra/s').max(1000, 'Máximo 1000 muestras/s'),
  fileName: z.string().min(1, 'El nombre es requerido').regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  sensors: z.object({
    sensor1: z.boolean(),
    sensor2: z.boolean(),
    sensor3: z.boolean(),
    sensor4: z.boolean(),
    sensor5: z.boolean(),
  }).refine(data => Object.values(data).some(v => v), {
    message: 'Debe seleccionar al menos un sensor.',
    path: ['sensor1'],
  }),
});

export default function ConfiguracionPage() {
  const router = useRouter();
  const { config, setConfig, setAcquisitionState, resetApp } = useApp();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<Configuration | null>(null);

  const form = useForm<Configuration>({
    resolver: zodResolver(formSchema),
    defaultValues: config,
  });

  const onSubmit = (values: Configuration) => {
    setPendingConfig(values);
    setIsConfirmModalOpen(true);
  };

  const handleStartAcquisition = () => {
    if (!pendingConfig) return;
    setConfig(pendingConfig);
    setAcquisitionState('running');
    router.push('/adquisicion');
  };
  
  const handleReset = () => {
    resetApp();
    form.reset(config);
    router.push('/configuracion');
  };

  const activeSensorsText = pendingConfig
    ? Object.entries(pendingConfig.sensors)
        .filter(([, isActive]) => isActive)
        .map(([key]) => `Sensor ${parseInt(key.replace('sensor', ''), 10)}`)
        .join(', ')
    : '';

  return (
    <>
      <div className="container mx-auto max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Adquisición</CardTitle>
                <CardDescription>
                  Defina los parámetros para la nueva medición.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="acquisitionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de adquisición (s)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej: 60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="samplesPerSecond"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Muestras por segundo (Hz)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej: 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del archivo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: prueba_motor_caliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <div>
                  <h3 className="text-lg font-medium">Selección de Sensores</h3>
                  <p className="text-sm text-muted-foreground">Active los sensores que desea monitorear.</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {(Object.keys(config.sensors) as Array<keyof typeof config.sensors>).map((sensorKey, index) => (
                      <FormField
                        key={sensorKey}
                        control={form.control}
                        name={`sensors.${sensorKey}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                             <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                             </FormControl>
                             <div className="space-y-1 leading-none">
                                <FormLabel>Sensor {index + 1}</FormLabel>
                             </div>
                           </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage>{form.formState.errors.sensors?.root?.message}</FormMessage>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleReset}>
                    Reiniciar
                  </Button>
                  <Button type="submit">Iniciar Adquisición</Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Confirmar Parámetros de la Prueba</DialogTitle>
            <DialogDescription>
              Por favor, verifique que los datos son correctos antes de iniciar.
            </DialogDescription>
          </DialogHeader>
          {pendingConfig && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                <Label className="text-muted-foreground">Tiempo de adquisición</Label>
                <p className="font-semibold">{pendingConfig.acquisitionTime} segundos</p>
              </div>
              <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                <Label className="text-muted-foreground">Muestras por segundo</Label>
                <p className="font-semibold">{pendingConfig.samplesPerSecond} Hz</p>
              </div>
              <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                <Label className="text-muted-foreground">Nombre del archivo</Label>
                <p className="font-semibold truncate">{pendingConfig.fileName}.xlsx</p>
              </div>
              <div className="grid grid-cols-[1fr,auto] items-start gap-4">
                <Label className="text-muted-foreground">Sensores Activos</Label>
                <p className="font-semibold text-right">{activeSensorsText || 'Ninguno'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleStartAcquisition}>Confirmar e Iniciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
