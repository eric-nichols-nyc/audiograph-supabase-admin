import { Loader2, Check, AlertCircle } from "lucide-react";

const STAGES = {
  INIT: { title: 'Initializing', order: 0 },
  METADATA: { title: 'Spotify Data', order: 1 },
  ANALYTICS: { title: 'Analytics Data', order: 2 },
  VIDEO_DATA: { title: 'Video Data', order: 3 },
  TRACK_DATA: { title: 'Track Data', order: 4 },
  URL_DATA: { title: 'URL Data', order: 5 },
  WIKIPEDIA: { title: 'Wikipedia Data', order: 6 },
  STORE: { title: 'Store Data', order: 7 },
  COMPLETE: { title: 'Complete', order: 8 },
  ERROR: { title: 'Error', order: -1 }
} as const;

interface StageUpdate {
  stage: keyof typeof STAGES;
  message: string;
  details: string;
  progress?: number;
}

interface MultiStepLoaderProps {
  currentStage: StageUpdate | null;
  error: string | null;
}

export default function MultiStepLoader({ currentStage, error }: MultiStepLoaderProps) {
  const stageKeys = Object.keys(STAGES) as Array<keyof typeof STAGES>;
  const sortedStages = stageKeys
    .filter(key => STAGES[key].order >= 0)
    .sort((a, b) => STAGES[a].order - STAGES[b].order);

  const getCurrentStatus = (stageKey: keyof typeof STAGES) => {
    if (error) return 'error';
    if (!currentStage) return 'pending';
    if (currentStage.stage === 'COMPLETE' && STAGES[stageKey].order < STAGES.COMPLETE.order) return 'complete';
    if (currentStage.stage === stageKey) return 'current';
    if (STAGES[currentStage.stage].order > STAGES[stageKey].order) return 'complete';
    return 'pending';
  };

  const StageIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return <Check className="h-4 w-4 text-white" />;
      case 'current':
        return <Loader2 className="h-4 w-4 animate-spin text-white" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 p-4">
      {sortedStages.map((stage, index) => {
        const status = getCurrentStatus(stage);
        const isLast = index === sortedStages.length - 1;

        return (
          <div key={stage} className="flex items-start gap-4 w-full">
            <div className="flex flex-col items-center">
              <div className="relative h-6 w-6">
                <div className={`absolute inset-0 flex items-center justify-center rounded-full
                  ${status === 'pending' ? 'bg-gray-300 dark:bg-gray-700' : 
                    status === 'error' ? 'bg-red-500' :
                    'bg-green-600'}`}
                >
                  <StageIcon status={status} />
                </div>
              </div>
              {!isLast && (
                <div className={`h-10 w-[2px] 
                  ${status === 'complete' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`} 
                />
              )}
            </div>
            
            <div className="flex-1 min-h-[2.5rem]">
              <p className="text-sm font-medium">{STAGES[stage].title}</p>
              {currentStage?.stage === stage && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentStage.details}
                </p>
              )}
            </div>

            <div className="text-sm font-medium">
              {currentStage?.stage === stage && currentStage.progress && (
                <span className="text-green-600">{currentStage.progress}%</span>
              )}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg w-full">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}