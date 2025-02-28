import e from "express";
import { verifyUser } from "../middlewares/verifyUser";
import Event from "../models/Event";

const eventRoutes = e.Router();

eventRoutes.post("/", verifyUser, async (req, res) => {
  const { id, summary, description, start, end, status, priority } = req.body;

  const event = await new Event({
    id,
    summary,
    description,
    start,
    end,
    status,
    priority,
  }).save();

  res.send(event);
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
