"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Job, JobStatusInfo } from "@/types";
import { fetchJobs, fetchJobStatus } from "@/services/api";

import JobList from "@/components/JobList";
import CreateTab from "@/components/CreateTab";
import ProcessTab from "@/components/tabs/ProcessTab";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("job");
  
  const [activeTab, setActiveTab] = useState<string>("create");
  const [processTab, setProcessTab] = useState<string>("status");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  
  const [currentJobId, setCurrentJobId] = useState<string | null>(jobIdParam);
  const [jobStatus, setJobStatus] = useState<JobStatusInfo | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  
  const [pollingInterval, setPollingInterval] = useState<number>(5000); // 5 seconds
  const [lastPolled, setLastPolled] = useState<number>(0);

  // Load jobs
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    
    try {
      const response = await fetchJobs();
      
      if (response.status === "success") {
        setJobs(response.jobs);
      } else {
        setJobsError("Failed to load jobs");
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      setJobsError("Error loading jobs. Please try again.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

// Inside the loadJobStatus function in your Home component
const loadJobStatus = useCallback(async (jobId: string) => {
  if (!jobId) return;
  
  setStatusLoading(true);
  setStatusError(null);
  
  try {
    const response = await fetchJobStatus(jobId);
    if (response.status === "success") {
      setJobStatus(response.job);
    } else {
      setStatusError("Failed to load job status");
    }
  } catch (error) {
    console.error("Error loading job status:", error);
    setStatusError(error instanceof Error ? error.message : "Error loading job status. Please try again.");
    
    // If we get a 404, the job might not exist
    if (error instanceof Error && error.message.includes("404")) {
      setStatusError("Job not found. It may have been deleted.");
    }
  } finally {
    setStatusLoading(false);
    setLastPolled(Date.now());
  }
}, []);

  // Initial load
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Load job status when currentJobId changes
  useEffect(() => {
    if (currentJobId) {
      loadJobStatus(currentJobId);
      setActiveTab("process");
      
      // Update URL with job ID
      router.replace(`?job=${currentJobId}`, { scroll: false });
    }
  }, [currentJobId, loadJobStatus, router]);

  // Poll for job status updates
  useEffect(() => {
    if (!currentJobId || !jobStatus) return;
    
    // Don't poll for completed/failed jobs as frequently
    const status = jobStatus.status.toLowerCase();
    const shouldPoll = !["completed", "error", "failed", "cancelled"].includes(status) || 
                       (Date.now() - lastPolled > pollingInterval);
    
    if (!shouldPoll) return;
    
    const timer = setTimeout(() => {
      loadJobStatus(currentJobId);
    }, pollingInterval);
    
    return () => clearTimeout(timer);
  }, [currentJobId, jobStatus, loadJobStatus, lastPolled, pollingInterval]);

  // Handle job selection
  const handleSelectJob = (jobId: string) => {
    if (jobId !== currentJobId) {
      setCurrentJobId(jobId);
      setJobStatus(null);
      setStatusError(null);
    }
  };

  // Handle job creation success
  const handleJobCreated = (jobId: string) => {
    loadJobs();
    handleSelectJob(jobId);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (currentJobId) {
      loadJobStatus(currentJobId);
    }
    loadJobs();
  };

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">AI Video Generator</h1>
      
      {jobsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{jobsError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <JobList
            jobs={jobs}
            onSelectJob={handleSelectJob}
            currentJobId={currentJobId}
            loading={jobsLoading}
          />
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="create">Create New Video</TabsTrigger>
              <TabsTrigger value="process" disabled={!currentJobId}>
                Process Video
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <CreateTab onJobCreated={handleJobCreated} />
            </TabsContent>
            
            <TabsContent value="process">
              <ProcessTab
                loading={statusLoading}
                jobStatus={jobStatus}
                currentJobId={currentJobId}
                activeTab={processTab}
                setActiveTab={setProcessTab}
                error={statusError}
                onRefresh={handleRefresh}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}