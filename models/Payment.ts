import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    amount: Number,
    currency: String,

    paymentType: String,

    transactionDate: Date,
  },
  { timestamps: true },
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
