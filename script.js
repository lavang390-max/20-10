/**
 * ==========================================================
 * 20/10 ROMANTIC GIFT WEBSITE - INTERACTIVE ENGINE
 * ==========================================================
 */

(function () {
  'use strict';

  // --- DEFAULT REWARDS (SWEET & INTIMATE) ---
  const DEFAULT_WHEEL_PRIZES = [
    { title: '1 Cái Ôm Thật Chặt', note: 'Ít nhất 30 giây để bé cảm nhận trọn vẹn hơi ấm và tình yêu của anh ❤️', color: '#ff758c' },
    { title: '1 Chiếc Thơm Má Ngọt Ngào', note: 'Bất kỳ lúc nào bé thích, đổi lấy nụ cười rạng rỡ của bé!', color: '#ff85a2' },
    { title: '1 Giờ Lắng Nghe Tâm Sự', note: 'Chỉ lắng nghe, gật đầu, ôm vào lòng và xoa đầu bé', color: '#ffb199' },
    { title: 'Một Buổi Dạo Phố Đêm', note: 'Đèo bé đi hóng gió ngắm phố phường, bé tha hồ ôm từ phía sau', color: '#f6c85f' },
    { title: 'Xoa Bóp Đấm Lưng', note: 'Bàn tay chuyên nghiệp ru bé vào giấc ngủ thật ngon và thư giãn', color: '#4facfe' },
    { title: 'Một Điều Ước Vô Điều Kiện', note: 'Bất cứ điều gì bé sai bảo hôm nay, anh đều ngoan ngoãn nghe lời!', color: '#9d4edd' }
  ];

  // --- DEFAULT CONFIGURATION ---
  const DEFAULT_CONFIG = {
    passcode: '0702',
    passcodeHint: 'Gợi ý: Ngày kỷ niệm tình yêu của tụi mình nè! (0702) ✨',
    adminPin: '0702',
    girlfriendName: 'bé mèo',
    boyfriendName: 'khúc gỗ',
    startDate: '2024-02-07T00:00:00',
    wheelPrizes: DEFAULT_WHEEL_PRIZES,
    letterBody: `Hellu bé - bé iu của anh,\n\nNhân ngày Phụ Nữ Việt Nam 20/10, anh làm món quà nhỏ này dành riêng cho bé. Cảm ơn bé đã đến bên anh và luôn đồng hành với anh.\n\nAnh cũng mong anh sẽ là chỗ dựa của bé như cách bé vẫn luôn bên cạnh anh. Để khi bé mệt mỏi hay bé buồn, bé biết rằng vẫn sẽ có một người sẵn sàng lắng nghe và sẻ chia, nắm tay bé đi tiếp trên những chặng đường sắp tới.\n\nChúc bé của anh một ngày 20/10 thật hạnh phúc, luôn vui tươi, xinh đẹp và nhiều niềm vui. Và anh sẽ luôn ở bên cạnh, lắng nghe, chăm sóc và yêu thương bé nhiều hơn mỗi ngày.\n\nTuy món quà này hơi đơn sơ nhưng đây là công sức anh tranh thủ lúc rảnh làm trong mấy ngày vừa qua, mong là bé sẽ đón nhận món quá này từ anh nhá.`,
    imgbbApiKey: '',
    girlfriendRealName: 'bé mèo',
    boyfriendRealName: 'khúc gỗ',
    firebaseUrl: '',
    firebaseConfig: null
  };

  // --- MULTI-DEVICE CLOUD SYNC ENGINE ---
  function getApiUrl(endpoint) {
    if (!endpoint) return '';
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
    const clean = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    // 1. Khi đang chạy trên Node server (Render, Railway, localhost, v.v.)
    if (!window.location.hostname.includes('github.io') && window.location.protocol !== 'file:') {
      return clean;
    }

    // 2. Khi chạy local file:///
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000' + clean;
    }

    // 3. Khi chạy trên GitHub Pages: chỉ dùng remote nếu là URL hợp lệ và không phải domain chết
    const remote = (window.COUPLE_CONFIG && window.COUPLE_CONFIG.serverUrl) || 
                   localStorage.getItem('romantic_gift_server_url');
    if (remote && remote.startsWith('http') && !remote.includes('memphis-likes-timely-privileges.trycloudflare.com')) {
      return remote.replace(/\/+$/, '') + clean;
    }
    return clean;
  }

  function resolveMediaUrl(src) {
    if (!src) return 'images/photo1.jpg';
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // Ảnh trong thư mục uploads/: chuyển thành đường dẫn tương đối để tương thích 100% trên GitHub Pages & localhost
    if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
      return src.replace(/^\/+/, '');
    }
    return src;
  }

  // ImgBB Cloud Uploader Helper
  async function uploadToImgBB(fileOrBase64, apiKey) {
    if (!apiKey) return null;
    try {
      const formData = new FormData();
      if (typeof fileOrBase64 === 'string') {
        const cleanBase64 = fileOrBase64.replace(/^data:image\/\w+;base64,/, '');
        formData.append('image', cleanBase64);
      } else {
        formData.append('image', fileOrBase64);
      }
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data && data.data.url) {
          console.log('☁️ Đã upload ảnh lên ImgBB Cloud thành công:', data.data.url);
          return data.data.url;
        }
      }
    } catch (err) {
      console.warn('ImgBB Cloud Upload notice:', err.message);
    }
    return null;
  }

  // ==========================================================
  // 🔥 FIREBASE REALTIME CLOUD SYNC ENGINE (24/7 SERVERLESS)
  // ==========================================================
  const FirebaseSync = (function() {
    let firebaseUrl = '';
    let db = null;
    let initialized = false;

    function getCleanUrl() {
      if (firebaseUrl) return firebaseUrl;
      const url = (userConfig && userConfig.firebaseUrl) ||
                  (window.COUPLE_CONFIG && window.COUPLE_CONFIG.firebaseUrl) ||
                  localStorage.getItem('romantic_gift_firebase_url') || '';
      if (!url) return '';
      let clean = url.trim().replace(/\/+$/, '');
      if (clean.includes('console.firebase.google.com')) {
        const m = clean.match(/\/database\/([a-zA-Z0-9_\-]+)/);
        if (m) clean = 'https://' + m[1] + '.firebaseio.com';
      }
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      firebaseUrl = clean;
      return firebaseUrl;
    }

    function isAvailable() {
      return !!getCleanUrl();
    }

    function init() {
      const url = getCleanUrl();
      if (!url) return;

      // 1. Try Firebase SDK if available globally
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp({ databaseURL: url });
          }
          db = firebase.database();
          initialized = true;
          setupSdkListeners();
          console.log('🔥 [Firebase Cloud] SDK Realtime active 24/7:', url);
          return;
        } catch(e) {
          console.warn('Firebase SDK init notice, falling back to REST:', e);
        }
      }

      // 2. Fallback: REST Polling engine
      if (url) {
        initialized = true;
        console.log('🔥 [Firebase Cloud] REST Engine active 24/7:', url);
        setupRestPolling();
      }
    }

    function setupSdkListeners() {
      if (!db) return;

      // 1. Realtime Locket Moments (Máy Ảnh)
      db.ref('locket').on('value', snapshot => {
        const val = snapshot.val();
        if (val) {
          const list = Array.isArray(val) ? val : Object.values(val);
          list.sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
          cachedLocketItems = list.slice(0, 30);
          try {
            localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(cachedLocketItems));
          } catch(e) {}
          if (typeof renderLocketFeed === 'function') renderLocketFeed(cachedLocketItems);
        }
      });

      // 2. Realtime Memories (Kho Kỷ Niệm)
      db.ref('memories').on('value', snapshot => {
        const val = snapshot.val();
        if (val) {
          const list = Array.isArray(val) ? val : Object.values(val);
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          cachedMemories = list;
          try {
            localStorage.setItem('romantic_gift_user_memories', JSON.stringify(list));
          } catch(e) {}
          if (typeof renderMemoriesGrid === 'function') renderMemoriesGrid();
        }
      });

      // 3. Realtime Notes (Nhật Ký Cảm Xúc)
      db.ref('notes').on('value', snapshot => {
        const val = snapshot.val();
        if (val) {
          const list = Array.isArray(val) ? val : Object.values(val);
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          cachedNotes = list;
          try {
            localStorage.setItem('romantic_gift_user_notes', JSON.stringify(list));
          } catch(e) {}
          if (typeof renderNotesGrid === 'function') renderNotesGrid();
        }
      });

      // 4. Realtime Bucket List
      db.ref('bucket').on('value', snapshot => {
        const val = snapshot.val();
        if (val) {
          const list = Array.isArray(val) ? val : Object.values(val);
          cachedBucketList = list;
          try {
            localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(list));
          } catch(e) {}
          if (typeof renderBucketListUI === 'function') renderBucketListUI();
        }
      });

      // 5. Realtime Couple Config (Ngày kỷ niệm yêu nhau, tên, v.v.)
      db.ref('config').on('value', snapshot => {
        const val = snapshot.val();
        if (val && typeof val === 'object' && val.startDate) {
          userConfig = Object.assign({}, userConfig, val);
          try {
            localStorage.setItem('romantic_gift_config_2010', JSON.stringify(userConfig));
          } catch(e) {}
          if (typeof updateLiveCounter === 'function') updateLiveCounter();
          if (typeof applyConfigToUI === 'function') applyConfigToUI();
        }
      });
    }

    async function fetchCloudLocket() {
      const url = getCleanUrl();
      if (!url) return null;
      try {
        const res = await fetch(url + '/locket.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const list = Array.isArray(data) ? data : Object.values(data);
            return list;
          }
        }
      } catch(e) {}
      return null;
    }

    async function pushLocket(moment) {
      const url = getCleanUrl();
      if (!url) return false;
      if (db) {
        try {
          await db.ref('locket').push(moment);
          return true;
        } catch(e) {}
      }
      try {
        const res = await fetch(url + '/locket.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moment)
        });
        return res.ok;
      } catch(e) {
        return false;
      }
    }

    async function fetchCloudMemories() {
      const url = getCleanUrl();
      if (!url) return null;
      try {
        const res = await fetch(url + '/memories.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const list = Array.isArray(data) ? data : Object.values(data);
            return list;
          }
        }
      } catch(e) {}
      return null;
    }

    async function pushMemory(memory) {
      const url = getCleanUrl();
      if (!url) return false;
      if (db) {
        try {
          await db.ref('memories').push(memory);
          return true;
        } catch(e) {}
      }
      try {
        const res = await fetch(url + '/memories.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memory)
        });
        return res.ok;
      } catch(e) {
        return false;
      }
    }

    async function fetchCloudNotes() {
      const url = getCleanUrl();
      if (!url) return null;
      try {
        const res = await fetch(url + '/notes.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const list = Array.isArray(data) ? data : Object.values(data);
            return list;
          }
        }
      } catch(e) {}
      return null;
    }

    async function pushNote(note) {
      const url = getCleanUrl();
      if (!url) return false;
      if (db) {
        try {
          await db.ref('notes').push(note);
          return true;
        } catch(e) {}
      }
      try {
        const res = await fetch(url + '/notes.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note)
        });
        return res.ok;
      } catch(e) {
        return false;
      }
    }

    async function fetchCloudBucket() {
      const url = getCleanUrl();
      if (!url) return null;
      try {
        const res = await fetch(url + '/bucket.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const list = Array.isArray(data) ? data : Object.values(data);
            return list;
          }
        }
      } catch(e) {}
      return null;
    }

    async function setCloudBucket(bucketList) {
      const url = getCleanUrl();
      if (!url) return false;
      if (db) {
        try {
          await db.ref('bucket').set(bucketList);
          return true;
        } catch(e) {}
      }
      try {
        const res = await fetch(url + '/bucket.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bucketList)
        });
        return res.ok;
      } catch(e) {
        return false;
      }
    }

    function setupRestPolling() {
      setInterval(async () => {
        try {
          const cloudLocket = await fetchCloudLocket();
          if (cloudLocket && Array.isArray(cloudLocket) && cloudLocket.length > 0) {
            cloudLocket.sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if (JSON.stringify(cloudLocket) !== JSON.stringify(cachedLocketItems)) {
              cachedLocketItems = cloudLocket;
              renderLocketFeed(cachedLocketItems);
            }
          }
          const cloudMem = await fetchCloudMemories();
          if (cloudMem && Array.isArray(cloudMem) && cloudMem.length > 0) {
            if (JSON.stringify(cloudMem) !== JSON.stringify(cachedMemories)) {
              cachedMemories = cloudMem;
              renderMemoriesGrid();
            }
          }
        } catch(e) {}
      }, 10000);
    }

    return {
      init,
      isAvailable,
      getCleanUrl,
      pushLocket,
      fetchCloudLocket,
      pushMemory,
      fetchCloudMemories,
      pushNote,
      fetchCloudNotes,
      setCloudBucket,
      fetchCloudBucket
    };
  })();

  // Safe UTF-8 Base64 decoder for shared configuration from URL
  function decodeConfigFromUrl() {
    try {
      let hash = window.location.hash || '';
      if (hash.startsWith('#')) hash = hash.substring(1);
      const urlParams = new URLSearchParams(hash.includes('=') ? hash : window.location.search);
      let dataParam = urlParams.get('data');
      if (!dataParam && hash.startsWith('data=')) {
        dataParam = hash.substring(5);
      }
      if (dataParam) {
        const binary = atob(dataParam);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const jsonStr = new TextDecoder().decode(bytes);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Cannot decode shared configuration from URL:', e);
    }
    return null;
  }

  // Load configuration with priority: Shared URL > config.js / SEED_DATA > localStorage > DEFAULT_CONFIG
  let userConfig = Object.assign({}, DEFAULT_CONFIG);

  // 1. Base cache from localStorage (nếu có)
  // --- VERSIONED CACHE RESET TO ENSURE 100% UNIFIED DATA ACROSS ALL DEVICES ---
  const CURRENT_SYNC_VERSION = '20261018_master_sync_v15';
  try {
    if (localStorage.getItem('romantic_gift_sync_ver') !== CURRENT_SYNC_VERSION) {
      localStorage.removeItem('romantic_gift_user_memories');
      localStorage.removeItem('romantic_gift_locket_feed');
      localStorage.removeItem('romantic_gift_user_notes');
      localStorage.removeItem('romantic_gift_bucket_list');
      localStorage.removeItem('romantic_gift_user_bucket');
      localStorage.setItem('romantic_gift_sync_ver', CURRENT_SYNC_VERSION);
      if (window.indexedDB) {
        try {
          const req = indexedDB.open('LoveGiftMemoriesDB', 1);
          req.onsuccess = (e) => {
            const db = e.target.result;
            if (db && db.objectStoreNames.contains('memories_store')) {
              const tx = db.transaction('memories_store', 'readwrite');
              tx.objectStore('memories_store').clear();
            }
          };
        } catch(err) {}
      }
    }
  } catch(e) {}

  try {
    const saved = localStorage.getItem('romantic_gift_config_2010');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.girlfriendRealName === 'N.T.B.N') parsed.girlfriendRealName = 'bé mèo';
      if (parsed.boyfriendRealName === 'Huỳnh Ngọc Thắng') parsed.boyfriendRealName = 'khúc gỗ';
      if (parsed.wheelPrizes && parsed.wheelPrizes.length === 6 && !parsed.wheelPrizes[0].title.includes('Trà Sữa')) {
        userConfig = Object.assign({}, userConfig, parsed);
      } else {
        delete parsed.wheelPrizes;
        userConfig = Object.assign({}, userConfig, parsed);
      }
    }
  } catch (e) {
    console.warn('Storage not available', e);
  }

  // 2. Official SEED_DATA config (fallback đồng bộ offline)
  if (window.SEED_DATA && window.SEED_DATA.config && typeof window.SEED_DATA.config === 'object') {
    userConfig = Object.assign({}, userConfig, window.SEED_DATA.config);
  }

  // 3. Official COUPLE_CONFIG từ config.js (luôn ưu tiên cao hơn localStorage cũ)
  if (window.COUPLE_CONFIG && typeof window.COUPLE_CONFIG === 'object') {
    userConfig = Object.assign({}, userConfig, window.COUPLE_CONFIG);
  }

  // 4. Ưu tiên cao nhất #1: Shared URL data (#data=...) khi mở từ link Admin
  const sharedConfig = decodeConfigFromUrl();
  if (sharedConfig && typeof sharedConfig === 'object') {
    userConfig = Object.assign({}, userConfig, sharedConfig);
    try {
      localStorage.setItem('romantic_gift_config_2010', JSON.stringify(userConfig));
    } catch(e) {}
  }

  // --- REALTIME 2-WAY BROADCAST CHANNEL BETWEEN BÉ & ADMIN ---
  let syncChannel = null;
  try {
    syncChannel = new BroadcastChannel('love_gift_realtime_sync');
    syncChannel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      console.log('[Bé] ⚡ Nhận tín hiệu thời gian thực từ Admin:', data);

      if (data.type === 'CONFIG_UPDATED') {
        if (data.payload && typeof data.payload === 'object') {
          userConfig = Object.assign({}, userConfig, data.payload);
          try {
            localStorage.setItem('romantic_gift_config_2010', JSON.stringify(userConfig));
          } catch(e) {}
          if (typeof applyConfigToUI === 'function') applyConfigToUI();
          if (typeof drawLuckyWheel === 'function') drawLuckyWheel();
        } else if (typeof syncConfigToUI === 'function') {
          syncConfigToUI();
        }
      } else if (data.type === 'DATA_UPDATED') {
        const mod = data.payload && data.payload.module;
        if ((!mod || mod === 'notes') && typeof syncNotesToUI === 'function') syncNotesToUI();
        if ((!mod || mod === 'memories') && typeof syncMemoriesToUI === 'function') syncMemoriesToUI();
        if ((!mod || mod === 'bucket') && typeof fetchBucketList === 'function') fetchBucketList();
        if ((!mod || mod === 'locket') && typeof loadLocketFeed === 'function') loadLocketFeed();
      }
    };
  } catch(e) {
    console.warn('BroadcastChannel not available', e);
  }

  function broadcastRealtime(type = 'BÉ_ACTION', payload = {}) {
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch(e) {}
    }
  }

  // Fallback cross-window storage event listener
  window.addEventListener('storage', (event) => {
    if (event.key === 'romantic_gift_config_2010' || event.key === 'romantic_gift_last_sync') {
      if (typeof syncConfigToUI === 'function') syncConfigToUI();
    } else if (event.key === 'romantic_gift_user_notes') {
      if (typeof renderDiaryNotes === 'function') renderDiaryNotes();
    } else if (event.key === 'romantic_gift_user_memories') {
      if (typeof renderMemoriesGrid === 'function') renderMemoriesGrid();
    } else if (event.key === 'romantic_gift_bucket_list') {
      if (typeof renderBucketList === 'function') renderBucketList();
    } else if (event.key === 'romantic_gift_locket_feed') {
      if (typeof loadLocketFeed === 'function') loadLocketFeed();
    }
  });

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playKeyClick() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playUnlockSound() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.15, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.35);
      });
    }

    playFlowerBloomSound() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.8);
      });
    }

    playCameraShutter() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    playScratchSound() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    playWheelTick() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    }

    playWinFanfare() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.8);
      });
    }

    playTypewriterClick() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }

    playCameraShutter() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(900, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      gain2.gain.setValueAtTime(0.14, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.12);
    }

    playSuccessChime() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    }

    playErrorBuzz() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  const sound = new SoundEngine();

  // --- AMBIENT PARTICLES (Bokeh & Hearts) ---
  function initAmbientParticles() {
    const container = document.getElementById('ambient-particles');
    if (!container) return;
    const particleCount = 20;
    const icons = ['✨', '💖', '🌸', '💫', '💕', '⭐'];

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      p.innerText = icons[Math.floor(Math.random() * icons.length)];
      p.style.left = Math.random() * 100 + 'vw';
      p.style.fontSize = (12 + Math.random() * 16) + 'px';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      container.appendChild(p);
    }
  }

  // --- 1. IPHONE STYLE PASSCODE LOCK SCREEN ---
  let enteredPasscode = '';
  const lockScreen = document.getElementById('lock-screen');
  const appContainer = document.getElementById('app-container');
  const passcodeDots = document.getElementById('passcode-dots');
  const passcodeErrorMsg = document.getElementById('passcode-error-msg');
  const lockClockDisplay = document.getElementById('lock-clock-display');
  const lockDateDisplay = document.getElementById('lock-date-display');
  const lockIconWrap = document.getElementById('lock-icon-wrap');
  const hintBubble = document.getElementById('hint-bubble');

  function updateLockClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    if (lockClockDisplay) lockClockDisplay.textContent = `${hh}:${mm}`;

    const daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = daysVi[now.getDay()];
    const dayDate = now.getDate();
    const month = now.getMonth() + 1;
    if (lockDateDisplay) {
      lockDateDisplay.textContent = `${dayName}, ngày ${dayDate} tháng ${month}`;
    }
  }
  setInterval(updateLockClock, 1000);
  updateLockClock();

  function updatePasscodeDots() {
    const dots = passcodeDots.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
      if (idx < enteredPasscode.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function handleKeypadPress(key) {
    sound.init();
    sound.playKeyClick();
    if (enteredPasscode.length < 4) {
      enteredPasscode += key;
      updatePasscodeDots();
      if (enteredPasscode.length === 4) {
        verifyPasscode();
      }
    }
  }

  function handleDeletePasscode() {
    sound.init();
    sound.playKeyClick();
    if (enteredPasscode.length > 0) {
      enteredPasscode = enteredPasscode.slice(0, -1);
      updatePasscodeDots();
      passcodeErrorMsg.textContent = '';
    }
  }

  function verifyPasscode() {
    const expected = userConfig.passcode || '2010';
    if (enteredPasscode === expected) {
      // SUCCESS!
      sound.playUnlockSound();
      lockIconWrap.classList.add('unlocked-anim');
      passcodeErrorMsg.style.color = '#55efc4';
      passcodeErrorMsg.textContent = 'Mật mã chính xác! Đang mở quà... 💖';

      setTimeout(() => {
        lockScreen.classList.add('unlocked');
        
        // Start background music
        playBackgroundAudio();
        
        // Open Fullscreen Cinematic Flower Gift presentation
        playFlowerGiftCinematic();
      }, 700);

    } else {
      // ERROR - VIBRATE & SHAKE
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      passcodeDots.classList.add('shake-error');
      passcodeErrorMsg.style.color = '#ff7675';
      passcodeErrorMsg.textContent = 'Mật khẩu sai rồi nha đồ ngốc! Thử lại đi nè 🥺';

      setTimeout(() => {
        passcodeDots.classList.remove('shake-error');
        enteredPasscode = '';
        updatePasscodeDots();
      }, 650);
    }
  }

  // Keypad button listeners
  const keyButtons = document.querySelectorAll('.key-btn[data-key]');
  keyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      handleKeypadPress(key);
    });
  });

  const btnDelete = document.getElementById('btn-delete');
  if (btnDelete) {
    btnDelete.addEventListener('click', handleDeletePasscode);
  }

  const btnHint = document.getElementById('btn-hint');
  if (btnHint) {
    btnHint.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      hintBubble.classList.toggle('show');
      setTimeout(() => {
        hintBubble.classList.remove('show');
      }, 4000);
    });
  }

  // Keyboard support for passcode
  window.addEventListener('keydown', (e) => {
    if (!lockScreen.classList.contains('unlocked')) {
      if (/^[0-9]$/.test(e.key)) {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDeletePasscode();
      }
    }
  });

  // ==========================================================
  // 💐 FULLSCREEN CINEMATIC 20/10 FLOWER GIFT ENGINE
  // ==========================================================
  const flowerGiftScreen = document.getElementById('flower-gift-screen');
  const flowerSkipBtn = document.getElementById('flower-skip-btn');
  const btnReplayFlower = document.getElementById('btn-replay-flower');
  let flowerParticlesRunning = false;
  let flowerAnimFrameId = null;
  let flowerAnimTimeout = null;

  function playFlowerGiftCinematic() {
    if (!flowerGiftScreen) {
      appContainer.classList.remove('app-hidden');
      launchWelcomeConfetti();
      return;
    }

    // Populate customized recipient name & boyfriend name
    const gfNameEl = document.getElementById('flower-gf-name');
    const bfNameEl = document.getElementById('flower-bf-name');
    if (gfNameEl) gfNameEl.textContent = (userConfig && userConfig.girlfriendName) || 'Bé Mèo';
    if (bfNameEl) bfNameEl.textContent = (userConfig && userConfig.boyfriendName) || 'Khúc Gỗ';

    flowerGiftScreen.classList.remove('dissolve-out', 'ready-to-tap');
    flowerGiftScreen.classList.add('active');
    flowerGiftScreen.setAttribute('aria-hidden', 'false');

    // Play magical harp bloom sound
    try {
      sound.init();
      sound.playFlowerBloomSound();
    } catch(e) {}

    // Trigger stage bloom transition
    requestAnimationFrame(() => {
      flowerGiftScreen.classList.add('playing');
    });

    // Start 60fps canvas particles (falling rose petals & glowing golden stardust)
    startFlowerParticles();

    // After animation sequence finishes (~3.0s), stop in breathing state and display tap hint
    clearTimeout(flowerAnimTimeout);
    flowerAnimTimeout = setTimeout(() => {
      flowerGiftScreen.classList.add('ready-to-tap');
    }, 3000);
  }

  function dismissFlowerGift() {
    if (!flowerGiftScreen || !flowerGiftScreen.classList.contains('active')) return;

    // Smooth cinematic dissolve transition
    flowerGiftScreen.classList.remove('ready-to-tap');
    flowerGiftScreen.classList.add('dissolve-out');

    // Reveal main app container
    appContainer.classList.remove('app-hidden');

    // Launch welcome confetti celebration!
    launchWelcomeConfetti();

    setTimeout(() => {
      flowerGiftScreen.classList.remove('active', 'playing', 'dissolve-out');
      flowerGiftScreen.setAttribute('aria-hidden', 'true');
      stopFlowerParticles();
    }, 750);
  }

  // Tap ANYWHERE on the screen to proceed
  if (flowerGiftScreen) {
    flowerGiftScreen.addEventListener('click', (e) => {
      dismissFlowerGift();
    });
  }

  // Skip button
  if (flowerSkipBtn) {
    flowerSkipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissFlowerGift();
    });
  }

  // Replay button in top nav
  if (btnReplayFlower) {
    btnReplayFlower.addEventListener('click', () => {
      playFlowerGiftCinematic();
    });
  }

  // Direct shortcut preview via URL hash: index.html#flower
  if (window.location.hash && window.location.hash.toLowerCase().includes('flower')) {
    setTimeout(() => {
      if (lockScreen) lockScreen.classList.add('unlocked');
      playBackgroundAudio();
      playFlowerGiftCinematic();
    }, 400);
  }

  // Physics-based Rose Petals & Golden Fairy Dust Canvas System
  function startFlowerParticles() {
    const canvas = document.getElementById('flower-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();

    flowerParticlesRunning = true;

    // 40 delicate rose petals
    const petals = [];
    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height * 0.8,
        size: 11 + Math.random() * 14,
        speedX: -1 + Math.random() * 2,
        speedY: 1.5 + Math.random() * 2.5,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.035,
        flip: Math.random(),
        flipSpeed: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.4 ? '#ff758c' : (Math.random() > 0.5 ? '#ff85a2' : '#e84393'),
        opacity: 0.6 + Math.random() * 0.35
      });
    }

    // 30 glistening golden fairy sparks
    const sparkles = [];
    for (let i = 0; i < 30; i++) {
      sparkles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 3.5,
        speedY: -0.5 - Math.random() * 1.2,
        speedX: (Math.random() - 0.5) * 0.6,
        alpha: Math.random(),
        pulseSpeed: 0.025 + Math.random() * 0.03,
        color: Math.random() > 0.35 ? '#ffd700' : '#ffffff'
      });
    }

    function render() {
      if (!flowerParticlesRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render fairy sparks
      sparkles.forEach(s => {
        s.y += s.speedY;
        s.x += s.speedX;
        s.alpha += s.pulseSpeed;
        if (s.alpha > 1 || s.alpha < 0.2) s.pulseSpeed = -s.pulseSpeed;
        if (s.y < -10) {
          s.y = canvas.height + 10;
          s.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render rose petals
      petals.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(p.angle) * 1.6 + p.speedX;
        p.angle += p.angularSpeed;
        p.flip += p.flipSpeed;

        if (p.y > canvas.height + 25) {
          p.y = -25;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -25) p.x = canvas.width + 25;
        if (p.x > canvas.width + 25) p.x = -25;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(Math.cos(p.flip), 1);
        ctx.globalAlpha = p.opacity;

        // Realistic curved petal bezier geometry
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size, -p.size, -p.size / 2, 0, -p.size * 1.35);
        ctx.bezierCurveTo(p.size, -p.size / 2, p.size / 2, -p.size, 0, 0);
        ctx.fill();
        ctx.restore();
      });

      flowerAnimFrameId = requestAnimationFrame(render);
    }

    render();
  }

  function stopFlowerParticles() {
    flowerParticlesRunning = false;
    if (flowerAnimFrameId) cancelAnimationFrame(flowerAnimFrameId);
    const canvas = document.getElementById('flower-particles-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // --- 2. FLOATING VINYL PLAYER & BACKGROUND AUDIO ---
  const vinylPlayer = document.getElementById('vinyl-player');
  const bgAudio = document.getElementById('bg-audio');
  let isAudioPlaying = false;

  function playBackgroundAudio() {
    if (!bgAudio) return;
    bgAudio.volume = 0.7;
    const playPromise = bgAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isAudioPlaying = true;
        vinylPlayer.classList.add('playing');
      }).catch(err => {
        console.warn('Autoplay prevented:', err);
        isAudioPlaying = false;
        vinylPlayer.classList.remove('playing');
      });
    }
  }

  function toggleAudioPlayback() {
    sound.init();
    if (!bgAudio) return;
    if (isAudioPlaying) {
      bgAudio.pause();
      isAudioPlaying = false;
      vinylPlayer.classList.remove('playing');
    } else {
      bgAudio.play().then(() => {
        isAudioPlaying = true;
        vinylPlayer.classList.add('playing');
      }).catch(e => console.warn(e));
    }
  }

  if (vinylPlayer) {
    vinylPlayer.addEventListener('click', toggleAudioPlayback);
  }

  // --- 3. LIVE TIME COUNTER ---
  const counterYears = document.getElementById('counter-years');
  const counterDays = document.getElementById('counter-days');
  const counterHours = document.getElementById('counter-hours');
  const counterMinutes = document.getElementById('counter-minutes');
  const counterSeconds = document.getElementById('counter-seconds');
  const statTotalDays = document.getElementById('stat-total-days');

  function updateLiveCounter() {
    const startDate = new Date(userConfig.startDate || '2023-05-20T00:00:00');
    const now = new Date();
    let diffMs = now - startDate;

    if (diffMs < 0) diffMs = 0;

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalDays = Math.floor(totalSeconds / 86400);

    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (counterYears) counterYears.textContent = years;
    if (counterDays) counterDays.textContent = days;
    if (counterHours) counterHours.textContent = String(hours).padStart(2, '0');
    if (counterMinutes) counterMinutes.textContent = String(minutes).padStart(2, '0');
    if (counterSeconds) counterSeconds.textContent = String(seconds).padStart(2, '0');

    if (statTotalDays) {
      statTotalDays.textContent = `💕 ${totalDays} Ngày gắn kết`;
    }
  }
  setInterval(updateLiveCounter, 1000);
  updateLiveCounter();

  // --- 4. SLIDE NAVIGATION & BOTTOM DOCK ---
  const slideSections = document.querySelectorAll('.slide-section');
  const dockButtons = document.querySelectorAll('.dock-btn');
  let currentSlide = 0;
  let previousSlide = 0;

  function goToSlide(index) {
    sound.init();
    sound.playKeyClick();
    if (index < 0 || index >= slideSections.length) return;
    if (index !== currentSlide) {
      previousSlide = currentSlide;
    }
    currentSlide = index;

    slideSections.forEach((section, idx) => {
      if (idx === index) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    dockButtons.forEach((btn, idx) => {
      if (idx === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Special trigger on enter slide
    if (index === 1) {
      initScratchCard();
    } else if (index === 3) {
      initLocketCamera();
      loadLocketFeed();
    } else if (index === 4) {
      renderDiaryNotes();
    } else if (index === 5) {
      renderMemoriesGrid();
      syncMemoriesToUI();
    } else if (index === 6) {
      renderBucketList();
      fetchBucketList();
    }

    // Stop locket camera when navigating away from slide 3
    if (index !== 3) {
      stopLocketCamera();
    }
  }

  dockButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => goToSlide(idx));
  });

  const nextSlideButtons = document.querySelectorAll('.btn-next-slide');
  nextSlideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-goto'), 10);
      goToSlide(target);
    });
  });

  // Compatibility stubs for wheel prizes
  function getWheelPrizes() {
    return (userConfig.wheelPrizes && userConfig.wheelPrizes.length === 6)
      ? userConfig.wheelPrizes
      : DEFAULT_WHEEL_PRIZES;
  }
  function drawLuckyWheel() {}

  // --- 6. INTERACTIVE SCRATCH CARD (HTML5 Canvas) ---
  const scratchCanvas = document.getElementById('scratch-canvas');
  const scratchProgressFill = document.getElementById('scratch-progress-fill');
  const scratchProgressText = document.getElementById('scratch-progress-text');
  const scratchHintOverlay = document.getElementById('scratch-hint-overlay');
  const btnRevealAllScratch = document.getElementById('btn-reveal-all-scratch');
  let isScratching = false;
  let isRevealed = false;
  let scratchCtx = null;
  let strokeCount = 0;

  function initScratchCard() {
    if (!scratchCanvas || isRevealed) return;
    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
    const wrapper = scratchCanvas.parentElement;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    scratchCanvas.width = width;
    scratchCanvas.height = height;

    // Draw shimmering metallic foil gradient
    const grad = scratchCtx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#c0c0c0');
    grad.addColorStop(0.2, '#f5f5f5');
    grad.addColorStop(0.4, '#e0e0e0');
    grad.addColorStop(0.6, '#ffd1dc');
    grad.addColorStop(0.8, '#e6e6e6');
    grad.addColorStop(1, '#d8d8d8');

    scratchCtx.fillStyle = grad;
    scratchCtx.fillRect(0, 0, width, height);

    // Add metallic speckles & sparkles pattern
    scratchCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rr = Math.random() * 2.5;
      scratchCtx.beginPath();
      scratchCtx.arc(rx, ry, rr, 0, 2 * Math.PI);
      scratchCtx.fill();
    }

    // Top text on foil
    scratchCtx.font = 'bold 18px Outfit, sans-serif';
    scratchCtx.fillStyle = '#635336';
    scratchCtx.textAlign = 'center';
    scratchCtx.fillText('✨ LỚP MÃ CÀO BẢO MẬT 20/10 ✨', width / 2, height / 2 - 20);

    scratchCtx.font = '14px Outfit, sans-serif';
    scratchCtx.fillStyle = '#8a795d';
    scratchCtx.fillText('Chà ngón tay hoặc chuột để khám phá', width / 2, height / 2 + 10);
  }

  function getScratchCoords(e) {
    const rect = scratchCanvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function scratchAt(x, y) {
    if (!scratchCtx || isRevealed) return;
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.beginPath();
    scratchCtx.arc(x, y, 28, 0, 2 * Math.PI);
    scratchCtx.fill();

    sound.playScratchSound();

    if (scratchHintOverlay) {
      scratchHintOverlay.style.opacity = '0';
    }

    strokeCount++;
    if (strokeCount % 12 === 0) {
      checkScratchPercentage();
    }
  }

  function checkScratchPercentage() {
    if (isRevealed || !scratchCtx) return;
    const width = scratchCanvas.width;
    const height = scratchCanvas.height;
    const imgData = scratchCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    let transparentCount = 0;
    const totalSamples = pixels.length / 4;

    // Sample every 16th pixel for high performance
    for (let i = 3; i < pixels.length; i += 16 * 4) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const sampledTotal = Math.floor(totalSamples / 16);
    const percent = Math.min(100, Math.round((transparentCount / sampledTotal) * 100));

    if (scratchProgressFill) scratchProgressFill.style.width = percent + '%';
    if (scratchProgressText) scratchProgressText.textContent = `Đã cào: ${percent}%`;

    // Once scratched over 55%, trigger celebration and auto-reveal!
    if (percent >= 55) {
      revealFullScratch();
    }
  }

  function revealFullScratch() {
    if (isRevealed) return;
    isRevealed = true;
    sound.playWinFanfare();

    if (scratchCanvas) {
      scratchCanvas.classList.add('fade-out');
    }
    if (scratchProgressFill) scratchProgressFill.style.width = '100%';
    if (scratchProgressText) scratchProgressText.textContent = '🎉 ĐÃ MỞ KHÓA HOÀN TOÀN!';

    launchCelebrationConfetti();
  }

  if (scratchCanvas) {
    // Mouse events
    scratchCanvas.addEventListener('mousedown', (e) => {
      sound.init();
      isScratching = true;
      const coords = getScratchCoords(e);
      scratchAt(coords.x, coords.y);
    });

    window.addEventListener('mousemove', (e) => {
      if (isScratching) {
        const coords = getScratchCoords(e);
        scratchAt(coords.x, coords.y);
      }
    });

    window.addEventListener('mouseup', () => {
      isScratching = false;
    });

    // Touch events for mobile
    scratchCanvas.addEventListener('touchstart', (e) => {
      sound.init();
      isScratching = true;
      const coords = getScratchCoords(e);
      scratchAt(coords.x, coords.y);
    }, { passive: false });

    scratchCanvas.addEventListener('touchmove', (e) => {
      if (isScratching) {
        e.preventDefault();
        const coords = getScratchCoords(e);
        scratchAt(coords.x, coords.y);
      }
    }, { passive: false });

    scratchCanvas.addEventListener('touchend', () => {
      isScratching = false;
    });
  }

  if (btnRevealAllScratch) {
    btnRevealAllScratch.addEventListener('click', revealFullScratch);
  }

  // --- 7. POLAROID PHOTO BOOTH UPGRADE (TOUCH HEARTS + PHOTOS) ---
  const polaroidStage = document.getElementById('polaroid-stage');
  const polaroidsShelf = document.getElementById('polaroids-shelf');
  const stagePlaceholderHint = document.getElementById('stage-placeholder-hint');
  const btnSpawnPolaroid = document.getElementById('btn-spawn-polaroid');
  const btnClearPolaroids = document.getElementById('btn-clear-polaroids');

  const POLAROID_DATA = [
    { src: 'images/photo1.jpg', caption: 'Bên bé mọi khoảnh khắc đều đẹp 💖', date: 'Kỷ niệm yêu thương' },
    { src: 'images/photo2.jpg', caption: 'Nụ cười tỏa nắng của bé ☀️', date: 'Ngày hạnh phúc' },
    { src: 'images/photo3.jpg', caption: 'Nắm tay bé đi khắp thế gian 🌸', date: 'Tình yêu ngọt ngào' },
    { src: 'images/photo4.jpg', caption: 'Bé yêu của anh ✨', date: 'Những ngày bình yên' },
    { src: 'images/photo5.jpg', caption: 'Mỗi ngày bên bé là một món quà 🎁', date: 'Hành trình bên nhau' },
    { src: 'images/photo6.jpg', caption: 'Ánh mắt bé làm tan chảy tim anh ✨', date: 'Khoảnh khắc diệu kỳ' },
    { src: 'images/photo7.jpg', caption: 'Yêu bé nhiều hơn mỗi ngày 💕', date: 'Kỷ niệm đôi ta' },
    { src: 'images/photo8.jpg', caption: 'Thế giới của anh thu nhỏ lại bằng bé 🌍', date: 'Yêu thương đong đầy' },
    { src: 'images/photo9.jpg', caption: 'Bình yên nhất là khi có bé 🍃', date: 'Ngọt ngào bên bé' },
    { src: 'images/photo10.jpg', caption: 'Đi cùng với anh nhó 👵👴', date: 'Hứa mãi bên nhau' },
    { src: 'images/photo11.jpg', caption: 'Hạnh phúc đơn giản là có bé bên cạnh 🥰', date: 'Mùa yêu thương' },
    { src: 'images/photo12.jpg', caption: 'Chúc mừng 20/10 người anh yêu nhất trần đời 💐', date: '20.10.2026 ❤️' }
  ];

  let polaroidCounter = 0;
  let highestZ = 10;

  // Touch hearts burst at exact coordinate
  function burstHeartsAt(x, y) {
    const heartIcons = ['💖', '💕', '💗', '💓', '💝', '✨', '🌸'];
    const burstCount = 10;

    for (let i = 0; i < burstCount; i++) {
      const heart = document.createElement('span');
      heart.className = 'touch-heart-burst';
      heart.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';

      // Random direction vector
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() * 0.4);
      const distance = 40 + Math.random() * 65;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      heart.style.setProperty('--dx', `${dx}px`);
      heart.style.setProperty('--dy', `${dy}px`);
      heart.style.fontSize = (16 + Math.random() * 14) + 'px';

      document.body.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 1200);
    }
  }

  function spawnPolaroidAt(targetX, targetY) {
    sound.init();
    sound.playCameraShutter();
    if (stagePlaceholderHint) stagePlaceholderHint.style.opacity = '0';

    const stageRect = polaroidStage.getBoundingClientRect();
    const activeMemories = typeof getSavedMemories === 'function' ? getSavedMemories() : POLAROID_DATA;
    const pool = (Array.isArray(activeMemories) && activeMemories.length > 0) ? activeMemories : POLAROID_DATA;
    const data = pool[polaroidCounter % pool.length];
    polaroidCounter++;
    highestZ++;

    // Calculate position within bounds
    let posX = targetX !== undefined ? (targetX - stageRect.left) : (stageRect.width / 2);
    let posY = targetY !== undefined ? (targetY - stageRect.top) : (stageRect.height / 2);

    // Keep cards nicely inside
    posX = Math.max(90, Math.min(stageRect.width - 90, posX));
    posY = Math.max(120, Math.min(stageRect.height - 120, posY));

    const randomRot = (Math.random() * 24 - 12).toFixed(1);

    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.style.left = posX + 'px';
    card.style.top = posY + 'px';
    card.style.zIndex = highestZ;
    card.style.transform = `translate(-50%, -50%) rotate(${randomRot}deg)`;

    const resolvedPolaroidSrc = resolveMediaUrl(data.src);
    const safeCaption = escapeHTML(data.caption || 'Kỷ niệm đôi ta');
    const safeDate = escapeHTML(data.date || '');

    card.innerHTML = `
      <div class="polaroid-tape"></div>
      <div class="polaroid-img-wrap">
        <img src="${resolvedPolaroidSrc}" alt="${safeCaption}" loading="lazy" onerror="this.onerror=null;this.src='images/photo1.jpg';">
      </div>
      <p class="polaroid-caption">${safeCaption}</p>
      <p class="polaroid-date">${safeDate}</p>
    `;

    // Make polaroid draggable
    makeDraggable(card);

    // Click to bring to top
    card.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      highestZ++;
      card.style.zIndex = highestZ;
    });

    polaroidsShelf.appendChild(card);
  }

  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initLeft, initTop;

    element.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = parseFloat(element.style.left) || 0;
      initTop = parseFloat(element.style.top) || 0;
      element.setPointerCapture(e.pointerId);
    });

    element.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = (initLeft + dx) + 'px';
      element.style.top = (initTop + dy) + 'px';
    });

    element.addEventListener('pointerup', (e) => {
      isDragging = false;
      try { element.releasePointerCapture(e.pointerId); } catch(err){}
    });
  }

  if (polaroidStage) {
    polaroidStage.addEventListener('click', (e) => {
      if (e.target.closest('.polaroid-card') || e.target.closest('button')) return;
      // Burst hearts at click location
      burstHeartsAt(e.clientX, e.clientY);
      // Spawn new polaroid photo at that spot
      spawnPolaroidAt(e.clientX, e.clientY);
    });
  }

  if (btnSpawnPolaroid) {
    btnSpawnPolaroid.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = polaroidStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      burstHeartsAt(cx, cy);
      spawnPolaroidAt(cx, cy);
    });
  }

  if (btnClearPolaroids) {
    btnClearPolaroids.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      sound.playKeyClick();
      if (polaroidsShelf) polaroidsShelf.innerHTML = '';
      if (stagePlaceholderHint) stagePlaceholderHint.style.opacity = '1';
    });
  }

  // --- HELPER FUNCTIONS ---
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- 8. MINI LOCKET COUPLE WIDGET (CHỤP ẢNH TỨC THÌ & VIDEO 5S) ---
  const locketVideo = document.getElementById('locket-video');
  const locketCanvas = document.getElementById('locket-canvas');
  const locketViewportFrame = document.getElementById('locket-viewport-frame');
  const locketFlashOverlay = document.getElementById('locket-flash-overlay');
  const locketLiveClock = document.getElementById('locket-live-clock');
  const locketRecBadge = document.getElementById('locket-rec-badge');
  const locketRecSeconds = document.getElementById('locket-rec-seconds');
  const locketDisplayName = document.getElementById('locket-display-name');
  const locketQuoteTag = document.getElementById('locket-quote-tag');
  const locketLiveSticker = document.getElementById('locket-live-sticker');

  // Preview elements
  const locketPreviewWrap = document.getElementById('locket-preview-wrap');
  const locketPreviewImg = document.getElementById('locket-preview-img');
  const locketPreviewVideo = document.getElementById('locket-preview-video');
  const btnRetakeLocket = document.getElementById('btn-retake-locket');
  const btnRetakeCorner = document.getElementById('btn-retake-corner');
  const locketPreviewQuote = document.getElementById('locket-preview-quote');
  const locketPreviewSticker = document.getElementById('locket-preview-sticker');
  const locketFocusRing = document.getElementById('locket-focus-ring');
  const locketToast = document.getElementById('locket-toast');

  // Navigation, HUD & Status elements
  const btnCameraClose = document.getElementById('btn-camera-close');
  const cameraStatusPill = document.getElementById('camera-status-pill');
  const cameraStatusDot = document.getElementById('camera-status-dot');
  const cameraStatusText = document.getElementById('camera-status-text');
  const btnToggleFeedDrawer = document.getElementById('btn-toggle-feed-drawer');
  const btnCloseFeedDrawer = document.getElementById('btn-close-feed-drawer');
  const feedDrawerBackdrop = document.getElementById('feed-drawer-backdrop');
  const cameraFeedDrawer = document.getElementById('camera-feed-drawer');
  const cameraFeedBadge = document.getElementById('camera-feed-badge');

  // Tool buttons
  const btnFlipCamera = document.getElementById('btn-flip-camera');
  const btnToggleFlash = document.getElementById('btn-toggle-flash');
  const btnLocketHeartPulse = document.getElementById('btn-locket-heart-pulse');
  const filterChips = document.querySelectorAll('.locket-filter-chip');

  // Shutter & Mode
  const tabModePhoto = document.getElementById('tab-mode-photo');
  const tabModeVideo = document.getElementById('tab-mode-video');
  const btnLocketShutter = document.getElementById('btn-locket-shutter');
  const locketProgressFill = document.getElementById('locket-progress-fill');
  const btnLocketBrowseFile = document.getElementById('btn-locket-browse-file');
  const btnCameraFallbackFile = document.getElementById('btn-camera-fallback-file');
  const locketFileInput = document.getElementById('locket-file-input');
  const locketShutterBar = document.getElementById('locket-shutter-bar');

  // Caption & Recipient Send Sheet
  const locketCaptionBox = document.getElementById('locket-caption-box');
  const locketCaptionInput = document.getElementById('locket-caption-input');
  const btnOpenRecipientSheet = document.getElementById('btn-open-recipient-sheet');
  const btnCloseRecipientSheet = document.getElementById('btn-close-recipient-sheet');
  const recipientSheetBackdrop = document.getElementById('recipient-sheet-backdrop');
  const cameraRecipientSheet = document.getElementById('camera-recipient-sheet');
  const btnInstantSend = document.getElementById('btn-instant-send');
  const btnSendLocket = document.getElementById('btn-send-locket');
  const btnCancelSendLocket = document.getElementById('btn-cancel-send-locket');
  const quickSendPersonName = document.getElementById('quick-send-person-name');
  const choiceTitleBf = document.getElementById('choice-title-bf');
  const recipientCheckboxes = document.querySelectorAll('input[name="camera_target_recipient"]');
  const recipientChoiceItems = document.querySelectorAll('.recipient-choice-item');
  const stickerBtns = document.querySelectorAll('.locket-sticker-btn');

  // Camera Overlay & Prompt
  const cameraStartOverlay = document.getElementById('camera-start-overlay');
  const btnStartCamera = document.getElementById('btn-start-camera');
  const cameraPromptTip = document.getElementById('camera-prompt-tip');

  // Feed
  const locketFeedGrid = document.getElementById('locket-feed-grid');
  const locketFeedCount = document.getElementById('locket-feed-count');

  let currentCameraFacing = 'user'; // 'user' (selfie/front) or 'environment' (rear)
  let isFlashActive = false;
  let activeLocketFilter = 'normal';
  let activeLocketSticker = '💕';
  let currentLocketMode = 'photo'; // 'photo' or 'video'

  let locketMediaStream = null;
  let mediaRecorder = null;
  let recordedBlobs = [];
  let isRecordingVideo = false;
  let recordingInterval = null;
  let capturedMediaData = null; // { type: 'photo' | 'video', base64: '...', rawBase64: '...' }
  let cachedLocketItems = (function() {
    try {
      const raw = localStorage.getItem('romantic_gift_locket_feed');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch(e) {}
    if (typeof window !== 'undefined' && window.SEED_DATA && Array.isArray(window.SEED_DATA.locket)) {
      return JSON.parse(JSON.stringify(window.SEED_DATA.locket));
    }
    return [];
  })();

  // 1. Dynamic Status Indicator & Clock
  function updateCameraStatus(statusClass, statusText) {
    if (cameraStatusText) {
      cameraStatusText.textContent = statusText;
    }
    if (cameraStatusDot) {
      cameraStatusDot.className = 'camera-status-dot ' + (statusClass || '');
    }
  }

  function updateLocketClock() {
    if (!locketLiveClock) return;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    locketLiveClock.textContent = `${hours}:${mins} • Hôm nay`;
  }
  setInterval(updateLocketClock, 1000);
  updateLocketClock();

  // Personalize recipient names in UI
  const partnerBoyfriendName = (userConfig && userConfig.boyfriendName) || 'Khúc Gỗ';
  if (quickSendPersonName) {
    quickSendPersonName.textContent = `Gửi Cho ${partnerBoyfriendName} 💖`;
  }
  if (choiceTitleBf) {
    choiceTitleBf.textContent = `Chàng Trai Của Bé (${partnerBoyfriendName})`;
  }

  // Toast Notification for Camera
  function showLocketToast(message, emoji = '💖') {
    if (!locketToast) return;
    locketToast.innerHTML = `<span>${emoji}</span><span>${message}</span>`;
    locketToast.classList.add('show');
    clearTimeout(locketToast._timer);
    locketToast._timer = setTimeout(() => {
      locketToast.classList.remove('show');
    }, 2800);
  }

  // Close camera button: Return to previous screen & turn off camera
  if (btnCameraClose) {
    btnCameraClose.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      sound.playKeyClick();
      stopLocketCamera();
      const targetSlide = (typeof previousSlide === 'number' && previousSlide !== 3) ? previousSlide : 0;
      goToSlide(targetSlide);
      showLocketToast('Đã đóng máy ảnh ✨', '📸');
    });
  }

  // Tap-to-focus on camera viewfinder
  if (locketViewportFrame) {
    let lastTapTime = 0;
    const handleViewportTap = (e) => {
      if (locketPreviewWrap && locketPreviewWrap.classList.contains('active')) return;
      const now = Date.now();
      const isDoubleTap = now - lastTapTime < 320;
      lastTapTime = now;

      if (isDoubleTap) {
        // Double tap: flip camera!
        sound.init();
        sound.playKeyClick();
        toggleFlipCamera();
        return;
      }

      // Single tap: focus box animation
      const rect = locketViewportFrame.getBoundingClientRect();
      const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) || (rect.left + rect.width / 2);
      const clientY = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) || (rect.top + rect.height / 2);
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (locketFocusRing) {
        locketFocusRing.style.left = `${x}px`;
        locketFocusRing.style.top = `${y}px`;
        locketFocusRing.classList.add('active');
        sound.init();
        sound.playKeyClick();
        clearTimeout(locketFocusRing._timer);
        locketFocusRing._timer = setTimeout(() => {
          locketFocusRing.classList.remove('active');
        }, 400);
      }
      burstHeartsAt(clientX, clientY);
    };

    locketViewportFrame.addEventListener('click', handleViewportTap);
  }

  // Multi-tier safe camera stream acquirer
  async function getCameraStream(facing) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Trình duyệt không hỗ trợ getUserMedia');
    }

    // Tier 1: Try ideal facingMode with mobile 16:9 / 4:3 high-definition resolution
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (e1) {
      console.warn('Camera tier 1 failed, trying simple facingMode:', e1);
    }

    // Tier 2: Try simple facingMode string
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false
      });
    } catch (e2) {
      console.warn('Camera tier 2 failed, trying basic video:', e2);
    }

    // Tier 3: Any available video stream
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  }

  // 2. Camera Management
  async function initLocketCamera() {
    if (!locketVideo) return;
    if (locketMediaStream && locketMediaStream.active) {
      if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
      if (locketVideo.paused) {
        locketVideo.play().catch(e => console.warn(e));
      }
      updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
      return;
    }

    updateCameraStatus('capturing', '⏳ Đang khởi động máy ảnh...');
    if (cameraPromptTip) {
      cameraPromptTip.textContent = '⏳ Đang kết nối máy ảnh thiết bị...';
    }

    try {
      locketVideo.muted = true;
      locketVideo.playsInline = true;
      locketVideo.setAttribute('playsinline', '');
      locketVideo.setAttribute('webkit-playsinline', '');
      locketVideo.setAttribute('x5-playsinline', '');
      locketVideo.setAttribute('x5-video-player-type', 'h5-page');
      locketVideo.setAttribute('x5-video-player-fullscreen', 'false');
      locketVideo.setAttribute('disablePictureInPicture', '');
      locketVideo.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');

      // Prevent native fullscreen video popups on mobile Safari & mobile Chrome
      locketVideo.onwebkitbeginfullscreen = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (typeof locketVideo.webkitExitFullscreen === 'function') {
          locketVideo.webkitExitFullscreen();
        }
      };
      locketVideo.onenterfullscreen = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      };

      const stream = await getCameraStream(currentCameraFacing);
      locketMediaStream = stream;
      locketVideo.srcObject = stream;

      const onVideoReady = () => {
        if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
        updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
      };

      locketVideo.onplaying = onVideoReady;
      locketVideo.onloadedmetadata = () => {
        locketVideo.play().then(onVideoReady).catch(err => console.warn('Autoplay prevented:', err));
      };

      const playPromise = locketVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(onVideoReady).catch(err => console.warn('Autoplay prevented:', err));
      }

      if (currentCameraFacing === 'user') {
        locketVideo.classList.remove('rear-camera');
      } else {
        locketVideo.classList.add('rear-camera');
      }

      if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
      updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
    } catch(err) {
      console.warn('Direct camera access failed:', err);
      if (cameraStartOverlay) cameraStartOverlay.classList.remove('hidden');
      updateCameraStatus('error', 'Không thể mở máy ảnh');
      if (cameraPromptTip) {
        cameraPromptTip.innerHTML = 'Không thể mở trực tiếp máy ảnh.<br><span style="color:#ff2a6d;font-weight:700;">Chạm vào nút bên dưới</span> để chọn ảnh/video từ máy nhé! 💕';
      }
      if (btnStartCamera) {
        btnStartCamera.innerHTML = '<span>🔄 Thử Bật Lại Camera</span>';
        btnStartCamera.onclick = (ev) => {
          ev.stopPropagation();
          initLocketCamera();
        };
      }
    }
  }

  function stopLocketCamera() {
    if (locketMediaStream) {
      locketMediaStream.getTracks().forEach(track => track.stop());
      locketMediaStream = null;
    }
    if (locketVideo) {
      locketVideo.srcObject = null;
    }
    if (cameraStartOverlay) {
      cameraStartOverlay.classList.remove('hidden');
    }
    updateCameraStatus('', 'Chạm để bật máy ảnh');
  }

  // Camera start overlay gesture triggers
  if (btnStartCamera) {
    btnStartCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      sound.playKeyClick();
      initLocketCamera();
    });
  }
  if (btnCameraFallbackFile && locketFileInput) {
    btnCameraFallbackFile.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      sound.playKeyClick();
      locketFileInput.click();
    });
  }

  // Flip Camera Functionality
  function toggleFlipCamera() {
    sound.init();
    sound.playKeyClick();
    currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
    stopLocketCamera();
    initLocketCamera();
    showLocketToast(`Đã lật camera ${currentCameraFacing === 'user' ? 'Trước 🤳' : 'Sau 📸'}`, '🔄');
  }

  if (btnFlipCamera) {
    btnFlipCamera.addEventListener('click', () => {
      toggleFlipCamera();
    });
  }

  // Flash Toggle
  if (btnToggleFlash) {
    btnToggleFlash.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      isFlashActive = !isFlashActive;
      btnToggleFlash.classList.toggle('active', isFlashActive);
      showLocketToast(`Đèn Flash trợ sáng: ${isFlashActive ? 'BẬT ⚡' : 'TẮT ⚪'}`, '⚡');
    });
  }

  // Filter Selection
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeLocketFilter = chip.getAttribute('data-filter') || 'normal';

      if (locketVideo) {
        locketVideo.className = `camera-video-feed filter-${activeLocketFilter} ${currentCameraFacing === 'environment' ? 'rear-camera' : ''}`;
      }
      if (locketPreviewImg) {
        locketPreviewImg.className = `camera-preview-media filter-${activeLocketFilter}`;
      }
      if (locketPreviewVideo) {
        locketPreviewVideo.className = `camera-preview-media filter-${activeLocketFilter}`;
      }
    });
  });

  // Mode Selection (Chụp Ảnh / Quay Video)
  if (tabModePhoto && tabModeVideo) {
    tabModePhoto.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      currentLocketMode = 'photo';
      tabModePhoto.classList.add('active');
      tabModeVideo.classList.remove('active');
      if (btnLocketShutter) {
        btnLocketShutter.classList.remove('video-mode');
        btnLocketShutter.title = 'Bấm để chụp ảnh tức thì';
      }
    });

    tabModeVideo.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      currentLocketMode = 'video';
      tabModeVideo.classList.add('active');
      tabModePhoto.classList.remove('active');
      if (btnLocketShutter) {
        btnLocketShutter.classList.add('video-mode');
        btnLocketShutter.title = 'Bấm để quay video ngắn 5 giây';
      }
    });
  }

  // Shutter Button Action Trigger
  async function triggerShutterAction() {
    sound.init();

    const hasLiveVideo = locketVideo && locketMediaStream && locketMediaStream.active && (locketVideo.videoWidth > 0 || locketVideo.readyState >= 2);

    if (!hasLiveVideo) {
      updateCameraStatus('capturing', '⏳ Đang khởi động...');
      showLocketToast('Đang kết nối máy ảnh, bé chờ xíu nhé! ⏳', '📸');
      try {
        await initLocketCamera();
      } catch (err) {
        console.warn('initLocketCamera error:', err);
      }

      if (locketMediaStream && locketMediaStream.active) {
        setTimeout(() => {
          if (currentLocketMode === 'photo') {
            takeLocketPhoto();
          } else {
            startLocketVideoRecording();
          }
        }, 350);
        return;
      } else {
        showLocketToast('Chạm vào 📁 để chọn ảnh từ máy gửi anh nhé! 💕', '📷');
        if (locketFileInput) locketFileInput.click();
        return;
      }
    }

    if (currentLocketMode === 'photo') {
      takeLocketPhoto();
    } else {
      if (!isRecordingVideo) {
        startLocketVideoRecording();
      } else {
        stopLocketVideoRecording();
      }
    }
  }

  if (btnLocketShutter) {
    let lastShutterTime = 0;
    const onShutterTrigger = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastShutterTime < 450) return;
      lastShutterTime = now;
      triggerShutterAction();
    };

    btnLocketShutter.addEventListener('click', onShutterTrigger);
  }

  // 3. Take Photo Mode
  function takeLocketPhoto() {
    sound.init();
    try {
      sound.playCameraShutter();
    } catch(e) {}

    updateCameraStatus('capturing', '⚡ Đang chụp ảnh...');

    // Screen flash animation
    if (locketFlashOverlay) {
      locketFlashOverlay.classList.add('flashing');
      setTimeout(() => locketFlashOverlay.classList.remove('flashing'), 220);
    }

    if (!locketCanvas) return;

    locketCanvas.width = 720;
    locketCanvas.height = 720;
    const ctx = locketCanvas.getContext('2d');
    if (!ctx) return;

    const filterMap = {
      normal: 'none',
      pink: 'saturate(1.25) contrast(1.05) brightness(1.08) hue-rotate(-12deg)',
      vintage: 'sepia(0.35) contrast(1.15) brightness(0.95) saturate(1.25)',
      warm: 'sepia(0.2) saturate(1.45) brightness(1.06) hue-rotate(-15deg)',
      bw: 'grayscale(1) contrast(1.25)'
    };
    ctx.filter = filterMap[activeLocketFilter] || 'none';

    try {
      if (locketVideo && locketVideo.videoWidth > 0 && locketVideo.videoHeight > 0) {
        const w = locketVideo.videoWidth;
        const h = locketVideo.videoHeight;
        const minSide = Math.min(w, h);
        const sx = (w - minSide) / 2;
        const sy = (h - minSide) / 2;
        ctx.save();
        if (currentCameraFacing === 'user') {
          // Flip selfie back to natural orientation
          ctx.translate(720, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(locketVideo, sx, sy, minSide, minSide, 0, 0, 720, 720);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(0, 0, 720, 720);
        grad.addColorStop(0, '#ff4d88');
        grad.addColorStop(1, '#ff9a8b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 720, 720);
      }
    } catch(drawErr) {
      console.warn('Canvas draw error:', drawErr);
      const grad = ctx.createLinearGradient(0, 0, 720, 720);
      grad.addColorStop(0, '#ff4d88');
      grad.addColorStop(1, '#ff9a8b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 720);
    }

    ctx.filter = 'none';
    const cleanPhotoBase64 = locketCanvas.toDataURL('image/jpeg', 0.92);

    capturedMediaData = {
      type: 'photo',
      base64: cleanPhotoBase64,
      rawBase64: cleanPhotoBase64
    };

    if (locketPreviewImg) {
      locketPreviewImg.src = cleanPhotoBase64;
      locketPreviewImg.style.display = 'block';
    }
    if (locketPreviewVideo) {
      locketPreviewVideo.style.display = 'none';
      locketPreviewVideo.pause();
    }
    if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
    if (locketPreviewWrap) locketPreviewWrap.classList.add('active');

    // Sync live preview caption pill
    const currentText = (locketCaptionInput && locketCaptionInput.value.trim()) || 'Gửi người anh thương nhất';
    if (locketPreviewQuote) locketPreviewQuote.textContent = currentText;
    if (locketPreviewSticker) locketPreviewSticker.textContent = activeLocketSticker;

    if (locketShutterBar) locketShutterBar.style.display = 'none';
    if (locketCaptionBox) {
      locketCaptionBox.classList.add('show');
    }

    updateCameraStatus('ready', 'Xem trước ảnh');
    showLocketToast('Ảnh đã chụp xong! Gõ lời nhắn gửi người thương nha 💌', '📸');
  }

  // 4. Record 5s Video Mode
  async function startLocketVideoRecording() {
    if (!locketMediaStream) {
      await initLocketCamera();
    }
    if (!locketMediaStream) {
      showLocketToast('Không thể mở camera quay video. Bé bấm 📁 để tải lên nhé! 💕', '🎥');
      return;
    }

    sound.init();
    sound.playKeyClick();
    recordedBlobs = [];
    isRecordingVideo = true;

    let options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: '' };
      }
    }

    try {
      mediaRecorder = new MediaRecorder(locketMediaStream, options);
    } catch(e) {
      mediaRecorder = new MediaRecorder(locketMediaStream);
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedBlobs, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        capturedMediaData = {
          type: 'video',
          base64: reader.result
        };
      };
      reader.readAsDataURL(blob);

      if (locketPreviewVideo) {
        locketPreviewVideo.src = URL.createObjectURL(blob);
        locketPreviewVideo.style.display = 'block';
        locketPreviewVideo.play().catch(e => console.warn(e));
      }
      if (locketPreviewImg) {
        locketPreviewImg.style.display = 'none';
      }
      if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
      if (locketPreviewWrap) locketPreviewWrap.classList.add('active');

      const currentText = (locketCaptionInput && locketCaptionInput.value.trim()) || 'Gửi người anh thương nhất';
      if (locketPreviewQuote) locketPreviewQuote.textContent = currentText;
      if (locketPreviewSticker) locketPreviewSticker.textContent = activeLocketSticker;

      if (locketShutterBar) locketShutterBar.style.display = 'none';
      if (locketCaptionBox) {
        locketCaptionBox.classList.add('show');
      }

      updateCameraStatus('ready', 'Xem trước video');
      showLocketToast('Đã quay video 5s xong! Gõ lời nhắn gửi người thương nha 💌', '🎥');
    };

    mediaRecorder.start(100);

    // UI state for recording
    updateCameraStatus('recording', '🔴 Đang quay video...');
    if (btnLocketShutter) btnLocketShutter.classList.add('recording');
    if (locketRecBadge) locketRecBadge.style.display = 'inline-flex';

    const DURATION = 5000;
    const startTime = Date.now();
    if (recordingInterval) clearInterval(recordingInterval);

    recordingInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, DURATION - elapsed);
      const progress = Math.min(1, elapsed / DURATION);
      const offset = 245 * (1 - progress);

      if (locketProgressFill) locketProgressFill.style.strokeDashoffset = offset;
      if (locketRecSeconds) {
        const sec = Math.ceil(remainingMs / 1000);
        locketRecSeconds.textContent = `0:0${sec}`;
      }

      if (elapsed >= DURATION) {
        stopLocketVideoRecording();
      }
    }, 50);
  }

  function stopLocketVideoRecording() {
    if (!isRecordingVideo) return;
    isRecordingVideo = false;
    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }

    if (btnLocketShutter) btnLocketShutter.classList.remove('recording');
    if (locketRecBadge) locketRecBadge.style.display = 'none';
    if (locketProgressFill) locketProgressFill.style.strokeDashoffset = '245';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    sound.playSuccessChime();
  }

  // 5. Fallback Album File Upload
  if (btnLocketBrowseFile && locketFileInput) {
    btnLocketBrowseFile.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      locketFileInput.click();
    });

    locketFileInput.addEventListener('change', () => {
      if (!locketFileInput.files || !locketFileInput.files[0]) return;
      const file = locketFileInput.files[0];
      const isVideo = file.type.startsWith('video');

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const resultUrl = loadEvent.target.result;

        // 1. Ẩn ngay màn hình khởi động / overlay để hiện ảnh preview trong ô vuông
        if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');

        if (isVideo) {
          capturedMediaData = {
            type: 'video',
            base64: resultUrl
          };
          if (locketPreviewVideo) {
            locketPreviewVideo.src = resultUrl;
            locketPreviewVideo.style.display = 'block';
            locketPreviewVideo.play().catch(err => console.warn(err));
          }
          if (locketPreviewImg) locketPreviewImg.style.display = 'none';
        } else {
          // Hiển thị ảnh ngay lập tức trong ô vuông để xem lại trước khi upload
          if (locketPreviewImg) {
            locketPreviewImg.src = resultUrl;
            locketPreviewImg.style.display = 'block';
          }
          if (locketPreviewVideo) {
            locketPreviewVideo.style.display = 'none';
            locketPreviewVideo.pause();
          }

          capturedMediaData = {
            type: 'photo',
            base64: resultUrl,
            rawBase64: resultUrl
          };

          // Đồng thời crop vuông chuẩn 1:1 trong canvas nền chất lượng cao
          const tempImg = new Image();
          tempImg.onload = () => {
            if (locketCanvas) {
              locketCanvas.width = 720;
              locketCanvas.height = 720;
              const ctx = locketCanvas.getContext('2d');
              if (ctx) {
                const w = tempImg.width;
                const h = tempImg.height;
                const minSide = Math.min(w, h);
                const sx = (w - minSide) / 2;
                const sy = (h - minSide) / 2;
                ctx.drawImage(tempImg, sx, sy, minSide, minSide, 0, 0, 720, 720);
                const cleanSquareBase64 = locketCanvas.toDataURL('image/jpeg', 0.92);
                capturedMediaData = {
                  type: 'photo',
                  base64: cleanSquareBase64,
                  rawBase64: cleanSquareBase64
                };
                if (locketPreviewImg) {
                  locketPreviewImg.src = cleanSquareBase64;
                }
              }
            }
          };
          tempImg.src = resultUrl;
        }

        if (locketPreviewWrap) locketPreviewWrap.classList.add('active');
        if (locketShutterBar) locketShutterBar.style.display = 'none';
        if (locketCaptionBox) {
          locketCaptionBox.classList.add('show');
        }

        const currentText = (locketCaptionInput && locketCaptionInput.value.trim()) || 'Gửi người anh thương nhất';
        if (locketPreviewQuote) locketPreviewQuote.textContent = currentText;
        if (locketPreviewSticker) locketPreviewSticker.textContent = activeLocketSticker;

        updateCameraStatus('ready', 'Xem trước ảnh');
        showLocketToast('Đã chọn ảnh! Viết lời nhắn gửi người thương nhé 💕', '✨');
      };
      reader.readAsDataURL(file);
    });
  }

  // Retake / Reset Viewfinder
  function retakeLocket() {
    capturedMediaData = null;
    closeRecipientSheet();
    if (locketFileInput) locketFileInput.value = '';
    if (locketPreviewWrap) locketPreviewWrap.classList.remove('active');
    if (locketCaptionBox) locketCaptionBox.classList.remove('show');
    if (locketShutterBar) locketShutterBar.style.display = 'flex';
    if (locketPreviewVideo) {
      locketPreviewVideo.pause();
      locketPreviewVideo.src = '';
    }
    if (locketPreviewImg) locketPreviewImg.src = '';
    if (locketCaptionInput) locketCaptionInput.value = '';
    if (locketPreviewQuote) locketPreviewQuote.textContent = 'Gửi người anh thương nhất';
    if (locketRecBadge) locketRecBadge.style.display = 'none';
    if (locketProgressFill) locketProgressFill.style.strokeDashoffset = '245';

    if (locketVideo && locketMediaStream && locketMediaStream.active) {
      if (cameraStartOverlay) cameraStartOverlay.classList.add('hidden');
      if (locketVideo.paused) {
        locketVideo.play().catch(e => console.warn(e));
      }
      updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
    } else {
      if (cameraStartOverlay) cameraStartOverlay.classList.remove('hidden');
      updateCameraStatus('', 'Chạm để bật máy ảnh');
    }
  }

  const handleRetakeClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sound.init();
    sound.playKeyClick();
    retakeLocket();
    showLocketToast('Sẵn sàng chụp lại khoảnh khắc mới! 📸', '🔄');
  };

  if (btnRetakeLocket) btnRetakeLocket.addEventListener('click', handleRetakeClick);
  if (btnRetakeCorner) btnRetakeCorner.addEventListener('click', handleRetakeClick);
  if (btnCancelSendLocket) btnCancelSendLocket.addEventListener('click', handleRetakeClick);

  // Real-time caption sync to preview pill
  if (locketCaptionInput) {
    locketCaptionInput.addEventListener('input', () => {
      const text = locketCaptionInput.value.trim();
      if (locketPreviewQuote) {
        locketPreviewQuote.textContent = text || 'Gửi người anh thương nhất';
      }
    });
  }

  // Sticker Selector with live preview sync
  stickerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      stickerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLocketSticker = btn.getAttribute('data-sticker') || '💕';
      if (locketLiveSticker) locketLiveSticker.textContent = activeLocketSticker;
      if (locketPreviewSticker) locketPreviewSticker.textContent = activeLocketSticker;
    });
  });

  // 6. Recipient Selection Sheet & Quick Send Logic
  function openRecipientSheet() {
    if (!capturedMediaData) {
      showLocketToast('Bé hãy chụp ảnh hoặc quay video trước khi gửi nhé! 💕', '📷');
      return;
    }
    sound.init();
    sound.playKeyClick();
    if (cameraRecipientSheet) {
      cameraRecipientSheet.classList.add('show');
      cameraRecipientSheet.setAttribute('aria-hidden', 'false');
    }
  }

  function closeRecipientSheet() {
    if (cameraRecipientSheet) {
      cameraRecipientSheet.classList.remove('show');
      cameraRecipientSheet.setAttribute('aria-hidden', 'true');
    }
  }

  if (btnOpenRecipientSheet) {
    btnOpenRecipientSheet.addEventListener('click', openRecipientSheet);
  }
  if (btnCloseRecipientSheet) {
    btnCloseRecipientSheet.addEventListener('click', closeRecipientSheet);
  }
  if (recipientSheetBackdrop) {
    recipientSheetBackdrop.addEventListener('click', closeRecipientSheet);
  }

  // Recipient item selection toggle
  recipientChoiceItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      if (checkbox) {
        item.classList.toggle('active', checkbox.checked);
      }
    });
  });

  // Send Moment Controller (supports Quick Send and Selected Recipients)
  async function performSendCameraMoment(recipientLabel = '') {
    if (!capturedMediaData) {
      showLocketToast('Bé hãy chụp ảnh hoặc quay video trước khi gửi nhé! 💕', '📷');
      return;
    }

    sound.init();
    updateCameraStatus('uploading', '⏳ Đang tải ảnh lên...');
    showLocketToast('Đang tải ảnh lên và đồng bộ khoảnh khắc... ⏳', '🚀');

    const sendBtns = [btnSendLocket, btnInstantSend].filter(Boolean);
    sendBtns.forEach(b => {
      b.disabled = true;
      if (b === btnSendLocket) b.innerHTML = '<span>⏳ Đang tải ảnh lên...</span>';
      if (b === btnInstantSend) b.innerHTML = '<span>⏳ Đang gửi...</span>';
    });

    try {
      const userCaption = (locketCaptionInput && locketCaptionInput.value.trim()) || 'Gửi người anh thương nhất 💕';
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const timeFormatted = `${hours}:${mins} • Hôm nay`;

      let finalMediaUrl = capturedMediaData.base64;

      // Watermark stamping on captured photos
      if (capturedMediaData.type === 'photo' && capturedMediaData.rawBase64 && locketCanvas) {
        try {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = capturedMediaData.rawBase64;
          });

          locketCanvas.width = 720;
          locketCanvas.height = 720;
          const ctx = locketCanvas.getContext('2d');
          if (ctx) {
            ctx.filter = 'none';
            ctx.drawImage(img, 0, 0, 720, 720);

            // 1. Watermark Top: Time Pill
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(24, 24, 210, 42, 21);
            } else {
              ctx.rect(24, 24, 210, 42);
            }
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(timeFormatted, 42, 51);

            // 2. Watermark Bottom: Custom Caption & Sticker Pill
            const fullText = `${activeLocketSticker} ${userCaption}`;
            ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const textWidth = Math.min(640, Math.max(220, ctx.measureText(fullText).width + 50));
            const pillX = (720 - textWidth) / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(pillX, 646, textWidth, 48, 24);
            } else {
              ctx.rect(pillX, 646, textWidth, 48);
            }
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 77, 136, 0.55)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffd6e0';
            ctx.textAlign = 'center';
            ctx.fillText(fullText, 360, 676);

            finalMediaUrl = locketCanvas.toDataURL('image/jpeg', 0.92);
          }
        } catch (stampErr) {
          console.warn('Watermark stamping error:', stampErr);
        }
      }

      // Upload to ImgBB Cloud if API key is provided
      if (capturedMediaData.type === 'photo' && userConfig.imgbbApiKey) {
        updateCameraStatus('uploading', '☁️ Đang tải lên Cloud...');
        const cloudUrl = await uploadToImgBB(finalMediaUrl, userConfig.imgbbApiKey);
        if (cloudUrl) {
          finalMediaUrl = cloudUrl;
        }
      }

      const newMoment = {
        id: 'cam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: capturedMediaData.type,
        mediaUrl: finalMediaUrl,
        caption: userCaption,
        sender: (userConfig && userConfig.girlfriendName) || 'Bé Mèo',
        senderRole: 'girlfriend',
        recipient: recipientLabel || partnerBoyfriendName,
        sticker: activeLocketSticker,
        filter: activeLocketFilter,
        reactions: 1,
        timeFormatted: timeFormatted,
        timestamp: now.toISOString()
      };

      // 1. ALWAYS save to local device storage (localStorage)
      let localFeed = [];
      try {
        const raw = localStorage.getItem('romantic_gift_locket_feed');
        if (raw) localFeed = JSON.parse(raw);
        if (!Array.isArray(localFeed)) localFeed = [];
      } catch(e) { localFeed = []; }

      localFeed.unshift(newMoment);
      const trimmedFeed = localFeed.slice(0, 25);
      try {
        localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(trimmedFeed));
      } catch(quotaErr) {
        try {
          localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(trimmedFeed.slice(0, 10)));
        } catch(e) {}
      }

      cachedLocketItems = trimmedFeed;
      renderLocketFeed(cachedLocketItems);

      // 2. Play celebration sound and confetti
      sound.playWinFanfare();
      burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
      launchCelebrationConfetti();

      // 3. Reset UI & view
      closeRecipientSheet();
      retakeLocket();

      // 4. Background server sync
      const payload = {
        type: newMoment.type,
        caption: newMoment.caption,
        sender: newMoment.sender,
        senderRole: newMoment.senderRole,
        recipient: newMoment.recipient,
        sticker: newMoment.sticker,
        filter: newMoment.filter,
        mediaBase64: finalMediaUrl
      };

      try {
        await fetch(getApiUrl('/api/locket'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch(e) {
        console.log('GitHub Pages static mode: moment saved securely in device storage');
      }

      broadcastRealtime('BÉ_ACTION', { module: 'locket' });

      // 4.1 Realtime Cloud Sync to Firebase (24/7 serverless)
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
        FirebaseSync.pushLocket(newMoment);
      }

      const targetDesc = recipientLabel ? `đến ${recipientLabel}` : 'thành công';
      updateCameraStatus('success', '✅ Gửi thành công!');
      showLocketToast(`Đã gửi khoảnh khắc ${targetDesc}! 💖📸`, '🎉');

      setTimeout(() => {
        updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
      }, 3500);
    } catch (sendError) {
      console.error('Camera send error:', sendError);
      updateCameraStatus('error', '❌ Gửi thất bại');
      showLocketToast('Gửi khoảnh khắc thất bại. Vui lòng thử lại! 😢', '❌');
      setTimeout(() => {
        updateCameraStatus('ready', 'Máy ảnh sẵn sàng');
      }, 3500);
    } finally {
      sendBtns.forEach(b => {
        b.disabled = false;
        if (b === btnSendLocket) b.innerHTML = '<span>🚀 Xác Nhận Gửi Khoảnh Khắc</span>';
        if (b === btnInstantSend) b.innerHTML = '<span>Gửi Ngay 🚀</span>';
      });
    }
  }

  // Quick Send Action (1 chạm)
  if (btnInstantSend) {
    btnInstantSend.addEventListener('click', () => {
      performSendCameraMoment(partnerBoyfriendName);
    });
  }

  // Multi-recipient Send Action
  if (btnSendLocket) {
    btnSendLocket.addEventListener('click', () => {
      const selected = [];
      recipientCheckboxes.forEach(cb => {
        if (cb.checked) {
          if (cb.value === 'boyfriend') selected.push(partnerBoyfriendName);
          else if (cb.value === 'feed') selected.push('Bảng Tin');
          else if (cb.value === 'best_friends') selected.push('Bạn Bè');
        }
      });
      const label = selected.length > 0 ? selected.join(' & ') : partnerBoyfriendName;
      performSendCameraMoment(label);
    });
  }

  // Feed Drawer Controls
  function openFeedDrawer() {
    sound.init();
    sound.playKeyClick();
    if (cameraFeedDrawer) {
      cameraFeedDrawer.classList.add('show');
      cameraFeedDrawer.setAttribute('aria-hidden', 'false');
    }
  }

  function closeFeedDrawer() {
    if (cameraFeedDrawer) {
      cameraFeedDrawer.classList.remove('show');
      cameraFeedDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  if (btnToggleFeedDrawer) {
    btnToggleFeedDrawer.addEventListener('click', openFeedDrawer);
  }
  if (btnCloseFeedDrawer) {
    btnCloseFeedDrawer.addEventListener('click', closeFeedDrawer);
  }
  if (feedDrawerBackdrop) {
    feedDrawerBackdrop.addEventListener('click', closeFeedDrawer);
  }

  // 7. Camera Feed Rendering & Auto-Sync
  async function loadLocketFeed() {
    if (!locketFeedGrid) return;

    // 1. Load from localStorage first (guaranteed instant display)
    try {
      const raw = localStorage.getItem('romantic_gift_locket_feed');
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          cachedLocketItems = items;
          renderLocketFeed(cachedLocketItems);
        }
      }
    } catch(e) {}

    // 2. Fallback to SEED_DATA immediately if empty
    if (cachedLocketItems.length === 0 && window.SEED_DATA && Array.isArray(window.SEED_DATA.locket) && window.SEED_DATA.locket.length > 0) {
      cachedLocketItems = JSON.parse(JSON.stringify(window.SEED_DATA.locket));
      try {
        localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(cachedLocketItems));
      } catch(e) {}
      renderLocketFeed(cachedLocketItems);
    }

    // 2.1 Fetch from Firebase Cloud if available (24/7 Serverless)
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
      try {
        const cloudItems = await FirebaseSync.fetchCloudLocket();
        if (cloudItems && Array.isArray(cloudItems) && cloudItems.length > 0) {
          cloudItems.sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
          cachedLocketItems = cloudItems.slice(0, 30);
          try {
            localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(cachedLocketItems));
          } catch(e) {}
          renderLocketFeed(cachedLocketItems);
          return;
        }
      } catch(e) {}
    }

    // 3. In background, fetch from server if backend is active
    try {
      const res = await fetch(getApiUrl('/api/locket?v=' + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          const serverMap = new Map();
          data.items.forEach(it => { if (it && it.id) serverMap.set(it.id, it); });
          cachedLocketItems.forEach(it => {
            if (it && it.id && !serverMap.has(it.id)) serverMap.set(it.id, it);
          });
          const merged = Array.from(serverMap.values()).slice(0, 30);
          cachedLocketItems = merged;
          localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(merged));
          renderLocketFeed(merged);
          return;
        }
      }
    } catch(e) {}

    // 4. Fallback to data/db.json on GitHub Pages static mode (luôn đồng bộ chuẩn xác với cơ sở dữ liệu)
    try {
      const res = await fetch('data/db.json?v=' + Date.now());
      if (res.ok) {
        const dbData = await res.json();
        if (dbData && Array.isArray(dbData.locket) && dbData.locket.length > 0) {
          const authoritative = dbData.locket;
          const prevStr = JSON.stringify(cachedLocketItems);
          const newStr = JSON.stringify(authoritative);
          if (prevStr !== newStr) {
            cachedLocketItems = authoritative;
            localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(authoritative));
            renderLocketFeed(cachedLocketItems);
          }
        }
      }
    } catch(e) {}
  }

  function renderLocketFeed(items) {
    if (!locketFeedGrid) return;
    if (locketFeedCount) {
      locketFeedCount.textContent = `${items.length} khoảnh khắc`;
    }
    if (cameraFeedBadge) {
      cameraFeedBadge.textContent = items.length;
    }

    locketFeedGrid.innerHTML = '';
    if (!items || items.length === 0) {
      locketFeedGrid.innerHTML = `<div class="admin-empty-state" style="grid-column: 1 / -1;">Chưa có khoảnh khắc nào. Hãy chụp bức ảnh hoặc quay video 5s đầu tiên nhé! 📸✨</div>`;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'locket-feed-card';

      const isVideo = item.type === 'video';
      const resolvedMediaUrl = resolveMediaUrl(item.mediaUrl);
      const mediaHtml = isVideo
        ? `<video src="${resolvedMediaUrl}" class="locket-feed-media filter-${item.filter || 'normal'}" loop muted playsinline webkit-playsinline autoplay></video>`
        : `<img src="${resolvedMediaUrl}" class="locket-feed-media filter-${item.filter || 'normal'}" alt="${escapeHTML(item.caption)}" loading="lazy">`;

      card.innerHTML = `
        ${mediaHtml}
        <div class="locket-feed-card-overlay">
          <div class="locket-feed-top-row">
            <span class="locket-feed-sender">${item.sticker || '💕'} ${escapeHTML(item.sender || 'Bé Yêu')}</span>
            <button type="button" class="btn-react-locket" data-id="${item.id}" title="Thả tim">
              ❤️ <span>${item.reactions || 1}</span>
            </button>
          </div>
          <div class="locket-feed-bottom">
            <div class="locket-feed-caption-bubble">${escapeHTML(item.caption)}</div>
            <div class="locket-feed-meta-row">
              <span>${item.timeFormatted || 'Vừa xong'}</span>
            </div>
          </div>
        </div>
      `;

      const reactBtn = card.querySelector('.btn-react-locket');
      if (reactBtn) {
        reactBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          burstHeartsAt(e.clientX, e.clientY);
          sound.init();
          sound.playSuccessChime();

          item.reactions = (item.reactions || 1) + 1;
          const countSpan = reactBtn.querySelector('span');
          if (countSpan) {
            countSpan.textContent = item.reactions;
          }

          // Update in localStorage
          try {
            const raw = localStorage.getItem('romantic_gift_locket_feed');
            if (raw) {
              const list = JSON.parse(raw);
              const found = list.find(x => x.id === item.id);
              if (found) {
                found.reactions = item.reactions;
                localStorage.setItem('romantic_gift_locket_feed', JSON.stringify(list));
              }
            }
          } catch(err) {}

          // Background sync to server
          try {
            fetch(getApiUrl(`/api/locket/${encodeURIComponent(item.id)}/react`), { method: 'POST' }).catch(() => {});
          } catch(err) {}
        });
      }

      locketFeedGrid.appendChild(card);
    });
  }

  // Auto poll Camera moments every 20s
  setInterval(loadLocketFeed, 20000);

  // --- 9. BÉ VIẾT CHIA SẺ CẢM XÚC (DIARY / MOOD) ---
  const moodPills = document.querySelectorAll('.mood-pill');
  const diaryTextarea = document.getElementById('diary-textarea');
  const btnSaveDiaryNote = document.getElementById('btn-save-diary-note');
  const diaryNotesList = document.getElementById('diary-notes-list');
  const diaryNotesCount = document.getElementById('diary-notes-count');

  let selectedMood = '🥰';
  let selectedMoodLabel = 'Hạnh phúc';

  moodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      moodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedMood = pill.getAttribute('data-mood') || '🥰';
      selectedMoodLabel = pill.getAttribute('data-label') || 'Hạnh phúc';
    });
  });

  const DEFAULT_DIARY_NOTES = [
    {
      id: 'default-welcome-note',
      mood: '🥰',
      moodLabel: 'Hạnh phúc',
      text: 'Chào bé yêu! Đây là góc nhỏ bí mật để bé thoải mái chia sẻ mọi suy nghĩ, tâm sự, dặn dò hoặc hờn dỗi với anh. Bất cứ điều gì bé viết ở đây đều được anh trân trọng và lắng nghe!',
      date: 'Góc Của Bé ❤️'
    }
  ];

  // --- DATABASE API FOR NOTES ---
  async function fetchNotesFromDatabase() {
    let remoteNotes = null;

    // 0. Fetch from Firebase Cloud if available (24/7 Serverless)
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
      try {
        const cloudNotes = await FirebaseSync.fetchCloudNotes();
        if (cloudNotes && Array.isArray(cloudNotes) && cloudNotes.length > 0) {
          remoteNotes = cloudNotes;
        }
      } catch(e) {}
    }
    try {
      const res = await fetch(getApiUrl('/api/notes?v=' + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.notes)) {
          remoteNotes = data.notes;
        }
      }
    } catch(e) {}

    // Static GitHub Pages fallback
    if (!remoteNotes) {
      try {
        const res = await fetch('data/db.json?v=' + Date.now());
        if (res.ok) {
          const dbData = await res.json();
          if (dbData && Array.isArray(dbData.notes)) {
            remoteNotes = dbData.notes;
          }
        }
      } catch(e) {}
    }

    if (!remoteNotes && window.SEED_DATA && Array.isArray(window.SEED_DATA.notes)) {
      remoteNotes = window.SEED_DATA.notes;
    }

    if (remoteNotes) {
      const current = getSavedDiaryNotes();
      const noteMap = new Map();
      remoteNotes.forEach(dn => {
        if (dn && dn.id) noteMap.set(dn.id, dn);
      });
      // Giữ lại ghi chú mới bé vừa viết trên thiết bị này nếu chưa kịp đồng bộ lên server
      current.forEach(cn => {
        if (cn && cn.id && !noteMap.has(cn.id) && cn.id.startsWith('note_')) {
          noteMap.set(cn.id, cn);
        }
      });
      const merged = Array.from(noteMap.values());
      merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const prevStr = JSON.stringify(current);
      const newStr = JSON.stringify(merged);
      if (prevStr !== newStr) {
        localStorage.setItem('romantic_gift_user_notes', JSON.stringify(merged));
        return merged;
      }
      return current;
    }

    return null;
  }

  async function syncNotesToUI() {
    const remoteNotes = await fetchNotesFromDatabase();
    if (remoteNotes) {
      renderDiaryNotes();
    }
  }

  async function postNoteToDatabase(noteObj) {
    try {
      const res = await fetch(getApiUrl('/api/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteObj)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.note) {
          return data.note;
        }
      }
    } catch(e) {
      console.warn('API /api/notes unavailable, saved locally:', e);
    }
    return noteObj;
  }

  async function deleteNoteFromDatabase(noteId) {
    try {
      await fetch(getApiUrl(`/api/notes/${encodeURIComponent(noteId)}`), { method: 'DELETE' });
    } catch(e) {}
    broadcastRealtime('BÉ_ACTION', { module: 'notes' });
  }

  function getSavedDiaryNotes() {
    try {
      const raw = localStorage.getItem('romantic_gift_user_notes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    if (window.SEED_DATA && Array.isArray(window.SEED_DATA.notes) && window.SEED_DATA.notes.length > 0) {
      return JSON.parse(JSON.stringify(window.SEED_DATA.notes));
    }
    return DEFAULT_DIARY_NOTES;
  }

  function saveDiaryNotes(notes) {
    try {
      localStorage.setItem('romantic_gift_user_notes', JSON.stringify(notes));
    } catch(e) {}
  }

  function renderDiaryNotes() {
    if (!diaryNotesList) return;
    const notes = getSavedDiaryNotes();
    if (diaryNotesCount) {
      diaryNotesCount.textContent = `${notes.length} lời nhắn`;
    }
    diaryNotesList.innerHTML = '';

    if (notes.length === 0) {
      diaryNotesList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 12px 0;">Chưa có lời nhắn nào. Bé hãy viết cho anh điều đầu tiên nhé! 💕</p>`;
      return;
    }

    notes.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'diary-note-card';
      card.innerHTML = `
        <div class="diary-note-head">
          <span class="diary-note-mood">${item.mood} ${item.moodLabel || ''}</span>
          <div class="diary-note-meta">
            <span class="diary-note-date">${item.date}</span>
            <button type="button" class="btn-delete-note" title="Xóa lời nhắn này" data-index="${index}">✕</button>
          </div>
        </div>
        <p class="diary-note-body">${escapeHTML(item.text)}</p>
        <div class="diary-note-actions-row">
          <button type="button" class="btn-share-note" data-index="${index}">💬 Gửi cho Anh</button>
        </div>
      `;

      const delBtn = card.querySelector('.btn-delete-note');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Bé có muốn xóa mẩu lời nhắn này không?')) {
          try { sound.init(); sound.playKeyClick(); } catch(err){}
          await deleteNoteFromDatabase(item.id);
          notes.splice(index, 1);
          saveDiaryNotes(notes);
          renderDiaryNotes();
        }
      });

      const shareBtn = card.querySelector('.btn-share-note');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const shareText = `💌 [Lời nhắn bé gửi khúc gỗ - ${item.mood} ${item.moodLabel || ''}]\n"${item.text}"\n(${item.date})`;
          if (navigator.share) {
            navigator.share({ title: 'Gửi anh 💌', text: shareText }).catch(() => {});
          } else {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareText);
            }
            alert('Đã sao chép lời nhắn! Bé có thể dán vào Zalo/Messenger để gửi ngay cho anh nhé 💕');
          }
        });
      }

      diaryNotesList.appendChild(card);
    });
  }

  if (btnSaveDiaryNote && diaryTextarea) {
    btnSaveDiaryNote.addEventListener('click', async () => {
      try { sound.init(); } catch(err){}
      const content = diaryTextarea.value.trim();
      if (!content) {
        alert('Bé ơi, hãy nhập vài dòng lời nhắn trước khi gửi nhé! 💌');
        return;
      }

      const now = new Date();
      const dateStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} • ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

      const tempNote = {
        id: 'note_' + Date.now(),
        mood: selectedMood,
        moodLabel: selectedMoodLabel,
        text: content,
        date: dateStr
      };

      // Save to database API
      const savedNote = await postNoteToDatabase(tempNote);

      const notes = getSavedDiaryNotes();
      notes.unshift(savedNote);
      saveDiaryNotes(notes);

      // Cloud Sync note to Firebase (24/7 serverless)
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
        FirebaseSync.pushNote(savedNote);
      }

      diaryTextarea.value = '';
      try {
        sound.playSuccessChime();
        burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
      } catch(err){}
      renderDiaryNotes();
      broadcastRealtime('BÉ_ACTION', { module: 'notes' });

      const shareText = `💌 [Lời nhắn bé gửi khúc gỗ - ${selectedMood} ${selectedMoodLabel}]\n"${content}"\n(${dateStr})`;
      if (navigator.share) {
        navigator.share({
          title: 'Lời nhắn 20/10 gửi anh',
          text: shareText
        }).catch(() => {});
      } else {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText);
        }
      }
      alert('Đã lưu và gửi lời nhắn đến anh thành công! 💌\nAnh sẽ đọc được ngay trong trang quản trị.');
    });
  }

  // --- 10. KHO KỶ NIỆM ĐÔI TA (UPLOAD ẢNH LƯU TRỮ) ---
  const memoryUploadDropzone = document.getElementById('memory-upload-dropzone');
  const dropzoneTrigger = document.getElementById('dropzone-trigger');
  const memoryFileInput = document.getElementById('memory-file-input');
  const btnBrowsePhoto = document.getElementById('btn-browse-photo');
  const uploadPreviewForm = document.getElementById('upload-preview-form');
  const previewImg = document.getElementById('preview-img');
  const btnCancelPreview = document.getElementById('btn-cancel-preview');
  const memoryCaptionInput = document.getElementById('memory-caption-input');
  const memoryDateInput = document.getElementById('memory-date-input');
  const btnSaveMemoryPhoto = document.getElementById('btn-save-memory-photo');
  const memoriesGrid = document.getElementById('memories-grid');
  const memoriesCountText = document.getElementById('memories-count-text');

  // Lightbox Modal
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxDate = document.getElementById('lightbox-date');

  let currentPendingImageData = null;

  if (memoryDateInput) {
    const today = new Date().toISOString().split('T')[0];
    memoryDateInput.value = today;
  }

  const DEFAULT_MEMORIES = [
    { id: 'mem-1', src: 'images/photo1.jpg', caption: 'Bên bé mọi khoảnh khắc đều đẹp 💖', date: 'Kỷ niệm yêu thương' },
    { id: 'mem-2', src: 'images/photo2.jpg', caption: 'Nụ cười tỏa nắng của bé ☀️', date: 'Ngày hạnh phúc' },
    { id: 'mem-3', src: 'images/photo3.jpg', caption: 'Nắm tay bé đi khắp thế gian 🌸', date: 'Tình yêu ngọt ngào' },
    { id: 'mem-4', src: 'images/photo4.jpg', caption: 'Bé yêu của anh ✨', date: 'Những ngày bình yên' },
    { id: 'mem-5', src: 'images/photo5.jpg', caption: 'Mỗi ngày bên bé là một món quà 🎁', date: 'Hành trình bên nhau' },
    { id: 'mem-6', src: 'images/photo6.jpg', caption: 'Ánh mắt bé làm tan chảy tim anh ✨', date: 'Khoảnh khắc diệu kỳ' },
    { id: 'mem-7', src: 'images/photo7.jpg', caption: 'Yêu bé nhiều hơn mỗi ngày 💕', date: 'Kỷ niệm đôi ta' },
    { id: 'mem-8', src: 'images/photo8.jpg', caption: 'Thế giới của anh thu nhỏ lại bằng bé 🌍', date: 'Yêu thương đong đầy' },
    { id: 'mem-9', src: 'images/photo9.jpg', caption: 'Bình yên nhất là khi có bé 🍃', date: 'Ngọt ngào bên bé' },
    { id: 'mem-10', src: 'images/photo10.jpg', caption: 'Đi cùng với anh nhó 👵👴', date: 'Hứa mãi bên nhau' },
    { id: 'mem-11', src: 'images/photo11.jpg', caption: 'Hạnh phúc đơn giản là có bé bên cạnh 🥰', date: 'Mùa yêu thương' },
    { id: 'mem-12', src: 'images/photo12.jpg', caption: 'Chúc mừng 20/10 người anh yêu nhất trần đời 💐', date: '20.10.2026 ❤️' }
  ];

  let cachedMemories = [];

  // --- INDEXEDDB STORAGE FOR UNLIMITED LOCAL MEMORIES STORAGE ---
  const MEMORIES_IDB_NAME = 'LoveGiftMemoriesDB';
  const MEMORIES_STORE_NAME = 'memories_store';

  function openMemoriesIDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(MEMORIES_IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(MEMORIES_STORE_NAME)) {
            db.createObjectStore(MEMORIES_STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch(e) {
        resolve(null);
      }
    });
  }

  async function persistMemoryItemToIDB(item) {
    if (!item || !item.id) return;
    try {
      const db = await openMemoriesIDB();
      if (!db) return;
      const tx = db.transaction(MEMORIES_STORE_NAME, 'readwrite');
      tx.objectStore(MEMORIES_STORE_NAME).put(item);
    } catch(e) {
      console.warn('IDB put error:', e);
    }
  }

  async function getAllMemoriesFromIDB() {
    try {
      const db = await openMemoriesIDB();
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(MEMORIES_STORE_NAME, 'readonly');
        const store = tx.objectStore(MEMORIES_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch(e) {
      return [];
    }
  }

  async function deleteMemoryFromIDB(id) {
    if (!id) return;
    try {
      const db = await openMemoriesIDB();
      if (!db) return;
      const tx = db.transaction(MEMORIES_STORE_NAME, 'readwrite');
      tx.objectStore(MEMORIES_STORE_NAME).delete(id);
    } catch(e) {}
  }

  // --- DATABASE API FOR MEMORIES ---
  async function fetchMemoriesFromDatabase() {
    let remoteMemories = [];

    // 0. Fetch from Firebase Cloud if available (24/7 Serverless)
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
      try {
        const cloudMem = await FirebaseSync.fetchCloudMemories();
        if (cloudMem && Array.isArray(cloudMem) && cloudMem.length > 0) {
          remoteMemories = cloudMem;
        }
      } catch(e) {}
    }

    // 1. Fetch from live API
    try {
      const res = await fetch(getApiUrl('/api/memories?v=' + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.memories) && data.memories.length > 0) {
          remoteMemories = data.memories;
        }
      }
    } catch(e) {}

    // 2. Static fallback: data/db.json
    if (remoteMemories.length === 0) {
      try {
        const res = await fetch('data/db.json?v=' + Date.now());
        if (res.ok) {
          const dbData = await res.json();
          if (dbData && Array.isArray(dbData.memories) && dbData.memories.length > 0) {
            remoteMemories = dbData.memories;
          }
        }
      } catch(e) {}
    }

    // 3. Fallback to SEED_DATA
    if (remoteMemories.length === 0 && window.SEED_DATA && Array.isArray(window.SEED_DATA.memories)) {
      remoteMemories = JSON.parse(JSON.stringify(window.SEED_DATA.memories));
    }

    if (remoteMemories.length === 0) {
      remoteMemories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
    }

    // 4. Load persisted memories from IndexedDB (survives reload & quota errors)
    const idbMemories = await getAllMemoriesFromIDB();

    // 5. Load persisted memories from localStorage
    let localStoredMemories = [];
    try {
      const raw = localStorage.getItem('romantic_gift_user_memories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localStoredMemories = parsed;
      }
    } catch(e) {}

    // 6. Intelligent Merge: Nguồn dữ liệu từ máy chủ/db.json là nguồn chuẩn duy nhất
    const memoryMap = new Map();

    // Bước 1: Nạp toàn bộ ảnh từ cơ sở dữ liệu chung (remoteMemories)
    remoteMemories.forEach(m => {
      if (m && m.id) memoryMap.set(m.id, m);
    });

    // Bước 2: Chỉ giữ lại ảnh vừa tải lên tại máy này trong phiên hiện tại (< 3 phút) nếu chưa kịp sync lên git
    const now = Date.now();
    [...localStoredMemories, ...idbMemories].forEach(m => {
      if (m && m.id && !memoryMap.has(m.id)) {
        if (m.createdAt && (now - m.createdAt < 180000)) {
          memoryMap.set(m.id, m);
        } else {
          deleteMemoryFromIDB(m.id);
        }
      }
    });

    // Bước 3: Đảm bảo 12 ảnh kỷ niệm mặc định luôn có mặt đầy đủ
    DEFAULT_MEMORIES.forEach(dm => {
      if (!memoryMap.has(dm.id)) memoryMap.set(dm.id, dm);
    });

    const merged = Array.from(memoryMap.values());
    // Sort: user-uploaded photos (newer createdAt/date) first, then default photos
    merged.sort((a, b) => {
      const isDefaultA = a.id && a.id.startsWith('mem-') && !a.id.includes('_');
      const isDefaultB = b.id && b.id.startsWith('mem-') && !b.id.includes('_');
      if (isDefaultA && !isDefaultB) return 1;
      if (!isDefaultA && isDefaultB) return -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    cachedMemories = merged;

    // Persist all user memories to IndexedDB so they never get lost
    idbMemories.forEach(im => persistMemoryItemToIDB(im));

    try {
      localStorage.setItem('romantic_gift_user_memories', JSON.stringify(merged));
    } catch(e) {
      // If quota exceeded, store lightweight metadata in localStorage
      try {
        const lightweight = merged.map(m => m.src && m.src.length > 2000 ? { ...m, src: '' } : m);
        localStorage.setItem('romantic_gift_user_memories', JSON.stringify(lightweight));
      } catch(err) {}
    }

    return cachedMemories;
  }

  async function syncMemoriesToUI() {
    const remoteMem = await fetchMemoriesFromDatabase();
    if (remoteMem && remoteMem.length > 0) {
      renderMemoriesGrid();
    }
  }

  async function postMemoryToDatabase(imageBase64, caption, date) {
    try {
      const res = await fetch(getApiUrl('/api/memories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, caption, date })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.memory) {
          return data.memory;
        }
      }
    } catch(e) {
      console.warn('API /api/memories unavailable, saving locally:', e);
    }
    return null;
  }

  async function deleteMemoryFromDatabase(memId) {
    try {
      await fetch(getApiUrl(`/api/memories/${encodeURIComponent(memId)}`), { method: 'DELETE' });
    } catch(e) {}
    await deleteMemoryFromIDB(memId);
    broadcastRealtime('BÉ_ACTION', { module: 'memories' });
  }

  function getSavedMemories() {
    if (Array.isArray(cachedMemories) && cachedMemories.length > 0) {
      return cachedMemories;
    }
    try {
      const raw = localStorage.getItem('romantic_gift_user_memories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedMemories = parsed;
          return cachedMemories;
        }
      }
    } catch(e) {}
    if (window.SEED_DATA && Array.isArray(window.SEED_DATA.memories) && window.SEED_DATA.memories.length > 0) {
      cachedMemories = JSON.parse(JSON.stringify(window.SEED_DATA.memories));
      return cachedMemories;
    }
    cachedMemories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
    return cachedMemories;
  }

  function saveMemories(memories) {
    if (Array.isArray(memories)) {
      cachedMemories = memories;
      // Backup each user memory to IndexedDB
      memories.forEach(m => {
        if (m && m.id && (!m.id.startsWith('mem-') || m.id.includes('_'))) {
          persistMemoryItemToIDB(m);
        }
      });
    }
    try {
      localStorage.setItem('romantic_gift_user_memories', JSON.stringify(memories));
    } catch(e) {
      console.warn('LocalStorage quota exceeded for memories:', e);
      try {
        const lightweight = memories.map(m => m.src && m.src.length > 2000 ? { ...m, src: '' } : m);
        localStorage.setItem('romantic_gift_user_memories', JSON.stringify(lightweight));
      } catch(err) {}
    }
  }

  // Compress image to canvas (max 1000px, 0.82 quality)
  function compressImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        callback(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  let currentSelectedMemoryFile = null;

  function handleFileSelected(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file ảnh hợp lệ (JPG, PNG, WebP...)');
      return;
    }

    currentSelectedMemoryFile = file;

    compressImageFile(file, (dataUrl) => {
      currentPendingImageData = dataUrl;
      if (previewImg) previewImg.src = dataUrl;
      if (dropzoneTrigger) dropzoneTrigger.style.display = 'none';
      if (uploadPreviewForm) uploadPreviewForm.style.display = 'flex';
      if (memoryCaptionInput) memoryCaptionInput.focus();
    });
  }

  if (btnBrowsePhoto && memoryFileInput) {
    btnBrowsePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      memoryFileInput.click();
    });
  }

  if (memoryFileInput) {
    memoryFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (dropzoneTrigger && memoryFileInput) {
    dropzoneTrigger.addEventListener('click', (e) => {
      if (e.target === btnBrowsePhoto || e.target.closest('#btn-browse-photo')) return;
      memoryFileInput.click();
    });
  }

  // Drag and drop support
  if (memoryUploadDropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      memoryUploadDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        memoryUploadDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      memoryUploadDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        memoryUploadDropzone.classList.remove('dragover');
      });
    });

    memoryUploadDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        handleFileSelected(dt.files[0]);
      }
    });
  }

  if (btnCancelPreview) {
    btnCancelPreview.addEventListener('click', () => {
      currentPendingImageData = null;
      currentSelectedMemoryFile = null;
      if (previewImg) previewImg.src = '';
      if (memoryFileInput) memoryFileInput.value = '';
      if (uploadPreviewForm) uploadPreviewForm.style.display = 'none';
      if (dropzoneTrigger) dropzoneTrigger.style.display = 'block';
    });
  }

  if (btnSaveMemoryPhoto) {
    btnSaveMemoryPhoto.addEventListener('click', async () => {
      if (!currentPendingImageData && !currentSelectedMemoryFile) return;
      sound.init();
      sound.playKeyClick();

      const origBtnHtml = btnSaveMemoryPhoto.innerHTML;
      btnSaveMemoryPhoto.disabled = true;
      btnSaveMemoryPhoto.innerHTML = '⏳ Đang lưu ảnh...';

      try {
        const caption = (memoryCaptionInput && memoryCaptionInput.value.trim()) || 'Khoảnh khắc đáng nhớ';
        let dateVal = memoryDateInput ? memoryDateInput.value : '';
        if (!dateVal) {
          const d = new Date();
          dateVal = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } else {
          const parts = dateVal.split('-');
          if (parts.length === 3) dateVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        let finalImgSrc = currentPendingImageData;
        let serverMem = null;

        // 1. Try ImgBB Cloud API upload first if key exists
        if (userConfig.imgbbApiKey && currentPendingImageData) {
          try {
            const cloudUrl = await uploadToImgBB(currentPendingImageData, userConfig.imgbbApiKey);
            if (cloudUrl) finalImgSrc = cloudUrl;
          } catch(e) {}
        }

        // 2. Try uploading via FormData to backend Database Server
        if (currentSelectedMemoryFile) {
          try {
            const formData = new FormData();
            formData.append('photo', currentSelectedMemoryFile);
            formData.append('caption', caption);
            formData.append('date', dateVal);

            const res = await fetch(getApiUrl('/api/memories'), {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              if (data && data.success && data.memory) {
                serverMem = data.memory;
              }
            }
          } catch(err) {
            console.warn('FormData upload to /api/memories failed:', err);
          }
        }

        // 3. Fallback to base64 JSON API upload if FormData didn't return
        if (!serverMem && finalImgSrc) {
          serverMem = await postMemoryToDatabase(finalImgSrc, caption, dateVal);
        }

        const newMem = serverMem || {
          id: 'mem_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          src: finalImgSrc,
          caption: caption,
          date: dateVal,
          createdAt: Date.now()
        };

        // 4. Save to IndexedDB (unlimited storage, permanent, survives reload & browser restarts)
        await persistMemoryItemToIDB(newMem);

        // 5. Update in-memory cachedMemories
        const memories = getSavedMemories();
        const existingIdx = memories.findIndex(m => m.id === newMem.id);
        if (existingIdx !== -1) {
          memories.splice(existingIdx, 1);
        }
        memories.unshift(newMem);
        saveMemories(memories);

        // Cloud sync memory to Firebase (24/7 serverless)
        if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
          FirebaseSync.pushMemory(newMem);
        }

        // Reset preview
        currentPendingImageData = null;
        currentSelectedMemoryFile = null;
        if (previewImg) previewImg.src = '';
        if (memoryCaptionInput) memoryCaptionInput.value = '';
        if (memoryFileInput) memoryFileInput.value = '';
        if (uploadPreviewForm) uploadPreviewForm.style.display = 'none';
        if (dropzoneTrigger) dropzoneTrigger.style.display = 'block';

        sound.playSuccessChime();
        burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
        renderMemoriesGrid();
        broadcastRealtime('BÉ_ACTION', { module: 'memories' });
        alert('Đã lưu bức ảnh vào kho kỷ niệm thành công! 📸✨ Cả hai bạn đều sẽ thấy bức ảnh này mãi mãi!');
      } catch (err) {
        console.error('Lỗi khi lưu ảnh kỷ niệm:', err);
        alert('Có lỗi xảy ra khi lưu ảnh. Bé hãy thử lại nhé!');
      } finally {
        btnSaveMemoryPhoto.disabled = false;
        btnSaveMemoryPhoto.innerHTML = origBtnHtml;
      }
    });
  }

  function renderMemoriesGrid() {
    if (!memoriesGrid) return;
    const memories = getSavedMemories();
    if (memoriesCountText) memoriesCountText.textContent = `${memories.length} bức ảnh đã lưu`;
    memoriesGrid.innerHTML = '';

    memories.forEach((mem, index) => {
      const card = document.createElement('div');
      card.className = 'memory-item-card';
      card.innerHTML = `
        <button type="button" class="btn-delete-memory" title="Xóa ảnh này">✕</button>
        <div class="memory-thumb-wrap">
          <img src="${resolveMediaUrl(mem.src)}" alt="${escapeHTML(mem.caption)}" loading="lazy" onerror="this.onerror=null;this.src='images/photo1.jpg';">
        </div>
        <div class="memory-card-caption">
          <h5>${escapeHTML(mem.caption)}</h5>
          <small>${escapeHTML(mem.date)}</small>
        </div>
      `;

      // Open Lightbox on click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-memory')) return;
        openLightbox(mem);
      });

      // Delete action
      const btnDel = card.querySelector('.btn-delete-memory');
      btnDel.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Bé có chắc muốn xóa bức ảnh này khỏi album kỷ niệm?')) {
          sound.init();
          sound.playKeyClick();
          await deleteMemoryFromDatabase(mem.id);
          const currentList = getSavedMemories();
          const targetIdx = currentList.findIndex(m => m.id === mem.id);
          if (targetIdx !== -1) {
            currentList.splice(targetIdx, 1);
          }
          saveMemories(currentList);
          renderMemoriesGrid();
        }
      });

      memoriesGrid.appendChild(card);
    });
  }

  function openLightbox(mem) {
    if (!lightboxModal || !lightboxImg) return;
    sound.init();
    sound.playKeyClick();
    lightboxImg.src = resolveMediaUrl(mem.src);
    if (lightboxCaption) lightboxCaption.textContent = mem.caption || 'Kỷ niệm đôi ta';
    if (lightboxDate) lightboxDate.textContent = mem.date || '';
    lightboxModal.classList.add('show');
    lightboxModal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('show');
    lightboxModal.setAttribute('aria-hidden', 'true');
    if (lightboxImg) lightboxImg.src = '';
  }

  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  // --- 11. LOVE BUCKET LIST (100 ĐIỀU CÙNG NHAU LÀM) ---
  const bucketListGrid = document.getElementById('bucket-list-grid');
  const bucketProgressFill = document.getElementById('bucket-progress-fill');
  const bucketProgressText = document.getElementById('bucket-progress-text');
  const bucketRankTitle = document.getElementById('bucket-rank-title');
  const bucketBadgeRank = document.getElementById('bucket-badge-rank');
  const bucketFilterPills = document.querySelectorAll('.bucket-filter-pill');
  const btnToggleAddBucket = document.getElementById('btn-toggle-add-bucket');
  const bucketAddBox = document.getElementById('bucket-add-box');
  const inputBucketTitle = document.getElementById('input-bucket-title');
  const selectBucketCategory = document.getElementById('select-bucket-category');
  const inputBucketNote = document.getElementById('input-bucket-note');
  const btnSubmitNewBucket = document.getElementById('btn-submit-new-bucket');

  let activeBucketFilter = 'all';
  let cachedBucketList = (function() {
    try {
      const raw = localStorage.getItem('romantic_gift_bucket_list') || localStorage.getItem('romantic_gift_user_bucket');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch(e) {}
    if (typeof window !== 'undefined' && window.SEED_DATA && Array.isArray(window.SEED_DATA.bucketList)) {
      return JSON.parse(JSON.stringify(window.SEED_DATA.bucketList));
    }
    return [];
  })();

  const CATEGORY_MAP = {
    sweet: { label: 'Lãng mạn', icon: '🌸' },
    date: { label: 'Hẹn hò', icon: '🍿' },
    travel: { label: 'Du lịch', icon: '✈️' },
    future: { label: 'Tương lai', icon: '🏡' }
  };

  async function fetchBucketList() {
    // 1. Initial fast load from localStorage or SEED_DATA
    try {
      const raw = localStorage.getItem('romantic_gift_bucket_list') || localStorage.getItem('romantic_gift_user_bucket');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedBucketList = parsed;
          renderBucketList();
        }
      }
    } catch(e) {}

    if (cachedBucketList.length === 0 && window.SEED_DATA && Array.isArray(window.SEED_DATA.bucketList) && window.SEED_DATA.bucketList.length > 0) {
      cachedBucketList = JSON.parse(JSON.stringify(window.SEED_DATA.bucketList));
      try {
        localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(cachedBucketList));
      } catch(e) {}
      renderBucketList();
    }

    // 1.1 Fetch from Firebase Cloud if available (24/7 Serverless)
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
      try {
        const cloudBucket = await FirebaseSync.fetchCloudBucket();
        if (cloudBucket && Array.isArray(cloudBucket) && cloudBucket.length > 0) {
          cachedBucketList = cloudBucket;
          localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(cloudBucket));
          renderBucketList();
          return;
        }
      } catch(e) {}
    }

    // 2. Fetch from /api/bucket (local server)
    try {
      const res = await fetch(getApiUrl('/api/bucket?v=' + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          cachedBucketList = data.items;
          localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(data.items));
          renderBucketList();
          return;
        }
      }
    } catch(e) {}

    // 3. Static fallback: fetch data/db.json (luôn cập nhật trạng thái mới nhất kể cả khi cache đã có dữ liệu)
    try {
      const res = await fetch('data/db.json?v=' + Date.now());
      if (res.ok) {
        const dbData = await res.json();
        if (dbData && Array.isArray(dbData.bucketList) && dbData.bucketList.length > 0) {
          const itemMap = new Map();
          dbData.bucketList.forEach(it => { if (it && it.id) itemMap.set(it.id, it); });
          cachedBucketList.forEach(it => {
            if (it && it.id && !itemMap.has(it.id) && it.id.startsWith('b_')) {
              itemMap.set(it.id, it);
            }
          });
          const merged = Array.from(itemMap.values());
          const prevStr = JSON.stringify(cachedBucketList);
          const newStr = JSON.stringify(merged);
          if (prevStr !== newStr) {
            cachedBucketList = merged;
            localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(merged));
            renderBucketList();
          }
        }
      }
    } catch(e) {}
  }

  function renderBucketList() {
    if (!bucketListGrid) return;

    const total = cachedBucketList.length;
    const completedCount = cachedBucketList.filter(i => i.completed).length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Update progress bar
    if (bucketProgressFill) {
      bucketProgressFill.style.width = `${percent}%`;
    }
    if (bucketProgressText) {
      bucketProgressText.textContent = `Đã hoàn thành: ${completedCount} / ${total} điều (${percent}%)`;
    }

    // Update rank
    if (bucketRankTitle) {
      if (percent >= 75) bucketRankTitle.textContent = 'Tình Yêu Vĩnh Cửu 👑';
      else if (percent >= 50) bucketRankTitle.textContent = 'Cặp Đôi Tri Kỷ 🌟';
      else if (percent >= 25) bucketRankTitle.textContent = 'Cặp Đôi Đồng Điệu 💖';
      else bucketRankTitle.textContent = 'Cặp Đôi Bắt Đầu Yêu 🌱';
    }

    // Filter items
    let filtered = cachedBucketList;
    if (activeBucketFilter === 'todo') {
      filtered = cachedBucketList.filter(i => !i.completed);
    } else if (activeBucketFilter === 'done') {
      filtered = cachedBucketList.filter(i => i.completed);
    } else if (activeBucketFilter !== 'all') {
      filtered = cachedBucketList.filter(i => i.category === activeBucketFilter);
    }

    bucketListGrid.innerHTML = '';
    if (filtered.length === 0) {
      bucketListGrid.innerHTML = `<div class="admin-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted);">Không có điều ước nào trong mục này 💕</div>`;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = `bucket-item-card ${item.completed ? 'completed' : ''}`;
      card.innerHTML = `
        <button type="button" class="bucket-check-btn" title="${item.completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}">
          ${item.completed ? '💖' : '🤍'}
        </button>
        <div class="bucket-item-body">
          <div class="bucket-item-head">
            <span class="bucket-category-tag">${item.icon || '💖'} ${item.categoryLabel || 'Tình yêu'}</span>
          </div>
          <h4 class="bucket-item-title">${escapeHTML(item.title)}</h4>
          ${item.note ? `<p class="bucket-item-note">💬 ${escapeHTML(item.note)}</p>` : ''}
          ${item.completed ? `<span class="bucket-completed-badge">✅ ${item.completedDate || 'Đã hoàn thành'}</span>` : ''}
        </div>
      `;

      const checkBtn = card.querySelector('.bucket-check-btn');
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBucketItem(item.id, card, e);
      });

      bucketListGrid.appendChild(card);
    });
  }

  async function toggleBucketItem(id, cardEl, clickEvent) {
    sound.init();
    const item = cachedBucketList.find(i => i.id === id);
    if (!item) return;

    const willBeCompleted = !item.completed;
    item.completed = willBeCompleted;

    if (willBeCompleted) {
      sound.playSuccessChime();
      const d = new Date();
      item.completedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      // Confetti & Hearts at click position
      if (clickEvent) {
        burstHeartsAt(clickEvent.clientX, clickEvent.clientY);
      }
      fireConfetti();
    } else {
      sound.playKeyClick();
      item.completedDate = null;
    }

    localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(cachedBucketList));
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
      FirebaseSync.setCloudBucket(cachedBucketList);
    }
    renderBucketList();

    // Sync to backend database
    try {
      await fetch(getApiUrl(`/api/bucket/${encodeURIComponent(id)}/toggle`), { method: 'PUT' });
    } catch(e) {}
    broadcastRealtime('BÉ_ACTION', { module: 'bucket' });
  }

  // Filter pills
  bucketFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      bucketFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeBucketFilter = pill.getAttribute('data-filter') || 'all';
      renderBucketList();
    });
  });

  // Toggle add box
  if (btnToggleAddBucket && bucketAddBox) {
    btnToggleAddBucket.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      bucketAddBox.classList.toggle('show');
      if (bucketAddBox.classList.contains('show') && inputBucketTitle) {
        inputBucketTitle.focus();
      }
    });
  }

  // Submit new wish
  if (btnSubmitNewBucket && inputBucketTitle) {
    btnSubmitNewBucket.addEventListener('click', async () => {
      sound.init();
      const title = inputBucketTitle.value.trim();
      if (!title) {
        alert('Bé ơi, hãy nhập điều muốn làm cùng nhau trước nhé! 💕');
        return;
      }

      const category = (selectBucketCategory && selectBucketCategory.value) || 'sweet';
      const catInfo = CATEGORY_MAP[category] || { label: 'Lãng mạn', icon: '🌸' };
      const note = (inputBucketNote && inputBucketNote.value.trim()) || '';

      const newWish = {
        id: 'b_' + Date.now(),
        icon: catInfo.icon,
        title: title,
        category: category,
        categoryLabel: catInfo.label,
        completed: false,
        completedDate: null,
        note: note,
        createdAt: Date.now()
      };

      cachedBucketList.unshift(newWish);
      localStorage.setItem('romantic_gift_bucket_list', JSON.stringify(cachedBucketList));
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.isAvailable()) {
        FirebaseSync.setCloudBucket(cachedBucketList);
      }

      // Reset form
      inputBucketTitle.value = '';
      if (inputBucketNote) inputBucketNote.value = '';
      if (bucketAddBox) bucketAddBox.classList.remove('show');

      sound.playSuccessChime();
      burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
      renderBucketList();
      alert('Đã thêm điều ước mới vào danh sách Bucket List của đôi mình! 🎯💖');

      // Send to server
      try {
        await fetch(getApiUrl('/api/bucket'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWish)
        });
      } catch(e) {}
      broadcastRealtime('BÉ_ACTION', { module: 'bucket' });
    });
  }

  // --- 12. TYPEWRITER LOVE LETTER MODAL ---
  const envelope3d = document.getElementById('envelope-3d');
  const btnOpenLetterDirect = document.getElementById('btn-open-letter-direct');
  const letterModal = document.getElementById('letter-modal');
  const btnCloseLetter = document.getElementById('btn-close-letter');
  const letterBackdrop = document.getElementById('letter-backdrop');
  const typewriterText = document.getElementById('typewriter-text');
  const btnSkipTyping = document.getElementById('btn-skip-typing');
  const btnReplayTyping = document.getElementById('btn-replay-typing');
  const btnFireConfetti = document.getElementById('btn-fire-confetti');
  const letterSalutation = document.getElementById('letter-salutation');
  const letterSenderName = document.getElementById('letter-sender-name');

  let typingTimer = null;
  let isTyping = false;

  function openLetterModal() {
    sound.init();
    sound.playUnlockSound();
    if (envelope3d) envelope3d.classList.add('open');

    setTimeout(() => {
      if (letterModal) letterModal.classList.add('show');
      startTypewriterEffect();
    }, 450);
  }

  function closeLetterModal() {
    if (letterModal) letterModal.classList.remove('show');
    if (envelope3d) envelope3d.classList.remove('open');
    if (typingTimer) clearTimeout(typingTimer);
    isTyping = false;
  }

  function startTypewriterEffect() {
    if (typingTimer) clearTimeout(typingTimer);
    isTyping = true;
    typewriterText.textContent = '';
    
    // Update salutation and sender
    if (letterSalutation) {
      letterSalutation.textContent = `Gửi ${userConfig.girlfriendName || 'Bé Yêu'},`;
    }
    if (letterSenderName) {
      letterSenderName.textContent = `${userConfig.boyfriendName || 'Anh Yêu'} ❤️`;
    }

    const fullText = userConfig.letterBody || DEFAULT_CONFIG.letterBody;
    let charIndex = 0;

    function typeNextChar() {
      if (!isTyping) return;
      if (charIndex < fullText.length) {
        const char = fullText.charAt(charIndex);
        typewriterText.textContent += char;
        charIndex++;

        // Vintage key click sound every few chars
        if (charIndex % 3 === 0) {
          sound.playTypewriterClick();
        }

        // Punctuation delay
        let delay = 35;
        if (char === '.' || char === '!' || char === '?') {
          delay = 280;
        } else if (char === ',' || char === ';') {
          delay = 140;
        } else if (char === '\n') {
          delay = 220;
        }

        typingTimer = setTimeout(typeNextChar, delay);
      } else {
        isTyping = false;
        sound.playWinFanfare();
        launchCelebrationConfetti();
      }
    }

    typeNextChar();
  }

  function skipTypewriter() {
    if (typingTimer) clearTimeout(typingTimer);
    isTyping = false;
    typewriterText.textContent = userConfig.letterBody || DEFAULT_CONFIG.letterBody;
    launchCelebrationConfetti();
  }

  if (envelope3d) envelope3d.addEventListener('click', openLetterModal);
  if (btnOpenLetterDirect) btnOpenLetterDirect.addEventListener('click', openLetterModal);
  if (btnCloseLetter) btnCloseLetter.addEventListener('click', closeLetterModal);
  if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetterModal);
  if (btnSkipTyping) btnSkipTyping.addEventListener('click', skipTypewriter);
  if (btnReplayTyping) btnReplayTyping.addEventListener('click', startTypewriterEffect);
  if (btnFireConfetti) btnFireConfetti.addEventListener('click', launchCelebrationConfetti);

  // --- 9. CONFETTI CELEBRATIONS ---
  function launchWelcomeConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff4d88', '#f6c85f', '#ff7eb3', '#ffffff']
      });
    }
  }

  function launchCelebrationConfetti() {
    if (typeof confetti === 'function') {
      // Multi-angle festive fireworks
      const count = 200;
      const defaults = {
        origin: { y: 0.7 }
      };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ff477e', '#f6c85f'] });
      fire(0.2, { spread: 60, colors: ['#ff758c', '#a82020'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, colors: ['#ffd1dc', '#fff'] });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }

  function fireConfetti() {
    launchCelebrationConfetti();
  }

  // --- 10. SETTINGS & CUSTOMIZATION MODAL ---
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnResetDefault = document.getElementById('btn-reset-default');

  const inputGfName = document.getElementById('input-girlfriend-name');
  const inputBfName = document.getElementById('input-boyfriend-name');
  const inputStartDate = document.getElementById('input-start-date');
  const inputPasscode = document.getElementById('input-passcode');
  const inputLetterBody = document.getElementById('input-letter-body');

  // Helper: Format Date or ISO string to local YYYY-MM-DDTHH:mm (avoiding UTC shift bug)
  function formatLocalDateTime(dateInput) {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function openSettings() {
    // SECURITY GATE: Only boyfriend can edit!
    const enteredPin = prompt('🔒 BẢO MẬT QUẢN TRỊ VIÊN:\nChỉ người tạo web mới có quyền chỉnh sửa.\nVui lòng nhập mã PIN bảo mật để mở cài đặt:');
    if (!enteredPin) return;
    if (enteredPin !== userConfig.passcode && enteredPin !== '0702') {
      alert('Mã PIN quản trị không chính xác!');
      return;
    }

    try {
      sound.init();
      sound.playKeyClick();
    } catch(e) {}
    if (inputGfName) inputGfName.value = userConfig.girlfriendName;
    if (inputBfName) inputBfName.value = userConfig.boyfriendName;
    if (inputPasscode) inputPasscode.value = userConfig.passcode;
    if (inputLetterBody) inputLetterBody.value = userConfig.letterBody;

    if (inputStartDate && userConfig.startDate) {
      try {
        const formatted = formatLocalDateTime(userConfig.startDate);
        if (formatted) inputStartDate.value = formatted;
      } catch (err) {}
    }

    const prizesGrid = document.getElementById('wheel-prizes-edit-grid');
    if (prizesGrid) {
      prizesGrid.innerHTML = '';
      const prizes = getWheelPrizes();
      prizes.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'wheel-prize-edit-row';
        row.innerHTML = `
          <span class="prize-slot-badge">Ô ${idx + 1}</span>
          <div class="prize-input-pair">
            <input type="text" class="input-prize-title" data-idx="${idx}" value="${p.title}" placeholder="Tên phần thưởng">
            <input type="text" class="input-prize-note" data-idx="${idx}" value="${p.note}" placeholder="Lời nhắn / chi tiết">
          </div>
        `;
        prizesGrid.appendChild(row);
      });
    }

    if (settingsModal) settingsModal.classList.add('show');
  }

  function closeSettings() {
    if (settingsModal) settingsModal.classList.remove('show');
  }

  function saveSettings() {
    sound.init();
    sound.playUnlockSound();
    userConfig.girlfriendName = inputGfName.value.trim() || 'Bé Yêu';
    userConfig.boyfriendName = inputBfName.value.trim() || 'Anh Yêu';
    userConfig.passcode = inputPasscode.value.trim() || '2010';
    userConfig.letterBody = inputLetterBody.value.trim() || DEFAULT_CONFIG.letterBody;

    if (inputStartDate.value) {
      try {
        const d = new Date(inputStartDate.value);
        if (!isNaN(d.getTime())) {
          userConfig.startDate = d.toISOString();
        }
      } catch(e) {}
    }

    // Save customized wheel prizes
    const titleInputs = document.querySelectorAll('.input-prize-title');
    const noteInputs = document.querySelectorAll('.input-prize-note');
    if (titleInputs.length === 6) {
      const updatedPrizes = [];
      titleInputs.forEach((inp, idx) => {
        const title = inp.value.trim() || DEFAULT_WHEEL_PRIZES[idx].title;
        const note = (noteInputs[idx] && noteInputs[idx].value.trim()) || DEFAULT_WHEEL_PRIZES[idx].note;
        const color = DEFAULT_WHEEL_PRIZES[idx].color;
        updatedPrizes.push({ title, note, color });
      });
      userConfig.wheelPrizes = updatedPrizes;
    }

    try {
      localStorage.setItem('romantic_gift_config_2010', JSON.stringify(userConfig));
    } catch (e) {
      console.warn('Storage failed', e);
    }

    applyConfigToUI();
    drawLuckyWheel();
    closeSettings();
    alert('Đã lưu thông tin tùy chỉnh thành công! 💖');
  }

  function applyConfigToUI() {
    const displayNames = document.getElementById('display-couple-names');
    if (displayNames) {
      displayNames.textContent = `${userConfig.boyfriendName || 'khúc gỗ'} & ${userConfig.girlfriendName || 'bé mèo'}`;
    }

    const certRecipient = document.getElementById('cert-recipient-name');
    if (certRecipient) {
      const gfCertName = (userConfig.girlfriendRealName && userConfig.girlfriendRealName !== 'N.T.B.N') ? userConfig.girlfriendRealName : (userConfig.girlfriendName || 'bé mèo');
      certRecipient.textContent = `${gfCertName} !`;
    }

    const certIssuer = document.getElementById('cert-issuer-name');
    if (certIssuer) {
      const bfCertName = (userConfig.boyfriendRealName && userConfig.boyfriendRealName !== 'Huỳnh Ngọc Thắng') ? userConfig.boyfriendRealName : (userConfig.boyfriendName || 'khúc gỗ');
      certIssuer.textContent = bfCertName;
    }

    const hintSpan = document.querySelector('#hint-bubble span');
    if (hintSpan && userConfig.passcodeHint) {
      hintSpan.textContent = userConfig.passcodeHint;
    }

    // Camera recipient labels
    const partnerName = (userConfig && userConfig.boyfriendName) || 'khúc gỗ';
    if (typeof quickSendPersonName !== 'undefined' && quickSendPersonName) {
      quickSendPersonName.textContent = `Gửi Cho ${partnerName} 💖`;
    }
    if (typeof choiceTitleBf !== 'undefined' && choiceTitleBf) {
      choiceTitleBf.textContent = `Chàng Trai Của Bé (${partnerName})`;
    }

    // Letter modal salutation and sender
    const letterSalutation = document.getElementById('letter-salutation');
    if (letterSalutation) {
      letterSalutation.textContent = `Gửi ${userConfig.girlfriendName || 'bé mèo'},`;
    }
    const letterSenderName = document.getElementById('letter-sender-name');
    if (letterSenderName) {
      letterSenderName.textContent = `${userConfig.boyfriendName || 'khúc gỗ'} ❤️`;
    }

    // If letter is currently displayed on screen, update typewriterText immediately
    const typewriterText = document.getElementById('typewriter-text');
    if (typewriterText && !isTyping && typewriterText.textContent.trim()) {
      typewriterText.textContent = userConfig.letterBody || DEFAULT_CONFIG.letterBody;
    }

    updateLiveCounter();
  }

  function resetDefaultConfig() {
    if (confirm('Khôi phục toàn bộ cài đặt gốc?')) {
      userConfig = Object.assign({}, DEFAULT_CONFIG);
      userConfig.wheelPrizes = JSON.parse(JSON.stringify(DEFAULT_WHEEL_PRIZES));
      localStorage.removeItem('romantic_gift_config_2010');
      applyConfigToUI();
      drawLuckyWheel();
      openSettings();
    }
  }

  if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettings);
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);
  if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveSettings);
  if (btnResetDefault) btnResetDefault.addEventListener('click', resetDefaultConfig);

  // Admin Mode Visibility Check (Locks out admin on recipient view)
  function initAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedData = window.location.hash.includes('data=') || urlParams.has('data');

    // When girlfriend opens via shared link, strictly hide admin and settings:
    if (hasSharedData) {
      if (btnOpenSettings) {
        btnOpenSettings.classList.remove('admin-visible');
        btnOpenSettings.style.display = 'none';
      }
      return;
    }

    // Only show admin gear if explicitly launched with ?admin=true or #admin
    const isAdmin = urlParams.get('admin') === 'true' || urlParams.get('mode') === 'admin' || window.location.hash === '#admin';
    if (isAdmin && btnOpenSettings) {
      btnOpenSettings.classList.add('admin-visible');
    }
  }

  // Initialize
  initAmbientParticles();
  applyConfigToUI();
  renderDiaryNotes();
  renderMemoriesGrid();
  renderBucketList();
  loadLocketFeed();
  initAdminMode();

  // Dynamic Sync Configuration from Database Server
  async function syncConfigToUI() {
    let newConfigData = null;

    // 1. Fetch from live /api/config
    try {
      const res = await fetch(getApiUrl('/api/config?v=' + Date.now()));
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.config) {
          newConfigData = data.config;
        }
      }
    } catch(e) {}

    // 2. Fallback to data/db.json
    if (!newConfigData) {
      try {
        const res = await fetch('data/db.json?v=' + Date.now());
        if (res.ok) {
          const db = await res.json();
          if (db && db.config) {
            newConfigData = db.config;
          }
        }
      } catch(e) {}
    }

    // 3. Fallback to COUPLE_CONFIG or SEED_DATA.config
    if (!newConfigData) {
      if (window.COUPLE_CONFIG && typeof window.COUPLE_CONFIG === 'object') {
        newConfigData = window.COUPLE_CONFIG;
      } else if (window.SEED_DATA && window.SEED_DATA.config) {
        newConfigData = window.SEED_DATA.config;
      }
    }

    if (newConfigData) {
      const prevConfigStr = JSON.stringify(userConfig);
      userConfig = Object.assign({}, userConfig, newConfigData);
      const newConfigStr = JSON.stringify(userConfig);

      try {
        localStorage.setItem('romantic_gift_config_2010', JSON.stringify(userConfig));
      } catch(e) {}

      // Re-apply if ANY field changed
      if (prevConfigStr !== newConfigStr) {
        applyConfigToUI();
        if (typeof drawLuckyWheel === 'function') drawLuckyWheel();
        console.log('🔄 Đã tự động cập nhật cấu hình mới từ Database!');
      }
    }
  }

  // Unified Realtime Sync of All 5 Modules
  function syncAllRealtimeData() {
    syncConfigToUI();
    syncNotesToUI();
    syncMemoriesToUI();
    fetchBucketList();
    loadLocketFeed();
  }

  // Initialize Firebase Realtime Cloud Sync (24/7 Serverless)
  if (typeof FirebaseSync !== 'undefined') {
    FirebaseSync.init();
  }

  // Initial Sync with Database Server
  syncAllRealtimeData();

  // Fast Polling every 2.5 seconds for live 2-way sync across devices
  setInterval(syncAllRealtimeData, 2500);

  // Immediate refresh when tab becomes active / visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncAllRealtimeData();
  });
  window.addEventListener('focus', syncAllRealtimeData);

})();
