import mongoose from "mongoose";

const CheckinSchema = new mongoose.Schema(
  {
    // The participant that was checked in
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },

    // The guide who performed the check-in
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // The schedule this check-in belongs to
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },

    // Timestamp of the scan
    timestamp: { type: Date, default: () => new Date() },

    status: {
      type: String,
      enum: ["valid", "invalid", "duplicate"],
      default: "valid",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Checkin ||
  mongoose.model("Checkin", CheckinSchema);
