export async function fetchGoogleCalendar(
  method: "GET" | "POST" | "DELETE" | "PUT",
  accessToken: string
) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      return { message: "Failed to sync events to google calendar." };
    }
    const events = await response.json();
    return events;
  } catch (err) {
    return { message: "An error happened", err };
  }
}
