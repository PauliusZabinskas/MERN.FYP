import express from 'express';
import dotenv from 'dotenv';
import { connectFB } from './config/db.js';

dotenv.config();

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});


app.listen(3000, () => {
    connectFB();
    console.log('Server is running on http://localhost:3000');
});