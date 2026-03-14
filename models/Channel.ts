import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    uuid: String,
  },
  { timestamps: true },
);

export default mongoose.models.Channel ||
  mongoose.model("Channel", ChannelSchema);
