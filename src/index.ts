import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { requestHandler } from './form';
import { imageURLRequestHandler } from './blob';
import { uploadJSONHandler } from './json';

const app = express();
const port = process.env.PORT || 8000;

dotenv.config();
app.use(cors());

app.get('/', (_, res) => {
  res.status(200).send('Never gonna give you up');
});

app.post('/upload', (req, res) => {
  requestHandler(req, res);
});

app.post('/url', express.json(), (req, res) => {
  imageURLRequestHandler(req, res);
});

app.post('/json', express.json(), (req, res) => {
  uploadJSONHandler(req, res);
});

app.listen(port, () => {
  console.log('🚀 Started listening on port ', port);
});