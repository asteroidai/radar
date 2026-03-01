import { z } from "zod";

const recurrenceDay = z.enum(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);

const classSchema = z.object({
  name: z.string().describe("Class name as shown on the website."),
  description: z.string().describe("Class description. Empty string if not available."),
});

const instructorSchema = z.object({
  first_name: z.string().describe("Instructor first name."),
  last_name: z.string().describe("Instructor last name. 'N/A' if only one name shown."),
});

const scheduleSchema = z.object({
  class_name: z.string().describe("Must exactly match a name in the classes array."),
  start_date: z.string().describe("ISO 8601 with timezone offset, e.g. 2026-02-15T09:00:00-05:00."),
  duration_in_minutes: z.number().int().min(1).describe("Class duration in minutes. Default 60 if not shown."),
  instructor_first_name: z.string().describe("Instructor first name, or empty string if none listed."),
  instructor_last_name: z.string().describe("Instructor last name, or empty string if none listed."),
  is_recurring: z.boolean().describe("Whether this class recurs weekly."),
  recurrence_days: z.array(recurrenceDay).min(1).nullable().describe("Days of week this class recurs. Null if not recurring."),
});

export const gymOutputSchema = z.object({
  venue_address: z.string().nullable().describe("Full venue address as displayed on the website. Null if not found."),
  schedule_url: z.string().nullable().describe("URL where the schedule was found. Null if not found."),
  classes: z.array(classSchema).describe("All classes found on the schedule after exclusion filtering. Empty array if none listed."),
  instructors: z.array(instructorSchema).describe("Instructors found on the schedule. Empty array if none listed."),
  schedules: z.array(scheduleSchema).describe("Schedule entries for the next 7-14 days. Empty array if none listed."),
});

export type GymOutput = z.infer<typeof gymOutputSchema>;
