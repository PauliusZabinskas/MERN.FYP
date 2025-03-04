import express from 'express';
import dotenv from 'dotenv';
import { connectFB } from './config/db.js';
import File from './models/file.model.js';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/file-post', async (req, res) => {
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
});


app.listen(3000, () => {
    connectFB();
    console.log('Server is running on http://localhost:3000');
});