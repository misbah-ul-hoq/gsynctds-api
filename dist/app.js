"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./config/routes"));
const app = (0, express_1.default)();
let origin;
if (process.env.NODE_ENV === "development") {
    origin = ["http://localhost:3000"];
}
else {
    origin = ["https://gsynctds.vercel.app"];
}
// Middlewares
app.use((0, cors_1.default)({
    origin,
    credentials: true,
    allowedHeaders: ["Authorization", "authToken", "Content-Type", "authtoken"],
    exposedHeaders: ["authToken"],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
}));
app.use(express_1.default.json());
// Routes
(0, routes_1.default)(app);
// Default Route
app.get("/", (req, res) => {
    res.send("API is running for GsyncTDS...");
});
exports.default = app;
