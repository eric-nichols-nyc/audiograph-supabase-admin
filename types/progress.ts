export type ProgressStage = 
  | 'INIT' 
  | 'METADATA' 
  | 'ANALYTICS' 
  | 'MEDIA' 
  | 'STORE' 
  | 'COMPLETE' 
  | 'ERROR';

export interface ProgressUpdate {
  stage: ProgressStage;
  message: string;
  details: string;
  progress: number;
  payload?: any;
} 