import { Progress } from "@/components/ui/progress";

interface UsageData {
  feature: string;
  usage: {
    usedCount: number;
    lastUsed: string;
  } | null;
}

interface UsageMeterProps {
  usage: UsageData[];
}

const featureNames = {
  api_generation: "API Generation",
  docker_generation: "Docker Tools",
  cicd_generation: "CI/CD Workflows",
  ai_assistance: "AI Assistant",
};

const featureColors = {
  api_generation: "bg-neon-cyan",
  docker_generation: "bg-neon-green",
  cicd_generation: "bg-neon-purple",
  ai_assistance: "bg-yellow-500",
};

export function UsageMeter({ usage }: UsageMeterProps) {
  const freeLimit = 1;

  return (
    <div className="space-y-4">
      {usage.map(({ feature, usage: usageData }) => {
        const usedCount = usageData?.usedCount || 0;
        const percentage = Math.min((usedCount / freeLimit) * 100, 100);
        const isExceeded = usedCount > freeLimit;
        
        return (
          <div key={feature} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                {featureNames[feature as keyof typeof featureNames]}
              </span>
              <span className={`font-medium ${isExceeded ? 'text-red-400' : 'text-gray-400'}`}>
                {usedCount} / {freeLimit} free uses
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={percentage} 
                className="h-2"
              />
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  featureColors[feature as keyof typeof featureColors]
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            {isExceeded && (
              <p className="text-xs text-red-400">
                Free limit exceeded. Credits required for further use.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
