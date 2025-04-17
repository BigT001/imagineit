import { Job, JobStatusInfo, GenerateResult } from '@/types';

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetch all jobs
export const fetchJobs = async (): Promise<{ status: string; jobs: Job[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Fetch job status
export const fetchJobStatus = async (jobId: string): Promise<{ status: string; job: JobStatusInfo }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/job/${jobId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from server: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching job status:', error);
    throw error;
  }
};



// Create a new job
export const createJob = async (prompt: string): Promise<GenerateResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Cancel a job
export const cancelJob = async (jobId: string): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/job/${jobId}/cancel`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
};

// Fetch script for a job
export const fetchScript = async (jobId: string): Promise<{ status: string; script: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/script/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching script:', error);
    throw error;
  }
};

// Fetch assets for a job
export const fetchAssets = async (jobId: string): Promise<{ status: string; assets: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assets/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};
