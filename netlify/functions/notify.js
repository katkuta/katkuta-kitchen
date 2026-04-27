// Proxy for OneSignal REST API — avoids CORS issues on mobile Safari
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { restKey, method, notifId, appId, payload } = body;
  if (!restKey || !appId) {
    return { statusCode: 400, body: 'Missing restKey or appId' };
  }

  const isDelete = method === 'DELETE' && notifId;
  const url = isDelete
    ? `https://onesignal.com/api/v1/notifications/${notifId}?app_id=${appId}`
    : 'https://onesignal.com/api/v1/notifications';

  try {
    const res = await fetch(url, {
      method: isDelete ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restKey}`,
      },
      ...(isDelete ? {} : { body: JSON.stringify({ app_id: appId, ...payload }) }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
