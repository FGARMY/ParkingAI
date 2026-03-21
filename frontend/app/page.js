"use client"
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { uploadMedia } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileVideo, Image as ImageIcon, X, CheckCircle2, FileCheck2, Loader2, AlertCircle } from 'lucide-react';

export default function UploadDetection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const { addToast } = useAppStore();
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const mutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: (data) => {
      setResults({
        empty: data.empty ?? 0,
        occupied: data.occupied ?? 0,
        total: data.total ?? (data.empty + data.occupied) ?? 0,
        boxes: data.boxes || [],
        classes: data.classes || []
      });
      addToast({
        title: 'Inference Complete',
        description: `Successfully analyzed file`,
        variant: 'default',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Upload Failed',
        description: error.message || 'Error processing media file',
        variant: 'destructive',
      });
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    const selected = acceptedFiles[0];
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        addToast({ title: 'File too large', description: 'Max file size is 50MB', variant: 'destructive' });
        return;
      }
      setFile(selected);
      setResults(null);
      const objectUrl = URL.createObjectURL(selected);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'video/mp4': [],
      'video/webm': [],
      'video/quicktime': []
    },
    maxFiles: 1,
    disabled: mutation.isPending || file !== null
  });

  const handleUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!file) return;
    mutation.mutate(file);
  };

  const clearFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFile(null);
    setPreview(null);
    setResults(null);
    mutation.reset();
  };

  // Draw bounding boxes when results change
  useEffect(() => {
    if (results && results.boxes && !results.videoUrl && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Match canvas size to displayed image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Calculate scale factors (natural vs displayed)
      const scaleX = img.width / img.naturalWidth;
      const scaleY = img.height / img.naturalHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      results.boxes.forEach((box, index) => {
        const cls = results.classes[index];
        const [x1, y1, x2, y2] = box;
        
        // Scale coordinates
        const scaledX1 = x1 * scaleX;
        const scaledY1 = y1 * scaleY;
        const scaledX2 = x2 * scaleX;
        const scaledY2 = y2 * scaleY;
        const width = scaledX2 - scaledX1;
        const height = scaledY2 - scaledY1;
        
        // Styling based on class (0 = empty = green, 1 = occupied = red)
        const isOccupied = cls === 1;
        ctx.strokeStyle = isOccupied ? '#ef4444' : '#22c55e'; // Tailwind red-500 : green-500
        ctx.lineWidth = 3;
        ctx.fillStyle = isOccupied ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        
        ctx.beginPath();
        ctx.rect(scaledX1, scaledY1, width, height);
        ctx.fillRect(scaledX1, scaledY1, width, height);
        ctx.stroke();
      });
    }
  }, [results, preview]);

  // Recalculate boxes on window resize
  useEffect(() => {
    const handleResize = () => {
      // Force a slight re-render update to fire the effect above
      if (results) {
        setResults({ ...results });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [results]);

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Batch Upload & Detection</h1>
        <p className="text-neutral-dark">Upload an image or video for YOLO parking inference</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-dashed border-2 bg-surface">
            <CardContent className="p-0">
              <div 
                {...getRootProps()} 
                className={`flex flex-col items-center justify-center min-h-[400px] p-8 text-center transition-colors
                  ${!file ? 'cursor-pointer' : ''}
                  ${isDragActive ? 'bg-primary/5 border-primary' : !file ? 'hover:bg-neutral/30' : ''}
                  ${isDragReject ? 'bg-danger/5 border-danger' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {!file ? (
                  <div className="space-y-4 pointer-events-none">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Click or drag & drop to upload</h3>
                      <p className="text-sm text-neutral-dark mb-4">PNG, JPG, or Video (max. 50MB)</p>
                    </div>
                    {isDragReject && (
                      <p className="text-sm font-medium text-danger flex items-center justify-center gap-1">
                        <AlertCircle className="h-4 w-4" /> File type not supported
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center">
                    {/* Preview Area */}
                    <div className="relative w-full max-w-lg rounded-lg overflow-hidden border border-border bg-black/5" onClick={(e) => e.stopPropagation()}>
                      
                      {/* Video Output OR Canvas Overlay for Image Boxes */}
                      {results && results.videoUrl ? (
                         <video 
                           src={results.videoUrl} 
                           className="w-full h-auto max-h-[60vh] object-contain block pointer-events-auto shadow-sm shadow-black/20"
                           controls 
                           autoPlay 
                           loop 
                           muted
                         />
                      ) : (
                        <>
                          {/* Show uploaded video preview if there are no results yet, or image preview */}
                          {file.type.startsWith('video/') ? (
                             <video 
                               src={preview} 
                               className="w-full h-auto object-contain block pointer-events-auto"
                               controls 
                             />
                          ) : (
                            <img 
                              ref={imageRef}
                              src={preview} 
                              alt="Preview" 
                              className="w-full h-auto object-contain block pointer-events-none" 
                              onLoad={() => {
                                // Trigger re-render to draw boxes if results already exist
                                if (results) setResults({...results});
                              }}
                            />
                          )}
                          
                          {/* Canvas Overlay for Image Boxes */}
                          {results && !results.videoUrl && !file.type.startsWith('video/') && (
                            <canvas 
                              ref={canvasRef}
                              className="absolute top-0 left-0 pointer-events-none"
                            />
                          )}
                        </>
                      )}
                      
                      {!mutation.isPending && !results && (
                        <button 
                          type="button"
                          onClick={clearFile}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Processing overlay */}
                      {mutation.isPending && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                          <h4 className="font-semibold text-lg">Running Inference...</h4>
                        </div>
                      )}

                      {results && (
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-success text-white border border-success/20">Analysis Complete</Badge>
                        </div>
                      )}
                    </div>
                    
                    {!results && (
                      <div className="mt-6 flex gap-4 w-full max-w-lg justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button type="button" variant="outline" onClick={clearFile} disabled={mutation.isPending}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleUpload} disabled={mutation.isPending}>
                          {mutation.isPending ? 'Processing...' : 'Start Inference'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {results ? (
            <Card className="animate-in slide-in-from-right-8 duration-500 border-success shadow-success/10 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-4 bg-success/5 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-success" /> 
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-md bg-neutral">
                    <span className="text-sm font-medium text-neutral-dark">Total Detected</span>
                    <span className="text-xl font-bold">{results?.total ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-md bg-success/10 border border-success/20">
                    <span className="text-sm font-medium text-success">Empty (Available)</span>
                    <span className="text-xl font-bold text-success">{results?.empty ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-md bg-danger/10 border border-danger/20">
                    <span className="text-sm font-medium text-danger">Occupied</span>
                    <span className="text-xl font-bold text-danger">{results?.occupied ?? 0}</span>
                  </div>
                </div>

                <Button type="button" className="w-full" variant="outline" onClick={clearFile}>
                  Upload Another
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <FileVideo className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold block mb-1">Supported Formats</span>
                      <span className="text-neutral-dark">Images (JPG, PNG) and Videos (MP4, WebM, MOV).</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold block mb-1">Camera Angle</span>
                      <span className="text-neutral-dark">High angle, unobscured views produce the best detection results.</span>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        
      </div>
    </div>
  );
}
