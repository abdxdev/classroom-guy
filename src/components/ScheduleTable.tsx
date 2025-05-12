import { format } from "date-fns";
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

export type TagConfigType = {
  [key in string]: {
    title: string;
    bgColor: string;
    textColor: string;
  }
};

export type TaskTagType = string;

export type ScheduleItem = {
  deadline: Date;
  title: string;
  tag: TaskTagType;
  notes?: string;
};

type ScheduleTableProps = {
  schedule: ScheduleItem[];
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
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedSchedule.map((item, index) => (
          <TableRow key={index}>
            <TableCell>
              {item.deadline && (
                ['Assignment', 'Project', 'CCP'].includes(item.tag)
                  ? (
                    <div>
                      {format(item.deadline, 'MMM dd, yyyy')}
                      <div className="text-xs text-gray-500 mt-0">
                        {format(item.deadline, 'hh:mm a')}
                      </div>
                    </div>
                  )
                  : format(item.deadline, 'MMM dd, yyyy')
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge className={cn(tagConfig[item.tag].bgColor, tagConfig[item.tag].textColor)}>
                  {tagConfig[item.tag].title}
                </Badge>
                {item.title}
              </div>
            </TableCell>
            <TableCell className="whitespace-normal min-w-60">{item.notes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}