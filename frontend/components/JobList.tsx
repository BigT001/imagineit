import React from 'react';
import { Job } from '../types';
import { getStatusColor } from '../utils/statusUtils';

interface JobListProps {
  jobs: Job[];
  onSelectJob: (jobId: string) => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob }) => {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No jobs found</p>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.job_id} className="border rounded p-3 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="truncate flex-1">
                  <h3 className="font-medium truncate">{job.prompt || "No prompt"}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(job.created_at * 1000).toLocaleString()}
                  </p>
                </div>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => onSelectJob(job.job_id)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  View Status
                </button>
                {job.video_ready && (
                  <a
                    href={`http://localhost:5000/api/download/${job.job_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
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
