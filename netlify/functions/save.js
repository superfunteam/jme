exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { password, content } = JSON.parse(event.body);

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    // Get current file SHA (required for updates)
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/content.json`,
      { headers: { Authorization: `token ${token}`, 'User-Agent': 'jme-admin' } }
    );

    if (!getRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to read current content' }) };
    }

    const fileData = await getRes.json();

    // Commit updated content.json
    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/content.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'jme-admin'
        },
        body: JSON.stringify({
          message: 'Update content via admin',
          content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
          sha: fileData.sha
        })
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save', details: err }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
