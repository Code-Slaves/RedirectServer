const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let targetUrl = 'https://example.com';
// Предполагается, что PASSWORD_HASH был создан с использованием bcrypt и представляет собой хеш настоящего пароля.
const PASSWORD = 'D12345678'; // хеш вашего реального пароля.

app.get('/', (req, res) => {
  res.redirect(targetUrl);
});

app.post('/update', async (req, res) => {
  try {
    const isMatch = await checkPassword(PASSWORD, req.body.password);
    
    if (!isMatch) {
      res.status(401).send('Unauthorized');
      return;
    }
    
    targetUrl = req.body.newUrl;
    res.send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

async function checkPassword(inputPassword, savedPasswordHash) {
  // bcrypt сравнит два пароля за вас и вернет true, если они совпадают, и false, если нет.
  return bcrypt.compare(inputPassword, savedPasswordHash);
}
