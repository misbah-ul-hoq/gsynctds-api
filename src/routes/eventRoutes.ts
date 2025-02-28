import e from "express";
import { verifyUser } from "../middlewares/verifyUser";
import Event from "../models/Event";

const eventRoutes = e.Router();

eventRoutes.post("/", verifyUser, async (req, res) => {
  const { summary, description, start, end, status, priority } = req.body;

  const event = await new Event({
    summary,
    description,
    start,
    end,
    status,
    priority,
  }).save();

  res.send(event);
});

export default eventRoutes;

// TODO
