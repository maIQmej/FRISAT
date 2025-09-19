'use client';

import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface DirectDownloadButtonProps {
  runId: string;
  fileName: string;
  className?: string;
}

export function DirectDownloadButton({ runId, fileName, className }: DirectDownloadButtonProps) {
  const { t } = useTranslation();

  const handleDownload = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8765/runs/${runId}/download`);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv.gz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {t('downloadData')}
    </Button>
  );
}
