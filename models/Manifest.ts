import mongoose from "mongoose";

const ManifestSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },

    date: Date,

    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],

    totalGuests: Number,
  },
  { timestamps: true },
);

export default mongoose.models.Manifest ||
  mongoose.model("Manifest", ManifestSchema);
