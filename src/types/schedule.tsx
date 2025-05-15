import { ValidTag } from "@/constants/tags";
import { Course, Schedule } from "./db";

export type TagConfigType = {
  [key in ValidTag]: {
    title: string;
    bgColor: string;
    textColor: string;
  }
};

export type ScheduleWithCourse = Schedule & {
  course?: Omit<Course, '_id'> & { _id: string };
};