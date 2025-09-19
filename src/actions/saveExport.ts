'use server';

interface MeasurementData {
  runId: string;
  rows: any[];
  header: string[];
  meta: any;
}

export async function saveMeasurementToDatabase(data: MeasurementData) {
  try {
    const response = await fetch(`http://127.0.0.1:8765/runs/${data.runId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rows: data.rows,
        header: data.header,
        meta: data.meta
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save measurement');
    }

    const result = await response.json();
    return { success: true, message: result.message || 'Measurement saved successfully.' };
  } catch (error) {
    console.error('Failed to save measurement to database:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to save measurement: ${errorMessage}` };
  }
}

export async function startMeasurementRun(metadata: any) {
  try {
    const response = await fetch('http://127.0.0.1:8765/runs/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start measurement run');
    }

    const result = await response.json();
    return { success: true, runId: result.run_id };
  } catch (error) {
    console.error('Failed to start measurement run:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to start measurement: ${errorMessage}` };
  }
}
