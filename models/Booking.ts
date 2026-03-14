import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    bookingId: Number,
    confirmationCode: String,
    externalReference: String,

    status: String,
    passType: String,
    optionCode: String,
    resellerId: String,
    currency: String,

    totalPrice: Number,
    totalPaid: Number,

    channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

    activityBookingId: Number,

    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },

    startDateTime: Date,
    endDateTime: Date,

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
