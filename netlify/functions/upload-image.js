exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { password, path, data } = JSON.parse(event.body);

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Allow any web-safe image/video filename directly under images/ —
  // no subdirectories, no path traversal, extension must be a known media type
  const isValidPath = /^images\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpe?g|png|webp|gif|mp4|webm)$/.test(path);
  if (!isValidPath) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image path' }) };
  }

  if (!data || typeof data !== 'string' || data.length > 8 * 1024 * 1024) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or oversized image data' }) };
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    // Get current file SHA if it exists (needed for updates)
    let sha;
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      { headers: { Authorization: `token ${token}`, 'User-Agent': 'jme-admin' } }
    );

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // Commit image
    const body = {
      message: `Update ${path} via admin`,
      content: data // already base64-encoded
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'jme-admin'
        },
        body: JSON.stringify(body)
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to upload', details: err }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
