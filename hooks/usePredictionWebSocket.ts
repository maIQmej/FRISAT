
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

export const usePredictionWebSocket = ({ n_sensors, hop, enabled = true }: UsePredictionWebSocketProps) => {
    const [lastPrediction, setLastPrediction] = useState<Prediction | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    
    const connect = useCallback(() => {
        if (!enabled || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        setConnectionStatus('connecting');
        setError(null);
        
        ws.current = new WebSocket(WEBSOCKET_URL);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setConnectionStatus('connected');
            // Send config on connect
            ws.current?.send(JSON.stringify({
                type: 'CONFIG',
                n_sensors,
                hop
            }));
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'PREDICTION') {
                    setLastPrediction(message);
                } else if (message.type === 'ERROR') {
                    console.error('WebSocket server error:', message.msg);
                    setError(message.msg);
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
                setError('Invalid message from server');
            }
        };

        ws.current.onerror = (event) => {
            console.error('WebSocket error:', event);
            setError('Connection failed');
            setConnectionStatus('error');
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setConnectionStatus('disconnected');
            // Optional: try to reconnect
        };

    }, [enabled, n_sensors, hop]);

    useEffect(() => {
        if (enabled) {
            connect();
        } else {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [enabled, connect]);

    const send = useCallback((data: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    return { lastPrediction: {...(lastPrediction || {}), send}, connectionStatus, error };
};
