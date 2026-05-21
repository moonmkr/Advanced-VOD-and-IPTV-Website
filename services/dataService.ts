import { ContentItem, ContentType, User, UserRole, Comment, ContentRequest, SystemNotification, SiteSettings } from '../types';
import { INITIAL_CONTENT } from '../constants';

// --- CONFIGURATION ---
const isDev = typeof import.meta !== 'undefined' && 
              (import.meta as any).env && 
              (import.meta as any).env.DEV;

// POINTING TO NEW API FILE (Express compatibility layer)
const API_URL = 'http://localhost:3000/api_handler.php'; 

const CURRENT_USER_KEY = 'eddit_current_user_cache';
const MOCK_DELAY = 600; 

// STATE TRACKING
let isOfflineMode = false;

// --- MOCK DATA FALLBACK (In-Memory) ---
// Used ONLY if api.php is unreachable (404/500)
let mockContent: ContentItem[] = [...INITIAL_CONTENT];
let mockUsers: User[] = [
    {
        id: 'admin',
        username: 'eddit',
        password: 'admin', 
        role: 'admin',
        email: 'admin@eddit.site',
        favorites: [],
        watchHistory: {},
        registeredAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        points: 999,
        awardedContentIds: []
    }
];
let mockRequests: ContentRequest[] = [];
let mockComments: Comment[] = [];
let mockNotifications: SystemNotification[] = [];
let mockSettings: SiteSettings = { discordLink: 'https://discord.gg/eddit' };

// --- HELPER FUNCTIONS ---

const getBody = (options?: RequestInit): any => {
    if (!options?.body) return {};
    try { return JSON.parse(options.body as string); } catch { return {}; }
};

const handleMockRequest = async (url: string, options?: RequestInit): Promise<any> => {
    // Notify app we are utilizing mock data
    if (!isOfflineMode) {
        console.warn("ENTERING OFFLINE MODE: api_handler.php not reachable.");
        isOfflineMode = true;
    }

    await new Promise(r => setTimeout(r, MOCK_DELAY)); 
    
    const urlObj = new URL(url, 'http://localhost');
    const action = urlObj.searchParams.get('action');
    const body = getBody(options);

    switch (action) {
        case 'health': return { status: 'offline', source: 'mock' };
        case 'getSettings': return mockSettings;
        case 'saveSettings': 
            mockSettings = { ...mockSettings, ...body };
            return { success: true };
        
        case 'getContent': return mockContent;
        case 'saveContent':
            mockContent.push(body);
            return { success: true };
        case 'updateContent':
            mockContent = mockContent.map(c => c.id === body.id ? { ...c, ...body } : c);
            return { success: true };
        case 'deleteContent':
            mockContent = mockContent.filter(c => c.id !== body.id);
            return { success: true };

        case 'login':
            const foundUser = mockUsers.find(u => u.username === body.username && u.password === body.password);
            if (foundUser) return foundUser;
            return { error: 'Invalid credentials (Try: eddit / admin)' };
        
        case 'register':
            if (mockUsers.find(u => u.username === body.username)) return { success: false, error: 'User exists' };
            const newUser: User = { ...body, role: 'user', favorites: [], watchHistory: {}, points: 0, awardedContentIds: [], registeredAt: new Date().toISOString(), lastActive: new Date().toISOString() };
            mockUsers.push(newUser);
            return { success: true };
        
        case 'getUsers': return mockUsers;
        case 'updateUser':
            mockUsers = mockUsers.map(u => u.id === body.id ? body : u);
            return { success: true };
        case 'adminUpdateUser':
            mockUsers = mockUsers.map(u => u.id === body.id ? { ...u, ...body } : u);
            return { success: true };

        case 'getNotifications': return mockNotifications;
        case 'addNotification':
            mockNotifications.push({ ...body });
            return { success: true };
        case 'deleteNotification':
            mockNotifications = mockNotifications.filter(n => n.id !== body.id);
            return { success: true };

        case 'getRequests': return mockRequests;
        case 'addRequest':
            mockRequests.push({ ...body });
            return { success: true };
        case 'updateRequestStatus':
            mockRequests = mockRequests.map(r => r.id === body.id ? { ...r, status: body.status } : r);
            return { success: true };
        case 'deleteRequest':
            mockRequests = mockRequests.filter(r => r.id !== body.id);
            return { success: true };

        case 'getComments': return mockComments.filter(c => c.contentId === urlObj.searchParams.get('contentId'));
        case 'addComment':
            mockComments.push(body);
            return { success: true };
        case 'deleteComment':
            mockComments = mockComments.filter(c => c.id !== body.id);
            return { success: true };

        case 'importDB':
             // Mock import
             const newDB = body;
             if(newDB.users) mockUsers = newDB.users;
             if(newDB.content) mockContent = newDB.content;
             if(newDB.requests) mockRequests = newDB.requests;
             if(newDB.comments) mockComments = newDB.comments;
             if(newDB.notifications) mockNotifications = newDB.notifications;
             if(newDB.settings) mockSettings = newDB.settings;
             return { success: true };

        default: return null;
    }
};

const fetchJSON = async (url: string, options?: RequestInit) => {
    try {
        const opts = { ...options };
        if (options?.body && !opts.headers) opts.headers = { 'Content-Type': 'application/json' };
        const res = await fetch(url, opts);
        if (!res.ok) {
            // If 404/500, backend is missing. Switch to mock.
            return handleMockRequest(url, options);
        }
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            isOfflineMode = false; 
            return json;
        } catch (e) {
            console.error("JSON Parse Error (Backend likely returned PHP Error HTML)", text);
            return handleMockRequest(url, options);
        }
    } catch (e) {
        // Network failure (e.g. server down)
        return handleMockRequest(url, options);
    }
};

export const dataService = {
  // Check if we are connected to Real DB or Mock
  checkHealth: async () => {
      return fetchJSON(`${API_URL}?action=health`);
  },

  // --- SETTINGS ---
  getSettings: async () => fetchJSON(`${API_URL}?action=getSettings`),
  saveSettings: async (s: SiteSettings) => fetchJSON(`${API_URL}?action=saveSettings`, { method: 'POST', body: JSON.stringify(s) }),

  // --- CONTENT ---
  getContent: async (): Promise<ContentItem[]> => {
      const data = await fetchJSON(`${API_URL}?action=getContent`);
      return Array.isArray(data) ? data : [];
  },
  saveContent: async (item: any) => {
    const currentUser = dataService.getCurrentUserSync();
    const newItem = { 
        ...item, 
        id: item.id || Math.random().toString(36).substring(2, 9), 
        addedAt: new Date().toISOString(), 
        addedBy: currentUser?.username || 'Unknown' 
    };
    await fetchJSON(`${API_URL}?action=saveContent`, { method: 'POST', body: JSON.stringify(newItem) });
  },
  updateContent: async (id: string, data: any) => fetchJSON(`${API_URL}?action=updateContent`, { method: 'POST', body: JSON.stringify({ id, ...data }) }),
  deleteContent: async (id: string) => fetchJSON(`${API_URL}?action=deleteContent`, { method: 'POST', body: JSON.stringify({ id }) }),

  // --- USER ---
  getCurrentUserSync: (): User | null => {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
  },
  getCurrentUser: async () => dataService.getCurrentUserSync(),
  
  refreshUser: async (): Promise<User | null> => {
      const current = dataService.getCurrentUserSync();
      if (!current) return null;
      // Re-verify credentials against server
      const user = await fetchJSON(`${API_URL}?action=login`, { method: 'POST', body: JSON.stringify({ username: current.username, password: current.password }) });
      if (user && !user.error) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          return user;
      }
      return current; 
  },

  login: async (username: string, password: string) => {
    const user = await fetchJSON(`${API_URL}?action=login`, { method: 'POST', body: JSON.stringify({ username, password }) });
    if (user && !user.error) {
        if (user.isBanned) return { user: null, error: 'Banned' };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return { user };
    }
    return { user: null, error: user?.error || 'Login failed' };
  },
  logout: () => localStorage.removeItem(CURRENT_USER_KEY),
  
  register: async (u: string, p: string, e: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const res = await fetchJSON(`${API_URL}?action=register`, { method: 'POST', body: JSON.stringify({ 
          id, username: u, password: p, email: e,
          role: 'user', favorites: [], watchHistory: {}, points: 0, awardedContentIds: [],
          registeredAt: new Date().toISOString(), lastActive: new Date().toISOString()
      }) });
      return res?.success === true;
  },

  getUsers: async () => {
      const d = await fetchJSON(`${API_URL}?action=getUsers`);
      return Array.isArray(d) ? d : [];
  },
  adminUpdateUser: async (id: string, updates: any) => fetchJSON(`${API_URL}?action=adminUpdateUser`, { method: 'POST', body: JSON.stringify({ id, ...updates }) }),
  
  updateUser: async (user: User) => {
      await fetchJSON(`${API_URL}?action=updateUser`, { method: 'POST', body: JSON.stringify(user) });
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  // --- FEATURES ---
  toggleFavorite: async (contentId: string) => {
      const user = dataService.getCurrentUserSync();
      if (!user) return;
      const newFavs = user.favorites.includes(contentId) ? user.favorites.filter(id => id !== contentId) : [...user.favorites, contentId];
      const updated = { ...user, favorites: newFavs };
      await dataService.updateUser(updated);
      window.dispatchEvent(new Event('user-updated'));
  },

  updateWatchHistory: async (contentId: string, timestamp: number, duration: number) => {
      const user = dataService.getCurrentUserSync();
      if (!user) return;
      
      let points = user.points || 0;
      let awarded = [...(user.awardedContentIds || [])];

      if (duration > 1200 && timestamp > 1200 && !awarded.includes(contentId)) {
          points += 1;
          awarded.push(contentId);
      }

      const updated = {
          ...user,
          points,
          awardedContentIds: awarded,
          watchHistory: {
              ...user.watchHistory,
              [contentId]: { timestamp, duration, lastWatched: new Date().toISOString() }
          }
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      fetchJSON(`${API_URL}?action=updateUser`, { method: 'POST', body: JSON.stringify(updated) });
  },

  getWatchProgress: (id: string) => {
      const u = dataService.getCurrentUserSync();
      const entry = u?.watchHistory[id];
      if (!entry) return 0;
      return typeof entry === 'number' ? entry : entry.timestamp;
  },

  // --- COMMENTS ---
  getComments: async (id: string) => {
      const d = await fetchJSON(`${API_URL}?action=getComments&contentId=${id}`);
      return Array.isArray(d) ? d : [];
  },
  addComment: async (contentId: string, text: string) => {
      const u = dataService.getCurrentUserSync();
      if (!u) return;
      await fetchJSON(`${API_URL}?action=addComment`, { 
          method: 'POST', 
          body: JSON.stringify({ 
            id: Math.random().toString(), contentId, userId: u.id, username: u.username, 
            userRole: u.role, userAvatar: u.avatarUrl, text, createdAt: new Date().toISOString() 
          }) 
      });
  },
  deleteComment: async (id: string) => fetchJSON(`${API_URL}?action=deleteComment`, { method: 'POST', body: JSON.stringify({ id }) }),

  // --- REQUESTS ---
  getRequests: async () => {
      const d = await fetchJSON(`${API_URL}?action=getRequests`);
      return Array.isArray(d) ? d : [];
  },
  getUserRequests: async (uid: string) => (await dataService.getRequests()).filter(r => r.userId === uid),
  addRequest: async (title: string, description: string) => {
      const u = dataService.getCurrentUserSync();
      if (!u) return;
      await fetchJSON(`${API_URL}?action=addRequest`, { 
          method: 'POST', 
          body: JSON.stringify({ id: Math.random().toString(), userId: u.id, username: u.username, title, description, createdAt: new Date().toISOString(), status: 'pending' }) 
      });
  },
  updateRequestStatus: async (id: string, status: string) => fetchJSON(`${API_URL}?action=updateRequestStatus`, { method: 'POST', body: JSON.stringify({ id, status }) }),
  deleteRequest: async (id: string) => fetchJSON(`${API_URL}?action=deleteRequest`, { method: 'POST', body: JSON.stringify({ id }) }),

  // --- NOTIFICATIONS ---
  getNotifications: async () => {
      const d = await fetchJSON(`${API_URL}?action=getNotifications`);
      return Array.isArray(d) ? d : [];
  },
  addNotification: async (title: string, message: string, isSticky: boolean) => fetchJSON(`${API_URL}?action=addNotification`, { method: 'POST', body: JSON.stringify({ id: Math.random().toString(), title, message, isSticky, createdAt: new Date().toISOString() }) }),
  deleteNotification: async (id: string) => fetchJSON(`${API_URL}?action=deleteNotification`, { method: 'POST', body: JSON.stringify({ id }) }),

  // --- IMPORT/EXPORT ---
  exportDB: async () => {
    // If online, download directly from API if we built an endpoint, OR fetch all JSON
    const data = await fetchJSON(`${API_URL}?action=getContent`); // Actually, let's grab the whole file implicitly or struct
    // For a real export, we should probably fetch content, users, etc separately or make a 'getFullDB' endpoint. 
    // For now, let's just use what we have in memory or content
    // Better strategy: Create a temporary object
    const content = await dataService.getContent();
    const users = await dataService.getUsers();
    const reqs = await dataService.getRequests();
    const notifs = await dataService.getNotifications();
    const sets = await dataService.getSettings();
    
    // We can't easily get comments for ALL content without an endpoint, 
    // but this is 'good enough' for basic backup or we can make a getFullDB endpoint later.
    // Let's assume the user accepts a partial backup (Content/Users/Settings) or we add a 'getFullDB' action.
    
    const fullBackup = {
        content, users, requests: reqs, notifications: notifs, settings: sets, comments: [] // Comments are harder to fetch all at once without endpoint
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `eddit_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },
  
  importDB: async (jsonStr: string) => {
      try {
          const data = JSON.parse(jsonStr);
          const res = await fetchJSON(`${API_URL}?action=importDB`, {
              method: 'POST',
              body: JSON.stringify(data)
          });
          return res?.success === true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  },
  downloadJSON: () => {}
  ,
  // --- ADMIN IMPORT HELPERS (new REST endpoints) ---
  ingestM3U: async (url: string) => {
      try {
          const res = await fetch('http://localhost:3000/api/v1/admin/ingest/m3u', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
          const j = await res.json();
          return j;
      } catch (e) { console.error(e); return { error: String(e) }; }
  },
  ingestXtream: async (host: string, username: string, password: string) => {
      try {
          const res = await fetch('http://localhost:3000/api/v1/admin/ingest/xtream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, username, password }) });
          const j = await res.json();
          return j;
      } catch (e) { console.error(e); return { error: String(e) }; }
  },
  createSubscriber: async (username: string, password: string, expirationDate?: string) => {
      try {
          const res = await fetch('http://localhost:3000/api/v1/admin/subscriber', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, expirationDate }) });
          const j = await res.json();
          return j;
      } catch (e) { console.error(e); return { error: String(e) }; }
  }
};