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
    file: {
        type: Object,
        required: true,
    },
}, {
    timestamps: true,
});


const File = mongoose.model("File", fileSchema);

export default File;