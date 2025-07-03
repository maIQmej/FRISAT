'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpContent } from '@/components/app/HelpContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AyudaPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Centro de Ayuda</CardTitle>
              <CardDescription>
                Encuentre respuestas a sus preguntas y aprenda a sacar el máximo provecho de SensorSync.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <HelpContent />
        </CardContent>
      </Card>
    </div>
  );
}
