"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUser_1 = require("../middlewares/verifyUser");
const Event_1 = __importDefault(require("../models/Event"));
const fetchGoogleCalendar_1 = require("../utils/functions/fetchGoogleCalendar");
const eventRoutes = express_1.default.Router();
eventRoutes.post("/", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, summary, description, start, end, status, priority, accessToken, } = req.body;
    let event;
    if (!id) {
        // save the event to mongodb.
        event = yield new Event_1.default({
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
}));
// sync all post events
eventRoutes.post("/sync", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, accessToken } = req.body;
    if (!accessToken)
        return res.send({ message: "Must login with google to sync events." });
    // the event is saved at mongodb first then synced to google calendar
    if (_id) {
        const event = yield Event_1.default.findById(_id);
        if (!event)
            return res.status(404).send({ message: "Event not found." });
        if (!(event === null || event === void 0 ? void 0 : event.isSavedToCalendar)) {
            const events = yield (0, fetchGoogleCalendar_1.fetchGoogleCalendar)("POST", accessToken);
            event.isSavedToCalendar = true;
            event.id = events.items.id;
            yield event.save();
            return res.send({
                message: "Event synced to google calendar.",
                eventFromCalendar: events,
                eventFromMongoDb: event,
            });
        }
    }
    // the event is saved at google calendar first then synced to mongodb
    const events = yield (0, fetchGoogleCalendar_1.fetchGoogleCalendar)("GET", accessToken);
    console.log(events);
    const allEvents = yield Event_1.default.find();
    // compare the events from google calendar and mongodb. if they are not equal then sync the events.
    if (events.items.length !== allEvents.length) {
        const savedEvents = events.items.map((event) => __awaiter(void 0, void 0, void 0, function* () {
            // save events to mongodb if not already saved.
            const eventExists = yield Event_1.default.findOne({ id: event.id });
            if (eventExists)
                return eventExists;
            if (!eventExists) {
                return yield new Event_1.default({
                    id: event.id,
                    summary: event.summary,
                    description: event.description || " ",
                    start: event.start,
                    end: event.end,
                    status: event.status,
                    priority: event.priority,
                    isSavedToCalendar: true,
                }).save();
            }
        }));
        return res.send({
            message: "Events synced to mongodb.",
            events: savedEvents,
        });
    }
    // await Promise.all(savedEvents);
    res.send({
        message: "Events already synced to google calendar.",
    });
}));
// sync the deleted events to google calendar on every render.
eventRoutes.delete("/sync-all", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, _id } = req.body;
    if (!accessToken)
        return res.send({ message: "Must login with google to sync events." });
    const event = yield Event_1.default.findById(_id);
    const syncedEvents = yield Event_1.default.find({ isSavedToCalendar: true });
    const response = yield fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        console.log(response);
        return res
            .status(500)
            .send({ message: "Failed to sync events to google calendar." });
    }
    const events = yield response.json();
    const googleEvents = events.items;
    // if all events are deleted from google calendar, delete all events from mongodb.
    if (googleEvents.length === 0) {
        yield Event_1.default.deleteMany({});
        return res.send({ message: "Events synced to google calendar.", events });
    }
    googleEvents.map((event) => {
        Event_1.default.findOneAndDelete({ id: event.id });
    });
    return res.send(events);
}));
// sync all updated events
eventRoutes.put("/sync", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, accessToken } = req.body;
    if (!accessToken)
        return res.send({ message: "Must login with google to sync events." });
    const event = yield Event_1.default.findById(_id);
    if (!event)
        return res.status(404).send({ message: "Event not found." });
    if (event === null || event === void 0 ? void 0 : event.isSavedToCalendar) {
        const response = yield fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event === null || event === void 0 ? void 0 : event.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                summary: event === null || event === void 0 ? void 0 : event.summary,
                description: event === null || event === void 0 ? void 0 : event.description,
                start: event === null || event === void 0 ? void 0 : event.start,
                end: event === null || event === void 0 ? void 0 : event.end,
                status: event === null || event === void 0 ? void 0 : event.status,
                priority: event === null || event === void 0 ? void 0 : event.priority,
            }),
        });
        if (!response.ok) {
            return res
                .status(500)
                .send({ message: "Failed to sync events to google calendar." });
        }
        const events = yield response.json();
        return res.send(events);
    }
    res.send({
        message: "Events already synced to google calendar.",
        event,
    });
}));
eventRoutes.get("/", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const events = yield Event_1.default.find({});
    res.send(events);
}));
eventRoutes.get("/:id", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const event = yield Event_1.default.findById(id);
    res.send(event);
}));
eventRoutes.put("/:id", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { summary, description, start, end, status, priority } = req.body;
    const event = yield Event_1.default.findOneAndUpdate({ id }, {
        summary,
        description,
        start,
        end,
        status,
        priority,
    }, { new: true });
    res.send(event);
}));
eventRoutes.delete("/:id", verifyUser_1.verifyUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const event = yield Event_1.default.findOneAndDelete({ id });
    res.send(event);
}));
exports.default = eventRoutes;
// TODO
