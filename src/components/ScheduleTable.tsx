// "use client";

import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TagConfigType, ScheduleWithCourse } from "@/types/schedule";

type ScheduleTableProps = {
  schedule: ScheduleWithCourse[];
  tagConfig: TagConfigType;
  maxItems?: number;
};

export default function ScheduleTable({
  schedule,
  tagConfig,
  maxItems = 0
}: ScheduleTableProps) {
  const displayedSchedule = maxItems > 0 ? schedule.slice(0, maxItems) : schedule;

  if (displayedSchedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">📝</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Deadline</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Description/Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedSchedule.map((item, index) => {
          const date = typeof item.date === 'string' ? parseISO(item.date) : item.date;

          return (
            <TableRow key={index}>
              <TableCell>
                {date && (
                  ['Assignment', 'Project', 'CCP'].includes(item.tag)
                    ? (
                      <div>
                        {format(date, 'MMM dd, yyyy')}
                        <div className="text-xs text-gray-500 mt-0">
                          {format(date, 'hh:mm a')}
                        </div>
                      </div>
                    )
                    : format(date, 'MMM dd, yyyy')
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge className={cn(tagConfig[item.tag].bgColor, tagConfig[item.tag].textColor)}>
                    {tagConfig[item.tag].title}
                  </Badge>
                  {item.course?.name}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal min-w-60">{item.description}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}