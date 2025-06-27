import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, Settings, CheckCircle, AlertCircle, Clock, Loader2, CloudUpload } from "lucide-react";

interface CsvBatch {
  id: string;
  filename: string;
  totalRows: number;
  processedRows: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function CSVUploader() {
  const [dragOver, setDragOver] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for batch status if we have an active batch
  const { data: batchStatus } = useQuery<CsvBatch>({
    queryKey: ["/api/csv/batch", currentBatchId],
    enabled: !!currentBatchId,
    refetchInterval: (data) => {
      // Stop polling if batch is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds while processing
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentBatchId(data.batchId);
      toast({
        title: "CSV Upload Started",
        description: `Processing ${data.totalRows} rows. You'll see progress below.`,
      });
      
      // Invalidate activities to show the upload activity
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.type === 'text/csv' || 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFile) {
      uploadMutation.mutate(csvFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Settings className="w-5 h-5 text-neural animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-accent" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-text-secondary" />;
    }
  };

  const progress = batchStatus ? (batchStatus.processedRows / batchStatus.totalRows) * 100 : 0;

  return (
    <Card className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-neural" />
          <span>Bulk CSV Processing</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-neural bg-neural bg-opacity-10'
              : 'border-surface-light hover:border-neural'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="w-16 h-16 bg-neural bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              {uploadMutation.isPending ? (
                <Loader2 className="w-8 h-8 text-neural animate-spin" />
              ) : (
                <CloudUpload className="w-8 h-8 text-neural" />
              )}
            </div>
            <div>
              <p className="text-text-primary font-medium">
                {uploadMutation.isPending ? 'Uploading...' : 'Drop your CSV file here'}
              </p>
              <p className="text-text-secondary text-sm">
                {uploadMutation.isPending ? 'Please wait...' : 'or click to browse'}
              </p>
            </div>
            <p className="text-xs text-text-secondary">
              Supports keyword lists, competitor analysis, content topics
            </p>
          </div>
        </div>
        
        {/* Processing Status */}
        {batchStatus && (
          <div className="mt-4 bg-dark p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(batchStatus.status)}
              <span className="text-sm font-medium">
                Processing: {batchStatus.filename}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>
                  {batchStatus.processedRows}/{batchStatus.totalRows} rows
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {batchStatus.status === 'processing' && (
                <p className="text-xs text-text-secondary">
                  Estimated time remaining: {Math.ceil((batchStatus.totalRows - batchStatus.processedRows) * 0.1)} seconds
                </p>
              )}
              
              {batchStatus.status === 'completed' && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-accent">
                    ✓ Processing completed successfully
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-surface-light hover:border-accent"
                  >
                    <i className="fas fa-download mr-1"></i>
                    Download Results
                  </Button>
                </div>
              )}
              
              {batchStatus.status === 'failed' && (
                <p className="text-xs text-red-500">
                  ✗ Processing failed. Please try again.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Help Text */}
        {!batchStatus && (
          <div className="mt-4 text-xs text-text-secondary space-y-1">
            <p>• <strong>Supported formats:</strong> CSV files with keyword columns</p>
            <p>• <strong>Processing:</strong> Automatic keyword research and clustering</p>
            <p>• <strong>Export:</strong> Download enriched data with SEO metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
