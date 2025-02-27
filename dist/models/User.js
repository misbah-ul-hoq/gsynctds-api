"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    secret: {
        ascii: String,
        hex: String,
        base32: String,
        otpauth_url: String,
    },
    twoFactorAuthenticationEnabled: {
        type: Boolean,
        default: false,
    },
    otp: String,
    otpExpires: { type: Number, required: false },
});
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
