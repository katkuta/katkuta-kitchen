// Proxy for OneSignal REST API — avoids CORS issues on mobile Safari
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { restKey, method, notifId, appId, payload } = req.body;
  if (!restKey || !appId) {
    return res.status(400).json({ error: 'Missing restKey or appId' });
  }

  const isV2 = restKey.startsWith('os_v2_');
  const isDelete = method === 'DELETE' && notifId;
  const baseUrl = isV2 ? 'https://api.onesignal.com' : 'https://onesignal.com/api/v1';
  const url = isDelete
    ? `${baseUrl}/notifications/${notifId}?app_id=${appId}`
    : `${baseUrl}/notifications`;

  const authHeader = isV2 ? `Key ${restKey}` : `Basic ${restKey}`;

  try {
    const response = await fetch(url, {
      method: isDelete ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      ...(isDelete ? {} : { body: JSON.stringify({ app_id: appId, ...payload }) }),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
