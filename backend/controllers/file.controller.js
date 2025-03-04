import File from "../models/file.model.js";
import mongoose from 'mongoose'; 


export const getFiles = async (req, res) => {
  try {
    const files = await File.find({});
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    console.log("Failed to fetch files", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getFile = async (req, res) => {
    const {id} = req.params;
    
  
    if (!mongoose.Types.ObjectId.isValid(id)) { // Add this validation
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    } 
  
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
  
    try {
      res.status(200).json({ success: true, data: file });
    } catch (error) {
      console.log("Failed to fetch a file", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
}

export const createFile = async (req, res) => {
const file = req.body; 

if (!file.name || !file.security_level || !file.owner || !file.file_path) {
    return res.status(400).send({ message: 'All fields are required' });
}

const newFile = new File(file);

try {
    await newFile.save();
    res.status(201).json({ success: true, data: newFile });
}
catch (error) {
    console.log("Failed to upload a file", error.message);
    res.status(500).json({ success: false, message: error.message });
}
}

export const updateFile = async (req, res) => {
    const {id} = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) { // Add this validation
        return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    const file = await File.findById(id);
    
    if (!file) {
        return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    try {
        
        const updatedFile = await File.findByIdAndUpdate (id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: updatedFile });
    } catch (error) {
        console.log("Failed to update a file", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

export const deleteFile = async (req, res) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) { // Add this validation
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }

    const file = await File.findById(id);


    if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
    }

    try {
    await File.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'File deleted successfully' });
    
    } catch (error) {
    console.log("Failed to delete a file", error.message);
    res.status(500).json({ success: false, message: error.message });
    }
}