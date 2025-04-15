import React from 'react';
import { Job } from '../types';
import { getStatusColor } from '../utils/statusUtils';

interface JobListProps {
  jobs: Job[];
  onSelectJob: (jobId: string) => void;
  currentJobId?: string | null;
}

const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob, currentJobId }) => {
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No jobs found</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {jobs.map(job => (
            <div 
              key={job.job_id} // This key should be unique
              className={`border rounded p-3 transition-colors ${
                currentJobId === job.job_id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="truncate flex-1">
                  <h3 className="font-medium truncate">{job.prompt || "No prompt"}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(job.created_at)}
                  </p>
                </div>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-2 flex space-x-2">
                {/* Make sure any other mapped elements have keys */}
                <button
                  onClick={() => onSelectJob(job.job_id)}
                  className={`text-xs px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 ${
                    currentJobId === job.job_id
                      ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  {currentJobId === job.job_id ? 'Selected' : 'View Status'}
                </button>
                {job.video_ready && (
                  <a
                    href={`http://localhost:5000/api/video/${job.job_id}`}
                    download
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
