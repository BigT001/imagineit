"use client";

import { useState, useEffect } from 'react';
import { Job, JobStatus as JobStatusType } from '@/types';
import { fetchJobs, fetchJobStatus } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Import components
import Header from '@/components/Header';
import JobList from '@/components/JobList';
import CreateVideoTab from '@/components/tabs/CreateVideoTab';
import ProcessTab from '@/components/tabs/ProcessTab';
import ScriptGeneratorTab from '@/components/tabs/ScriptGeneratorTab';
import AssetGeneratorTab from '@/components/tabs/AssetGeneratorTab';
import BlenderAnimatorTab from '@/components/tabs/BlenderAnimatorTab';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [mainTab, setMainTab] = useState<string>("create");

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
    setMainTab("process"); // Switch to process tab to show job status
    loadJobs(); // Refresh job list
  };

  const handleSelectJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab("status"); // Switch to status tab when selecting a job
    setMainTab("process"); // Switch to process tab to show job details
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
        
        <Tabs value={mainTab} onValueChange={setMainTab} className="mt-6">
          <MainNavigation />
          
          <TabsContent value="create" className="space-y-6">
            <CreateVideoTab onJobCreated={handleJobCreated} />
            
            <JobList 
              jobs={jobs} 
              onSelectJob={handleSelectJob} 
              currentJobId={currentJobId} 
            />
          </TabsContent>
          
          <TabsContent value="process">
            <ProcessTab 
              loading={loading} 
              jobStatus={jobStatus} 
              currentJobId={currentJobId} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          
          <TabsContent value="script">
            <ScriptGeneratorTab />
          </TabsContent>
          
          <TabsContent value="assets">
            <AssetGeneratorTab />
          </TabsContent>
          
          <TabsContent value="animator">
            <BlenderAnimatorTab />
          </TabsContent>
        </Tabs>
        
        <Footer />
      </div>
    </main>
  );
}
