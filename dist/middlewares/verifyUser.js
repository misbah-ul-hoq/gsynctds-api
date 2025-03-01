"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = verifyUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifyUser(req, res, next) {
    const authToken = req.headers.authtoken;
    if (!authToken)
        return res.status(401).send({ message: "Unauthorized" });
    const isValid = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
    if (!isValid)
        return res.status(401).send({ message: "Unauthorized" });
    next();
}
