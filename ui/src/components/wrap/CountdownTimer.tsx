'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  timeRemaining: number | null; // seconds remaining
  className?: string;
}

export function CountdownTimer({ timeRemaining, className = '' }: CountdownTimerProps) {
  const [currentTime, setCurrentTime] = useState<number | null>(timeRemaining);

  useEffect(() => {
    setCurrentTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (currentTime === null || currentTime <= 0) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime]);

  if (timeRemaining === null) return null;
  if (currentTime === null || currentTime < 0) return null;

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00:00';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isReady = currentTime <= 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-defi-blue" />
      <div className="text-sm">
        {isReady ? (
          <span className="text-green-400 font-medium">Ready for fulfillment</span>
        ) : (
          <div className="flex flex-col">
            <span className="text-muted-foreground">Time remaining:</span>
            <span className="font-mono text-lg font-medium text-defi-purple">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-muted-foreground">
              DD:HH:MM:SS
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 