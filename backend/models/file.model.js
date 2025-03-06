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
    file_id: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});


const File = mongoose.model("File", fileSchema);

export default File;