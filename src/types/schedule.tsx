import { Schedule, Course, Tag } from "./db";

export type ScheduleTableEntry = Schedule & {
  course: Course;
  tag: Tag;
};