"use client";

import { useState, useEffect } from 'react';
import { Job, JobStatus as JobStatusType } from '@/types';
import { fetchJobs, fetchJobStatus } from '@/services/api';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import VideoGenerator from '@/components/VideoGenerator';
import JobStatus from '@/components/JobStatus';
import JobList from '@/components/JobList';
import ScriptViewer from '@/components/ScriptViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");

  // Fetch jobs on component mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Poll job status if we have a current job
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentJobId) {
      // Immediately load status
      loadJobStatus(currentJobId);
      
      // Then set up polling
      interval = setInterval(() => {
        loadJobStatus(currentJobId);
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentJobId]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchJobs();
      
      if (data.status === 'success') {
        setJobs(data.jobs);
        
        // If we have jobs but no current job selected, select the most recent one
        if (data.jobs.length > 0 && !currentJobId) {
          setCurrentJobId(data.jobs[0].job_id);
        }
      } else {
        setError('Failed to load jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Error connecting to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadJobStatus = async (jobId: string) => {
    try {
      const data = await fetchJobStatus(jobId);
      
      setJobStatus(data);
      
      // If job is complete or has error, refresh the job list
      if (data.status === 'completed' || data.status === 'error') {
        loadJobs();
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
      // Don't set error state here to avoid disrupting the UI during polling
    }
  };

  const handleJobCreated = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab("status"); // Switch to status tab when new job is created
    loadJobs(); // Refresh job list
  };

  const handleSelectJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab("status"); // Switch to status tab when selecting a job
    loadJobStatus(jobId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header onRefreshJobs={loadJobs} />
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <p className="text-sm mt-1">
                Please make sure the backend server is running at http://localhost:5000
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left column - Input controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Video</h2>
                <ImageUploader />
                <div className="mt-6">
                  <VideoGenerator onJobCreated={handleJobCreated} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
                <JobList 
                  jobs={jobs} 
                  onSelectJob={handleSelectJob} 
                  currentJobId={currentJobId}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Job details */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardContent className="p-0">
                {loading && !jobStatus ? (
                  <div className="flex items-center justify-center h-64">
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
          </div>
        </div>
        
        <footer className="mt-16 text-center text-muted-foreground text-sm border-t pt-6">
          <p className="font-medium">ImagineIt - AI Video Generator</p>
          <p className="mt-1">© {new Date().getFullYear()} - All rights reserved</p>
        </footer>
      </div>
    </main>
  );
}

// Asset Viewer Component
const AssetViewer = ({ jobId }: { jobId: string }) => {
  const [assets, setAssets] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/assets/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setAssets(data.assets);
        } else {
          setError(data.message || 'Failed to load assets');
        }
      } catch (err) {
        setError('Error fetching assets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading assets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!assets) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Assets not available yet. They will appear here once generated.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Generated Assets</h3>
      
      <div className="mb-6">
        <h4 className="font-medium text-muted-foreground mb-3">Images</h4>
        
        {assets.images && assets.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {assets.images.map((imagePath: string, index: number) => {
              // Extract filename from path
              const filename = imagePath.split('/').pop();
              const assetType = 'images';
              
              return (
                <div key={index} className="overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                  <div className="aspect-video relative">
                    <img
                      src={`/api/asset/${jobId}/${assetType}/${filename}`}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Scene {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm p-4 border rounded-md bg-muted/50">
            No images have been generated yet.
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground mt-4 flex items-center justify-between">
        <span>
          Total assets: {
            (assets.images?.length || 0) +
            (assets.audio?.length || 0) +
            (assets.models?.length || 0)
          }
        </span>
        
        {assets.images?.length > 0 && (
          <button className="text-primary text-sm hover:underline">
            Download All
          </button>
        )}
      </div>
    </div>
  );
};
