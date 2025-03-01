export async function fetchGoogleCalendar(
  method: "GET" | "POST" | "DELETE" | "PUT",
  accessToken: string,
  eventId?: string,
  body?: any
) {
  let url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  if (method === "DELETE") {
    url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  }
  try {
    const response = await fetch(url, {
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
    const events = await response.json();
    return events;
  } catch (err) {
    return { message: "An error happened", err };
  }
}
