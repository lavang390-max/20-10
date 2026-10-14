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
    girlfriendName: 'Bé mèo',
    boyfriendName: 'Anh',
    startDate: '2023-05-20T00:00:00',
    wheelPrizes: DEFAULT_WHEEL_PRIZES,
    letterBody: `Hellu bé - cô gái tuyệt vời nhất trên đời của anh,\n\nNhân ngày Phụ Nữ Việt Nam 20/10, anh làm món quà nhỏ này dành riêng cho bé. Cảm ơn bé đã đến bên anh, mang theo cả bầu trời bình yên và nụ cười rạng rỡ nhất.\n\nTừ ngày có bé, từng phút giây trôi qua đối với anh đều trở nên đặc biệt ý nghĩa. Chúc bé của anh một ngày 20/10 thật hạnh phúc, luôn vui tươi, xinh đẹp và nhiều niềm vui.\n\nAnh hứa sẽ luôn ở bên cạnh, lắng nghe, chăm sóc và yêu thương bé nhiều hơn mỗi ngày. Mãi bên nhau bé nhé!`
  };

  // Load config from localStorage
  let userConfig = Object.assign({}, DEFAULT_CONFIG);
  try {
    const saved = localStorage.getItem('romantic_gift_config_2010');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-upgrade to sweet prizes if older prizes or Shopee/Tra sua present
      if (parsed.wheelPrizes && parsed.wheelPrizes.length === 6 && !parsed.wheelPrizes[0].title.includes('Trà Sữa')) {
        userConfig = Object.assign({}, DEFAULT_CONFIG, parsed);
      } else {
        delete parsed.wheelPrizes;
        userConfig = Object.assign({}, DEFAULT_CONFIG, parsed);
        userConfig.wheelPrizes = JSON.parse(JSON.stringify(DEFAULT_WHEEL_PRIZES));
      }
    } else {
      userConfig.wheelPrizes = JSON.parse(JSON.stringify(DEFAULT_WHEEL_PRIZES));
    }
  } catch (e) {
    console.warn('Storage not available', e);
    userConfig.wheelPrizes = JSON.parse(JSON.stringify(DEFAULT_WHEEL_PRIZES));
  }

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
        appContainer.classList.remove('app-hidden');
        
        // Start background music
        playBackgroundAudio();
        
        // Launch welcoming confetti
        launchWelcomeConfetti();
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

  function goToSlide(index) {
    sound.init();
    sound.playKeyClick();
    if (index < 0 || index >= slideSections.length) return;
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
    if (index === 2) {
      initScratchCard();
    } else if (index === 1) {
      drawLuckyWheel();
    } else if (index === 4) {
      renderQuizQuestion();
    } else if (index === 5) {
      renderDiaryNotes();
    } else if (index === 6) {
      renderMemoriesGrid();
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

  // --- 5. LUCKY SPIN WHEEL (6 SLOTS) ---
  const wheelCanvas = document.getElementById('wheel-canvas');
  const btnSpinWheel = document.getElementById('btn-spin-wheel');
  const wheelStatusText = document.getElementById('wheel-status-text');
  const prizeHistoryBar = document.getElementById('prize-history-bar');
  const recentWonPrize = document.getElementById('recent-won-prize');
  const prizeModal = document.getElementById('prize-modal');
  const voucherPrizeName = document.getElementById('voucher-prize-name');
  const voucherNote = document.getElementById('voucher-note');

  function getWheelPrizes() {
    return (userConfig.wheelPrizes && userConfig.wheelPrizes.length === 6)
      ? userConfig.wheelPrizes
      : DEFAULT_WHEEL_PRIZES;
  }

  let currentRotationAngle = 0;
  let isSpinning = false;

  function drawLuckyWheel() {
    if (!wheelCanvas) return;
    const ctx = wheelCanvas.getContext('2d');
    const width = wheelCanvas.width;
    const height = wheelCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;
    const currentPrizes = getWheelPrizes();
    const arc = (2 * Math.PI) / currentPrizes.length;

    ctx.clearRect(0, 0, width, height);

    // Outer golden rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
    ctx.restore();

    // Wheel Slices
    currentPrizes.forEach((item, i) => {
      const angle = i * arc;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.fillStyle = item.color || DEFAULT_WHEEL_PRIZES[i % 6].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text and Icons
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(item.title, radius - 16, 5);
      ctx.restore();
    });

    // Decorative golden border studs
    for (let i = 0; i < 24; i++) {
      const studAngle = (i * 2 * Math.PI) / 24;
      const studX = centerX + (radius + 4) * Math.cos(studAngle);
      const studY = centerY + (radius + 4) * Math.sin(studAngle);
      ctx.beginPath();
      ctx.arc(studX, studY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  drawLuckyWheel();

  function spinLuckyWheel() {
    if (isSpinning) return;
    sound.init();
    isSpinning = true;
    wheelStatusText.textContent = '✨ Vòng quay đang chạy... Chờ đợi điều ngọt ngào!';

    const currentPrizes = getWheelPrizes();
    const numSlices = currentPrizes.length;
    const arcDegrees = 360 / numSlices;
    
    // Choose winning index randomly
    const prizeIndex = Math.floor(Math.random() * numSlices);
    
    // Total rotations: 5 to 7 full circles + target slice offset
    // The top needle is at 270 degrees in canvas standard coordinates
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const targetSliceCenter = (prizeIndex * arcDegrees) + (arcDegrees / 2);
    // Align target slice to the top needle (270 degrees)
    const stopAngle = 270 - targetSliceCenter;
    const totalRotation = (extraRounds * 360) + stopAngle;

    wheelCanvas.style.transition = 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)';
    wheelCanvas.style.transform = `rotate(${totalRotation}deg)`;

    // Tick sounds during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sound.playWheelTick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 150);

    setTimeout(() => {
      isSpinning = false;
      const wonPrize = currentPrizes[prizeIndex];
      sound.playWinFanfare();

      // Show win modal & voucher
      if (voucherPrizeName) voucherPrizeName.textContent = wonPrize.title;
      if (voucherNote) voucherNote.textContent = wonPrize.note;
      if (prizeModal) prizeModal.classList.add('show');

      // Update history
      if (prizeHistoryBar && recentWonPrize) {
        prizeHistoryBar.style.display = 'block';
        recentWonPrize.textContent = wonPrize.title;
      }
      wheelStatusText.textContent = `🎉 Chúc mừng bé đã trúng: ${wonPrize.title}!`;

      // Launch Confetti
      launchCelebrationConfetti();
    }, 4600);
  }

  if (btnSpinWheel) {
    btnSpinWheel.addEventListener('click', spinLuckyWheel);
  }

  // Prize Modal Handlers
  const btnClaimPrize = document.getElementById('btn-claim-prize');
  const btnSpinAgain = document.getElementById('btn-spin-again');
  const prizeBackdrop = document.getElementById('prize-backdrop');

  function closePrizeModal() {
    if (prizeModal) prizeModal.classList.remove('show');
  }

  if (btnClaimPrize) {
    btnClaimPrize.addEventListener('click', () => {
      closePrizeModal();
      goToSlide(2); // Go to scratch card
    });
  }

  if (btnSpinAgain) {
    btnSpinAgain.addEventListener('click', () => {
      closePrizeModal();
      // Reset wheel rotation styling smoothly
      wheelCanvas.style.transition = 'none';
      wheelCanvas.style.transform = 'rotate(0deg)';
      setTimeout(spinLuckyWheel, 200);
    });
  }

  if (prizeBackdrop) prizeBackdrop.addEventListener('click', closePrizeModal);

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
    const data = POLAROID_DATA[polaroidCounter % POLAROID_DATA.length];
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

    card.innerHTML = `
      <div class="polaroid-tape"></div>
      <div class="polaroid-img-wrap">
        <img src="${data.src}" alt="${data.caption}">
      </div>
      <p class="polaroid-caption">${data.caption}</p>
      <p class="polaroid-date">${data.date}</p>
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

  // --- 8. COUPLE QUIZ (TRẮC NGHIỆM ĐÔI TA) ---
  const QUIZ_QUESTIONS = [
    {
      q: 'Ai là người hay dỗi hơn trong hai đứa?',
      options: [
        { text: 'Bé mèo (nhưng dỗi siêu cấp đáng yêu)', correct: true, feedback: 'Chuẩn 100%! Bé hay dỗi nhưng lúc nào dỗi nhìn cũng cưng xỉu 🥰' },
        { text: 'Chắc chắn là bé mèo (anh luôn dỗ trước)', correct: true, feedback: 'Chính xác! Dù thế nào thì anh luôn là người dỗ dành và nhận lỗi trước 💖' }
      ]
    },
    {
      q: 'Khi bé nói: "Em không sao đâu..." thì anh phải hiểu là gì?',
      options: [
        { text: 'Tin là bé ổn thật, đi chơi game tiếp', correct: false, feedback: 'Sai bét! Tới công chuyện liền, chuẩn bị thành củi khô đốt lò nhé 💥' },
        { text: 'Có sao to đùng! Mau ôm vào lòng và mua trà sữa', correct: true, feedback: '100 điểm tinh tế! Luôn phải ôm bé thật chặt và dỗ ngay lập tức 🥤💕' }
      ]
    },
    {
      q: 'Ai là "nóc nhà" quyền lực tối thượng trong nhà?',
      options: [
        { text: 'Bé mèo - vị thế độc tôn bất khả xâm phạm', correct: true, feedback: 'Đương nhiên rồi! Lời bé nói chính là mệnh lệnh tối cao 👑' },
        { text: 'Khúc gỗ chỉ là phận làm thuê ngoan ngoãn', correct: true, feedback: 'Rất biết thân biết phận! Khúc gỗ chỉ biết nghe lời và cưng chiều bé thôi ✨' }
      ]
    },
    {
      q: 'Ai là người yêu đối phương nhiều hơn trên đời này?',
      options: [
        { text: 'Khúc gỗ yêu bé mèo nhiều hơn', correct: true, feedback: 'Cả hai cùng yêu nhau vô cực! Tình yêu này không gì sánh bằng 💕' },
        { text: 'Bé mèo yêu khúc gỗ nhiều hơn', correct: true, feedback: 'Cả hai cùng yêu nhau vô cực! Tình yêu này không gì sánh bằng 💕' }
      ]
    }
  ];

  let currentQuizIndex = 0;
  let quizScore = 0;

  const quizBody = document.getElementById('quiz-body');
  const quizResultView = document.getElementById('quiz-result-view');
  const quizStepText = document.getElementById('quiz-step-text');
  const quizScoreBadge = document.getElementById('quiz-score-badge');
  const quizProgressFill = document.getElementById('quiz-progress-fill');
  const quizQNum = document.getElementById('quiz-q-num');
  const quizQuestionTitle = document.getElementById('quiz-question-title');
  const quizOptionsGrid = document.getElementById('quiz-options-grid');
  const quizFeedbackBox = document.getElementById('quiz-feedback-box');
  const quizFeedbackText = document.getElementById('quiz-feedback-text');
  const btnNextQuestion = document.getElementById('btn-next-question');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');

  function renderQuizQuestion() {
    if (!quizBody || !quizResultView) return;
    if (currentQuizIndex >= QUIZ_QUESTIONS.length) {
      showQuizResult();
      return;
    }

    quizBody.style.display = 'block';
    quizResultView.style.display = 'none';
    if (quizFeedbackBox) quizFeedbackBox.style.display = 'none';

    const item = QUIZ_QUESTIONS[currentQuizIndex];
    if (quizStepText) quizStepText.textContent = `Câu hỏi ${currentQuizIndex + 1} / ${QUIZ_QUESTIONS.length}`;
    if (quizScoreBadge) quizScoreBadge.textContent = `Điểm: ${quizScore}`;
    if (quizProgressFill) {
      quizProgressFill.style.width = `${((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`;
    }
    if (quizQNum) quizQNum.textContent = `Q${currentQuizIndex + 1}`;
    if (quizQuestionTitle) quizQuestionTitle.textContent = item.q;

    if (quizOptionsGrid) {
      quizOptionsGrid.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];
      item.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span class="quiz-opt-letter">${letters[idx]}</span> <span>${opt.text}</span>`;
        btn.addEventListener('click', () => handleQuizAnswer(opt, btn));
        quizOptionsGrid.appendChild(btn);
      });
    }
  }

  function handleQuizAnswer(option, clickedBtn) {
    sound.init();
    sound.playKeyClick();

    if (!quizOptionsGrid) return;
    const allBtns = quizOptionsGrid.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });
    clickedBtn.classList.add('selected');

    if (option.correct) {
      quizScore += 25;
      if (quizScoreBadge) quizScoreBadge.textContent = `Điểm: ${quizScore}`;
      sound.playSuccessChime();
      burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      sound.playErrorBuzz();
    }

    if (quizFeedbackBox && quizFeedbackText) {
      quizFeedbackText.textContent = option.feedback;
      quizFeedbackBox.style.display = 'flex';
    }
  }

  if (btnNextQuestion) {
    btnNextQuestion.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      currentQuizIndex++;
      renderQuizQuestion();
    });
  }

  function showQuizResult() {
    if (!quizBody || !quizResultView) return;
    quizBody.style.display = 'none';
    quizResultView.style.display = 'block';
    sound.playUnlockSound();
    fireConfetti();
  }

  if (btnRestartQuiz) {
    btnRestartQuiz.addEventListener('click', () => {
      sound.init();
      sound.playKeyClick();
      currentQuizIndex = 0;
      quizScore = 0;
      renderQuizQuestion();
    });
  }

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

  function getSavedDiaryNotes() {
    try {
      const raw = localStorage.getItem('romantic_gift_user_notes');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
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
      `;

      const delBtn = card.querySelector('.btn-delete-note');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bé có muốn xóa mẩu lời nhắn này không?')) {
          sound.init();
          sound.playKeyClick();
          notes.splice(index, 1);
          saveDiaryNotes(notes);
          renderDiaryNotes();
        }
      });

      diaryNotesList.appendChild(card);
    });
  }

  if (btnSaveDiaryNote && diaryTextarea) {
    btnSaveDiaryNote.addEventListener('click', () => {
      sound.init();
      const content = diaryTextarea.value.trim();
      if (!content) {
        alert('Bé ơi, hãy nhập vài dòng lời nhắn trước khi gửi nhé! 💌');
        return;
      }

      const now = new Date();
      const dateStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} • ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

      const newNote = {
        id: 'note_' + Date.now(),
        mood: selectedMood,
        moodLabel: selectedMoodLabel,
        text: content,
        date: dateStr
      };

      const notes = getSavedDiaryNotes();
      notes.unshift(newNote);
      saveDiaryNotes(notes);

      diaryTextarea.value = '';
      sound.playSuccessChime();
      burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
      renderDiaryNotes();
      alert('Đã gửi lời nhắn thành công! Anh sẽ luôn ghi nhớ và yêu thương bé 💕');
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
    {
      id: 'mem-1',
      src: 'images/photo1.jpg',
      caption: 'Bên bé mọi khoảnh khắc đều đẹp',
      date: 'Kỷ niệm yêu thương'
    },
    {
      id: 'mem-2',
      src: 'images/photo2.jpg',
      caption: 'Nụ cười rạng rỡ của bé',
      date: 'Ngày hạnh phúc'
    },
    {
      id: 'mem-3',
      src: 'images/photo3.jpg',
      caption: 'Nắm tay bé đi khắp thế gian',
      date: 'Hành trình đôi ta'
    }
  ];

  function getSavedMemories() {
    try {
      const raw = localStorage.getItem('romantic_gift_user_memories');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return DEFAULT_MEMORIES;
  }

  function saveMemories(memories) {
    try {
      localStorage.setItem('romantic_gift_user_memories', JSON.stringify(memories));
    } catch(e) {
      alert('Bộ nhớ trình duyệt đã đầy ảnh. Bạn có thể xóa bớt một vài ảnh cũ để lưu thêm nhé!');
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

  function handleFileSelected(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file ảnh hợp lệ (JPG, PNG, WebP...)');
      return;
    }

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
      if (previewImg) previewImg.src = '';
      if (memoryFileInput) memoryFileInput.value = '';
      if (uploadPreviewForm) uploadPreviewForm.style.display = 'none';
      if (dropzoneTrigger) dropzoneTrigger.style.display = 'block';
    });
  }

  if (btnSaveMemoryPhoto) {
    btnSaveMemoryPhoto.addEventListener('click', () => {
      if (!currentPendingImageData) return;
      sound.init();
      sound.playKeyClick();

      const caption = (memoryCaptionInput && memoryCaptionInput.value.trim()) || 'Khoảnh khắc đáng nhớ';
      let dateVal = memoryDateInput ? memoryDateInput.value : '';
      if (!dateVal) {
        const d = new Date();
        dateVal = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      } else {
        const parts = dateVal.split('-');
        if (parts.length === 3) dateVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const newMem = {
        id: 'mem_' + Date.now(),
        src: currentPendingImageData,
        caption: caption,
        date: dateVal
      };

      const memories = getSavedMemories();
      memories.unshift(newMem);
      saveMemories(memories);

      // Reset preview
      currentPendingImageData = null;
      if (previewImg) previewImg.src = '';
      if (memoryCaptionInput) memoryCaptionInput.value = '';
      if (memoryFileInput) memoryFileInput.value = '';
      if (uploadPreviewForm) uploadPreviewForm.style.display = 'none';
      if (dropzoneTrigger) dropzoneTrigger.style.display = 'block';

      sound.playSuccessChime();
      burstHeartsAt(window.innerWidth / 2, window.innerHeight / 2);
      renderMemoriesGrid();
      alert('Đã lưu bức ảnh vào kho kỷ niệm thành công! 📸✨');
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
          <img src="${mem.src}" alt="${escapeHTML(mem.caption)}" loading="lazy">
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
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bé có chắc muốn xóa bức ảnh này khỏi album kỷ niệm?')) {
          sound.init();
          sound.playKeyClick();
          memories.splice(index, 1);
          saveMemories(memories);
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
    lightboxImg.src = mem.src;
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

  // --- 11. TYPEWRITER LOVE LETTER MODAL ---
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

  function openSettings() {
    sound.init();
    sound.playKeyClick();
    if (inputGfName) inputGfName.value = userConfig.girlfriendName;
    if (inputBfName) inputBfName.value = userConfig.boyfriendName;
    if (inputPasscode) inputPasscode.value = userConfig.passcode;
    if (inputLetterBody) inputLetterBody.value = userConfig.letterBody;

    if (inputStartDate && userConfig.startDate) {
      try {
        const d = new Date(userConfig.startDate);
        const iso = d.toISOString().slice(0, 16);
        inputStartDate.value = iso;
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
      userConfig.startDate = new Date(inputStartDate.value).toISOString();
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
      displayNames.textContent = `${userConfig.boyfriendName} & ${userConfig.girlfriendName}`;
    }

    const certRecipient = document.getElementById('cert-recipient-name');
    if (certRecipient) {
      certRecipient.textContent = `${userConfig.girlfriendName || 'Huỳnh Ngọc Thắng'} !`;
    }

    const certIssuer = document.getElementById('cert-issuer-name');
    if (certIssuer) {
      certIssuer.textContent = userConfig.boyfriendName || 'N.T.B.N';
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

  // Initialize
  initAmbientParticles();
  applyConfigToUI();
  renderQuizQuestion();
  renderDiaryNotes();
  renderMemoriesGrid();

})();
