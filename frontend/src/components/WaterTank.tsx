import React from 'react';

interface WaterTankProps {
  progress: number; // 0-100
  className?: string;
}

const WaterTank: React.FC<WaterTankProps> = ({ progress, className = "" }) => {
  return (
    <div className={`relative w-32 h-48 mx-auto ${className}`}>
      {/* Tank container */}
      <div className="absolute inset-0 border-4 border-primary rounded-b-3xl rounded-t-lg bg-card/50 backdrop-blur-sm">
        {/* Water level indicator lines */}
        <div className="absolute right-2 top-4 space-y-4">
          {[100, 75, 50, 25, 0].map((level) => (
            <div key={level} className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-px bg-primary/30" />
              <span>{level}%</span>
            </div>
          ))}
        </div>

        {/* Water fill */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-ocean rounded-b-3xl transition-all duration-1000 ease-out"
          style={{ 
            height: `${progress}%`,
            background: `linear-gradient(180deg, 
              hsl(var(--water-light)) 0%, 
              hsl(var(--water-blue)) 50%, 
              hsl(var(--water-dark)) 100%)`
          }}
        >
          {/* Water surface animation */}
          <div className="absolute top-0 left-0 right-0 h-2 wave-animation rounded-full opacity-80" />
          
          {/* Water bubbles */}
          {progress > 0 && (
            <>
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-bounce" 
                   style={{ animationDelay: '0s', animationDuration: '3s' }} />
              <div className="absolute top-8 right-6 w-1 h-1 bg-white/40 rounded-full animate-bounce" 
                   style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
              <div className="absolute top-12 left-6 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce" 
                   style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
            </>
          )}
        </div>

        {/* Tank cap */}
        <div className="absolute -top-2 left-2 right-2 h-4 bg-primary rounded-lg border-2 border-primary-dark">
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-dark rounded-full" />
        </div>
      </div>

      {/* Progress text */}
      <div className="absolute -bottom-8 left-0 right-0 text-center mb-3">
        <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
      </div>

      {/* Water droplets when filling */}
      {progress > 0 && (
        <>
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-water-blue rounded-full water-drop" 
               style={{ animationDelay: '0.5s' }} />
          <div className="absolute -top-4 left-1/3 w-1 h-2 bg-aqua rounded-full water-drop" 
               style={{ animationDelay: '1.5s' }} />
          <div className="absolute -top-5 right-1/3 w-1.5 h-2.5 bg-water-light rounded-full water-drop" 
               style={{ animationDelay: '2.5s' }} />
        </>
      )}
    </div>
  );
};

export default WaterTank;