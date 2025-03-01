"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authRoutes_1 = require("../routes/authRoutes");
const eventRoutes_1 = __importDefault(require("../routes/eventRoutes"));
const routes = (app) => {
    app.use("/auth", authRoutes_1.authRoutes);
    app.use("/events", eventRoutes_1.default);
};
exports.default = routes;
