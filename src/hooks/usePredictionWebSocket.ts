
'use client';

import { useState, useEffect, useRef } from 'react';
import type { RegimenType } from '../lib/types';

const WEBSOCKET_URL = 'ws://127.0.0.1:8765/ws';

export type Prediction = {
    label: RegimenType;
    probs: number[];
    window: number;
};

type UsePredictionWebSocketProps = {
    n_sensors: number;
    hop: number;
    enabled?: boolean;
};

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const simulatedRegimens: RegimenType[] = ['LAMINAR', 'TRANSITION', 'TURBULENT'];

export const usePredictionWebSocket = ({ n_sensors, hop, enabled = true }: UsePredictionWebSocketProps) => {
    const [lastPrediction, setLastPrediction] = useState<any | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
    const [error, setError] = useState<string | null>(null);
    const simulationInterval = useRef<NodeJS.Timeout | null>(null);
    const regimenIndex = useRef(0);

    useEffect(() => {
        if (enabled) {
            setConnectionStatus('connected');
            simulationInterval.current = setInterval(() => {
                const newPrediction = {
                    type: 'PREDICTION',
                    label: simulatedRegimens[regimenIndex.current],
                    probs: [0, 0, 0], // Dummy probabilities
                    window: 350
                };
                setLastPrediction(newPrediction);
                regimenIndex.current = (regimenIndex.current + 1) % simulatedRegimens.length;
            }, 3000);
        } else {
            if (simulationInterval.current) {
                clearInterval(simulationInterval.current);
            }
            setConnectionStatus('disconnected');
        }

        return () => {
            if (simulationInterval.current) {
                clearInterval(simulationInterval.current);
            }
        };
    }, [enabled]);
    
    // The send function is now a no-op, but we keep it for API consistency
    const send = (data: any) => {
        // console.log('Simulating send of:', data);
    };

    return { lastPrediction: {...lastPrediction, send}, connectionStatus, error };
};
