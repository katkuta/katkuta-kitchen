const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// OneSignal proxy — avoids CORS issues on mobile Safari
app.post('/api/notify', async (req, res) => {
  const { restKey, method, notifId, appId, payload } = req.body;
  if (!restKey || !appId) {
    return res.status(400).json({ error: 'Missing restKey or appId' });
  }

  const isV2     = restKey.startsWith('os_v2_');
  const isDelete = method === 'DELETE' && notifId;
  const baseUrl  = isV2 ? 'https://api.onesignal.com' : 'https://onesignal.com/api/v1';
  const url      = isDelete
    ? `${baseUrl}/notifications/${notifId}?app_id=${appId}`
    : `${baseUrl}/notifications`;

  const authHeader = isV2 ? `Key ${restKey}` : `Basic ${restKey}`;

  try {
    const response = await fetch(url, {
      method: isDelete ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      ...(isDelete ? {} : { body: JSON.stringify({ app_id: appId, ...payload }) }),
    });
    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fallback — serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Katkuta Kitchen running on port ${PORT}`));
