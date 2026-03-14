import mongoose from "mongoose";

const TourSchema = new mongoose.Schema(
  {
    externalProductId: String,
    title: String,
    description: String,
    durationHours: Number,
    category: String,
    vendor: String,
  },
  { timestamps: true },
);

export default mongoose.models.Tour || mongoose.model("Tour", TourSchema);
