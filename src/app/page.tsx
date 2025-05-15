"use client";

import React, { useRef, useState, useEffect } from 'react';
import ScalableCanvas from '@/components/ScalableCanvas';
import Logo from '@/components/svg/logo';
import MonthlyCalendars from '@/components/MonthlyCalendars';
import { ScheduleWithCourse } from '@/types/schedule';
import ScheduleTable from '@/components/ScheduleTable';
import { handleExport } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getSchedules } from '@/lib/modelFunctions';
import { parseISO } from 'date-fns';
import { TagConfig } from '@/constants/tags';

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);
  const [schedule, setSchedule] = useState<ScheduleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const frameSize = 640;
  const minCalendars = 1;
  const maxCalendars = 3;
  const maxItems = 15;

  useEffect(() => {
    async function loadSchedules() {
      try {
        const data = await getSchedules();
        const sortedData = [...data].sort((a, b) => {
          const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
          const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
          return dateA.getTime() - dateB.getTime();
        });
        setSchedule(sortedData);
      } catch (err) {
        console.error('Error loading schedules:', err);
        setError('Failed to load schedules');
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, []);

  const displayedSchedule = maxItems > 0 ? schedule.slice(0, maxItems) : schedule;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center max-w-4xl mx-auto m-4 justify-between">
      <h1 className="text-2xl font-bold mb-4">📅 Schedule</h1>
      <div className="w-full h-0.25 bg-gray-200" />
      {displayedSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-semibold mb-3">No Tasks Scheduled!</h2>
          <p className="text-gray-500 text-center">Enjoy your free time while it lasts!</p>
        </div>
      ) : (
        <div className="flex w-full">
          <MonthlyCalendars
            schedule={displayedSchedule}
            tagConfig={TagConfig}
            minCalendars={minCalendars}
            maxCalendars={maxCalendars}
          />
          <div className="w-0.5 bg-gray-200" />
          <ScheduleTable
            schedule={displayedSchedule}
            tagConfig={TagConfig}
            maxItems={maxItems}
          />
        </div>
      )}
      <div className="w-full h-0.25 bg-gray-200" />
      <div className="text-gray-500 mt-4 text-sm flex items-center justify-center p-4 gap-2">
        Last Checked {new Date().toLocaleString()}
        <Logo className="w-4" />
        Generated with classroom-guy.abd-dev.studio
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-screen justify-center p-4 overflow-auto">
      <ScalableCanvas
        captureRef={captureRef}
        width={frameSize}
        height={frameSize}
        className='bg-white outline outline-gray-200'
      >
        {content}
      </ScalableCanvas>
      <Button
        className="mt-4"
        onClick={() => captureRef.current && handleExport(captureRef, 'schedule.png')}
      >
        Export Schedule
      </Button>
    </div>
  );
}
