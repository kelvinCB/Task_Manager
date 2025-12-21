const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Debug Server Root');
});

app.get('/test', (req, res) => {
    res.json({ message: 'Debug Server Test' });
});

const PORT = 3002; // Use different port to avoid conflict
app.listen(PORT, () => {
    console.log(`Debug Server running on ${PORT}`);
});
