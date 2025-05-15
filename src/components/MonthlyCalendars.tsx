"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import {
  format,
  parse,
  addMonths,
  startOfMonth,
  differenceInMonths,
  parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Schedule } from '@/types/db';
import { TagConfigType } from '@/types/schedule';

interface DateHighlight {
  date: Date | string;
  className?: string;
  content?: React.ReactNode;
  tooltip?: string;
  meta?: unknown;
}

interface MonthlyCalendarsProps {
  schedule?: Schedule[];
  tagConfig?: Partial<TagConfigType>;  // Changed to Partial to make it optional
  highlights?: DateHighlight[];
  startDate?: Date | string;
  endDate?: Date | string;
  dateFormat?: string;
  minCalendars?: number;
  maxCalendars?: number;
  showNavigation?: boolean;
  className?: string;
  calendarClassName?: string;
  renderDay?: (date: Date, highlights: DateHighlight[]) => React.ReactNode;
}

const getTailwindColor = (className?: string): string => {
  if (!className || typeof window === 'undefined') return 'transparent';
  
  try {
    const tempDiv = document.createElement('div');
    tempDiv.className = className;
    document.body.appendChild(tempDiv);
    const bgColor = window.getComputedStyle(tempDiv).backgroundColor;
    document.body.removeChild(tempDiv);
    return bgColor;
  } catch (error) {
    console.warn('Error computing tailwind color:', error);
    return 'transparent';
  }
};

const useComputedColor = (className?: string) => {
  const [color, setColor] = useState('transparent');

  useEffect(() => {
    setColor(getTailwindColor(className));
  }, [className]);

  return color;
};

export default function MonthlyCalendars({
  schedule = [],
  tagConfig = {},
  highlights = [],
  startDate,
  endDate,
  dateFormat = 'yyyy-MM-dd',
  minCalendars = 1,
  maxCalendars = 3,
  showNavigation = false,
  className,
  calendarClassName,
  renderDay,
}: MonthlyCalendarsProps) {
  const { dateHighlights, monthsToDisplay } = useMemo(() => {
    const highlightMap: Record<string, DateHighlight[]> = {};
    const allDates: Date[] = [];

    highlights.forEach(highlight => {
      const date = typeof highlight.date === 'string'
        ? parse(highlight.date, dateFormat, new Date())
        : highlight.date;

      const dateKey = format(date, 'yyyy-MM-dd');

      if (!highlightMap[dateKey]) {
        highlightMap[dateKey] = [];
      }
      highlightMap[dateKey].push({
        ...highlight,
        date
      });

      allDates.push(date);
    });

    schedule.forEach(item => {
      const date = typeof item.date === 'string' ? parseISO(item.date) : item.date;
      if (!date) return;

      const dateKey = format(date, 'yyyy-MM-dd');

      if (!highlightMap[dateKey]) {
        highlightMap[dateKey] = [];
      }

      highlightMap[dateKey].push({
        date,
        className: item.tag && tagConfig[item.tag]?.bgColor,
        meta: item
      });
      allDates.push(date);
    });

    let firstMonth: Date;
    let lastMonth: Date;

    if (startDate && endDate) {
      firstMonth = startOfMonth(typeof startDate === 'string'
        ? parse(startDate, dateFormat, new Date())
        : startDate);
      lastMonth = startOfMonth(typeof endDate === 'string'
        ? parse(endDate, dateFormat, new Date())
        : endDate);
    } else if (allDates.length > 0) {
      const sortedDates = [...allDates].sort((a, b) => a.getTime() - b.getTime());
      firstMonth = startOfMonth(sortedDates[0]);
      lastMonth = startOfMonth(sortedDates[sortedDates.length - 1]);
    } else {
      const currentDate = new Date();
      firstMonth = startOfMonth(currentDate);
      lastMonth = firstMonth;
    }

    let monthDiff = differenceInMonths(lastMonth, firstMonth) + 1;
    monthDiff = Math.max(minCalendars, Math.min(maxCalendars, monthDiff));

    return {
      dateHighlights: highlightMap,
      monthsToDisplay: Array.from({ length: monthDiff }, (_, i) =>
        addMonths(firstMonth, i)
      )
    };
  }, [
    highlights,
    schedule,
    startDate,
    endDate,
    minCalendars,
    maxCalendars,
    dateFormat,
    tagConfig
  ]);

  return (
    <div className={cn("flex flex-col", className)}>
      {monthsToDisplay.map((month, index) => (
        <Calendar
          key={index}
          mode="single"
          month={month}
          defaultMonth={month}
          className={cn("rounded-md p-2", calendarClassName)}
          hideNavigation={!showNavigation}
          modifiersClassNames={{
            today: "bg-none",
          }}
          modifiers={{
            highlighted: (date) => format(date, 'yyyy-MM-dd') in dateHighlights,
          }}
          components={{
            DayContent: ({ date }) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayHighlights = dateHighlights[dateKey] || [];
              const isToday = dateKey === format(new Date(), 'yyyy-MM-dd');

              if (renderDay) {
                return renderDay(date, dayHighlights);
              }

              if (dayHighlights.length > 1) {
                const stripeSize = 100 / dayHighlights.length;
                const gradientParts = dayHighlights.map((highlight, idx) => {
                  const color = useComputedColor(highlight.className);
                  const start = idx * stripeSize;
                  return `${color} ${start}%, ${color} ${start + stripeSize}%`;
                });

                return (
                  <div className="w-full h-full relative">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `repeating-linear-gradient(135deg, ${gradientParts.join(', ')})`
                      }}
                    />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span className={isToday ? "font-bold" : ""}>
                        {date.getDate()}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  dayHighlights[0]?.className,
                )}>
                  <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
                </div>
              );
            }
          }}
        />
      ))}
    </div>
  );
}