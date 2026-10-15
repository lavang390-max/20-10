/**
 * ==========================================================
 * 20/10 ROMANTIC GIFT APP - BACKEND & DATABASE SERVER
 * ==========================================================
 * Quản lý cơ sở dữ liệu lưu trữ:
 * 1. Các lời nhắn/tâm sự bé gửi cho anh (/api/notes)
 * 2. Ảnh kỷ niệm bé & anh upload lên album (/api/memories)
 * 3. Cấu hình cặp đôi tùy chỉnh (/api/config)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default initial memories if database is brand new
const INITIAL_MEMORIES = [
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

const INITIAL_NOTES = [
  {
    id: 'default-welcome-note',
    mood: '🥰',
    moodLabel: 'Hạnh phúc',
    text: 'Chào bé yêu! Đây là góc nhỏ bí mật để bé thoải mái chia sẻ mọi suy nghĩ, tâm sự, dặn dò hoặc hờn dỗi với anh. Bất cứ điều gì bé viết ở đây đều được anh trân trọng và lắng nghe!',
    date: 'Góc Của Bé ❤️',
    createdAt: Date.now(),
    isRead: true
  }
];

// Default initial Love Bucket List (100 Điều Muốn Cùng Nhau Làm)
const INITIAL_BUCKET_LIST = [
  { id: 'b-1', icon: '🍿', title: 'Đi xem phim suất chiếu muộn và ăn bắp rang bơ cùng nhau', category: 'date', categoryLabel: 'Hẹn hò', completed: true, completedDate: 'Đã hoàn thành 💕', note: 'Lúc nào xem phim bé cũng tựa đầu vào vai anh' },
  { id: 'b-2', icon: '🛵', title: 'Đèo bé dạo quanh phố đêm ngắm thành phố lên đèn lung linh', category: 'date', categoryLabel: 'Hẹn hò', completed: true, completedDate: 'Đã hoàn thành 💕', note: 'Bé ôm anh từ phía sau ấm áp lắm' },
  { id: 'b-3', icon: '👩‍🍳', title: 'Cùng nhau vào bếp tự nấu một bữa tối lãng mạn', category: 'sweet', categoryLabel: 'Lãng mạn', completed: false, completedDate: null, note: 'Anh nấu món bé thích, bé nêm nếm gia vị' },
  { id: 'b-4', icon: '🏖️', title: 'Nắm tay nhau đi dạo và ngắm hoàng hôn trên bờ biển', category: 'travel', categoryLabel: 'Du lịch', completed: false, completedDate: null, note: 'Ghi lại dấu chân đôi mình trên cát' },
  { id: 'b-5', icon: '🌧️', title: 'Cùng nhau đi dưới mưa chung một chiếc ô nhỏ', category: 'sweet', categoryLabel: 'Lãng mạn', completed: true, completedDate: 'Đã hoàn thành 💕', note: 'Vai anh ướt nhưng bé thì không bị lạnh' },
  { id: 'b-6', icon: '✈️', title: 'Đi du lịch Đà Lạt săn mây và uống sữa đậu nành nóng', category: 'travel', categoryLabel: 'Du lịch', completed: false, completedDate: null, note: 'Thuê xe máy vi vu khắp các con dốc' },
  { id: 'b-7', icon: '👕', title: 'Mặc áo đôi cùng nhau dạo phố không ngại ánh mắt ai', category: 'sweet', categoryLabel: 'Lãng mạn', completed: false, completedDate: null, note: 'Tự hào khoe với cả thế giới bé là của anh' },
  { id: 'b-8', icon: '⛺', title: 'Đi cắm trại qua đêm ngắm bầu trời đầy sao lấp lánh', category: 'travel', categoryLabel: 'Du lịch', completed: false, completedDate: null, note: 'Đốt lửa trại, nướng khoai và tâm sự thâu đêm' },
  { id: 'b-9', icon: '💆‍♀️', title: 'Xoa bóp vai gáy, bóp đầu ru bé ngủ thật say giấc', category: 'sweet', categoryLabel: 'Lãng mạn', completed: true, completedDate: 'Đã hoàn thành 💕', note: 'Nhiệm vụ cao cả của anh mỗi khi bé mệt mỏi' },
  { id: 'b-10', icon: '📸', title: 'Chụp một bộ ảnh phong cách Hàn Quốc photobooth siêu ngố', category: 'date', categoryLabel: 'Hẹn hò', completed: false, completedDate: null, note: 'Làm những biểu cảm hài hước nhất cùng bé' },
  { id: 'b-11', icon: '🎂', title: 'Cùng nhau đón sinh nhật ấm cúng chỉ có riêng hai đứa', category: 'sweet', categoryLabel: 'Lãng mạn', completed: false, completedDate: null, note: 'Thổi nến và ước những điều ước cho tương lai' },
  { id: 'b-12', icon: '🐱', title: 'Cùng nhau nuôi một bé mèo hoặc bé cún ngoan ngoãn', category: 'future', categoryLabel: 'Tương lai', completed: false, completedDate: null, note: 'Hai đứa làm ba mẹ của một bé thú cưng đáng yêu' },
  { id: 'b-13', icon: '🎡', title: 'Đi công viên giải trí và chơi vòng đu quay khổng lồ', category: 'date', categoryLabel: 'Hẹn hò', completed: false, completedDate: null, note: 'Hôn nhau khi cabin đu quay lên đỉnh cao nhất' },
  { id: 'b-14', icon: '🌅', title: 'Thức dậy thật sớm đón bình minh ngày đầu năm mới', category: 'future', categoryLabel: 'Tương lai', completed: false, completedDate: null, note: 'Gửi những ước nguyện tốt đẹp nhất cho tình yêu' },
  { id: 'b-15', icon: '☕', title: 'Ngồi quán cafe yên tĩnh đọc sách và tựa vai nhau', category: 'date', categoryLabel: 'Hẹn hò', completed: false, completedDate: null, note: 'Những ngày bình yên không ồn ào' },
  { id: 'b-16', icon: '💌', title: 'Viết thư tay niêm phong và hẹn mở ra sau 1 năm', category: 'sweet', categoryLabel: 'Lãng mạn', completed: false, completedDate: null, note: 'Đọc lại những rung động ban đầu' },
  { id: 'b-17', icon: '🧺', title: 'Đi picnic trên bãi cỏ xanh ngát vào chiều cuối tuần', category: 'date', categoryLabel: 'Hẹn hò', completed: false, completedDate: null, note: 'Mang theo hoa quả, bánh ngọt và đàn hát cho bé nghe' },
  { id: 'b-18', icon: '💍', title: 'Cùng nhau bước vào lễ đường trong sự chúc phúc của gia đình', category: 'future', categoryLabel: 'Tương lai', completed: false, completedDate: null, note: 'Trao nhau chiếc nhẫn hẹn ước trọn đời' },
  { id: 'b-19', icon: '🏡', title: 'Xây dựng một tổ ấm nhỏ tràn ngập tiếng cười và bình yên', category: 'future', categoryLabel: 'Tương lai', completed: false, completedDate: null, note: 'Nơi trở về sau những bộn bề cuộc sống' },
  { id: 'b-20', icon: '👵👴', title: 'Cùng nhau già đi, đầu bạc răng long vẫn nắm chặt tay nhau', category: 'future', categoryLabel: 'Tương lai', completed: false, completedDate: null, note: 'Lời hứa trọn đời của anh dành cho bé' }
];

// Sample Initial Locket moments
const INITIAL_LOCKET = [
  {
    id: 'locket-sample-1',
    type: 'photo',
    mediaUrl: 'images/photo1.jpg',
    caption: 'Đang nhớ anh nhiều lắm nè 💕✨',
    sender: 'bé mèo',
    senderRole: 'girlfriend',
    sticker: '🥰',
    filter: 'pink',
    filterLabel: 'Hồng Ngọt Ngào',
    createdAt: Date.now() - 1000 * 60 * 25,
    timeFormatted: '25 phút trước',
    reactions: 3
  },
  {
    id: 'locket-sample-2',
    type: 'photo',
    mediaUrl: 'images/photo2.jpg',
    caption: 'Hôm nay trời đẹp, ước gì có anh ở đây 🌤️',
    sender: 'bé mèo',
    senderRole: 'girlfriend',
    sticker: '🌸',
    filter: 'vintage',
    filterLabel: 'Vintage Film',
    createdAt: Date.now() - 1000 * 60 * 120,
    timeFormatted: '2 giờ trước',
    reactions: 5
  }
];

// Helper to read & write DB
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      let changed = false;
      if (!parsed.bucketList || !Array.isArray(parsed.bucketList)) {
        parsed.bucketList = INITIAL_BUCKET_LIST;
        changed = true;
      }
      if (!parsed.locket || !Array.isArray(parsed.locket)) {
        parsed.locket = INITIAL_LOCKET;
        changed = true;
      }
      if (changed) {
        writeDatabase(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Lỗi khi đọc file db.json:', err);
  }

  const defaultDb = {
    notes: INITIAL_NOTES,
    memories: INITIAL_MEMORIES,
    bucketList: INITIAL_BUCKET_LIST,
    locket: INITIAL_LOCKET,
    config: null
  };
  writeDatabase(defaultDb);
  return defaultDb;
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Lỗi khi ghi file db.json:', err);
    return false;
  }
}

// Multer Storage Configuration for uploaded photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeName = 'memory_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Multer storage for Locket media (photos & 5s videos)
const locketStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    if (!ext) {
      if (file.mimetype && file.mimetype.includes('video')) ext = '.webm';
      else ext = '.jpg';
    }
    const safeName = 'locket_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});

const uploadLocket = multer({
  storage: locketStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max for video
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Static files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname));

// Route shortcuts
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================================
// 1. API: LỜI NHẮN / TÂM SỰ BÉ GỬI CHO ANH (DIARY NOTES)
// ==========================================================

// Lấy danh sách tất cả lời nhắn
app.get('/api/notes', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    total: db.notes ? db.notes.length : 0,
    notes: db.notes || []
  });
});

// Bé gửi một lời nhắn mới
app.post('/api/notes', (req, res) => {
  const { mood, moodLabel, text, date } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Nội dung lời nhắn không được để trống' });
  }

  const db = readDatabase();
  if (!db.notes) db.notes = [];

  const newNote = {
    id: 'note_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    mood: mood || '🥰',
    moodLabel: moodLabel || 'Hạnh phúc',
    text: text.trim(),
    date: date || new Date().toLocaleString('vi-VN'),
    createdAt: Date.now(),
    isRead: false
  };

  db.notes.unshift(newNote);
  writeDatabase(db);

  console.log(`[Database] 💌 Đã nhận lời nhắn mới từ bé: "${newNote.text.substring(0, 30)}..."`);
  res.status(201).json({ success: true, note: newNote });
});

// Đánh dấu đã đọc / Xóa lời nhắn
app.delete('/api/notes/:id', (req, res) => {
  const noteId = req.params.id;
  const db = readDatabase();
  if (!db.notes) db.notes = [];

  const initialLength = db.notes.length;
  db.notes = db.notes.filter(n => n.id !== noteId);

  if (db.notes.length !== initialLength) {
    writeDatabase(db);
    return res.json({ success: true, message: 'Đã xóa lời nhắn thành công' });
  } else {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời nhắn' });
  }
});

// ==========================================================
// 2. API: KHO ẢNH KỶ NIỆM ĐÔI TA (MEMORIES ALBUM)
// ==========================================================

// Lấy danh sách ảnh kỷ niệm
app.get('/api/memories', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    total: db.memories ? db.memories.length : 0,
    memories: db.memories || []
  });
});

// Upload ảnh mới (Hỗ trợ cả Multipart FormData và Base64 JSON)
app.post('/api/memories', upload.single('photo'), (req, res) => {
  let photoSrc = '';
  let caption = (req.body && req.body.caption) || 'Khoảnh khắc đáng nhớ';
  let dateVal = (req.body && req.body.date) || '';

  if (!dateVal) {
    const d = new Date();
    dateVal = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  // 1. Nếu upload qua file form-data
  if (req.file) {
    photoSrc = '/uploads/' + req.file.filename;
  }
  // 2. Nếu upload qua base64 string
  else if (req.body && req.body.imageBase64) {
    try {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const extMatch = req.body.imageBase64.match(/^data:image\/(\w+);base64,/);
      const ext = extMatch ? '.' + extMatch[1] : '.jpg';
      const filename = 'memory_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
      const filePath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(filePath, base64Data, 'base64');
      photoSrc = '/uploads/' + filename;
    } catch (err) {
      console.error('Lỗi lưu file ảnh base64:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xử lý file ảnh' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh hoặc dữ liệu ảnh' });
  }

  const db = readDatabase();
  if (!db.memories) db.memories = [];

  const newMemory = {
    id: 'mem_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    src: photoSrc,
    caption: caption.trim(),
    date: dateVal,
    createdAt: Date.now()
  };

  db.memories.unshift(newMemory);
  writeDatabase(db);

  console.log(`[Database] 📸 Đã thêm ảnh kỷ niệm mới: "${newMemory.caption}" -> ${photoSrc}`);
  res.status(201).json({ success: true, memory: newMemory });
});

// Xóa ảnh kỷ niệm
app.delete('/api/memories/:id', (req, res) => {
  const memId = req.params.id;
  const db = readDatabase();
  if (!db.memories) db.memories = [];

  const memIndex = db.memories.findIndex(m => m.id === memId);
  if (memIndex === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh kỷ niệm' });
  }

  const targetMem = db.memories[memIndex];
  // Nếu là file trong /uploads, xóa file trên ổ đĩa
  if (targetMem.src && targetMem.src.startsWith('/uploads/')) {
    const filename = path.basename(targetMem.src);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Không thể xóa file ảnh cũ:', e);
      }
    }
  }

  db.memories.splice(memIndex, 1);
  writeDatabase(db);

  res.json({ success: true, message: 'Đã xóa ảnh kỷ niệm thành công' });
});

// ==========================================================
// 3. API: CẤU HÌNH CẶP ĐÔI (COUPLE CONFIG)
// ==========================================================

app.get('/api/config', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    config: db.config || null
  });
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.status(400).json({ success: false, message: 'Dữ liệu cấu hình không hợp lệ' });
  }

  const db = readDatabase();
  db.config = newConfig;
  writeDatabase(db);

  // Sync to config.js file for permanent code persistence
  try {
    const configJsContent = `/**
 * ==========================================================
 * CẤU HÌNH QUÀ TẶNG 20/10 - THÔNG TIN DÀNH CHO CẶP ĐÔI
 * ==========================================================
 * Tự động đồng bộ từ Database Server
 */

window.COUPLE_CONFIG = ${JSON.stringify(newConfig, null, 2)};
`;
    fs.writeFileSync(path.join(__dirname, 'config.js'), configJsContent, 'utf8');
  } catch (err) {
    console.warn('Lỗi ghi file config.js:', err);
  }

  console.log('[Database] 💾 Đã lưu và đồng bộ cấu hình cặp đôi thành công!');
  res.json({ success: true, message: 'Đã lưu cấu hình vào Database thành công', config: newConfig });
});

// ==========================================================
// 4. API: LOVE BUCKET LIST (100 ĐIỀU CÙNG NHAU LÀM)
// ==========================================================

// Lấy danh sách bucket list và thống kê
app.get('/api/bucket', (req, res) => {
  const db = readDatabase();
  const items = db.bucketList || [];
  const completedCount = items.filter(i => i.completed).length;
  const percent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  res.json({
    success: true,
    total: items.length,
    completedCount: completedCount,
    percent: percent,
    items: items
  });
});

// Thêm điều ước mới
app.post('/api/bucket', (req, res) => {
  const { title, icon, category, categoryLabel, note } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
  }

  const db = readDatabase();
  if (!db.bucketList) db.bucketList = [];

  const newItem = {
    id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    icon: icon || '💖',
    title: title.trim(),
    category: category || 'sweet',
    categoryLabel: categoryLabel || 'Lãng mạn',
    completed: false,
    completedDate: null,
    note: (note && note.trim()) || '',
    createdAt: Date.now()
  };

  db.bucketList.push(newItem);
  writeDatabase(db);

  console.log(`[Database] 🎯 Đã thêm điều ước mới: "${newItem.title}"`);
  res.status(201).json({ success: true, item: newItem });
});

// Đổi trạng thái hoàn thành (Toggle complete)
app.put('/api/bucket/:id/toggle', (req, res) => {
  const itemId = req.params.id;
  const db = readDatabase();
  if (!db.bucketList) db.bucketList = [];

  const item = db.bucketList.find(b => b.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy mục này' });
  }

  item.completed = !item.completed;
  if (item.completed) {
    const d = new Date();
    item.completedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } else {
    item.completedDate = null;
  }

  writeDatabase(db);
  console.log(`[Database] 🎯 Bucket item "${item.title}" -> completed: ${item.completed}`);
  res.json({ success: true, item: item });
});

// Xóa điều ước
app.delete('/api/bucket/:id', (req, res) => {
  const itemId = req.params.id;
  const db = readDatabase();
  if (!db.bucketList) db.bucketList = [];

  const initialLen = db.bucketList.length;
  db.bucketList = db.bucketList.filter(b => b.id !== itemId);

  if (db.bucketList.length !== initialLen) {
    writeDatabase(db);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } else {
    res.status(404).json({ success: false, message: 'Không tìm thấy mục' });
  }
});

// ==========================================================
// 5. API: MINI LOCKET ĐÔI TA (ẢNH & VIDEO 5S TỨC THÌ)
// ==========================================================

// Lấy danh sách khoảnh khắc Locket
app.get('/api/locket', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    total: db.locket ? db.locket.length : 0,
    items: db.locket || []
  });
});

// Gửi một khoảnh khắc Locket mới (Ảnh hoặc Video 5s)
app.post('/api/locket', uploadLocket.single('media'), (req, res) => {
  let { caption, sender, senderRole, sticker, filter, filterLabel, type } = req.body;
  let mediaUrl = '';
  let mediaType = type || 'photo';

  if (req.file) {
    mediaUrl = '/uploads/' + req.file.filename;
    if (req.file.mimetype && req.file.mimetype.includes('video')) {
      mediaType = 'video';
    }
  } else if (req.body && req.body.mediaBase64) {
    try {
      const isVideo = req.body.mediaBase64.startsWith('data:video');
      mediaType = isVideo ? 'video' : 'photo';
      const base64Data = req.body.mediaBase64.replace(/^data:[^;]+;base64,/, '');
      const extMatch = req.body.mediaBase64.match(/^data:([^;]+);base64,/);
      let ext = isVideo ? '.webm' : '.jpg';
      if (extMatch) {
        if (extMatch[1].includes('mp4')) ext = '.mp4';
        else if (extMatch[1].includes('png')) ext = '.png';
        else if (extMatch[1].includes('webp')) ext = '.webp';
      }
      const filename = 'locket_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, base64Data, 'base64');
      mediaUrl = '/uploads/' + filename;
    } catch (err) {
      console.error('Lỗi lưu file locket base64:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xử lý file locket' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Thiếu file ảnh hoặc video Locket' });
  }

  const db = readDatabase();
  if (!db.locket) db.locket = [];

  const now = new Date();
  const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} • ${now.getDate()}/${now.getMonth() + 1}`;

  const newItem = {
    id: 'locket_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: mediaType,
    mediaUrl: mediaUrl,
    caption: (caption && caption.trim()) || 'Khoảnh khắc tức thì 💕',
    sender: sender || 'Bé Yêu',
    senderRole: senderRole || 'girlfriend',
    sticker: sticker || '💕',
    filter: filter || 'normal',
    filterLabel: filterLabel || 'Tự nhiên',
    createdAt: Date.now(),
    timeFormatted: timeFormatted,
    reactions: 1
  };

  db.locket.unshift(newItem);
  writeDatabase(db);
  console.log(`[Database] 💛 Đã lưu Locket mới (${newItem.type}): "${newItem.caption}" -> ${mediaUrl}`);
  res.status(201).json({ success: true, item: newItem });
});

// Thả tim phản hồi cho Locket
app.post('/api/locket/:id/react', (req, res) => {
  const locketId = req.params.id;
  const db = readDatabase();
  if (!db.locket) db.locket = [];

  const item = db.locket.find(l => l.id === locketId);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy Locket' });

  item.reactions = (item.reactions || 0) + 1;
  writeDatabase(db);
  res.json({ success: true, reactions: item.reactions });
});

// Xóa khoảnh khắc Locket
app.delete('/api/locket/:id', (req, res) => {
  const locketId = req.params.id;
  const db = readDatabase();
  if (!db.locket) db.locket = [];

  const idx = db.locket.findIndex(l => l.id === locketId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy Locket' });

  const item = db.locket[idx];
  if (item.mediaUrl && item.mediaUrl.startsWith('/uploads/')) {
    const filename = path.basename(item.mediaUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }

  db.locket.splice(idx, 1);
  writeDatabase(db);
  res.json({ success: true, message: 'Đã xóa khoảnh khắc Locket thành công' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log('==========================================================');
  console.log(`💖 Web Quà Tặng 20/10 Database Server đang chạy tại:`);
  console.log(`👉 Link Cho Bé (Chỉ Xem):   http://localhost:${PORT}/`);
  console.log(`👉 Link Cho Anh (Quản Trị): http://localhost:${PORT}/admin.html`);
  console.log(`📁 Dữ liệu lưu tại:         ${DB_FILE}`);
  console.log(`🖼️ Thư mục ảnh upload:      ${UPLOADS_DIR}`);
  console.log('==========================================================');
});
