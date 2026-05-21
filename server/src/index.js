require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { readDb, writeDb } = require('./storage');
const { parseM3UFromUrl, parseXtream } = require('./parsers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminOnly, SECRET } = require('./middleware');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Compatibility endpoint similar to api_handler.php used in frontend
app.all('/api_handler.php', async (req, res) => {
  const action = req.query.action || req.body.action;
  const db = readDb();

  try {
    switch (action) {
      case 'health':
        return res.json({ status: 'ok', server: 'iptv-ultimate-server' });

      case 'getSettings':
        return res.json(db.settings || {});

      case 'saveSettings':
        db.settings = { ...(db.settings || {}), ...(req.body || {}) };
        writeDb(db);
        return res.json({ success: true });

      case 'getContent':
        return res.json(db.channels || []);

      case 'saveContent':
        db.channels = db.channels || [];
        db.channels.push(req.body);
        writeDb(db);
        return res.json({ success: true });

      case 'updateContent':
        db.channels = (db.channels || []).map(c => c.id === req.body.id ? { ...c, ...req.body } : c);
        writeDb(db);
        return res.json({ success: true });

      case 'deleteContent':
        db.channels = (db.channels || []).filter(c => c.id !== req.body.id);
        writeDb(db);
        return res.json({ success: true });

      case 'login': {
        const { username, password } = req.body;
        const user = (db.users || []).find(u => u.username === username);
        if (!user) return res.json({ error: 'Invalid credentials' });
        if (user.password && user.password.startsWith('$2a$')) {
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) return res.json({ error: 'Invalid credentials' });
        } else {
          if (user.password !== password) return res.json({ error: 'Invalid credentials' });
        }
        // check expiration
        if (user.expirationDate && new Date(user.expirationDate) < new Date()) return res.json({ error: 'Subscription expired', isBanned: false });
        const safe = { ...user }; delete safe.password;
        return res.json(safe);
      }

      case 'register': {
        const { username, password, email } = req.body;
        if ((db.users || []).find(u => u.username === username)) return res.json({ success: false, error: 'User exists' });
        const id = uuidv4();
        const hashed = await bcrypt.hash(password, 10);
        const newUser = { id, username, password: hashed, email, role: 'user', favorites: [], watchHistory: {}, points: 0, awardedContentIds: [], registeredAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true };
        db.users = db.users || [];
        db.users.push(newUser);
        writeDb(db);
        return res.json({ success: true });
      }

      case 'getUsers':
        return res.json(db.users || []);

      case 'updateUser':
        db.users = (db.users || []).map(u => u.id === req.body.id ? req.body : u);
        writeDb(db);
        return res.json({ success: true });

      case 'adminUpdateUser':
        db.users = (db.users || []).map(u => u.id === req.body.id ? { ...u, ...req.body } : u);
        writeDb(db);
        return res.json({ success: true });

      case 'getNotifications':
        return res.json(db.notifications || []);
      case 'addNotification':
        db.notifications = db.notifications || [];
        db.notifications.push(req.body);
        writeDb(db);
        return res.json({ success: true });
      case 'deleteNotification':
        db.notifications = (db.notifications || []).filter(n => n.id !== req.body.id);
        writeDb(db);
        return res.json({ success: true });

      case 'getRequests':
        return res.json(db.requests || []);
      case 'addRequest':
        db.requests = db.requests || [];
        db.requests.push(req.body);
        writeDb(db);
        return res.json({ success: true });
      case 'updateRequestStatus':
        db.requests = (db.requests || []).map(r => r.id === req.body.id ? { ...r, status: req.body.status } : r);
        writeDb(db);
        return res.json({ success: true });
      case 'deleteRequest':
        db.requests = (db.requests || []).filter(r => r.id !== req.body.id);
        writeDb(db);
        return res.json({ success: true });

      case 'getComments':
        return res.json((db.comments || []).filter(c => c.contentId === req.query.contentId));
      case 'addComment':
        db.comments = db.comments || [];
        db.comments.push(req.body);
        writeDb(db);
        return res.json({ success: true });
      case 'deleteComment':
        db.comments = (db.comments || []).filter(c => c.id !== req.body.id);
        writeDb(db);
        return res.json({ success: true });

      case 'importDB':
        try {
          const payload = req.body;
          if (payload.users) db.users = payload.users;
          if (payload.content) db.channels = payload.content;
          if (payload.requests) db.requests = payload.requests;
          if (payload.comments) db.comments = payload.comments;
          if (payload.notifications) db.notifications = payload.notifications;
          if (payload.settings) db.settings = payload.settings;
          writeDb(db);
          return res.json({ success: true });
        } catch (e) {
          return res.status(500).json({ error: 'Import failed', details: String(e) });
        }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('API error', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
});

// RESTful Admin endpoints
app.post('/api/v1/admin/ingest/m3u', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const items = await parseM3UFromUrl(url);
    const db = readDb();
    db.channels = db.channels || [];
    const added = items.map(it => ({ id: uuidv4(), name: it.title, category: it.attrs && it.attrs['group-title'] || it.attrs.group || 'uncategorized', streamUrl: it.url, resolution: it.attrs.resolution || 'unknown', status: 'active' }));
    db.channels.push(...added);
    writeDb(db);
    return res.json({ success: true, added: added.length });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

app.post('/api/v1/admin/ingest/xtream', async (req, res) => {
  const { host, username, password } = req.body;
  if (!host || !username || !password) return res.status(400).json({ error: 'Missing params' });
  try {
    const items = await parseXtream(host, username, password);
    const db = readDb(); db.channels = db.channels || [];
    const added = items.map(it => ({ id: uuidv4(), name: it.title, category: it.attrs && it.attrs.category || 'uncategorized', streamUrl: it.url, resolution: it.attrs.resolution || 'unknown', status: 'active' }));
    db.channels.push(...added);
    writeDb(db);
    return res.json({ success: true, added: added.length });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

app.post('/api/v1/admin/subscriber', async (req, res) => {
  const { username, password, expirationDate } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDb();
  if ((db.users || []).find(u => u.username === username)) return res.status(400).json({ error: 'User exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), username, password: hashed, role: 'subscriber', expirationDate: expirationDate || null, isActive: true, favorites: [], watchHistory: {}, points: 0, awardedContentIds: [], registeredAt: new Date().toISOString(), lastActive: new Date().toISOString() };
  db.users = db.users || [];
  db.users.push(user);
  writeDb(db);
  return res.json({ success: true, userId: user.id });
});

// Auth endpoints (issue JWT)
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = (db.users || []).find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.expirationDate && new Date(user.expirationDate) < new Date()) return res.status(403).json({ error: 'Subscription expired' });
  const payload = { id: user.id, username: user.username, role: user.role || 'subscriber' };
  const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
  const safe = { ...user }; delete safe.password;
  return res.json({ token, user: safe });
});

// Playlist generation
app.get('/api/v1/playlist/:username', (req, res) => {
  const { username } = req.params;
  const db = readDb();
  const user = (db.users || []).find(u => u.username === username);
  if (!user) return res.status(404).send('User not found');
  if (user.expirationDate && new Date(user.expirationDate) < new Date()) return res.status(403).send('Subscription expired');
  const channels = db.channels || [];
  res.setHeader('Content-Type', 'audio/mpegurl');
  let m3u = '#EXTM3U\n';
  channels.forEach(c => {
    const tvg = `tvg-id=\"${c.id}\"`;
    const group = `group-title=\"${(c.category||'') }\"`;
    m3u += `#EXTINF:-1 ${tvg} ${group},${c.name || c.title || 'Channel'}\n`;
    m3u += `${c.streamUrl}\n`;
  });
  res.send(m3u);
});

// Basic listing
app.get('/api/v1/channels', (req, res) => {
  const db = readDb();
  res.json(db.channels || []);
});

app.get('/api/v1/users', (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});
// OpenAI Proxy Endpoint
app.post('/api/v1/openai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('OpenAI Request received');
    console.log('API Key configured:', !!apiKey);
    console.log('Messages:', messages);
    
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const client = new OpenAI({ apiKey });
    
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages || [],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    console.log('OpenAI Response successful');
    return res.json({ content });
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: error.message || 'OpenAI request failed' });
  }
});

// REST Channels endpoints
app.get('/api/v1/channels', (req, res) => {
  const db = readDb();
  res.json(db.channels || []);
});

app.get('/api/v1/channels/:id', (req, res) => {
  const db = readDb();
  const channel = (db.channels || []).find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  res.json(channel);
});

app.get('/api/v1/channels/category/:category', (req, res) => {
  const db = readDb();
  const channels = (db.channels || []).filter(c => c.category === req.params.category);
  res.json(channels);
});

const port = process.env.PORT || 3000;
// Ensure a default admin exists for initial setup
(() => {
  try {
    const db = readDb();
    if (!db.users || db.users.length === 0) {
      (async () => {
        const hashed = await bcrypt.hash('admin123', 10);
        db.users = [{ id: uuidv4(), username: 'admin', password: hashed, role: 'admin', email: 'admin@localhost', registeredAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true }];
        writeDb(db);
        console.log('Created default admin user: admin / admin123');
      })();
    }
  } catch (e) { console.warn('Could not ensure default admin', e); }
})();

app.listen(port, () => console.log(`IPTV Ultimate+ server listening on ${port}`));
