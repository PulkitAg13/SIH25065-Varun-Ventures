import React, { useEffect, useState } from 'react';
import { Droplets, Home, TreePine } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  autoPlay = true, 
  className = "" 
}) => {
  const [phase, setPhase] = useState<'start' | 'rain' | 'recharge' | 'complete'>('start');

  useEffect(() => {
    if (!autoPlay) return;

    const timer1 = setTimeout(() => setPhase('rain'), 500);
    const timer2 = setTimeout(() => setPhase('recharge'), 2000);
    const timer3 = setTimeout(() => setPhase('complete'), 4000);
    const timer4 = setTimeout(() => onComplete?.(), 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [autoPlay, onComplete]);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-sky-200 to-green-100 ${className}`}>
      {/* Sky and Clouds */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-20 w-16 h-8 bg-white/70 rounded-full animate-pulse" />
        <div className="absolute top-16 right-32 w-20 h-10 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-8 left-1/2 w-24 h-12 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Rain Drops */}
      {(phase === 'rain' || phase === 'recharge' || phase === 'complete') && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-4 bg-blue-400/60 rounded-full animate-rain-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* House */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          {/* House Base */}
          <div className="w-32 h-24 bg-amber-100 border-2 border-amber-200 rounded-lg">
            {/* Roof */}
            <div className="absolute -top-6 -left-2 w-36 h-12 bg-red-500 border-2 border-red-600 rounded-lg transform -rotate-1" />
            
            {/* Water Collection Animation */}
            {(phase === 'recharge' || phase === 'complete') && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <Droplets className="h-6 w-6 text-blue-500 animate-bounce" />
              </div>
            )}
            
            {/* Door */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-brown-600 rounded-t-lg" />
            
            {/* Windows */}
            <div className="absolute top-4 left-4 w-6 h-6 bg-sky-200 border border-sky-300 rounded" />
            <div className="absolute top-4 right-4 w-6 h-6 bg-sky-200 border border-sky-300 rounded" />
          </div>
          
          {/* Home Icon */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Home className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Underground Water Recharge */}
      {(phase === 'recharge' || phase === 'complete') && (
        <div className="absolute bottom-0 left-0 right-0 h-32">
          <div className="relative h-full bg-gradient-to-t from-blue-200/40 to-transparent">
            {/* Water Level Rising Animation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-300/60 to-blue-200/30 animate-water-rise" 
                 style={{ height: phase === 'complete' ? '100%' : '50%' }} />
            
            {/* Bubbles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-300/60 rounded-full animate-bubble-up"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  bottom: `${Math.random() * 20}px`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="absolute bottom-32 right-20">
        <div className="relative">
          {/* Tree Trunk */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-12 bg-amber-800 rounded-t-lg" />
          
          {/* Tree Crown - Changes from yellow to green */}
          <div className={`relative w-16 h-16 rounded-full transition-all duration-2000 ${
            phase === 'complete' ? 'bg-green-400' : 'bg-yellow-400'
          } border-2 ${
            phase === 'complete' ? 'border-green-500' : 'border-yellow-500'
          }`}>
            <TreePine className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 transition-colors duration-2000 ${
              phase === 'complete' ? 'text-green-600' : 'text-yellow-600'
            }`} />
          </div>
          
          {/* Leaves Falling/Growing Animation */}
          {phase === 'complete' && (
            <div className="absolute top-0 left-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full animate-leaf-grow"
                  style={{
                    left: `${Math.random() * 60}px`,
                    top: `${Math.random() * 60}px`,
                    animationDelay: `${Math.random() * 1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Text Overlay */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
          {phase === 'start' && (
            <p className="text-lg font-semibold text-gray-800 animate-fade-in">
              JalRakshak AI
            </p>
          )}
          {phase === 'rain' && (
            <p className="text-lg font-semibold text-blue-600 animate-fade-in">
              Capturing Rainwater...
            </p>
          )}
          {phase === 'recharge' && (
            <p className="text-lg font-semibold text-green-600 animate-fade-in">
              Recharging Groundwater...
            </p>
          )}
          {phase === 'complete' && (
            <p className="text-lg font-semibold text-green-700 animate-fade-in">
              Growing a Greener Future! 🌱
            </p>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-64">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-water transition-all duration-1000 ease-out"
            style={{ 
              width: phase === 'start' ? '0%' : 
                     phase === 'rain' ? '33%' : 
                     phase === 'recharge' ? '66%' : '100%' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;