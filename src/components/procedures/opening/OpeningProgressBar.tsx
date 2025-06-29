import { cn } from '@/lib/utils'

interface OpeningProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function OpeningProgressBar({ currentStep, totalSteps }: OpeningProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all",
              index + 1 < currentStep
                ? "bg-orange-500 text-white"
                : index + 1 === currentStep
                ? "bg-orange-500 text-white ring-4 ring-orange-100"
                : "bg-gray-200 text-gray-500"
            )}
          >
            {index + 1}
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}