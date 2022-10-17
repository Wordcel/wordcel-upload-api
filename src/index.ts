import express from 'express';
import cors from 'cors';
import { requestHandler } from './upload';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.get('/', (_, res) => {
  res.status(200).send('Never gonna give you up');
});

app.post('/upload', (req, res) => {
  requestHandler(req, res);
});

app.listen(port, () => {
  console.log('🚀 Started listening on port ', port);
});