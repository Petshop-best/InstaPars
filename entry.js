const express = require('express')
const { runStats } = require('./script');

const app = express();
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.post('/run', async (req, res) => {
  const { username, password, profileUrl } = req.body;

  if (!username || !password || !profileUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(username, password, profileUrl);
    const result = await runStats(username, password, profileUrl);
    console.log("RESULT EXISTS \n" + JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));