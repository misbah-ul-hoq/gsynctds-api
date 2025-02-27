"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const qrcode_1 = __importDefault(require("qrcode"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const passport_1 = __importDefault(require("passport"));
// @ts-ignore
const passport_google_oauth20_1 = __importDefault(require("passport-google-oauth20"));
const GoogleStrategy = passport_google_oauth20_1.default.Strategy;
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const authRoutes = express_1.default.Router();
exports.authRoutes = authRoutes;
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
authRoutes.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    const userExists = yield User_1.default.findOne({ email });
    if (userExists)
        return res.status(401).send({ message: "User already exists" });
    const salt = yield bcrypt_1.default.genSalt(10);
    const hashedPassword = yield bcrypt_1.default.hash(password, salt);
    const secret = speakeasy_1.default.generateSecret({
        name: "GsyncTDS",
    });
    const user = yield new User_1.default({
        name,
        email,
        password: hashedPassword,
        secret,
    }).save();
    res.send({
        name: user.name,
        email: user.email,
        secret: user.secret,
    });
}));
authRoutes.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
        return res.status(401).send({ message: "Invalid credentials" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000;
    yield user.save();
    yield transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "GsyncTDS OTP",
        html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 50px;">
    <div style="background: white; padding: 20px; border-radius: 10px; width: 100%; max-width: 400px; margin: auto; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; ">Your OTP Code</h2>
        <p style="background:#353535; width:120px; padding-block:8px; margin:auto; color: #fff; font-size: 24px; font-weight: bold;">${otp}</p>
        <p style="color: #666;">Use this OTP to verify your email. It is valid for 2 minutes.</p>
    </div>
</body>

    `,
    });
    res.send({
        message: "OTP sent successfully, please check your email",
    });
}));
authRoutes.post("/verify-email-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, otp } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user ||
        user.otp !== otp ||
        !user.otpExpires ||
        user.otpExpires < Date.now())
        return res.status(404).send({ message: "Invalid or Expired OTP" });
    qrcode_1.default.toDataURL(((_a = user === null || user === void 0 ? void 0 : user.secret) === null || _a === void 0 ? void 0 : _a.otpauth_url) || "", function (err, url) {
        res.send({
            message: "Email OTP verified successfully, now proceed to QR code verification.",
            qrCode: url,
            twoFactorAuthenticationEnabled: user.twoFactorAuthenticationEnabled,
        });
    });
}));
authRoutes.post("/request-new-email-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(404).send({ message: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000;
    yield user.save();
    yield transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "GsyncTDS OTP",
        html: `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 50px;">
    <div style="background: white; padding: 20px; border-radius: 10px; width: 100%; max-width: 400px; margin: auto; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; ">Your OTP Code</h2>
        <p style="background:#353535; width:120px; padding-block:8px; margin:auto; color: #fff; font-size: 24px; font-weight: bold;">${otp}</p>
        <p style="color: #666;">Use this OTP to verify your email. It is valid for 2 minutes.</p>
    </div>
</body>

    `,
    });
    res.send({
        message: "OTP sent successfully, please check your email",
    });
}));
authRoutes.post("/verify-authenticator-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, otp } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        return res.status(404).send({ message: "Invalid OTP" });
    const verified = speakeasy_1.default.totp.verify({
        secret: (_a = user === null || user === void 0 ? void 0 : user.secret) === null || _a === void 0 ? void 0 : _a.base32,
        encoding: "base32",
        token: otp,
    });
    if (!verified)
        return res.status(401).send({ message: "Invalid OTP" });
    if (!user.twoFactorAuthenticationEnabled) {
        user.twoFactorAuthenticationEnabled = true;
        yield user.save();
    }
    const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({
        message: "OTP verified successfully",
        authToken: token,
    });
}));
authRoutes.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO
    const authToken = req.headers.authtoken;
    // const authToken =
    //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
    if (!authToken) {
        return res.status(401).send({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded._id).select([
            "-password",
            "-secret",
            "-otp",
            "-otpExpires",
        ]);
        res.send(user);
    }
    catch (error) {
        // @ts-ignore
        res.send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
}));
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // callbackURL: "http://www.example.com/auth/google/callback",
}, 
// @ts-ignore
function (accessToken, refreshToken, profile, cb) {
    return { accessToken, refreshToken, profile };
}));
authRoutes.get("/google", passport_1.default.authenticate("google", { scope: ["profile"] }));
authRoutes.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/login" }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});
