import express from "express";
import cors from "cors";
import routes from "./config/routes";

const app = express();

let origin;
if (process.env.NODE_ENV === "development") {
  origin = "http://localhost:3000";
} else {
  origin = "https://gsynctds.vercel.app";
}
// Middlewares
app.use(express.json());
app.use(cors({ origin }));

// Routes
routes(app);

// Default Route
app.get("/", (req, res) => {
  res.send("API is running for GsyncTDS...");
});

export default app;
