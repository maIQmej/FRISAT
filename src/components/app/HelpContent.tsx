'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function HelpContent() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>¿Qué es SensorSync?</AccordionTrigger>
        <AccordionContent>
          SensorSync es un sistema avanzado de adquisición de datos diseñado para monitorear, registrar y analizar información de múltiples sensores en tiempo real. Permite configurar mediciones, visualizar datos en vivo y exportarlos para su posterior análisis.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Guía Rápida de Uso</AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Configuración:</strong> Vaya a la pestaña 'Configuración'. Establezca el tiempo de adquisición, las muestras por segundo, un nombre para el archivo y seleccione los sensores que desea usar.
            </li>
            <li>
              <strong>Adquisición:</strong> Presione 'Iniciar Adquisición'. Será llevado a la pantalla de monitoreo donde verá los datos de los sensores en gráficos en tiempo real.
            </li>
            <li>
              <strong>Post-Test:</strong> Una vez finalizada la adquisición, verá un resumen. Desde aquí puede optar por exportar los datos o iniciar una nueva configuración.
            </li>
            <li>
              <strong>Exportación:</strong> Use la pestaña correspondiente para exportar los datos en formato Excel a través de WiFi o USB.
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Preguntas Frecuentes (FAQ)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <h4 className="font-semibold">¿Qué formato usan los datos exportados?</h4>
            <p className="text-muted-foreground">
              Los datos se exportan en formato .xlsx (Microsoft Excel) para facilitar su manejo y análisis en software de hojas de cálculo estándar.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">¿Qué significan 'Muestras por segundo'?</h4>
            <p className="text-muted-foreground">
              También conocido como frecuencia de muestreo (medido en Hertz, Hz), determina cuántos puntos de datos se registran por cada segundo. Un valor más alto proporciona una resolución temporal mayor, pero genera archivos más grandes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">¿Puedo detener una adquisición antes de que termine?</h4>
            <p className="text-muted-foreground">
              Sí, en la pantalla de 'Adquisición', puede presionar el botón 'Detener Adquisición' en cualquier momento. Los datos recolectados hasta ese punto se guardarán y podrá proceder a la pantalla de post-test.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
