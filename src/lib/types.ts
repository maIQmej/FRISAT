
import type { Dispatch, SetStateAction } from 'react';

export type RegimenType = 'flujo laminar' | 'turbulento' | 'en la frontera' | 'indeterminado';

export interface Configuration {
  acquisitionTime: number;
  samplesPerSecond: number;
  fileName: string;
  sensors: {
    sensor1: boolean;
    sensor2: boolean;
    sensor3: boolean;
    sensor4: boolean;
    sensor5: boolean;
  };
}

export type SensorDataPoint = {
  time: number;
  [key: string]: number;
};

export type AcquisitionState = 'idle' | 'configuring' | 'running' | 'stopped' | 'completed';

export type AppContextType = {
  config: Configuration;
  setConfig: Dispatch<SetStateAction<Configuration>>;
  sensorData: SensorDataPoint[];
  setSensorData: Dispatch<SetStateAction<SensorDataPoint[]>>;
  acquisitionState: AcquisitionState;
  setAcquisitionState: Dispatch<SetStateAction<AcquisitionState>>;
  resetApp: () => void;
  regimen: RegimenType;
  setRegimen: Dispatch<SetStateAction<RegimenType>>;
};
