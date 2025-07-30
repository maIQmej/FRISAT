
'use server';

import type { SensorDataPoint, RegimenType } from '@/lib/types';

export async function predictRegime(data: SensorDataPoint[]): Promise<{ regimen: RegimenType; error?: string }> {
  // Python prediction logic has been removed.
  // Returning a default value.
  return Promise.resolve({ regimen: 'indeterminado' });
}
