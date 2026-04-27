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

  const isV2 = restKey.startsWith('os_v2_');
  const isDelete = method === 'DELETE' && notifId;

  // v2 keys use the new API endpoint; old keys use v1
  const baseUrl = isV2 ? 'https://api.onesignal.com' : 'https://onesignal.com/api/v1';
  const url = isDelete
    ? `${baseUrl}/notifications/${notifId}?app_id=${appId}`
    : `${baseUrl}/notifications`;

  const authHeader = isV2 ? `Key ${restKey}` : `Basic ${restKey}`;

  try {
    const res = await fetch(url, {
      method: isDelete ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      ...(isDelete ? {} : { body: JSON.stringify({ app_id: appId, ...payload }) }),
    });

    const data = await res.json().catch(() => ({}));
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ...data,
        _debug: {
          status: res.status,
          url,
          authHeader: authHeader.substring(0, 20) + '...',
          isV2,
        }
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
