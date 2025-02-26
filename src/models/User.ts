import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
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

const User = mongoose.model("User", UserSchema);

export default User;
