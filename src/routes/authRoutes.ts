import e from "express";
import dotenv from "dotenv";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import qrcode from "qrcode";
import nodemailer from "nodemailer";

import User from "../models/User";

dotenv.config();
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
    return res.status(401).send({ message: "Invalid credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 2 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
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
});

authRoutes.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (
    !user ||
    user.otp !== otp ||
    !user.otpExpires ||
    user.otpExpires < Date.now()
  )
    return res.status(404).send({ message: "Invalid or Expired OTP" });

  qrcode.toDataURL(user?.secret?.otpauth_url || "", function (err, url) {
    res.send({
      message:
        "Email OTP verified successfully, now proceed to QR code verification.",
      qrCode: url,
      twoFactorAuthenticationEnabled: user.twoFactorAuthenticationEnabled,
    });
  });
});

authRoutes.post("/request-new-email-otp", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 2 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
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
});

authRoutes.post("/verify-authenticator-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "Invalid Credentials" });

  const verified = speakeasy.totp.verify({
    secret: user?.secret?.base32 as string,
    encoding: "base32",
    token: otp,
    window: 3,
  });

  if (!verified) return res.status(401).send({ message: "Invalid OTP" });
  if (!user.twoFactorAuthenticationEnabled) {
    user.twoFactorAuthenticationEnabled = true;
    await user.save();
  }
  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.JWT_SECRET as string
  );

  res.send({
    message: "OTP verified successfully",
    authToken: token,
    email: user.email,
  });
});

authRoutes.get("/me", async (req, res) => {
  // TODO
  const authToken = req.headers.authtoken;
  // const authToken =
  //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

  if (!authToken) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(
      authToken as string,
      process.env.JWT_SECRET as string
    );
    const user = await User.findById((decoded as jwt.JwtPayload)._id).select([
      "-password",
      "-secret",
      "-otp",
      "-otpExpires",
    ]);
    res.send(user);
  } catch (error) {
    // @ts-ignore
    res.send({ message: error?.message });
  }
});

export { authRoutes };
