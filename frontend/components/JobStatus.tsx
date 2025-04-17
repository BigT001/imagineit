import React, { useState } from 'react';
import { JobStatusInfo, Step } from '@/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { cancelJob } from '@/services/api';

// Define the API base URL directly in this component
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface JobStatusProps {
  jobStatus: JobStatusInfo;
  jobId: string;
  onRefresh?: () => void;
}

const JobStatus: React.FC<JobStatusProps> = ({ jobStatus, jobId, onRefresh }) => {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const getStatusIcon = () => {
    const status = jobStatus.status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusColor = () => {
    const status = jobStatus.status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    const status = jobStatus.status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return 'Job completed successfully';
      case 'error':
      case 'failed':
        return 'Job failed';
      case 'cancelled':
        return 'Job was cancelled';
      case 'processing':
        return `Processing your request... (${jobStatus.current_step})`;
      case 'pending':
        return 'Job is queued and waiting to start';
      default:
        return 'Unknown status';
    }
  };

  const handleCancelJob = async () => {
    if (!jobId) return;
    
    setCancelling(true);
    setCancelError(null);
    
    try {
      const response = await cancelJob(jobId);
      
      if (response.status !== 'success') {
        setCancelError(response.message || 'Failed to cancel job');
      } else if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      setCancelError('Error cancelling job. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const isJobActive = ['pending', 'processing'].includes(jobStatus.status.toLowerCase());
  const createdDate = new Date(jobStatus.created_at * 1000); // Convert timestamp to date
  const updatedDate = new Date(jobStatus.updated_at * 1000); // Convert timestamp to date
  const completedDate = jobStatus.completed_at ? new Date(jobStatus.completed_at * 1000) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-full ${getStatusColor()} bg-opacity-10`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-medium">
                Status: {jobStatus.status}
              </h3>
              <p className="text-muted-foreground">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <Progress value={jobStatus.progress} className="h-2 mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Job ID:</p>
              <p className="font-mono">{jobId}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Created:</p>
              <p>{createdDate.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Last Updated:</p>
              <p>{updatedDate.toLocaleString()}</p>
            </div>
            
            {completedDate && (
              <div>
                <p className="text-muted-foreground">Completed:</p>
                <p>{completedDate.toLocaleString()}</p>
              </div>
            )}
          </div>
          
          {/* Display steps */}
          {jobStatus.steps && jobStatus.steps.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Processing Steps:</h4>
              <div className="space-y-3">
                {jobStatus.steps.map((step: Step, index: number) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                        {step.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />}
                        {step.status === 'pending' && <Clock className="h-4 w-4 text-amber-500 mr-2" />}
                        {step.status === 'error' && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                        <span className="font-medium">{step.name}</span>
                      </div>
                      <Badge variant={
                        step.status === 'completed' ? 'outline' : 
                        step.status === 'processing' ? 'secondary' :
                        step.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {step.status}
                      </Badge>
                    </div>
                    <Progress value={step.progress} className="h-1 mb-2" />
                    {step.message && (
                      <p className="text-xs text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {cancelError && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
              {cancelError}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-6">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
            
            {isJobActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelJob}
                disabled={cancelling}
                className="gap-1"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Cancel Job
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {jobStatus.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
            <pre className="whitespace-pre-wrap text-sm text-red-700 p-3 bg-red-100 rounded-md">
              {jobStatus.error}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobStatus;
