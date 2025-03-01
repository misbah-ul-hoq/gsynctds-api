import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  id: { type: String, required: false },
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
  status: {
    type: String,
    enum: ["confirmed", "tentative", "cancelled"],
    default: "confirmed",
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium",
  },
  isSavedToCalendar: { type: Boolean, default: false },
  isDeletedFromCalendar: { type: Boolean, default: false },
  isUpdatedOnCalendar: { type: Boolean, default: false },
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
