import React, { useState } from 'react';
import { JobStatus as JobStatusType } from '../types';
import { API_BASE_URL } from '../services/api';

interface JobStatusProps {
  jobStatus: JobStatusType;
  jobId: string;
}

const JobStatus: React.FC<JobStatusProps> = ({ jobStatus, jobId }) => {
  const [videoError, setVideoError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'initializing':
      case 'generating_script':
      case 'generating_assets':
      case 'creating_animation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initializing':
        return 'Initializing job...';
      case 'generating_script':
        return 'Generating script...';
      case 'generating_assets':
        return 'Generating assets...';
      case 'creating_animation':
        return 'Creating animation...';
      case 'completed':
        return 'Job completed successfully!';
      case 'error':
        return 'Error processing job';
      default:
        return `Status: ${status}`;
    }
  };

  const handleVideoError = () => {
    setVideoError('Error loading video. Please try again later.');
  };

  const downloadVideo = () => {
    window.open(`${API_BASE_URL}/videos/${jobId}`, '_blank');
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Job Status</h2>
      
      <div className="mb-4">
        <div className={`px-3 py-2 rounded-md ${getStatusColor(jobStatus.status)}`}>
          <p className="font-medium">{getStatusText(jobStatus.status)}</p>
        </div>
        
        {jobStatus.error && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Error details:</p>
            <p className="font-mono text-sm mt-1">{jobStatus.error}</p>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Job ID: <span className="font-mono">{jobId}</span>
        </p>
        <p className="text-sm text-gray-600">
          Created: {new Date(jobStatus.created_at * 1000).toLocaleString()}
        </p>
        {jobStatus.completed_at && (
          <p className="text-sm text-gray-600">
            Completed: {new Date(jobStatus.completed_at * 1000).toLocaleString()}
          </p>
        )}
      </div>
      
      {jobStatus.video_ready && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Generated Video</h3>
          
          {videoError ? (
            <div className="p-3 bg-red-50 text-red-700 rounded-md mb-3">
              {videoError}
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-3">
              <video 
                controls 
                className="w-full h-full" 
                onError={handleVideoError}
                src={`${API_BASE_URL}/videos/${jobId}`}
              />
            </div>
          )}
          
          <button
            onClick={downloadVideo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download Video
          </button>
        </div>
      )}
    </div>
  );
};

export default JobStatus;
