'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { suggestAcquisitionParameters } from '@/ai/flows/suggest-acquisition-parameters';
import type { Configuration } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AIAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistDialog({ open, onOpenChange }: AIAssistDialogProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setValue } = useFormContext<Configuration>();
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, ingrese una descripción del experimento.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await suggestAcquisitionParameters({ experimentDescription: description });
      setValue('acquisitionTime', result.acquisitionTime, { shouldValidate: true });
      setValue('samplesPerSecond', result.samplesPerSecond, { shouldValidate: true });
      
      const sensorKeys: (keyof Configuration['sensors'])[] = ['sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5'];
      sensorKeys.forEach(key => {
        setValue(`sensors.${key}`, result.sensorSelection.includes(key));
      });

      toast({
        title: 'Sugerencia Exitosa',
        description: 'Los parámetros han sido actualizados con la sugerencia de la IA.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        title: 'Error de IA',
        description: 'No se pudieron obtener las sugerencias. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asistente de Configuración IA</DialogTitle>
          <DialogDescription>
            Describa su experimento o proceso y la IA sugerirá los parámetros de adquisición óptimos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="description"
            placeholder="Ej: Monitoreo de vibraciones en un motor durante 5 minutos para detectar fallos."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSuggest} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Obtener Sugerencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
