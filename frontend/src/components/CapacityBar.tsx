interface CapacityBarProps {
  current: number;
  max: number;
  label: string;
}

export default function CapacityBar({ current, max, label }: CapacityBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isOverAllocated = current > max;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-800 tracking-tight capitalize">{label}</span>
          <span className="text-[10px] text-gray-400 font-bold capitalize tracking-wider">
            {isOverAllocated ? 'Critical capacity' : 'Standard capacity'}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-extrabold ${isOverAllocated ? 'text-primary' : 'text-gray-900'}`}>
            {current.toFixed(1)} <span className="text-gray-300 font-medium">/ {max.toFixed(1)}</span>
          </span>
        </div>
      </div>
      
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
        <div 
          className={`h-full transition-all duration-700 ease-in-out rounded-full ${
            isOverAllocated ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary/90 shadow-md shadow-primary/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isOverAllocated && (
        <div className="flex items-center gap-1.5 mt-2 text-[9px] text-primary font-bold capitalize tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded-lg border border-primary/10">
          <span className="animate-pulse">●</span>
          Over-allocation alert
        </div>
      )}
    </div>
  );
}
