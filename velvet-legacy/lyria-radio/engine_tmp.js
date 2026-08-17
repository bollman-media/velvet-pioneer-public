// ═══════════════════════════════════════════════════════════════
//  LYRIA AUDIO ENGINE — Crossfade + Preload
//  Web Audio API GainNodes for 3-second crossfades between tracks.
//  Preloads track N+1 while N plays so transitions are instant.
// ═══════════════════════════════════════════════════════════════

let audioCtx = null;
const SLOTS = [
  { audio: null, source: null, gain: null, blobUrl: null },
  { audio: null, source: null, gain: null, blobUrl: null },
];
let activeSlot = 0;
let pendingBlobUrl = null;
let pendingIndex = -1;
let progressRAF = null;
const FADE_SECS = 3;

function ensureAudioCtx() {
  if (audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  SLOTS.forEach(slot => {
    slot.audio = new Audio();
    slot.audio.crossOrigin = 'anonymous';
    slot.audio.preload = 'auto';
    slot.source = audioCtx.createMediaElementSource(slot.audio);
    slot.gain   = audioCtx.createGain();
    slot.gain.gain.value = 0;
    slot.source.connect(slot.gain);
    slot.gain.connect(audioCtx.destination);
  });
  return audioCtx;
}

function b64toBlobUrl(b64) {
  const clean = b64.replace(/\s/g, '');
  const raw   = atob(clean);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
}

function clearSlot(slot) {
  try { if (slot.audio) { slot.audio.pause(); slot.audio.src = ''; } } catch(e) {}
  if (slot.blobUrl) { URL.revokeObjectURL(slot.blobUrl); slot.blobUrl = null; }
  if (slot.gain) slot.gain.gain.value = 0;
}

function crossfadeToSlot(nextIdx, blobUrl, onEnded) {
  const ctx  = ensureAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const cur  = SLOTS[activeSlot];
  const next = SLOTS[nextIdx];
  const now  = ctx.currentTime;

  if (next.blobUrl) URL.revokeObjectURL(next.blobUrl);
  next.blobUrl = blobUrl;
  next.audio.src = blobUrl;
  next.audio.load();

  next.audio.addEventListener('canplaythrough', () => {
    next.audio.play().catch(e => console.warn('[Crossfade] play():', e.message));
    next.gain.gain.cancelScheduledValues(now);
    next.gain.gain.setValueAtTime(0, now);
    next.gain.gain.linearRampToValueAtTime(1, now + FADE_SECS);
    if (cur.audio && !cur.audio.paused) {
      const curVal = cur.gain.gain.value;
      cur.gain.gain.cancelScheduledValues(now);
      cur.gain.gain.setValueAtTime(curVal, now);
      cur.gain.gain.linearRampToValueAtTime(0, now + FADE_SECS);
      setTimeout(() => clearSlot(cur), (FADE_SECS + 0.3) * 1000);
    }
    next.audio.addEventListener('ended', onEnded, { once: true });
    activeSlot = nextIdx;
    attachProgressToSlot(next);
  }, { once: true });

  next.audio.addEventListener('error', e => {
    console.error('[Audio] Slot error:', e.message || e);
  }, { once: true });
}

function attachProgressToSlot(slot) {
  if (progressRAF) cancelAnimationFrame(progressRAF);
  const audio = slot.audio;
  function tick() {
    if (!audio || audio.paused || audio.ended) return;
    const t = audio.currentTime || 0;
    const d = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : TRACK_DURATION;
    elapsed = t;
    const pct = Math.min(t / d * 100, 100);
    progressFill.style.width = pct + '%';
    currentTimeEl.textContent = fmt(t);
    totalTimeEl.textContent   = fmt(d);
    updateWaveform(pct / 100);
    if (d - t < 8 && pendingIndex !== currentIndex + 1) {
      preloadTrack(currentIndex + 1);
    }
    progressRAF = requestAnimationFrame(tick);
  }
  progressRAF = requestAnimationFrame(tick);
}

async function preloadTrack(idx) {
  if (idx < 0 || idx >= COMMUNITY_TRACKS.length) return;
  if (pendingIndex === idx && pendingBlobUrl) return;
  const track = COMMUNITY_TRACKS[idx];
  if (!track.audioData) {
    try {
      console.log(`[Preload] idx ${idx}: "${track.prompt.slice(0,40)}..."`);
      const res = await fetch('../api/generate-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: track.prompt, bpm: 90 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) { track.audioData = data.audio; console.log(`[Preload] OK idx ${idx}`); }
        else console.warn('[Preload] no audio field');
      }
    } catch(e) { console.warn('[Preload] failed idx', idx, e.message); }
  }
  if (track.audioData) {
    if (pendingBlobUrl) URL.revokeObjectURL(pendingBlobUrl);
    pendingBlobUrl = b64toBlobUrl(track.audioData);
    pendingIndex = idx;
    console.log(`[Preload] blob ready idx ${idx}`);
  }
}

async function playTrack(idx) {
  if (idx < 0 || idx >= COMMUNITY_TRACKS.length) return;
  currentIndex = idx;
  const track = COMMUNITY_TRACKS[idx];
  const nextSlot = 1 - activeSlot;

  npTitle.textContent    = track.title;
  npCreator.textContent  = track.name + '  \xB7  ' + track.creator;
  npAvatar.textContent   = track.avatar;
  npKicker.textContent   = '\u29D6 Composing with Lyria Realtime\u2026';
  document.getElementById('npArtwork').style.background = ART_GRADS[idx % 5];
  buildWaveform();
  document.getElementById('btnLike').classList.remove('is-liked');
  isLiked = false;
  elapsed = 0;
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  setPlayState(false);
  genState.classList.add('is-active');
  renderSidebar();
  scrollActiveIntoView();

  let blobUrl = null;
  if (pendingIndex === idx && pendingBlobUrl) {
    console.log('[Lyria] Using preloaded blob for idx', idx);
    blobUrl = pendingBlobUrl;
    pendingBlobUrl = null;
    pendingIndex = -1;
  } else {
    if (!track.audioData) {
      try {
        console.log(`[Lyria] Fetching idx ${idx}: "${track.prompt.slice(0,50)}..."`);
        const res = await fetch('../api/generate-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: track.prompt, bpm: 90 })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audio) {
            track.audioData = data.audio;
            console.log('[Lyria] Audio bytes:', data.audio.length);
          } else {
            console.warn('[Lyria] No audio field. Keys:', Object.keys(data));
          }
        } else {
          const txt = await res.text().catch(() => '');
          console.warn('[Lyria] HTTP', res.status, txt.slice(0, 200));
        }
      } catch(e) { console.warn('[Lyria] Fetch error:', e.message); }
    }
    if (track.audioData) blobUrl = b64toBlobUrl(track.audioData);
  }

  genState.classList.remove('is-active');
  npKicker.textContent = 'Now Playing \xB7 Track ' + (idx + 1) + ' of ' + COMMUNITY_TRACKS.length;
  setPlayState(true);

  if (blobUrl) {
    crossfadeToSlot(nextSlot, blobUrl, onTrackEnd);
  } else {
    console.log('[Audio] No audio available — fallback timer');
    startFallbackTimer(TRACK_DURATION);
  }
}

function startFallbackTimer(dur) {
  clearInterval(progressInterval);
  elapsed = 0;
  totalTimeEl.textContent = fmt(dur);
  progressInterval = setInterval(() => {
    elapsed++;
    const pct = Math.min(elapsed / dur * 100, 100);
    progressFill.style.width = pct + '%';
    currentTimeEl.textContent = fmt(elapsed);
    updateWaveform(pct / 100);
    if (elapsed >= dur) { clearInterval(progressInterval); onTrackEnd(); }
  }, 1000);
}

function onTrackEnd() {
  if ((currentIndex + 1) % 3 === 0) {
    showDjBreak(() => playTrack(currentIndex + 1));
  } else {
    playTrack(currentIndex + 1);
  }
}

function setPlayState(playing) {
  isPlaying = playing;
  playPauseIcon.textContent = playing ? 'pause' : 'play_arrow';
}
