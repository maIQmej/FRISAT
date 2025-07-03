'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Settings, BrainCircuit, HelpCircle, HardDrive, LineChart, TestTube, FileText, Bot } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const Logo = () => (
  <div className="flex items-center gap-2 p-2">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary">
        <rect width="256" height="256" fill="none"></rect>
        <path d="M48,88H72a32,32,0,0,1,0,64H48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="M104,168H80a32,32,0,0,1,0-64h48a32,32,0,0,0,0-64H104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <line x1="88" y1="208" x2="88" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
        <line x1="128" y1="88" x2="128" y2="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
        <path d="M208,88H184a32,32,0,0,0,0,64h24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
    </svg>
    <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
        SensorSync
    </h1>
  </div>
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { acquisitionState } = useApp();

  const navItems = [
    { href: '/configuracion', icon: Settings, label: 'Configuración', states: ['configuring', 'stopped', 'completed'] },
    { href: '/adquisicion', icon: LineChart, label: 'Adquisición', states: ['running'] },
    { href: '/post-test', icon: TestTube, label: 'Resultados', states: ['stopped', 'completed'] },
    { href: '/analisis', icon: BrainCircuit, label: 'Análisis IA', states: ['configuring', 'stopped', 'completed'] },
    { href: '/exportacion', icon: HardDrive, label: 'Exportación', states: ['completed'] },
    { href: '/ayuda', icon: HelpCircle, label: 'Ayuda', states: ['configuring', 'running', 'stopped', 'completed'] },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    disabled={!item.states.includes(acquisitionState)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold md:text-xl">
            {navItems.find(item => item.href === pathname)?.label || 'SensorSync'}
          </h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bot className="h-5 w-5" />
            <span className="sr-only">AI Assistant</span>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
