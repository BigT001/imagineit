
"use client";

import { useState, useEffect } from 'react';
import { Job, JobStatus as JobStatusType } from '@/types';
import { fetchJobs, fetchJobStatus } from '@/services/api';

// Import components
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import VideoGenerator from '@/components/VideoGenerator';
import JobStatus from '@/components/JobStatus';
import JobList from '@/components/JobList';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusType | null>(null);

  // Fetch jobs on component mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Poll job status if we have a current job
  useEffect(() => {
    if (currentJobId) {
      const interval = setInterval(() => {
        loadJobStatus(currentJobId);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [currentJobId]);

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      
      if (data.status === 'success') {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const loadJobStatus = async (jobId: string) => {
    try {
      const data = await fetchJobStatus(jobId);
      
      setJobStatus(data);
      
      // If job is complete, refresh the job list
      if (data.status === 'completed') {
        loadJobs();
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
    }
  };

  const handleJobCreated = (jobId: string) => {
    setCurrentJobId(jobId);
    loadJobs(); // Refresh job list
  };

  const handleSelectJob = (jobId: string) => {
    setCurrentJobId(jobId);
    loadJobStatus(jobId);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <Header onRefreshJobs={loadJobs} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ImageUploader />
            <VideoGenerator onJobCreated={handleJobCreated} />
          </div>
          
          <div className="space-y-6">
            {jobStatus && currentJobId && (
              <JobStatus jobStatus={jobStatus} jobId={currentJobId} />
            )}
            
            <JobList jobs={jobs} onSelectJob={handleSelectJob} />
          </div>
        </div>
      </div>
    </main>
  );
}
