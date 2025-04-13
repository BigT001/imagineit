export interface Job {
    job_id: string;
    status: string;
    prompt: string;
    created_at: number;
    video_ready: boolean;
  }
  
  export interface JobStatus {
    status: string;
    job_id: string;
    video_ready: boolean;
    video_path: string | null;
  }
  
  export interface UploadResult {
    status: string;
    message: string;
    file_id?: string;
    file_path?: string;
  }
  
  export interface GenerateResult {
    status: string;
    message: string;
    job_id?: string;
    video_path?: string;
    publish_results?: Record<string, any>;
  }
  