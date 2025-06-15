const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow frontend access
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

console.log("Yash Rawat")
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:8000`);
});
