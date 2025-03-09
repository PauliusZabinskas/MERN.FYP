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
}, {
    timestamps: true,
});


const File = mongoose.model("File", fileSchema);

export default File;