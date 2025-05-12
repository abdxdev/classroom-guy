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
  Quiz: { title: "Quiz", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  Mid: { title: "Mid", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  Final: { title: "Final", bgColor: "bg-purple-100", textColor: "text-purple-700" },
  Project: { title: "Proj.", bgColor: "bg-green-100", textColor: "text-green-700" },
  CCP: { title: "CCP", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
}

const schedule: ScheduleItem[] = [
  // May 2025
  {
    deadline: new Date(2025, 4, 12, 10, 30), // May 12, 2025, 10:30 AM
    title: "Data Structures",
    tag: "Quiz",
    notes: "Study binary trees and heaps. Room 301.",
  },
  {
    deadline: new Date(2025, 4, 18, 23, 59), // May 18, 2025, 11:59 PM
    title: "Mobile App Development",
    tag: "Assignment",
    notes: "Submit UI wireframes and prototype.",
  },
  {
    deadline: new Date(2025, 4, 25, 14, 0), // May 25, 2025, 2:00 PM
    title: "Database Systems",
    tag: "Mid",
    notes: "Covers normalization, SQL, and indexing.",
  },
  {
    deadline: new Date(2025, 4, 28, 15, 0), // May 28, 2025, 3:00 PM
    title: "Software Engineering",
    tag: "Project",
    notes: "Final project demo - 15 min presentation.",
  },

  // June 2025
  {
    deadline: new Date(2025, 5, 5, 23, 59), // June 5, 2025, 11:59 PM
    title: "Artificial Intelligence",
    tag: "Assignment",
    notes: "Implement A* search algorithm for pathfinding.",
  },
  {
    deadline: new Date(2025, 5, 10, 9, 0), // June 10, 2025, 9:00 AM
    title: "Computational Theory",
    tag: "Mid",
    notes: "Comprehensive exam - 3 hours.",
  },
  {
    deadline: new Date(2025, 5, 22, 13, 30), // June 22, 2025, 1:30 PM
    title: "Network Security",
    tag: "CCP",
    notes: "Workshop on encryption and network protocols.",
  },

  // July 2025
  {
    deadline: new Date(2025, 6, 8, 17, 0), // July 8, 2025, 5:00 PM
    title: "Cloud Computing",
    tag: "Project",
    notes: "Deploy microservices application to AWS.",
  },
  {
    deadline: new Date(2025, 6, 12, 11, 15), // July 12, 2025, 11:15 AM
    title: "Human-Computer Interaction",
    tag: "Quiz",
    notes: "Covers usability principles and testing methods.",
  },

  // August 2025
  {
    deadline: new Date(2025, 7, 7, 10, 0), // August 7, 2025, 10:00 AM
    title: "Computer Vision",
    tag: "Mid",
    notes: "Focus on feature extraction and object detection.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },
  {
    deadline: new Date(2025, 7, 14, 23, 59), // August 14, 2025, 11:59 PM
    title: "Distributed Systems",
    tag: "Assignment",
    notes: "Implement a consensus algorithm.",
  },

  // September 2025
  {
    deadline: new Date(2025, 8, 3, 14, 30), // September 3, 2025, 2:30 PM
    title: "Natural Language Processing",
    tag: "Quiz",
    notes: "Text classification and sentiment analysis.",
  },
  {
    deadline: new Date(2025, 8, 3, 14, 30), // September 3, 2025, 2:30 PM
    title: "Natural Language Processing",
    tag: "Quiz",
    notes: "Text classification and sentiment analysis.",
  },
  {
    deadline: new Date(2025, 8, 3, 14, 30), // September 3, 2025, 2:30 PM
    title: "Natural Language Processing",
    tag: "Quiz",
    notes: "Text classification and sentiment analysis.",
  },
  {
    deadline: new Date(2025, 8, 3, 14, 30), // September 3, 2025, 2:30 PM
    title: "Natural Language Processing",
    tag: "Quiz",
    notes: "Text classification and sentiment analysis.",
  },
]

const frameSize = 640;

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);

  const minCalendars = 1;
  const maxCalendars = 3;
  const maxItems = 14;
  
  // Apply limit to schedule if maxItems > 0
  const displayedSchedule = maxItems > 0 ? schedule.slice(0, maxItems) : schedule;

  const content = (
    <div className="flex flex-col items-center max-w-4xl mx-auto m-4 justify-between">
      <h1 className="text-2xl font-bold mb-4">📅 Schedule</h1>
      <div className="w-full h-0.25 bg-gray-200" />  {/* line */}
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
