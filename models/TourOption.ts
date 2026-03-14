import mongoose from "mongoose";

const TourOptionSchema = new mongoose.Schema(
  {
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    rateId: Number,
    title: String,
    minParticipants: Number,
    maxParticipants: Number,
  },
  { timestamps: true },
);

export default mongoose.models.TourOption ||
  mongoose.model("TourOption", TourOptionSchema);
