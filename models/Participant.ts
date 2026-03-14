import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    firstName: String,
    lastName: String,
    ticketCategory: String,
    // The current status of the participant relative to the schedule.
    // BOOKED: not yet checked in
    // CHECKED_IN: scanned in
    // NO_SHOW: missed the tour
    status: {
      type: String,
      enum: ["BOOKED", "CHECKED_IN", "NO_SHOW"],
      default: "BOOKED",
    },
    checkedIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Participant ||
  mongoose.model("Participant", ParticipantSchema);
