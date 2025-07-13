const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const licenses = [
  {
    key: 'VALID-LICENSE-KEY',
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
  },
];

app.post('/validate-license', (req, res) => {
  const { licenseKey } = req.body;
  const license = licenses.find(l => l.key === licenseKey);
  if (license) {
    res.json({ isValid: true, expiryDate: license.expiryDate });
  } else {
    res.json({ isValid: false, expiryDate: null });
  }
});

app.listen(port, () => {
  console.log(`Licensing server listening at http://localhost:${port}`);
});
