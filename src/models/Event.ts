import { Schema } from "mongoose";

const eventSchema = new Schema({
  summary: { type: String, required: true },
  description: { type: String, required: true },
  start: {
    dateTime: { type: String },
    timeZone: {
      type: String,
      default: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  },
  end: {
    dateTime: { type: String },
    timeZone: {
      type: String,
      default: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  },
});
