const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.post('/post', (req, res) => {
  res.send('HI post!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
