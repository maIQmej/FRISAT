'use server';

import fs from 'fs/promises';
import path from 'path';

interface ExportFile {
  fileName: string;
  csvContent: string;
}

export async function saveExportedFiles(files: ExportFile[]) {
  try {
    const outputDir = path.join(process.cwd(), 'mediciones_guardadas');
    await fs.mkdir(outputDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(outputDir, file.fileName);
      await fs.writeFile(filePath, file.csvContent, 'utf-8');
    }

    return { success: true, message: 'Files saved successfully.' };
  } catch (error) {
    console.error('Failed to save exported files:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to save files: ${errorMessage}` };
  }
}
