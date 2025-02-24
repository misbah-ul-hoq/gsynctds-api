import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes

// Default Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
