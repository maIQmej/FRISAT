
'use client';

import { useState, useEffect, useRef } from 'react';
import type { RegimenType } from '../lib/types';

const WEBSOCKET_URL = 'ws://localhost:8000/ws';

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
    const [lastPrediction, setLastPrediction] = useState<any | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const connect = () => {
        if (!enabled || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        setConnectionStatus('connecting');
        setError(null);
        ws.current = new WebSocket(WEBSOCKET_URL);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setConnectionStatus('connected');
            setError(null);
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }

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
                } else if (message.type === 'ACK') {
                    console.log('WebSocket config ACK:', message);
                } else if (message.type === 'FILLING') {
                    // console.log('WebSocket filling buffer:', message);
                } else if (message.type === 'ERROR') {
                    console.error('WebSocket server error:', message.msg);
                    setError(message.msg);
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('Connection failed.');
            setConnectionStatus('error');
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setConnectionStatus('disconnected');
            if (enabled) {
                // Attempt to reconnect
                if (!reconnectTimeout.current) {
                    reconnectTimeout.current = setTimeout(() => {
                        console.log('Attempting to reconnect WebSocket...');
                        connect();
                    }, 3000);
                }
            }
        };
    };

    useEffect(() => {
        if (enabled) {
            connect();
        }

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, n_sensors, hop]);
    
    const send = (data: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected. Cannot send data.');
        }
    };


    return { lastPrediction: {...lastPrediction, send}, connectionStatus, error };
};
