document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const starter = document.getElementById('starter');
  const countdownEl = document.getElementById('countdown');
  const bgVideo = document.getElementById('bg-video');
  const siteHeader = document.querySelector('.site-header');

  // لا طلبات مبكرة للفيديو: سنضبط المصدر عند الموعد فقط
  let metaReady = false;
  bgVideo.addEventListener('loadeddata', () => { metaReady = true; });
  bgVideo.addEventListener('canplay', () => { metaReady = true; });
  try { bgVideo.pause(); } catch (_) {}

  // الموعد المستهدف: 2024/12/08 00:00:00 (وقت وهمي ثابت)
  const target = new Date(2024, 11, 8, 0, 0, 0); // شهر 11 = ديسمبر
  let triggered = false;
  let timer = null;
  // إعداد الصوت: نستخدم نقرة "ابدأ" كإيماءة مستخدم لفتح الصوت لاحقًا
  let soundAllowed = false;
  let audioCtx = null;
  let gainNode = null;
  let mediaSourceNode = null;
  // بداية العد الوهمي: 2024/12/07 23:59:55
  let fakeNow = new Date(2024, 11, 7, 23, 59, 55);

  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (dt) => `${dt.getFullYear()}/${pad(dt.getMonth()+1)}/${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;

  // ابدأ الساعة بعد النقر على "ابدأ"
  const startClock = () => {
    const update = () => {
      countdownEl.textContent = formatDate(fakeNow);
      // لا تبدأ الرجفة إلا بعد اكتمال ظهور الوقت
      if (countdownEl.classList.contains('show')) {
        countdownEl.classList.add('shake');
        setTimeout(() => countdownEl.classList.remove('shake'), 180);
      }

      // عند حلول/تجاوز الموعد، أظهر الفيديو وشغّله بتلاشي أبطأ
      if (!triggered && fakeNow.getTime() >= target.getTime()) {
        triggered = true;
        countdownEl.classList.add('pulse-red');
        setTimeout(async () => {
          splash.classList.add('fade-out');
          // انتظر قليلًا ليكتمل تلاشي السلاش قبل إظهار الفيديو
          setTimeout(() => {
            bgVideo.classList.add('visible');
            // أظهر الرأس بتلاشي بطيء بعد بدء الفيديو
            if (siteHeader) siteHeader.classList.add('show');
          }, 250);
          // اضبط المصدر الآن فقط لتجنب طلبات مبكرة
          bgVideo.setAttribute('playsinline', '');
          // إذا تمت الإيماءة (نقرة ابدأ)، أزل الكتم واجعل الصوت مفعّلًا
          bgVideo.muted = !soundAllowed;
          // اجعل مستوى الصوت الافتراضي مناسبًا؛ سنطبّق تلاشيًا عبر WebAudio إن أمكن
          bgVideo.volume = 0.85;
          bgVideo.src = 'bg.mp4';
          try { bgVideo.load(); } catch (_) {}
          try {
            const p = bgVideo.play();
            if (p) await p;
          } catch (_) {
            try { if (metaReady) bgVideo.currentTime = 0.02; } catch (_) {}
          }
          // إن كان الصوت مسموحًا، اربط الفيديو بـ WebAudio لعمل تلاشي صوت سلس
          if (soundAllowed) {
            try {
              if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              if (audioCtx.state === 'suspended') await audioCtx.resume();
              mediaSourceNode = audioCtx.createMediaElementSource(bgVideo);
              gainNode = audioCtx.createGain();
              // ابدأ بجين منخفض جدًا ثم ارفع تدريجيًا
              gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
              mediaSourceNode.connect(gainNode).connect(audioCtx.destination);
              // تلاشي تدريجي للصوت خلال ~2s
              gainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 2.0);
              bgVideo.muted = false;
            } catch (_) {
              // احتياطي: ارفع volume تدريجيًا بدون WebAudio
              let v = 0.0;
              const targetVol = 0.85;
              const step = targetVol / 20; // ~2s
              bgVideo.volume = 0.0;
              const iv = setInterval(() => {
                v = Math.min(targetVol, v + step);
                bgVideo.volume = v;
                if (v >= targetVol) clearInterval(iv);
              }, 100);
              bgVideo.muted = false;
            }
          }
          const tryResume = () => bgVideo.play().catch(() => {});
          bgVideo.addEventListener('waiting', tryResume);
          bgVideo.addEventListener('stalled', tryResume);
          bgVideo.addEventListener('suspend', tryResume);
          bgVideo.addEventListener('error', tryResume);
        }, 1000);
        if (timer) clearInterval(timer);
      }
    };
    update();
    timer = setInterval(() => {
      // زد ثانية واحدة كل نبضة
      fakeNow = new Date(fakeNow.getTime() + 1000);
      update();
    }, 1000);
  };

  // تدفق البدء: أنقر "ابدأ" لتلاشي النص ثم إظهار الساعة تدريجيًا والبدء
  starter.addEventListener('click', () => {
    starter.classList.add('fade-out');
    // مدة تلاشي الوقت في CSS: 1.8s، ابدأ العد بعد اكتمالها
    const COUNT_FADE_MS = 1800;
    setTimeout(() => {
      countdownEl.classList.add('show');
      setTimeout(() => {
        startClock();
      }, COUNT_FADE_MS + 120);
    }, 700);
    // افتح الصوت باستخدام إيماءة المستخدم الآن لتمكين تشغيل الصوت لاحقًا تلقائيًا
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume().then(() => { soundAllowed = true; }).catch(() => { soundAllowed = true; });
    } catch (_) {
      soundAllowed = true; // حتى لو تعذّر WebAudio، نستخدم رفع تدريجي للـ volume
    }
  });
});
