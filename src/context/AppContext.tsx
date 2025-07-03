'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Configuration, SensorDataPoint, AcquisitionState, AppContextType, RegimenType } from '@/lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialConfig: Configuration = {
  acquisitionTime: 10,
  samplesPerSecond: 1,
  fileName: 'medicion_01',
  sensors: {
    sensor1: true,
    sensor2: true,
    sensor3: false,
    sensor4: false,
    sensor5: false,
  },
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Configuration>(initialConfig);
  const [sensorData, setSensorData] = useState<SensorDataPoint[]>([]);
  const [acquisitionState, setAcquisitionState] = useState<AcquisitionState>('configuring');
  const [regimen, setRegimen] = useState<RegimenType>('indeterminado');

  const resetApp = useCallback(() => {
    setConfig(initialConfig);
    setSensorData([]);
    setAcquisitionState('configuring');
    setRegimen('indeterminado');
  }, []);

  return (
    <AppContext.Provider
      value={{
        config,
        setConfig,
        sensorData,
        setSensorData,
        acquisitionState,
        setAcquisitionState,
        regimen,
        setRegimen,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
