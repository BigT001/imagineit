import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Image as ImageIcon, 
  FileAudio, 
  Box, 
  Loader2, 
  AlertCircle,
  Film,
  Music,
  FileVideo
} from "lucide-react";
import { fetchAssets } from '@/services/api';

interface AssetViewerProps {
  jobId: string;
  assets?: string[];
}

const AssetViewer: React.FC<AssetViewerProps> = ({ jobId, assets: propAssets }) => {
  const [assets, setAssets] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState<boolean>(!propAssets);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('images');
  const [loadingAsset, setLoadingAsset] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // If assets are provided as props, organize them by type
    if (propAssets && propAssets.length > 0) {
      organizeAssetsByType(propAssets);
      setLoading(false);
      return;
    }

    const loadAssets = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchAssets(jobId);
        
        if (response.status === 'success') {
          if (response.assets && Array.isArray(response.assets)) {
            organizeAssetsByType(response.assets);
          } else {
            setAssets(null);
          }
        } else {
          setError('Failed to load assets');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching assets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [jobId, propAssets]);

  const organizeAssetsByType = (assetList: string[]) => {
    const organized: Record<string, string[]> = {
      images: [],
      audio: [],
      models: [],
      videos: []
    };

    assetList.forEach(asset => {
      const extension = asset.split('.').pop()?.toLowerCase() || '';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        organized.images.push(asset);
      } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
        organized.audio.push(asset);
      } else if (['glb', 'gltf', 'obj', 'fbx'].includes(extension)) {
        organized.models.push(asset);
      } else if (['mp4', 'webm', 'mov'].includes(extension)) {
        organized.videos.push(asset);
      }
    });

    setAssets(organized);
    
    // Set active tab to the first type that has assets
    for (const type in organized) {
      if (organized[type].length > 0) {
        setActiveTab(type);
        break;
      }
    }
  };

  const handleImageLoad = (assetId: string) => {
    setLoadingAsset(prev => ({ ...prev, [assetId]: false }));
  };

  const handleImageError = (assetId: string) => {
    setLoadingAsset(prev => ({ ...prev, [assetId]: false }));
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'images':
        return <ImageIcon className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'models':
        return <Box className="h-4 w-4" />;
      case 'videos':
        return <FileVideo className="h-4 w-4" />;
      default:
        return <FileAudio className="h-4 w-4" />;
    }
  };

  const downloadAsset = async (assetPath: string, assetType: string) => {
    try {
      const filename = assetPath.split('/').pop() || 'asset';
      const response = await fetch(`/api/asset/${jobId}/${assetType}/${filename}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading asset:', error);
      alert('Failed to download asset. Please try again.');
    }
  };

  const downloadAllAssets = async () => {
    // This would typically use a backend endpoint to create a zip file
    alert('Download all assets functionality would be implemented here');
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
        <AlertCircle className="h-4 w-4" />
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
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <div className="flex flex-col items-center justify-center space-y-2">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-medium">No Assets Available</h3>
          <p className="text-sm max-w-md text-muted-foreground">
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
      
      {assetTypes.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {assetTypes.map(type => (
                <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                  {getAssetTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                  <Badge variant="secondary" className="ml-1">
                    {getAssetCount(type)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadAllAssets}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>
          
          {assetTypes.map(type => (
            <TabsContent key={type} value={type} className="mt-0">
              {type === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {assets.images?.map((asset, index) => {
                    const assetId = `img-${index}`;
                    const isLoading = loadingAsset[assetId] !== false;
                    
                    return (
                      <Card key={index} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted/30">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          <img
                            src={`/api/asset/${jobId}/images/${asset.split('/').pop()}`}
                            alt={`Generated asset ${index + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => handleImageLoad(assetId)}
                            onError={() => handleImageError(assetId)}
                          />
                        </div>
                        <CardContent className="p-2 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground truncate">
                            {asset.split('/').pop()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => downloadAsset(asset, 'images')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {type === 'audio' && (
                <div className="space-y-3">
                  {assets.audio?.map((asset, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <FileAudio className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{asset.split('/').pop()}</p>
                              <p className="text-xs text-muted-foreground">Audio file</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <audio
                              controls
                              className="max-w-[200px] h-8"
                              src={`/api/asset/${jobId}/audio/${asset.split('/').pop()}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => downloadAsset(asset, 'audio')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {type === 'models' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assets.models?.map((asset, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <Box className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{asset.split('/').pop()}</p>
                              <p className="text-xs text-muted-foreground">3D Model</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => downloadAsset(asset, 'models')}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {type === 'videos' && (
                <div className="space-y-4">
                  {assets.videos?.map((asset, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <Film className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{asset.split('/').pop()}</p>
                                <p className="text-xs text-muted-foreground">Video file</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => downloadAsset(asset, 'videos')}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                          <div className="border rounded-md overflow-hidden">
                            <video
                              controls
                              className="w-full"
                              src={`/api/asset/${jobId}/videos/${asset.split('/').pop()}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default AssetViewer;

