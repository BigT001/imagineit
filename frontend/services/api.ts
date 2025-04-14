// API base URL
export const API_BASE_URL = 'http://localhost:5000/api';

// Test backend connection
export const testBackendConnection = async () => {
  const response = await fetch(`${API_BASE_URL}/test`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Check Blender version
export const checkBlenderVersion = async () => {
  const response = await fetch(`${API_BASE_URL}/blender-version`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Upload a file
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

// Generate a video
export const generateVideo = async (prompt: string) => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
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
};


// Fetch jobs
export const fetchJobs = async () => {
  const response = await fetch(`${API_BASE_URL}/jobs`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

// Fetch job status
export const fetchJobStatus = async (jobId: string) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
