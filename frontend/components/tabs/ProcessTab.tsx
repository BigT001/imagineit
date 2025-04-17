import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatusInfo } from '@/types';

import JobStatus from '@/components/JobStatus';
import ScriptViewer from '@/components/ScriptViewer';
import AssetViewer from '@/components/AssetViewer';
import VideoPlayer from '@/components/VideoPlayer';

interface ProcessTabProps {
  loading: boolean;
  jobStatus: JobStatusInfo | null;
  currentJobId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  error: string | null;
  onRefresh: () => void;
}

const ProcessTab: React.FC<ProcessTabProps> = ({
  loading,
  jobStatus,
  currentJobId,
  activeTab,
  setActiveTab,
  error,
  onRefresh
}) => {
  if (!currentJobId) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">No Job Selected</h2>
        <p className="text-muted-foreground mb-4">
          Please select a job from the list or create a new one.
        </p>
      </div>
    );
  }

  if (loading && !jobStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-muted-foreground">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="flex flex-col space-y-2">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!jobStatus) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The selected job could not be found or has been deleted.
        </p>
      </div>
    );
  }

  const hasScript = jobStatus.output?.script !== undefined;
  const hasAssets = jobStatus.output?.assets !== undefined && jobStatus.output.assets.length > 0;
  const hasVideo = jobStatus.output?.video_url !== undefined || jobStatus.video_ready;
  const videoUrl = jobStatus.output?.video_url || (jobStatus.video_ready && jobStatus.video_path ? `/api/video/${currentJobId}` : undefined);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="script" disabled={!hasScript}>Script</TabsTrigger>
          <TabsTrigger value="assets" disabled={!hasAssets}>Assets</TabsTrigger>
          <TabsTrigger value="video" disabled={!hasVideo}>Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <JobStatus 
            jobStatus={jobStatus} 
            jobId={currentJobId} 
            onRefresh={onRefresh} 
          />
        </TabsContent>
        
        <TabsContent value="script">
          {hasScript ? (
            <ScriptViewer 
              jobId={currentJobId} 
              script={jobStatus.output?.script} 
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Script is not available yet.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="assets">
          {hasAssets ? (
            <AssetViewer 
              jobId={currentJobId} 
              assets={jobStatus.output?.assets} 
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Assets are not available yet.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="video">
          {hasVideo && videoUrl ? (
            <VideoPlayer videoUrl={videoUrl} />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Video is not available yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessTab;
