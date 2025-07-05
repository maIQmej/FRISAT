import type { Configuration, SensorDataPoint, RegimenType } from './types';

export const generateCsvContent = (
    config: Configuration,
    sensorData: SensorDataPoint[],
    startTimestamp: Date | null,
    t: (key: string) => string,
    regimen?: RegimenType
) => {
    let csv = '\uFEFF';

    const activeSensors = Object.entries(config.sensors)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key);

    const testStats = activeSensors.map((key) => {
        const values = sensorData.map(p => p[key]).filter((v): v is number => typeof v === 'number' && isFinite(v));
        if (values.length < 2) {
            return { key, label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`, mean: "N/A", stdDev: "N/A", min: "N/A", max: "N/A" };
        }
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / count;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (count > 1 ? count - 1 : 1));
        return { key, label: `${t('sensor')} ${parseInt(key.replace('sensor', ''))}`, mean: mean.toFixed(2), stdDev: stdDev.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
    });

    csv += `"${t('testSummary')}"\n`;
    csv += `"${t('parameter')}","${t('value')}"\n`;
    csv += `"${t('fileNameLabel')}","${config.fileName}.csv"\n`;
    if (startTimestamp) {
        csv += `"startTime","${startTimestamp.toISOString()}"\n`;
    }
    csv += `"durationLabel","${sensorData.at(-1)?.time.toFixed(2) || '0'}s"\n`;
    csv += `"samplesPerSecondLabel","${config.samplesPerSecond} Hz"\n`;
    csv += `"totalSamples","${sensorData.length * activeSensors.length}"\n`;
    if (regimen) {
      csv += `"dominantRegimen","${regimen}"\n`;
    }
    csv += '\n';

    csv += `"${t('testStatistics')}"\n`;
    const statHeaders = [t('sensor'), t('statMean'), t('statStdDev'), t('statMin'), t('statMax')];
    csv += `${statHeaders.map(h => `"${h}"`).join(',')}\n`;
    testStats.forEach(stat => {
        const row = [`"${stat.label}"`, `"${stat.mean}"`, `"${stat.stdDev}"`, `"${stat.min}"`, `"${stat.max}"`];
        csv += `${row.join(',')}\n`;
    });
    csv += '\n';
    
    const dataHeaders = ['time', ...activeSensors, 'regimen'];
    csv += `"#RAW_HEADERS",${dataHeaders.join(',')}\n`;

    csv += `"${t('collectedData')}"\n`;
    const displayHeaders = [`"${t('sampleNumber')}"`, `"${t('time')}"`, ...activeSensors.map(h => `"${t('sensor')} ${h.replace('sensor', '')}"`), `"${t('flowRegime')}"`];
    csv += `${displayHeaders.join(',')}\n`;

    sensorData.forEach((point, index) => {
        const rowData = dataHeaders.map(header => {
            const value = point[header];
            if (typeof value === 'number') {
                return value.toFixed(2);
            }
            return `"${value ?? ''}"`;
        });
        const fullRow = [index + 1, ...rowData];
        csv += `${fullRow.join(',')}\n`;
    });

    return csv;
};
