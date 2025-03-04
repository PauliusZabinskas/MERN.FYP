import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: false,
  },
  security_level: {
    type: Number,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
    file_path: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});


const File = mongoose.model("File", fileSchema);

export default File;