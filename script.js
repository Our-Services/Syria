document.addEventListener('DOMContentLoaded', () => {
  const countdownEl = document.getElementById('countdown');
  const splash = document.getElementById('splash');
  const bgVideo = document.getElementById('bg-video');
  const audioHint = document.getElementById('audio-hint');

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

    // الوصول إلى اليوم التالي 2024/12/08 00:00:00
    if (y === 2024 && m === 12 && d === 8 && hh === 0 && mm === 0 && ss === 0) {
      countdownEl.textContent = '2024/12/08 00:00:00';
      countdownEl.classList.add('pulse-red');

      // بعد نبض قصير، تلاشي الشاشة وظهور الفيديو داكنًا
      setTimeout(async () => {
        splash.classList.add('fade-out');
        bgVideo.classList.add('visible');

        // محاولة تشغيل الصوت تلقائيًا (قد تُرفض بحسب سياسة المتصفح)
        try {
          bgVideo.muted = false;
          bgVideo.volume = 0.8;
          const p = bgVideo.play();
          if (p) await p;
        } catch (err) {
          // إذا فشل التشغيل بالصوت، إظهار تلميح بسيط لطلب نقرة في أي مكان
          if (audioHint) {
            audioHint.classList.remove('hidden');
            audioHint.classList.add('show');
          }
        }
      }, 2500);

      // يمكن إنهاء المؤقت بعد بدء التلاشي
      clearInterval(timer);
    }
  };

  // بدء العدّ: 5 ثوانٍ حتى منتصف الليل
  const timer = setInterval(tick, 1000);

  // بديل: أي نقرة في الصفحة تفعل الصوت إن كان محظورًا
  const enableAudio = async () => {
    try {
      bgVideo.muted = false;
      bgVideo.volume = 0.8;
      const p = bgVideo.play();
      if (p) await p;
      if (audioHint) {
        audioHint.classList.remove('show');
        audioHint.classList.add('hidden');
      }
      // إزالة المستمعات بعد التفعيل
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    } catch (_) {
      // إذا استمر الرفض، نبقي التلميح
    }
  };
  document.addEventListener('click', enableAudio);
  document.addEventListener('keydown', enableAudio);
  document.addEventListener('touchstart', enableAudio);
});