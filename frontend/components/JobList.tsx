import React from 'react';
import { Job } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertTriangle, Film, Loader2 } from "lucide-react";

interface JobListProps {
  jobs: Job[];
  onSelectJob: (jobId: string) => void;
  currentJobId: string | null;
  loading: boolean;
}

const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob, currentJobId, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Jobs</h2>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Jobs</h2>
        <Card className="bg-muted/20">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Film className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="font-medium">No Jobs Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your video generation jobs will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    status = status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    status = status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error':
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Jobs</h2>
      <div className="space-y-3">
        {jobs.map((job) => {
          const isSelected = currentJobId === job.job_id;
          const createdDate = new Date(job.created_at * 1000); // Convert timestamp to date
          
          return (
            <Card
              key={job.job_id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'border-primary shadow-md' : 'hover:border-primary/50'
              }`}
              onClick={() => onSelectJob(job.job_id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-medium truncate max-w-xs">
                      {job.prompt || `Job ${job.job_id.substring(0, 8)}`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {createdDate.toLocaleString()}
                    </p>
                  </div>
                  <Badge className={`flex items-center gap-1 ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span>{job.status}</span>
                  </Badge>
                </div>
                {job.video_ready && (
                  <div className="mt-2 pt-2 border-t flex items-center text-xs text-green-600">
                    <Film className="h-3 w-3 mr-1" />
                    <span>Video Ready</span>
                  </div>
                )}
                {job.error && (
                  <div className="mt-2 pt-2 border-t text-xs text-red-600">
                    <span>Error: {job.error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default JobList;
