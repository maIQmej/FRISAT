'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, History, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/app/ThemeToggle';
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher';

const Logo = () => (
    <div className="flex items-center justify-center gap-2 p-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-12 w-12 text-primary">
          <rect width="256" height="256" fill="none"></rect>
          <path d="M48,88H72a32,32,0,0,1,0,64H48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
          <path d="M104,168H80a32,32,0,0,1,0-64h48a32,32,0,0,0,0-64H104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
          <line x1="88" y1="208" x2="88" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
          <line x1="128" y1="88" x2="128" y2="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
          <path d="M208,88H184a32,32,0,0,0,0,64h24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
      </svg>
    </div>
  );

export default function WelcomePage() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/back2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-background opacity-80" />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 [&_button]:text-white [&_button:hover]:bg-white/20 [&_button:hover]:text-white [&_svg]:h-6 [&_svg]:w-6">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <Card className="relative z-10 w-full max-w-2xl text-center shadow-2xl">
        <CardHeader className="items-center p-8">
          <Logo />
          <CardTitle className="mt-4 text-4xl font-bold">{t('welcomeTitle')}</CardTitle>
          <CardDescription className="max-w-lg pt-2 text-base text-muted-foreground">
            {t('welcomeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-8 pt-0 sm:grid-cols-3">
          <Link href="/configuracion" asChild>
            <Button size="lg" className="h-24 w-full flex-col text-lg">
              <PlayCircle className="mb-2 h-7 w-7" />
              <span>{t('newTest')}</span>
            </Button>
          </Link>
          <Link href="/historial" asChild>
            <Button size="lg" variant="secondary" className="h-24 w-full flex-col text-lg">
              <History className="mb-2 h-7 w-7" />
              <span>{t('history')}</span>
            </Button>
          </Link>
          <Link href="/ayuda" asChild>
            <Button size="lg" variant="secondary" className="h-24 w-full flex-col text-lg">
              <HelpCircle className="mb-2 h-7 w-7" />
              <span>{t('help')}</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
