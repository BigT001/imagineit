import { GenerateResult, JobStatus, UploadResult } from '../types';

const API_BASE_URL = 'http://localhost:5000';

export const testBackendConnection = async (): Promise<{ status: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/test`);
  return response.json();
};

export const checkBlenderVersion = async (): Promise<{ status: string; version?: string; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/blender-version`);
  return response.json();
};

export const fetchJobs = async () => {
  const response = await fetch(`${API_BASE_URL}/api/jobs`);
  return response.json();
};

export const fetchJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);
  return response.json();
};

export const generateVideo = async (
  prompt: string, 
  duration: number, 
  style: string
): Promise<GenerateResult> => {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      duration,
      style
    }),
  });
  
  return response.json();
};

export const uploadFile = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};
