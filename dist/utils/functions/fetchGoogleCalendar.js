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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGoogleCalendar = fetchGoogleCalendar;
function fetchGoogleCalendar(method, accessToken, eventId, body) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        if (method === "DELETE") {
            url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
        }
        try {
            const response = yield fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                return { message: "Failed to sync events to google calendar." };
            }
            const events = yield response.json();
            return events;
        }
        catch (err) {
            return { message: "An error happened", err };
        }
    });
}
