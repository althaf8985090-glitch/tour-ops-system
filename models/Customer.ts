import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    externalCustomerId: Number,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    nationality: String,
  },
  { timestamps: true },
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
