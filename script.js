document.addEventListener('DOMContentLoaded', () => {
  const countdownEl = document.getElementById('countdown');
  const splash = document.getElementById('splash');
  const bgVideo = document.getElementById('bg-video');
  const bgSrc = document.getElementById('bg-src');
  // تهيئة تحميل الفيديو مبكرًا لضمان ظهور الإطار الأول
  let metaReady = false;
  bgVideo.addEventListener('loadeddata', () => { metaReady = true; });
  bgVideo.addEventListener('canplay', () => { metaReady = true; });
  // تجهيز مبكر لتدفئة التحميل وتقليل التعليق
  let prepared = false;
  // عدادات التعثر ومصدر Blob الاحتياطي
  let stallCount = 0;
  let blobLoading = false;
  let blobUrl = null;
  // تشغيل الصوت تلقائياً بعد انتهاء الوقت بدون أي تفاعل

  // تأكد أن الفيديو متوقف ولا يبدأ قبل الوقت
  try { bgVideo.pause(); } catch (_) {}

  // يبدأ المؤقت من: 2024/12/07 23:59:55
  let y = 2024, m = 12, d = 7, hh = 23, mm = 59, ss = 55;

  const format = () => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${y}/${pad(m)}/${pad(d)} ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  // عرض القيمة الابتدائية
  countdownEl.textContent = format();

  const tick = () => {
    // رعشة كل ثانية
    countdownEl.classList.add('shake');
    setTimeout(() => countdownEl.classList.remove('shake'), 180);

    // زيادة ثانية مع حمل الوقت
    ss += 1;
    if (ss >= 60) { ss = 0; mm += 1; }
    if (mm >= 60) { mm = 0; hh += 1; }
    if (hh >= 24) { hh = 0; d += 1; }

    // تحديث النص
    countdownEl.textContent = format();

    // جهّز الفيديو قبل الموعد بثوانٍ (بدون إظهاره)
    if (!prepared && y === 2024 && m === 12 && d === 7 && hh === 23 && mm === 59 && ss >= 58) {
      try {
        bgVideo.setAttribute('playsinline', '');
        bgVideo.muted = true;
        bgVideo.volume = 0.8;
        bgVideo.preload = 'auto';
        bgVideo.src = 'bg.mp4';
        bgVideo.load();
        prepared = true;
      } catch (_) {}
    }

    // الوصول إلى اليوم التالي 2024/12/08 00:00:00
    if (y === 2024 && m === 12 && d === 8 && hh === 0 && mm === 0 && ss === 0) {
      countdownEl.textContent = '2024/12/08 00:00:00';
      countdownEl.classList.add('pulse-red');

      // بعد نبض قصير، تلاشي الشاشة وظهور الفيديو داكنًا
      setTimeout(async () => {
        splash.classList.add('fade-out');
        bgVideo.classList.add('visible');

        // تأكيد الإعدادات الأساسية ثم التشغيل المباشر
        bgVideo.setAttribute('playsinline', '');
        bgVideo.muted = true;
        bgVideo.volume = 0.8;
        if (!bgVideo.src) {
          bgVideo.preload = 'auto';
          bgVideo.src = 'bg.mp4';
          try { bgVideo.load(); } catch (_) {}
        }

        try {
          const p = bgVideo.play();
          if (p) await p;
          setTimeout(() => { bgVideo.muted = false; }, 800);
        } catch (_) {
          // إذا فشل التشغيل، حاول إظهار الإطار الأول
          try { if (metaReady) bgVideo.currentTime = 0.02; } catch (_) {}
        }

        // التعافي الذكي من التعثر/الانتظار مع تبديل إلى Blob عند تكرار التوقف
        const handleStall = async (evt) => {
          stallCount++;
          const tryResume = () => bgVideo.play().catch(() => {});
          tryResume();

          // محاولة خفيفة لتجاوز فجوة التخزين المؤقت
          setTimeout(() => {
            if (bgVideo.paused || bgVideo.readyState < 3) {
              try { bgVideo.currentTime = Math.max(0, bgVideo.currentTime + 0.05); } catch (_) {}
              tryResume();
            }
          }, 500);

          // إذا تكرر التعثر عدة مرات، بدّل إلى مصدر Blob بعد تنزيله بالكامل
          if (stallCount >= 3 && !blobLoading) {
            blobLoading = true;
            try {
              const resp = await fetch('bg.mp4', { cache: 'no-store' });
              if (!resp.ok) throw new Error('Blob fetch failed');
              const blob = await resp.blob();
              const t = bgVideo.currentTime;
              // حرر URL قديم إن وجد
              if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (_) {} }
              blobUrl = URL.createObjectURL(blob);
              bgVideo.src = blobUrl;
              try { bgVideo.load(); } catch (_) {}
              try { bgVideo.currentTime = t; } catch (_) {}
              tryResume();
              setTimeout(() => { bgVideo.muted = false; }, 800);
            } catch (_) {
              // فشل جلب Blob؛ استمر بمحاولات الاستئناف العادية
              tryResume();
            } finally {
              blobLoading = false;
            }
          }
        };

        bgVideo.addEventListener('waiting', handleStall);
        bgVideo.addEventListener('stalled', handleStall);
        bgVideo.addEventListener('suspend', handleStall);
        bgVideo.addEventListener('error', handleStall);
      }, 2500);

      // يمكن إنهاء المؤقت بعد بدء التلاشي
      clearInterval(timer);
    }
  };

  // بدء العدّ: 5 ثوانٍ حتى منتصف الليل
  const timer = setInterval(tick, 1000);

  // لا مستمعات ولا نقرات — تجربة تلقائية بالكامل حسب الإمكان
});
