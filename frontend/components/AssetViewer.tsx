import React, { useState, useEffect } from 'react';
import { Loader2, Download, Image as ImageIcon, FileAudio, Box } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssetViewerProps {
  jobId: string;
}

interface AssetData {
  images?: string[];
  audio?: string[];
  models?: string[];
  [key: string]: string[] | undefined;
}

const AssetViewer: React.FC<AssetViewerProps> = ({ jobId }) => {
  const [assets, setAssets] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("images");
  const [loadingAsset, setLoadingAsset] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAssets = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/assets/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setAssets(data.assets);
          
          // Set active tab to the first asset type that has items
          if (data.assets) {
            const assetTypes = ['images', 'audio', 'models'];
            for (const type of assetTypes) {
              if (data.assets[type]?.length > 0) {
                setActiveTab(type);
                break;
              }
            }
          }
        } else {
          setError(data.message || 'Failed to load assets');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching assets');
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, [jobId]);

  const handleImageLoad = (assetId: string) => {
    setLoadingAsset(prev => ({ ...prev, [assetId]: false }));
  };

  const handleImageError = (assetId: string) => {
    setLoadingAsset(prev => ({ ...prev, [assetId]: false }));
  };

  const downloadAsset = async (assetPath: string, assetType: string) => {
    const filename = assetPath.split('/').pop() || 'asset';
    
    try {
      const response = await fetch(`/api/asset/${jobId}/${assetType}/${filename}`);
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading asset:', err);
    }
  };

  const downloadAllAssets = async () => {
    // This would typically call a backend endpoint that creates a zip of all assets
    try {
      const response = await fetch(`/api/download-all-assets/${jobId}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets-${jobId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading all assets:', err);
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'images':
        return <ImageIcon className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'models':
        return <Box className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getAssetCount = (type: string): number => {
    return assets?.[type]?.length || 0;
  };

  const getTotalAssetCount = (): number => {
    if (!assets) return 0;
    
    return Object.values(assets).reduce((total, assetArray) => {
      return total + (assetArray?.length || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-40" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-2">
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!assets || getTotalAssetCount() === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
        <div className="flex flex-col items-center justify-center space-y-2">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-medium">No Assets Available</h3>
          <p className="text-sm max-w-md">
            Assets will appear here once they've been generated. This typically happens after the script generation phase.
          </p>
        </div>
      </div>
    );
  }

  const assetTypes = Object.keys(assets).filter(type => assets[type]?.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Generated Assets</h3>
        <Badge variant="outline" className="px-2 py-1">
          {getTotalAssetCount()} total assets
        </Badge>
      </div>
      
      {assetTypes.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {assetTypes.map(type => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {getAssetTypeIcon(type)}
                <span className="capitalize">{type}</span>
                <Badge variant="secondary" className="ml-1">
                  {getAssetCount(type)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {assetTypes.map(type => (
            <TabsContent key={type} value={type} className="mt-0">
              {type === 'images' && assets.images && assets.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {assets.images.map((imagePath, index) => {
                    const filename = imagePath.split('/').pop() || '';
                    const assetId = `image-${index}`;
                    
                    // Set loading state for this asset if not already set
                    if (loadingAsset[assetId] === undefined) {
                      setLoadingAsset(prev => ({ ...prev, [assetId]: true }));
                    }
                    
                    return (
                      <div 
                        key={assetId} 
                        className="overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md group"
                      >
                        <div className="aspect-video relative">
                          {loadingAsset[assetId] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                          <img
                            src={`/api/asset/${jobId}/images/${filename}`}
                            alt={`Scene ${index + 1}`}
                            className="w-full h-full object-cover"
                            onLoad={() => handleImageLoad(assetId)}
                            onError={() => handleImageError(assetId)}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="gap-1"
                              onClick={() => downloadAsset(imagePath, 'images')}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="p-2 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Scene {index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {filename.split('.').pop()?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {type === 'audio' && assets.audio && assets.audio.length > 0 && (
                <div className="space-y-3">
                  {assets.audio.map((audioPath, index) => {
                    const filename = audioPath.split('/').pop() || '';
                    return (
                      <div 
                        key={`audio-${index}`} 
                        className="border rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <FileAudio className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{filename}</p>
                            <p className="text-xs text-muted-foreground">Audio Track {index + 1}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="gap-1"
                          onClick={() => downloadAsset(audioPath, 'audio')}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {type === 'models' && assets.models && assets.models.length > 0 && (
                <div className="space-y-3">
                  {assets.models.map((modelPath, index) => {
                    const filename = modelPath.split('/').pop() || '';
                    return (
                      <div 
                        key={`model-${index}`} 
                        className="border rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Box className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{filename}</p>
                            <p className="text-xs text-muted-foreground">3D Model {index + 1}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="gap-1"
                          onClick={() => downloadAsset(modelPath, 'models')}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          <div className="flex flex-col items-center justify-center space-y-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-medium">No Assets Available</h3>
            <p className="text-sm max-w-md">
              Assets will appear here once they've been generated.
            </p>
          </div>
        </div>
      )}
      
      {getTotalAssetCount() > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={downloadAllAssets}
          >
            <Download className="h-4 w-4" />
            Download All Assets
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssetViewer;
