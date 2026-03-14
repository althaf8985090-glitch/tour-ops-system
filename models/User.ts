import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["admin", "guide", "staff"],
      default: "staff",
    },
    phone: String,
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
