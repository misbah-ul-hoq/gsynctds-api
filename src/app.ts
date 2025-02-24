import express from "express";
import cors from "cors";
import routes from "./config/routes";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
routes(app);

// Default Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
