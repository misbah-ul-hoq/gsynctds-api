import mongoose, { Schema } from "mongoose";

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
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
