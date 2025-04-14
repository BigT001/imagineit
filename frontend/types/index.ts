// Job status type
export interface JobStatus {
  job_id: string;
  status: string;
  created_at: number;
  completed_at?: number;
  video_ready: boolean;
  video_path?: string;
  publish_results?: Record<string, any>;
  error?: string;
  progress?: number;
}

// Job type
export interface Job {
  job_id: string;
  status: string;
  created_at: number;
  completed_at?: number;
  video_ready: boolean;
  video_path?: string;
  prompt?: string;
  error?: string;
}

// Upload result type
export interface UploadResult {
  status: string;
  message: string;
  file_path?: string;
  filename?: string;
}

// Generate result type
export interface GenerateResult {
  status: string;
  message: string;
  job_id?: string;
  error?: string;
}

// Platform type for publishing
export interface Platform {
  id: string;
  name: string;
  icon: string;
}

// Available platforms
export const PLATFORMS: Platform[] = [
  { id: 'youtube', name: 'YouTube', icon: 'youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'tiktok' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' }
];
