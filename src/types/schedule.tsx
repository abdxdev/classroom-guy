export type TagConfigType = {
  [key in string]: {
    title: string;
    bgColor: string;
    textColor: string;
  }
};

export type ScheduleItem = {
  _id?: string;
  deadline: string | Date;
  title: string;
  tag: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};