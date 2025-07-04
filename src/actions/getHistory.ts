
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { RegimenType, SensorDataPoint } from '@/lib/types';

export interface HistoryEntry {
  id: string; // filename will be the id
  fileName: string;
  date: string; // ISO String
  duration: string;
  sensors: number;
  regimen: RegimenType;
  samplesPerSecond: number;
}

export interface HistoryDetail extends HistoryEntry {
    sensorData: SensorDataPoint[];
}

const parseCsvFile = async (filePath: string, fileName: string): Promise<HistoryDetail | null> => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let date = '';
        let duration = '0s';
        let samplesPerSecond = 0;
        let dataHeaders: string[] = [];
        let dominantRegimen: RegimenType = 'indeterminado';

        const metadataLines = lines.slice(0, 20);
        for (const line of metadataLines) {
            const cleanedLine = line.trim().replace(/"/g, '');
            if (!cleanedLine) continue;
            
            const parts = cleanedLine.split(',');

            if (parts[0] === 'startTime') {
                date = parts[1];
            } else if (parts[0] === 'durationLabel') {
                duration = parts[1];
            } else if (parts[0] === 'samplesPerSecondLabel') {
                samplesPerSecond = parseInt(parts[1]?.split(' ')[0] || '0', 10);
            } else if (parts[0] === '#RAW_HEADERS') {
                dataHeaders = parts.slice(1);
            } else if (parts[0] === 'dominantRegimen') {
                dominantRegimen = parts[1] as RegimenType;
            }
        }
        
        if (dataHeaders.length === 0) {
            console.warn("Could not find #RAW_HEADERS in", fileName);
            return null;
        }

        const sensorData: SensorDataPoint[] = [];
        const regimenCounts: { [key in RegimenType]?: number } = {};
        let inDataSection = false;
        
        for (const line of lines) {
            if (line.includes('"collectedData"')) {
                inDataSection = true;
                continue;
            }
            if (!inDataSection) continue;
            
            const cleanedLine = line.trim();
            if (!cleanedLine || cleanedLine.toLowerCase().includes('sample number') || cleanedLine.toLowerCase().includes('nº de muestra')) continue;
            
            const parts = cleanedLine.replace(/"/g, '').split(',');
            if (parts.length < dataHeaders.length + 1) continue;

            const point: SensorDataPoint = { time: 0 };
            dataHeaders.forEach((header, index) => {
                const value = parts[index + 1];
                if (header === 'time') {
                    point.time = parseFloat(value);
                } else if (header.startsWith('sensor')) {
                    point[header] = parseFloat(value);
                } else if (header === 'regimen') {
                    const regimenValue = (value as RegimenType) || 'indeterminado';
                    point.regimen = regimenValue;
                    if (!regimenCounts[regimenValue]) regimenCounts[regimenValue] = 0;
                    regimenCounts[regimenValue]!++;
                }
            });
            sensorData.push(point);
        }

        // Only calculate if not found in metadata
        if (dominantRegimen === 'indeterminado' && Object.keys(regimenCounts).length > 0) {
            dominantRegimen = Object.entries(regimenCounts).reduce((a, b) => (b[1]! > a[1]! ? b : a))[0] as RegimenType;
        }
        
        const activeSensorsCount = dataHeaders.filter(h => h.startsWith('sensor')).length;
        const cleanFileName = fileName.replace('.csv', '');

        return {
            id: fileName,
            fileName: cleanFileName,
            date,
            duration,
            sensors: activeSensorsCount,
            regimen: dominantRegimen,
            samplesPerSecond,
            sensorData
        };

    } catch (error) {
        console.error(`Failed to parse file ${fileName}:`, error);
        return null;
    }
}


export async function getHistory(): Promise<HistoryEntry[]> {
  const outputDir = path.join(process.cwd(), 'mediciones_guardadas');
  try {
    await fs.access(outputDir);
  } catch (error) {
    return [];
  }

  const files = await fs.readdir(outputDir);
  const csvFiles = files.filter(file => file.endsWith('.csv'));

  const historyPromises = csvFiles.map(file => {
    const filePath = path.join(outputDir, file);
    return parseCsvFile(filePath, file);
  });
  
  const historyEntries = (await Promise.all(historyPromises))
    .filter((entry): entry is HistoryDetail => entry !== null)
    .map(({ sensorData, ...entry }) => entry);
  
  historyEntries.sort((a, b) => {
    try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
        return 0;
    }
  });
  
  return historyEntries;
}

export async function getHistoryEntry(fileName: string): Promise<HistoryDetail | null> {
    const outputDir = path.join(process.cwd(), 'mediciones_guardadas');
    const filePath = path.join(outputDir, fileName);

    try {
        await fs.access(filePath);
        return await parseCsvFile(filePath, fileName);
    } catch (error) {
        console.error(`File not found or could not be read: ${fileName}`, error);
        return null;
    }
}
