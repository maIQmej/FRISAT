'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Configuration } from '@/lib/types';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {FormProvider} from 'react-hook-form';

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
    path: ['sensor1'], // path to show error
  }),
});

export default function ConfiguracionPage() {
  const router = useRouter();
  const { config, setConfig, setAcquisitionState, resetApp } = useApp();
  
  const form = useForm<Configuration>({
    resolver: zodResolver(formSchema),
    defaultValues: config,
  });

  const onSubmit = (values: Configuration) => {
    setConfig(values);
    setAcquisitionState('running');
    router.push('/adquisicion');
  };
  
  const handleReset = () => {
    resetApp();
    form.reset(config);
    router.push('/configuracion');
  }

  return (
    <FormProvider {...form}>
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
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reiniciar
                </Button>
                <div className="flex gap-2">
                  <Button type="submit">Iniciar Adquisición</Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </FormProvider>
  );
}
