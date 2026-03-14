import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI not defined. Add it to .env.local (or your environment).",
    );
  }
  return uri;
}

export const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(getMongoUri());
};
