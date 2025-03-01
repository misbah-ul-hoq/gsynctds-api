import e from "express";
import dotenv from "dotenv";
import { verifyUser } from "../middlewares/verifyUser";
import Event from "../models/Event";
import { fetchGoogleCalendar } from "../utils/functions/fetchGoogleCalendar";
import jwt, { JwtPayload } from "jsonwebtoken";

dotenv.config();
const eventRoutes = e.Router();

eventRoutes.post("/", verifyUser, async (req, res) => {
  const {
    id,
    summary,
    description,
    start,
    end,
    status,
    priority,
    accessToken,
  } = req.body;

  const email = req.headers.email as string;
  let event;

  if (!id) {
    // save the event to mongodb.
    event = await new Event({
      summary,
      email,
      description,
      start,
      end,
      status,
      priority,
    }).save();
  }
  return res.send({
    message: "Event saved successfully to mongodb.",
    event,
  });
});

// sync all post events
eventRoutes.post("/sync", verifyUser, async (req, res) => {
  const { _id, accessToken } = req.body;
  const email = req.headers.email as string;
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  // the event is saved at mongodb first then synced to google calendar
  if (_id) {
    const event = await Event.findById(_id);
    if (!event) return res.status(404).send({ message: "Event not found." });
    if (!event?.isSavedToCalendar) {
      const calendarEvent = await fetchGoogleCalendar(
        "POST",
        accessToken,
        undefined,
        {
          summary: event?.summary,
          description: event?.description,
          start: event?.start,
          end: event?.end,
          status: event?.status,
          priority: event?.priority,
        }
      );
      console.log(calendarEvent);
      event.isSavedToCalendar = true;
      event.id = calendarEvent.id;
      await event.save();
      return res.send({
        message: "Event synced to google calendar.",
        eventFromCalendar: calendarEvent,
        eventFromMongoDb: event,
      });
    }
  }

  // the event is saved at google calendar first then synced to mongodb
  const events = await fetchGoogleCalendar("GET", accessToken);
  const allEvents = await Event.find();
  console.log({
    googleEventsLinkInPost: events.items.length,
    mongodbEventsLinkInPost: allEvents.length,
  });

  // compare the events from google calendar and mongodb. if they are not equal then sync the events.
  if (events.items.length !== allEvents.length) {
    const savedEvents = events?.items.map(async (event: any) => {
      // save events to mongodb if not already saved.
      const eventExists = await Event.findOne({ id: event.id });
      if (eventExists) return eventExists;
      if (!eventExists) {
        return await new Event({
          id: event.id,
          email,
          summary: event.summary,
          description: event.description || " ",
          start: event.start,
          end: event.end,
          status: event.status,
          priority: event.priority,
          isSavedToCalendar: true,
        }).save();
      }
    });
    return res.send({
      message: "Events synced to mongodb.",
      events: savedEvents,
    });
  }

  res.send({
    message: "Events already synced to google calendar.",
  });
});

// sync the deleted events to google calendar on every render.
eventRoutes.delete("/sync-all", verifyUser, async (req, res) => {
  const { accessToken, _id } = req.body;
  const email = req.headers.email as string;
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  const events = await Event.find({ email });
  const googleEvents = await fetchGoogleCalendar("GET", accessToken);
  const googleItems = googleEvents.items;
  const googleItemsKeys: Record<string, string> = {};
  console.log({
    googleEventsLinkInDelete: events.length,
    mongodbEventsLinkInDelete: googleItems.length,
  });
  googleItems.forEach((item: any) => {
    googleItemsKeys[item.id] = item.id;
  });
  // if mongodb has more events than google calendar, then the event was deleted from google calendar.
  if (events.length > googleItems.length) {
    const toDelete = events.map(async (event) => {
      if (!googleItemsKeys[event.id]) {
        await Event.findOneAndDelete({ id: event.id });
        return googleItemsKeys.hasOwnProperty(event.id);
      }
    });
    return res.send({
      message: "Events deleted from mongodb and synced to google calendar.",
    });
  }

  // events ids in mongodb.
  const eventsKeys: Record<string, string> = {};
  events.forEach((event) => {
    eventsKeys[event.id] = event.id;
  });

  // if google calendar has more events than mongodb, then the event was deleted from mongodb.
  if (googleItems.length > events.length) {
    googleItems.forEach(async (item: any) => {
      if (!eventsKeys[item.id]) {
        await fetchGoogleCalendar("DELETE", accessToken, item.id);
      }
    });
    return res.send({
      message: "Events deleted from google calendar and synced to mongodb.",
    });
  }

  // if all events are deleted from google calendar, delete all events from mongodb.
  if (googleEvents.items.length === 0) {
    await Event.deleteMany({});
    return res.send({ message: "Events synced to google calendar." });
  }

  return res.send({ message: "Already synced." });
});

// sync all updated events
eventRoutes.put("/sync", verifyUser, async (req, res) => {
  const { _id, accessToken } = req.body;
  const email = req.headers.email as string;
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  const event = await Event.findById(_id);
  if (event?.email !== email)
    return res.status(401).send({ message: "Unauthorized." });
  if (!event) return res.status(404).send({ message: "Event not found." });
  if (event?.isSavedToCalendar) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event?.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: event?.summary,
          description: event?.description,
          start: event?.start,
          end: event?.end,
          status: event?.status,
          priority: event?.priority,
        }),
      }
    );
    if (!response.ok) {
      return res
        .status(500)
        .send({ message: "Failed to sync events to google calendar." });
    }
    const events = await response.json();
    return res.send(events);
  }
  res.send({
    message: "Events already synced to google calendar.",
    event,
  });
});

eventRoutes.get("/", verifyUser, async (req, res) => {
  const { email } = req.headers;
  const events = await Event.find({ email });
  res.send(events);
});

eventRoutes.get("/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  res.send(event);
});

eventRoutes.put("/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  const { summary, description, start, end, status, priority } = req.body;
  const event = await Event.findOneAndUpdate(
    { id },
    {
      summary,
      description,
      start,
      end,
      status,
      priority,
    },
    { new: true }
  );
  res.send(event);
});

eventRoutes.delete("/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const event = await Event.findByIdAndDelete(id);
  console.log(event);
  res.send(event);
});

// send the total number of events from both mongodb and google calendar.
eventRoutes.post("/count/all", verifyUser, async (req, res) => {
  if (!req.body.accessToken)
    return res.send({ message: "Must login with google to sync events." });
  const events = await Event.find({});
  const googleEvents = await fetchGoogleCalendar("GET", req.body.accessToken);
  console.log({
    events: events.length,
    googleEvents: googleEvents.items.length,
    shouldSync: events.length !== googleEvents.items.length,
  });
  res.send({
    events: events.length,
    googleEvents: googleEvents.items.length,
    shouldSync: events.length !== googleEvents.items.length,
  });
});

export default eventRoutes;

// TODO
