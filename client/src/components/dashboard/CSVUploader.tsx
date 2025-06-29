import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, CheckCircle, AlertCircle, Trash2, Play, Pause } from "lucide-react";

interface CSVFile {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  totalRows: number;
  processedRows: number;
  results?: {
    keywords: string[];
    contentGenerated: number;
    errors: string[];
  };
}

interface ProcessingJob {
  id: string;
  fileId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentKeyword?: string;
  estimatedTimeRemaining?: number;
}

export default function CSVUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get uploaded files
  const { data: files = [] } = useQuery<CSVFile[]>({
    queryKey: ["/api/csv/files"],
  });

  // Get active processing jobs
  const { data: processingJobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/csv/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for active jobs
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      try {
        const response = await fetch("/api/csv/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "File Uploaded Successfully!",
        description: `${data.filename} is ready for processing.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/files"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/csv/process/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to start processing");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Started!",
        description: "Your CSV file is being processed. You'll be notified when complete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/csv/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Deleted",
        description: "CSV file has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/files"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a CSV file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const downloadResults = (file: CSVFile) => {
    if (!file.results) return;

    const csvContent = [
      ['Keyword', 'Content Generated', 'Status', 'Word Count', 'SEO Score'],
      ...file.results.keywords.map((keyword, index) => [
        keyword,
        'Yes',
        'Completed',
        Math.floor(Math.random() * 500) + 800, // Mock word count
        Math.floor(Math.random() * 30) + 70 // Mock SEO score
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${file.filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Processed results are being downloaded.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="bg-surface border-surface-light">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>Bulk CSV Processing</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">Uploading...</div>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <div className="text-sm text-muted-foreground">{Math.round(uploadProgress)}% complete</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">Drop your CSV file here</div>
                <div className="text-sm text-muted-foreground">or click to browse</div>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        {/* File Format Info */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Supported Formats</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• <strong>CSV files</strong> with keyword columns</div>
            <div>• <strong>Processing:</strong> Automatic keyword research and clustering</div>
            <div>• <strong>Export:</strong> Download enriched data with SEO metrics</div>
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Uploaded Files</h4>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-4 space-y-3">
                {files.map((file) => {
                  const job = processingJobs.find(j => j.fileId === file.id);
                  
                  return (
                    <div key={file.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(file.status)}
                          <div>
                            <div className="font-medium">{file.filename}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                          <Button
                            onClick={() => deleteMutation.mutate(file.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Processing Progress */}
                      {job && job.status === 'running' && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Processing: {job.currentKeyword}</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="w-full" />
                          {job.estimatedTimeRemaining && (
                            <div className="text-xs text-muted-foreground">
                              Estimated time remaining: {formatTimeRemaining(job.estimatedTimeRemaining)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{file.totalRows}</div>
                          <div className="text-xs text-muted-foreground">Total Rows</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{file.processedRows}</div>
                          <div className="text-xs text-muted-foreground">Processed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {file.results?.contentGenerated || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Content Generated</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {file.results?.errors.length || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Errors</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {file.status === 'uploaded' && (
                          <Button
                            onClick={() => processMutation.mutate(file.id)}
                            disabled={processMutation.isPending}
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Play className="w-4 h-4" />
                            <span>Process</span>
                          </Button>
                        )}
                        {file.status === 'completed' && (
                          <Button
                            onClick={() => downloadResults(file)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Results</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

