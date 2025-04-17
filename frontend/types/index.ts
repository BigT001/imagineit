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

export interface Scene {
  description: string;
  duration: number;
  camera: string;
  effects: string;
}

export interface Script {
  title: string;
  prompt: string;
  scenes: Scene[];
}

export interface Step {
  name: string;
  status: string;
  progress: number;
  message: string;
}

export interface JobOutput {
  script?: Script;
  video?: string;
  assets?: string[];
}

export interface JobStatusInfo {
  job_id: string;
  prompt: string;
  status: string;
  progress: number;
  current_step: string;
  steps: Step[];
  created_at: number;
  updated_at: number;
  completed_at?: number;
  error?: string;
  video_ready?: boolean;
  video_path?: string;
  output?: {
    script?: Script;
    assets?: string[];
    video_url?: string;
  };
  createdAt: string;
}

// Available platforms
export const PLATFORMS: Platform[] = [
  { id: 'youtube', name: 'YouTube', icon: 'youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'tiktok' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' }
];
