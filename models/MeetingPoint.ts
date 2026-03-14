import mongoose from "mongoose";

const MeetingPointSchema = new mongoose.Schema(
  {
    title: String,
    address: String,
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  { timestamps: true },
);

export default mongoose.models.MeetingPoint ||
  mongoose.model("MeetingPoint", MeetingPointSchema);
