import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../actions/getHistory';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching history from API...');
      const response = await fetch('http://127.0.0.1:8765/historial', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      const runs = data.runs || [];
      
      // Ordenar por fecha de creación (más reciente primero)
      const sortedRuns = [...runs].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Convertir formato de la API al formato esperado por el frontend
      const historyEntries: HistoryEntry[] = sortedRuns.map((run: any) => ({
        id: run.id,
        fileName: run.file_name && typeof run.file_name === 'string' && run.file_name.trim() !== ''
          ? run.file_name
          : run.id.substring(0, 8),
        date: run.created_at,
        duration: `${run.duration_sec}s`,
        sensors: Array.isArray(run.sensors) ? run.sensors.length : 0,
        regimen: run.preview?.dominant_regimen || 'indeterminado',
        samplesPerSecond: run.sampling_hz,
        totalSamples: run.rows || 0,
        status: run.status || 'completed'
      }));
      
      console.log('Processed history entries:', historyEntries);
      setHistory(historyEntries);
    } catch (err) {
      console.error('Failed to fetch history from API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar el historial al montar el componente y cuando cambie lastUpdated
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, lastUpdated]);

  // Efecto para escuchar eventos de actualización
  useEffect(() => {
    const handleHistoryUpdate = () => {
      console.log('Evento de actualización de historial recibido');
      setLastUpdated(Date.now());
    };

    window.addEventListener('historyUpdate', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('historyUpdate', handleHistoryUpdate);
    };
  }, []);

  // Función para forzar la actualización del historial
  const refetch = useCallback(() => {
    console.log('Forzando actualización del historial...');
    setLastUpdated(Date.now());
    return fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch,
    lastUpdated
  };
}
