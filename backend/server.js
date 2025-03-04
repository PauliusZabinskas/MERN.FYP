import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import fileRoutes from './routes/file.api.js';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/file', fileRoutes);


app.listen(3000, () => {
    connectDB();
    console.log('Server is running on http://localhost:3000');
});