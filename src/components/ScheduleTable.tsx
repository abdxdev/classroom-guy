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
import { ScheduleTableEntry } from "@/types/schedule";

type ScheduleTableProps = {
  schedule: ScheduleTableEntry[];
  maxItems?: number;
};

export default function ScheduleTable({
  schedule,
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
                {date ? (
                  ['assignment', 'project', 'ccp'].includes(item.tagId)
                    ? (
                      <div>
                        {format(date, 'MMM dd, yyyy')}
                        <div className="text-xs text-gray-500 mt-0">
                          {format(date, 'hh:mm a')}
                        </div>
                      </div>
                    )
                    : format(date, 'MMM dd, yyyy')
                ) : (
                  <div className="text-gray-500">No Date</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge style={{ 
                    backgroundColor: `${item.tag.color}20`, // Using hex with 20 (12.5%) opacity
                    color: item.tag.color 
                  }}>
                    {item.tag.title}
                  </Badge>
                  {item.course.name}
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