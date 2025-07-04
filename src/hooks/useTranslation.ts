
'use client';
import { useApp } from '@/context/AppContext';
import { translations } from '@/lib/i18n';
import type { RegimenType } from '@/lib/types';

export const useTranslation = () => {
  const { language } = useApp();

  const t = (key: string) => {
    return translations[language][key] || translations['es'][key] || key;
  };

  const t_regimen = (regimen: RegimenType) => {
    const keyMap: { [key in RegimenType]: string } = {
      'flujo laminar': 'regimenLaminar',
      'turbulento': 'regimenTurbulento',
      'indeterminado': 'regimenIndeterminado'
    };
    const key = keyMap[regimen];
    return t(key);
  }

  return { t, t_regimen };
};
