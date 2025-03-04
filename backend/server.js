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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on http://localhost:'+PORT);
});