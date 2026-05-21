const axios = require('axios');

async function fetchText(url, opts = {}) {
  const res = await axios.get(url, { responseType: 'text', timeout: 15000, ...opts });
  return res.data;
}

function parseM3U(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      const info = line.substring(8).split(',');
      const meta = info[0];
      const title = info.slice(1).join(',').trim();
      const attrs = {};
      // parse attrs like tvg-id="..." or group-title="..."
      meta.replace(/(\S+?)=\"(.*?)\"/g, (_, k, v) => { attrs[k] = v; return ''; });
      const url = (lines[i+1] && !lines[i+1].startsWith('#')) ? lines[i+1] : null;
      channels.push({ title, url, attrs });
      i++; // skip url line
    }
  }
  return channels;
}

async function parseM3UFromUrl(url) {
  const text = await fetchText(url);
  return parseM3U(text);
}

// Xtream Codes style: host + "/player_api.php?username=USER&password=PASS&action=get_live_streams"
async function parseXtream(host, username, password) {
  const base = host.endsWith('/') ? host.slice(0, -1) : host;
  const api = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
  const res = await axios.get(api, { timeout: 15000 });
  if (Array.isArray(res.data)) {
    return res.data.map(c => ({ title: c.name || c.stream_name || c.name_en, url: c.stream_url || c.stream_id || '', attrs: { category: c.category || c.stream_category || '' } }));
  }
  // Some providers return object
  if (res.data && res.data.results) {
    return Object.values(res.data.results).map(c => ({ title: c.name || c.title, url: c.stream_url || '', attrs: {} }));
  }
  // Fallback: try to parse text
  if (typeof res.data === 'string') {
    return parseM3U(res.data);
  }
  return [];
}

module.exports = { parseM3UFromUrl, parseM3U, parseXtream };
