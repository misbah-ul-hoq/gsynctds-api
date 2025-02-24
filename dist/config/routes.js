"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authRoutes_1 = require("../routes/authRoutes");
const routes = (app) => {
    app.use("/auth", authRoutes_1.authRoutes);
};
exports.default = routes;
