
'use server';

import { spawn } from 'child_process';
import path from 'path';
import type { SensorDataPoint, RegimenType } from '@/lib/types';

export async function predictRegime(data: SensorDataPoint[]): Promise<{ regimen: RegimenType; error?: string }> {
  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
  const scriptPath = path.join(process.cwd(), 'src', 'python', 'Evaluacion.py');
  const dataString = JSON.stringify(data);

  return new Promise((resolve) => {
    // Añadido { shell: true } para mejorar la compatibilidad, especialmente en Windows
    const pythonProcess = spawn(pythonExecutable, [scriptPath], { shell: process.platform === 'win32' });

    let result = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = `El script de Python finalizó con el código ${code}: ${errorOutput}`;
        console.error(errorMessage);
        resolve({ regimen: 'indeterminado', error: errorMessage });
        return;
      }
      
      const prediction = result.trim() as RegimenType;
      
      if (['flujo laminar', 'turbulento', 'indeterminado'].includes(prediction)) {
        resolve({ regimen: prediction });
      } else {
          const errorMessage = `Valor de predicción inválido del script: "${prediction}"`;
          console.error(errorMessage);
          resolve({ regimen: 'indeterminado', error: errorMessage });
      }
    });
    
    pythonProcess.on('error', (err) => {
      const errorMessage = `No se pudo iniciar el script de Python: ${err.message}`;
      console.error(errorMessage);
      resolve({ regimen: 'indeterminado', error: errorMessage });
    });

    pythonProcess.stdin.write(dataString);
    pythonProcess.stdin.end();
  });
}
