import React from 'react';
import { JobStatus as JobStatusType } from '../types';
import { getStatusColor } from '../utils/statusUtils';

interface JobStatusProps {
  jobStatus: JobStatusType;
  jobId: string;
}

const JobStatus: React.FC<JobStatusProps> = ({ jobStatus, jobId }) => {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Current Job Status</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Job ID:</span>
          <span className="text-gray-600">{jobId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(jobStatus.status)}`}>
            {jobStatus.status}
          </span>
        </div>
        {jobStatus.video_ready && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Video Ready!</h3>
            <div className="bg-black p-2 rounded">
              <div className="text-center text-white p-8">
                Video Preview Placeholder
              </div>
            </div>
            <a 
              href={`http://localhost:5000${jobStatus.video_path}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-blue-500 hover:underline"
            >
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatus;
