'use client'

import { useState, useEffect } from 'react'

export interface CountdownData {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isFinished: boolean
  formatted: string
}

export function useCountdown(targetTime: number): CountdownData {
  const [timeLeft, setTimeLeft] = useState<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isFinished: true,
    formatted: '0d 0h 0m 0s'
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const difference = targetTime - now

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isFinished: true,
          formatted: 'Finished!'
        }
      }

      const days = Math.floor(difference / 86400)
      const hours = Math.floor((difference % 86400) / 3600)
      const minutes = Math.floor((difference % 3600) / 60)
      const seconds = Math.floor(difference % 60)

      return {
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: difference,
        isFinished: false,
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
      }
    }

    // Update immediately
    setTimeLeft(calculateTimeLeft())

    // Then update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
} 