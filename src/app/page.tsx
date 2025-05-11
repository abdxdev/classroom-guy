"use client";
import React, { useRef } from 'react';
import { handleExport } from '@/lib/utils';
import ScalableCanvas from '@/components/ScalableCanvas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';

enum TaskTag {
  Assignment = "Assignment",
  Quiz = "Quiz",
  Mid = "Mid",
  Final = "Final",
  Project = "Project",
  CCP = "CCP"
}

type ScheduleItem = {
  date: string;
  title: string;
  tag: TaskTag;
}

const schedule: ScheduleItem[] = [
  {
    date: "10-01-2025",
    title: "DAA",
    tag: TaskTag.Assignment,
  },
  {
    date: "10-01-2025",
    title: "CN",
    tag: TaskTag.Quiz,
  },
  {
    date: "10-01-2025",
    title: "ML",
    tag: TaskTag.Project,
  },
  {
    date: "10-01-2025",
    title: "Final Exam",
    tag: TaskTag.Final,
  },
  {
    date: "10-01-2025",
    title: "Final Exam",
    tag: TaskTag.Final,
  },
  {
    date: "10-01-2025",
    title: "Final Exam",
    tag: TaskTag.Final,
  },
]

const frameSize = 640;

export default function Home() {
  const captureRef = useRef<HTMLDivElement>(null);

  const content = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Tag</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedule.map((item) => (
          <TableRow key={item.title}>
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>{item.tag}</TableCell>
            <TableCell>{item.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex flex-col items-center h-screen justify-center">
      <ScalableCanvas
        captureRef={captureRef}
        width={frameSize}
        height={frameSize}
        className='bg-white border'
      >
        {content}
      </ScalableCanvas>
      <Button onClick={() => handleExport(captureRef)} className="mt-4 px-4 py-2 rounded">
        Export as PNG
      </Button>
    </div>
  );
}
