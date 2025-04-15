import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { JobStatus as JobStatusType } from '@/types';
import JobStatus from '@/components/JobStatus';
import ScriptViewer from '@/components/ScriptViewer';
import AssetViewer from '@/components/AssetViewer';

interface ProcessTabProps {
  loading: boolean;
  jobStatus: JobStatusType | null;
  currentJobId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProcessTab = ({ 
  loading, 
  jobStatus, 
  currentJobId, 
  activeTab, 
  setActiveTab 
}: ProcessTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Processing</CardTitle>
        <CardDescription>
          Track the status of your video generation job
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !jobStatus ? (
          <div className="flex items-center justify-center h-64 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading job details...</span>
          </div>
        ) : jobStatus && currentJobId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="status" className="mt-0">
                <JobStatus jobStatus={jobStatus} jobId={currentJobId} />
              </TabsContent>
              
              <TabsContent value="script" className="mt-0">
                <ScriptViewer jobId={currentJobId} />
              </TabsContent>
              
              <TabsContent value="assets" className="mt-0">
                <AssetViewer jobId={currentJobId} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <h3 className="text-xl font-medium mb-2">No Job Selected</h3>
            <p className="text-muted-foreground">
              Upload an image and generate a video, or select a job from the list to view details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessTab;
