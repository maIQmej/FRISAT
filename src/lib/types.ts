import type { AnalyzeSensorDataOutput } from "@/ai/flows/analyze-sensor-data";

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

export type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export type AppContextType = {
  config: Configuration;
  setConfig: (config: Configuration) => void;
  sensorData: SensorDataPoint[];
  setSensorData: (data: SensorDataPoint[]) => void;
  acquisitionState: AcquisitionState;
  setAcquisitionState: (state: AcquisitionState) => void;
  analysisResult: AnalyzeSensorDataOutput | null;
  setAnalysisResult: (result: AnalyzeSensorDataOutput | null) => void;
  analysisState: AnalysisState;
  setAnalysisState: (state: AnalysisState) => void;
  resetApp: () => void;
};
