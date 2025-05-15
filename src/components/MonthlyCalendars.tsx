import React, { useMemo } from 'react';
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
import { ScheduleTableEntry } from '@/types/schedule';

interface DateHighlight {
  date: Date | string;
  className?: string;
  content?: React.ReactNode;
  tooltip?: string;
  meta?: unknown;
}

interface MonthlyCalendarsProps {
  schedule?: ScheduleTableEntry[];
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

export default function MonthlyCalendars({
  schedule = [],
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
        className: item.tag.color,
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
            highlighted: ({ date }: { date: Date }) => {
              try {
                const formattedDate = format(date, 'yyyy-MM-dd');
                return formattedDate in dateHighlights;
              } catch (error) {
                console.warn('Invalid date encountered:', error);
                return false;
              }
            },
          }}
          components={{
            DayContent: ({ date }: { date: Date }) => {
              try {
                const dateKey = format(new Date(date), 'yyyy-MM-dd');
                const dayHighlights = dateHighlights[dateKey] || [];
                const isToday = dateKey === format(new Date(), 'yyyy-MM-dd');

                if (renderDay) {
                  return renderDay(new Date(date), dayHighlights);
                }

                if (dayHighlights.length > 1) {
                  const stripeSize = 100 / dayHighlights.length;
                  const gradientParts = dayHighlights.map((highlight, idx) => {
                    const color = highlight.className || 'transparent';
                    const start = idx * stripeSize;
                    return `${color}20 ${start}%, ${color}20 ${start + stripeSize}%`; // Using 20 (12.5%) opacity
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
                        <span className={isToday ? "font-bold" : ""}
                              style={{ color: dayHighlights[0]?.className || 'inherit' }}>
                          {date.getDate()}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${dayHighlights[0]?.className}20` || 'transparent',
                      color: dayHighlights[0]?.className || 'inherit'
                    }}
                  >
                    <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
                  </div>
                );
              } catch (error) {
                console.warn('Invalid date encountered:', error);
                return null;
              }
            }
          }}
        />
      ))}
    </div>
  );
}