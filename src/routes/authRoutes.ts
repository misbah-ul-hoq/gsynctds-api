import e from "express";
import speakeasy from "speakeasy";
import bcrypt from "bcrypt";
import qrcode from "qrcode";
import nodemailer from "nodemailer";
import User from "../models/User";

const authRoutes = e.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

authRoutes.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(401).send({ message: "User already exists" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const secret = speakeasy.generateSecret({
    name: "GsyncTDS",
  });

  const user = await new User({
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
});

authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 2 * 60 * 1000);
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "GsyncTDS OTP",
    text: `Your OTP code is ${otp}, valid for 2 minutes.`,
  });

  res.send({
    message: "OTP sent successfully, please check your email",
  });
});

authRoutes.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (
    !user ||
    user.otp !== otp ||
    !user.otpExpires ||
    user.otpExpires < new Date()
  )
    return res.status(404).send({ message: "Invalid OTP" });

  qrcode.toDataURL(user?.secret?.otpauth_url || "", function (err, url) {
    res.send({
      message:
        "Email OTP verified successfully, now proceed qr code verification.",
      qrCode: url,
    });
  });
});

authRoutes.post("/verify-authenticator-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "Invalid OTP" });

  if (!user.twoFactorAuthenticationEnabled) {
    user.twoFactorAuthenticationEnabled = true;
    await user.save();
  }

  const verified = speakeasy.totp.verify({
    secret: user?.secret?.base32 as string,
    encoding: "base32",
    token: otp,
  });

  if (!verified) return res.status(401).send({ message: "Invalid OTP" });

  res.send({
    message: "OTP verified successfully",
  });
});

export { authRoutes };
