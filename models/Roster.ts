import mongoose from "mongoose";

const RosterSchema = new mongoose.Schema(
  {
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
    guideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    participantIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],

    totalGuests: Number,
    startTime: Date,
    endTime: Date,

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "REQUESTED", "APPROVED", "PAID"],
      default: "PENDING",
    },

    paymentComment: String,
  },
  { timestamps: true },
);

export default mongoose.models.Roster || mongoose.model("Roster", RosterSchema);
