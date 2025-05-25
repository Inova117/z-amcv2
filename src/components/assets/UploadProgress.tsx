import React from 'react';
import { AssetUpload } from '@/types/asset';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface UploadProgressProps {
  uploads: AssetUpload[];
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ uploads }) => {
  const getStatusIcon = (status: AssetUpload['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <Upload className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: AssetUpload['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (uploads.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Upload Progress</h3>
        <Badge variant="secondary">
          {uploads.filter(u => u.status === 'completed').length}/{uploads.length} completed
        </Badge>
      </div>

      <div className="space-y-2">
        {uploads.map((upload, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            {getStatusIcon(upload.status)}
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{upload.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${getStatusColor(upload.status)}`}>
                  {upload.status.replace('_', ' ')}
                </Badge>
                {upload.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">
                    {upload.progress}%
                  </span>
                )}
              </div>
            </div>

            {upload.status === 'uploading' && (
              <div className="w-24">
                <Progress value={upload.progress} className="h-2" />
              </div>
            )}

            {upload.error && (
              <span className="text-xs text-red-600 max-w-32 truncate">
                {upload.error}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 