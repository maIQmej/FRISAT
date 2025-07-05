'use server';

import { spawn } from 'child_process';
import path from 'path';
import type { SensorDataPoint, RegimenType } from '@/lib/types';

export async function predictRegime(data: SensorDataPoint[]): Promise<RegimenType> {
  // Asegúrate de que Python está instalado en el entorno de ejecución.
  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3';
  const scriptPath = path.join(process.cwd(), 'src', 'python', 'predict.py');
  const dataString = JSON.stringify(data);

  return new Promise((resolve) => {
    const pythonProcess = spawn(pythonExecutable, [scriptPath]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${error}`);
        // Resuelve con 'indeterminado' en caso de error para no romper la UI
        resolve('indeterminado');
        return;
      }
      const prediction = result.trim() as RegimenType;
      // Valida que la predicción sea uno de los valores esperados
      if (['flujo laminar', 'turbulento', 'indeterminado'].includes(prediction)) {
        resolve(prediction);
      } else {
          console.error(`Invalid prediction value from script: ${prediction}`);
          resolve('indeterminado');
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python script:', err);
      resolve('indeterminado');
    });

    pythonProcess.stdin.write(dataString);
    pythonProcess.stdin.end();
  });
}
