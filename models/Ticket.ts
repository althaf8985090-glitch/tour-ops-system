import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    barcode: String,
    barcodeType: String,
    scanned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
