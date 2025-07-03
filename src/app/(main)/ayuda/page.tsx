'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpContent } from '@/components/app/HelpContent';

export default function AyudaPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Centro de Ayuda</CardTitle>
          <CardDescription>
            Encuentre respuestas a sus preguntas y aprenda a sacar el máximo provecho de SensorSync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpContent />
        </CardContent>
      </Card>
    </div>
  );
}
