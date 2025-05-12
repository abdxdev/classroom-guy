"use client";
import React, { useRef } from 'react';
import ScalableCanvas from '@/components/ScalableCanvas';
import Logo from '@/components/svg/logo';
import MonthlyCalendars from '@/components/MonthlyCalendars';
import ScheduleTable, { ScheduleItem, TagConfigType } from '@/components/ScheduleTable';
import { handleExport } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TagConfig: TagConfigType = {
  Assignment: { title: "Assign.", bgColor: "bg-red-100", textColor: "text-red-700" },
  Viva: { title: "Viva", bgColor: "bg-pink-100", textColor: "text-pink-700" },
  Quiz: { title: "Quiz", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  Mid: { title: "Mid", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  Final: { title: "Final", bgColor: "bg-purple-100", textColor: "text-purple-700" },
  Project: { title: "Proj.", bgColor: "bg-green-100", textColor: "text-green-700" },
  CCP: { title: "CCP", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  Other: { title: "Other", bgColor: "bg-gray-100", textColor: "text-gray-700" },
}

let schedule: ScheduleItem[] = [
  // July 2025
  {
    deadline: new Date(2025, 6, 5, 10, 30),
    title: "Data Structures",
    tag: "Viva",
    notes: "Study binary trees and heaps. Room 301.",
  },
  {
    deadline: new Date(2025, 6, 12, 23, 59),
    title: "Mobile App Development",
    tag: "Assignment",
    notes: "Submit UI wireframes and prototype.",
  },
  {
    deadline: new Date(2025, 6, 15, 14, 0),
    title: "Database Systems",
    tag: "Mid",
    notes: "Covers normalization, SQL, and indexing.",
  },
  {
    deadline: new Date(2025, 6, 28, 15, 0),
    title: "Software Engineering",
    tag: "Project",
    notes: "Final project demo - 15 min presentation.",
  },

  // August 2025
  {
    deadline: new Date(2025, 7, 5, 23, 59),
    title: "Artificial Intelligence",
    tag: "Assignment",
    notes: "Implement A* search algorithm for pathfinding.",
  },
  {
    deadline: new Date(2025, 7, 10, 9, 0),
    title: "Computational Theory",
    tag: "Mid",
    notes: "Comprehensive exam - 3 hours.",
  },
  {
    deadline: new Date(2025, 7, 15, 13, 30),
    title: "Network Security",
    tag: "CCP",
    notes: "Workshop on encryption and network protocols.",
  },
  {
    deadline: new Date(2025, 7, 20, 10, 0),
    title: "Machine Learning",
    tag: "Project",
    notes: "Neural network model deployment.",
  },
  {
    deadline: new Date(2025, 7, 20, 14, 30),
    title: "Web Security",
    tag: "Assignment",
    notes: "Penetration testing report submission.",
  },

  // September 2025
  {
    deadline: new Date(2025, 8, 5, 17, 0),
    title: "Cloud Computing",
    tag: "Project",
    notes: "Deploy microservices application to AWS.",
  },
  {
    deadline: new Date(2025, 8, 10, 11, 15),
    title: "Human-Computer Interaction",
    tag: "Quiz",
    notes: "Covers usability principles and testing methods.",
  },
  {
    deadline: new Date(2025, 8, 15, 9, 0),
    title: "Cloud Computing",
    tag: "Viva",
    notes: "Architecture and scaling discussion.",
  },
  {
    deadline: new Date(2025, 8, 15, 9, 0),
    title: "System Design",
    tag: "Quiz",
    notes: "Distributed systems implementation.",
  },
  {
    deadline: new Date(2025, 8, 15, 14, 30),
    title: "Web Development",
    tag: "Project",
    notes: "Full-stack application deployment.",
  },
  {
    deadline: new Date(2025, 8, 25, 10, 0),
    title: "Computer Graphics",
    tag: "Final",
    notes: "Ray tracing and OpenGL implementations.",
  }
]

// Sort schedule by deadline date
const sortedSchedule = [...schedule].sort((a, b) => 
  a.deadline.getTime() - b.deadline.getTime()
);

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);

  const frameSize = 640;
  const minCalendars = 1;
  const maxCalendars = 3;
  const maxItems = 15;

  const displayedSchedule = maxItems > 0 ? sortedSchedule.slice(0, maxItems) : sortedSchedule;

  const content = (
    <div className="flex flex-col items-center max-w-4xl mx-auto m-4 justify-between">
      <h1 className="text-2xl font-bold mb-4">📅 Schedule</h1>
      <div className="w-full h-0.25 bg-gray-200" />  {/* line */}
      {displayedSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-6xl mb-6">🎉</div>
          {/* <Logo className="w-20 mb-6" /> */}
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
          <div className="w-0.5 bg-gray-200" />  {/* line */}
          <ScheduleTable
            schedule={displayedSchedule}
            tagConfig={TagConfig}
            maxItems={maxItems}
          />
        </div>
      )}
      <div className="w-full h-0.25 bg-gray-200" />  {/* line */}
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
