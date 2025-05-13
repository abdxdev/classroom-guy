import { ValidTag } from "@/constants/tags";

export type TagConfigType = {
  [key in ValidTag]: {
    title: string;
    bgColor: string;
    textColor: string;
  }
};

export type ScheduleItem = {
  _id?: string;
  deadline: string | Date;
  title: string;
  tag: ValidTag;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};