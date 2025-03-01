import e from "express";
import { verifyUser } from "../middlewares/verifyUser";
import Event from "../models/Event";
import { fetchGoogleCalendar } from "../utils/functions/fetchGoogleCalendar";

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
  let event;
  if (!id) {
    // save the event to mongodb.
    event = await new Event({
      summary,
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
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  // the event is saved at mongodb first then synced to google calendar
  if (_id) {
    const event = await Event.findById(_id);
    if (!event) return res.status(404).send({ message: "Event not found." });
    if (!event?.isSavedToCalendar) {
      const events = await fetchGoogleCalendar("POST", accessToken);
      event.isSavedToCalendar = true;
      event.id = events.items.id;
      await event.save();
      return res.send({
        message: "Event synced to google calendar.",
        eventFromCalendar: events,
        eventFromMongoDb: event,
      });
    }
  }

  // the event is saved at google calendar first then synced to mongodb
  const events = await fetchGoogleCalendar("GET", accessToken);

  console.log(events);
  const allEvents = await Event.find();
  // save events to mongodb if not already saved.
  if (events.items.length !== allEvents.length) {
    const savedEvents = events.items.map(async (event: any) => {
      return await new Event({
        id: event.id,
        summary: event.summary,
        description: event.description || " ",
        start: event.start,
        end: event.end,
        status: event.status,
        priority: event.priority,
        isSavedToCalendar: true,
      }).save();
    });
    return res.send({
      message: "Events synced to mongodb.",
      events: savedEvents,
    });
  }

  // await Promise.all(savedEvents);

  res.send({
    message: "Events already synced to google calendar.",
  });
});

// sync the deleted events to google calendar on every render.
eventRoutes.delete("/sync-all", verifyUser, async (req, res) => {
  const { accessToken, _id } = req.body;
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  const event = await Event.findById(_id);
  const syncedEvents = await Event.find({ isSavedToCalendar: true });

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    console.log(response);
    return res
      .status(500)
      .send({ message: "Failed to sync events to google calendar." });
  }

  const events = await response.json();
  const googleEvents = events.items;
  // if all events are deleted from google calendar, delete all events from mongodb.
  if (googleEvents.length === 0) {
    await Event.deleteMany({});
    return res.send({ message: "Events synced to google calendar.", events });
  }
  googleEvents.map((event: any) => {
    Event.findOneAndDelete({ id: event.id });
  });
  return res.send(events);
});

// sync all updated events
eventRoutes.put("/sync", verifyUser, async (req, res) => {
  const { _id, accessToken } = req.body;
  if (!accessToken)
    return res.send({ message: "Must login with google to sync events." });

  const event = await Event.findById(_id);
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
  const events = await Event.find({});
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
  const event = await Event.findOneAndDelete({ id });
  res.send(event);
});

export default eventRoutes;

// TODO
