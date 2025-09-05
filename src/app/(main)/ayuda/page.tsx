

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { HelpContent } from '../../../components/app/HelpContent';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../hooks/useTranslation';

export default function AyudaPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('helpCenterTitle')}</CardTitle>
              <CardDescription>{t('helpCenterDesc')}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToHome')}
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

    