import express from "express";
import cors from "cors";
import routes from "./config/routes";

const app = express();

let origin;
if (process.env.NODE_ENV === "development") {
  origin = ["http://localhost:3000"];
} else {
  origin = ["https://gsynctds.vercel.app"];
}

// Middlewares
app.use(
  cors({
    origin,
    credentials: true,
    allowedHeaders: ["Authorization", "authToken", "Content-Type", "authtoken"],
    exposedHeaders: ["authToken"],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());

// Routes
routes(app);

// Default Route
app.get("/", (req, res) => {
  res.send("API is running for GsyncTDS...");
});

export default app;
