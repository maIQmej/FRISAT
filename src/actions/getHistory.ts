
'use server';

import type { RegimenType, SensorDataPoint } from '@/lib/types';

export interface HistoryEntry {
  id: string; // filename will be the id
  fileName: string;
  date: string; // ISO String
  duration: string;
  sensors: number;
  regimen: RegimenType;
  samplesPerSecond: number;
  totalSamples: number;
}

export interface HistoryDetail extends HistoryEntry {
    sensorData: SensorDataPoint[];
}

// Función para obtener datos de sensores desde la API
const getSensorDataFromAPI = async (runId: string): Promise<SensorDataPoint[]> => {
    try {
        const response = await fetch(`http://127.0.0.1:8765/runs/${runId}/download`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        
        // El archivo viene comprimido, necesitamos descomprimirlo
        const compressedData = await response.arrayBuffer();
        const decompressedData = await import('pako').then(pako => pako.inflate(new Uint8Array(compressedData), { to: 'string' }));
        
        const lines = decompressedData.split('\n');
        const sensorData: SensorDataPoint[] = [];
        let dataHeaders: string[] = [];
        let inDataSection = false;
        
        for (const line of lines) {
            const cleanedLine = line.trim().replace(/"/g, '');
            if (!cleanedLine) continue;
            
            const parts = cleanedLine.split(',');
            
            if (parts[0] === '#RAW_HEADERS') {
                dataHeaders = parts.slice(1);
            } else if (line.includes('"collectedData"')) {
                inDataSection = true;
                continue;
            }
            
            if (!inDataSection) continue;
            if (cleanedLine.toLowerCase().includes('sample number') || cleanedLine.toLowerCase().includes('nº de muestra')) continue;
            
            if (parts.length < dataHeaders.length + 1) continue;

            const point: SensorDataPoint = { time: 0 };
            dataHeaders.forEach((header, index) => {
                const value = parts[index + 1];
                if (header === 'time') {
                    point.time = parseFloat(value);
                } else if (header.startsWith('sensor')) {
                    point[header] = parseFloat(value);
                }
            });
            sensorData.push(point);
        }
        
        return sensorData;
    } catch (error) {
        console.error(`Failed to fetch sensor data for ${runId}:`, error);
        return [];
    }
}


export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    // Usar la URL completa para evitar problemas de CORS
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-url.com' 
      : 'http://127.0.0.1:8765';
    
    const response = await fetch(`${baseUrl}/historial`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data); // Debug log
    const runs = data.runs || [];
    
    // Convertir formato de la API al formato esperado por el frontend
    const historyEntries: HistoryEntry[] = runs.map((run: any) => ({
      id: run.id,
      fileName: run.id.substring(0, 8), // Usar primeros 8 caracteres del UUID
      date: run.created_at,
      duration: `${run.duration_sec}s`,
      sensors: run.sensors.length,
      regimen: run.preview?.dominant_regimen || 'indeterminado',
      samplesPerSecond: run.sampling_hz,
      totalSamples: run.rows
    }));
    
    console.log('Processed history entries:', historyEntries); // Debug log
    return historyEntries;
  } catch (error) {
    console.error('Failed to fetch history from API:', error);
    return [];
  }
}

export async function getHistoryEntry(runId: string): Promise<HistoryDetail | null> {
    try {
        // Obtener metadatos de la medición
        const response = await fetch(`http://127.0.0.1:8765/runs/${runId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch measurement details: ${response.statusText}`);
        }
        
        const run = await response.json();
        
        // Obtener datos de sensores
        const sensorData = await getSensorDataFromAPI(runId);
        
        // Convertir al formato esperado
        const historyDetail: HistoryDetail = {
            id: run.id,
            fileName: run.id.substring(0, 8),
            date: run.created_at,
            duration: `${run.duration_sec}s`,
            sensors: run.sensors.length,
            regimen: run.preview?.dominant_regimen || 'indeterminado',
            samplesPerSecond: run.sampling_hz,
            totalSamples: run.rows,
            sensorData
        };
        
        return historyDetail;
    } catch (error) {
        console.error(`Failed to fetch measurement details for ${runId}:`, error);
        return null;
    }
}
