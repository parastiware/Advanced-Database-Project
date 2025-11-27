const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Polyglot Persistence API is running');
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
