import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  cid: {
      type: String,
      required: false,
  },
  description: {
    type: String,
    required: false,
  },
  sharedWith: {
    type: [String],
    default: [],
  },
  tokenSharedWith: [
    {
      recipient: { type: String, required: true },
      tokenExp: { type: Number, required: true } // Expiration timestamp
    }
  ]
}, {
    timestamps: true,
});


const File = mongoose.model("File", fileSchema);

export default File;