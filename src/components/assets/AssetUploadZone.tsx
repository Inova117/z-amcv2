import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAssetOperations } from '@/hooks/useAssetOperations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AssetUploadZoneProps {
  onClose: () => void;
  folderId?: string;
}

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const AssetUploadZone: React.FC<AssetUploadZoneProps> = ({
  onClose,
  folderId,
}) => {
  const { uploadAsset } = useAssetOperations();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      status: 'pending',
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.aac'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.csv'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const startUpload = async () => {
    setIsUploading(true);
    
    for (const file of uploadFiles) {
      if (file.status === 'pending') {
        try {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'uploading' } : f
          ));
          
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 20) {
            setUploadFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ));
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          await uploadAsset(file, folderId);
          
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
          ));
        } catch (error) {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error', 
              error: 'Upload failed' 
            } : f
          ));
        }
      }
    }
    
    setIsUploading(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (file.type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedUploads = uploadFiles.filter(f => f.status === 'completed').length;
  const totalFiles = uploadFiles.length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Assets</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports images, videos, audio, and documents up to 100MB
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Files to Upload ({uploadFiles.length})</h3>
                {completedUploads > 0 && (
                  <Badge variant="secondary">
                    {completedUploads}/{totalFiles} completed
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <div className="w-20">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                      
                      {getStatusIcon(file.status)}
                      
                      {file.status === 'error' && file.error && (
                        <span className="text-xs text-red-600">{file.error}</span>
                      )}
                      
                      {file.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {uploadFiles.length > 0 && (
              <span>
                {uploadFiles.filter(f => f.status === 'pending').length} files ready to upload
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              {completedUploads === totalFiles && totalFiles > 0 ? 'Done' : 'Cancel'}
            </Button>
            
            {uploadFiles.some(f => f.status === 'pending') && (
              <Button 
                onClick={startUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 