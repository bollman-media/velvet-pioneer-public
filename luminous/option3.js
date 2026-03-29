// Option 3 — Time Machine Immersive Gallery
// Elite Motion Systems Designer + Hyper-Opinionated Design Critic
// ─────────────────────────────────────────────────────────────────────────────
// Inspired by macOS Time Machine: a perspective-driven depth stack.
//
//   LAYER 0 (bg-stage z:0): Two blurry panels crossfade between image palettes.
//     Lerped opacity at 0.10 — cinematic 400ms settle after fast swipes.
//     Small Y-parallax between panels creates genuine depth perception.
//
//   LAYER 1 (card theater z:2): CSS-class driven card positions in 3D space.
//     is-deep-past — 2+ cards back. Tiny, far, invisible (translateZ:-600px).
//     is-prev      — previous image. 81% scale, translateZ:-280px, 52% brightness.
//                    Peeks just behind the hero. Communicates origin.
//     is-current   — hero. Full scale, full brightness, z:0. The focus image.
//     is-next      — staged below viewport (110% Y), ready to enter.
//     is-future    — 2+ cards ahead, even further below, invisible.
//     During gesture: inline transforms track finger in real-time (no CSS transition).
//     On release: CSS transition snaps to settled class positions (620ms spring).
//
//   LAYER 2 (action pill, position indicator z:30): Hides during gesture,
//     returns 1.2s after settling. Position indicator auto-hides.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
    'use strict';

    // ── DOM ───────────────────────────────────────────────────────────────────
    const shell2       = document.getElementById('phone-shell-option3');
    if (!shell2) return; // guard: option3 shell not in DOM

    const promptInput  = shell2.querySelector('.video-floating-input__textarea');
    const inputRow     = shell2.querySelector('.video-floating-input__input-row');
    const sendBtn      = shell2.querySelector('.video-floating-input__send-btn');
    const chatOverlay  = document.getElementById('lum3-chat-overlay');
    const chatHistory  = document.getElementById('lum3-chat-history');
    const immersive    = document.getElementById('lum3-immersive');
    const immClose     = document.getElementById('lum3-immersive-close');
    const theater      = document.getElementById('lum3-lens-container');
    const bgA          = document.getElementById('lum3-bg-a');
    const bgB          = document.getElementById('lum3-bg-b');
    const actionPill   = document.getElementById('lum3-action-pill');
    const posIndicator = document.getElementById('lum3-position-indicator');
    const promptLabel  = document.getElementById('lum3-prompt-label');
    const promptText   = document.getElementById('lum3-prompt-text');

    // ── State ─────────────────────────────────────────────────────────────────
    let imageHistory = [];   // { dataUrl, prompt }
    let cards        = [];   // { el }  — one per imageHistory entry
    let currentIdx   = 0;

    let selectedStyle = 'salon';

    // bg-stage lerped state
    let bgAIdx = -1, bgBIdx = -1;
    let bgAY = 0, bgBY = 0;
    let bgAOp = 1, bgBOp = 0;
    let bgFrom = 0, bgTo = 0, bgTProg = 0, bgProg = 0;

    // Gesture tracking
    let dragging     = false;
    let dragStartY   = 0;
    let dragDelta    = 0;

    // Pill / indicator timers
    let pillTimer = null, indTimer = null;

    // ── Clone Option 1 grid ───────────────────────────────────────────────────
    const opt1Grid      = document.querySelector('#lum-content .cards-grid');
    const opt2Container = shell2.querySelector('#lum3-cards-container');
    if (opt1Grid && opt2Container) {
        const old = opt2Container.querySelector('.cards-grid');
        if (old) old.replaceWith(opt1Grid.cloneNode(true));
    }
    const styleCards = shell2.querySelectorAll('.style-card');
    const opt2Scroll = document.getElementById('lum3-cards-container');
    if (opt2Scroll) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('cards-visible'); obs.unobserve(e.target); } });
        }, { root: opt2Scroll, threshold: 0.05 });
        styleCards.forEach(c => obs.observe(c));
    }
    styleCards.forEach(c => c.addEventListener('click', () => {
        selectedStyle = c.dataset.style || 'salon';
        styleCards.forEach(x => x.classList.remove('is-selected'));
        c.classList.add('is-selected');
    }));

    // ── Input ─────────────────────────────────────────────────────────────────
    if (promptInput) {
        promptInput.addEventListener('input', () => {
            inputRow && inputRow.classList.toggle('has-text', promptInput.value.trim().length > 0);
            promptInput.style.height = 'auto';
            promptInput.style.height = promptInput.scrollHeight + 'px';
        });
        promptInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn && sendBtn.click(); }
        });
        const fi = shell2.querySelector('.video-floating-input');
        if (fi) fi.addEventListener('click', e => { if (!e.target.closest('button')) promptInput.focus(); });
    }

    // ── Chat ──────────────────────────────────────────────────────────────────
    function appendChatLoading(prompt) {
        const t = document.createElement('div');
        t.className = 'lum3-chat-turn';
        t.innerHTML = `
            <div class="lum-chat-shimmer-label">Generating image...</div>
            <div class="lum-chat-shimmer-box">
                <div class="lum-chat-shimmer-mesh"></div>
            </div>`;
        // Apply aspect ratio from prompt to shimmer box immediately
        const shimmer = t.querySelector('.lum-chat-shimmer-box');
        if (shimmer && window.detectAspectRatioFromPrompt) {
            shimmer.style.aspectRatio = window.detectAspectRatioFromPrompt(prompt);
        }
        chatHistory.appendChild(t);
        scrollBottom();
        return t;
    }

    function appendChatImage(dataUrl, prompt, index) {
        const t = document.createElement('div');
        t.className = 'lum-chat-turn';
        t.innerHTML = `
            <div class="lum-chat-bubble">${prompt}</div>
            <div class="lum-chat-image-wrap" style="position:relative;max-width:370px;">
                <img src="${dataUrl}" alt="${prompt}" loading="lazy"/>
                <button class="lum3-expand-btn" aria-label="Expand" data-index="${index}">
                    <span class="material-symbols-outlined">fullscreen</span>
                </button>
            </div>`;
        chatHistory.appendChild(t);
        // Apply aspect ratio to wrap — prompt-based first, then refined on load
        const wrap = t.querySelector('.lum-chat-image-wrap');
        const img  = t.querySelector('.lum-chat-image-wrap img');
        if (wrap && window.applyImageAspectRatio) {
            window.applyImageAspectRatio(wrap, img, prompt);
        }
        scrollBottom();
        const btn  = t.querySelector('.lum3-expand-btn');
        const open = () => openImmersive(dataUrl, index);
        if (btn)  btn.addEventListener('click', open);
        if (wrap) wrap.addEventListener('click', e => { if (!btn.contains(e.target)) open(); });
    }

    function scrollBottom() {
        const el = document.getElementById('lum3-chat-scroll');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    // ── Card factory ──────────────────────────────────────────────────────────
    function buildCard(dataUrl, prompt) {
        const card = document.createElement('div');
        card.className = 'lum3-card';
        const vp = document.createElement('div');
        vp.className = 'lum3-card__viewport';
        const img = document.createElement('img');
        img.className = 'lum3-card__img';
        img.src = dataUrl;
        img.alt = prompt;
        img.draggable = false;
        vp.appendChild(img);
        card.appendChild(vp);
        theater.appendChild(card);
        const entry = { el: card };
        cards.push(entry);
        return entry;
    }

    function buildLoadingCard() {
        const card = document.createElement('div');
        card.className = 'lum3-card is-loading-card';
        // Create viewport wrapper for loading content (consistent with regular cards)
        const vp = document.createElement('div');
        vp.className = 'lum3-card__viewport';
        vp.innerHTML = `
            <div class="lum3-loading-content">
                <div class="lum3-loading-label-wrap">
                    <span class="lum3-loading-label">Generating image...</span>
                </div>
            </div>`;
        card.appendChild(vp);
        theater.appendChild(card);
        const entry = { el: card, isLoading: true };
        cards.push(entry);
        return entry;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HORIZONTAL FILM-STRIP SCRUB ENGINE
    // ─────────────────────────────────────────────────────────────────────────
    // Inspired by the spatial continuity of iOS Photos and Apple TV+ trailers.
    // Images sit side-by-side on a horizontal X-axis track.
    //
    // Convention: index 0 = oldest / leftmost. Swiping LEFT reveals NEWER images
    // (higher index). Swiping RIGHT reveals OLDER images (lower index).
    // This matches every photo app convention the user has ever used.
    //
    // Per-card transform breakdown (dist = i − currentDepth):
    //   dist = 0   → hero. Full scale (1.0), full opacity, centered.
    //   dist = ±1  → adjacent. 90% scale, 60% opacity, ±8px X offset.
    //                Peeks just beyond the hero's edge — spatial invitation.
    //   |dist| = 2 → near-invisible. 80% scale, 0 opacity. Staged & ready.
    //   |dist| > 2 → hidden (opacity 0, no transform needed).
    //
    // During drag:  targetDepth changes continuously. currentDepth follows
    //               via a 0.14 lerp factor in the RAF loop (physical friction).
    // On release:   targetDepth snaps to nearest integer. The lerp settles it
    //               with a natural deceleration arc.
    // ══════════════════════════════════════════════════════════════════════════

    let targetDepth = 0;
    let currentDepth = 0;

    // Reference to DOM dot scrubber (nullable — only exists when html has it)
    const dotsEl = document.getElementById('lum3-dots');

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Dot scrubber: shows position + implicit swipe affordance ────────────
    // Called whenever imageHistory changes or currentDepth settles.
    function updateDots() {
        if (!dotsEl) return;
        const count = imageHistory.length;
        if (count < 2) { dotsEl.style.opacity = '0'; return; }

        // Rebuild dots only when count changes (avoids thrashing the DOM)
        if (dotsEl.childElementCount !== count) {
            dotsEl.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const d = document.createElement('span');
                d.className = 'lum3-dot';
                dotsEl.appendChild(d);
            }
        }

        const dots = dotsEl.querySelectorAll('.lum3-dot');
        const active = Math.round(currentDepth);
        dots.forEach((d, i) => {
            // Scale and opacity encode distance — active dot is largest+brightest
            const dist = Math.abs(i - currentDepth);
            const s = Math.max(0.5, 1 - dist * 0.3);
            const o = Math.max(0.25, 1 - dist * 0.45);
            d.style.transform = `scale(${s.toFixed(3)})`;
            d.style.opacity   = o.toFixed(3);
            d.style.background = i === active ? '#fff' : 'rgba(255,255,255,0.5)';
        });
        dotsEl.style.opacity = '1';
    }

    // ── renderCards: the single source of truth for all visual state ─────────
    function renderCards() {
        if (!cards.length) return;

        // Sync integer index + bg crossfade
        const newIdx = Math.round(currentDepth);
        if (newIdx !== currentIdx) {
            const oldIdx = currentIdx;
            currentIdx = newIdx;
            // Background crossfade: A holds old, B holds new, blend over ~400ms
            bgFrom = oldIdx; bgTo = newIdx; bgTProg = 1;
            if (bgA && imageHistory[oldIdx]) {
                bgA.style.backgroundImage = `url('${imageHistory[oldIdx].dataUrl}')`;
                bgAIdx = oldIdx;
            }
            if (bgB && imageHistory[newIdx]) {
                bgB.style.backgroundImage = `url('${imageHistory[newIdx].dataUrl}')`;
                bgBIdx = newIdx;
            }
            updatePositionIndicator();
            animatePromptTransition(oldIdx, newIdx);
        }

        const theaterW = theater.clientWidth || 390;

        cards.forEach((entry, i) => {
            const el   = entry.el;
            const dist = i - currentDepth; // signed horizontal distance
            const absDist = Math.abs(dist);

            // ── Hide cards too far away (saves GPU) ─────────────────────────
            if (absDist > 2.5) {
                el.style.opacity   = '0';
                el.style.transform = `translateX(${dist > 0 ? 110 : -110}%) scale(0.8)`;
                el.style.filter    = '';
                el.style.clipPath  = '';
                el.style.zIndex    = '0';
                el.style.pointerEvents = 'none';
                el.style.transition = 'none';
                return;
            }

            el.style.transition = 'none'; // RAF drives all motion — no CSS transitions

            // ── Per-card spatial transform ───────────────────────────────────
            // translateX: card sits at dist * 100% + side-gap for peek-through
            // Scale: hero is 1.0, adjacents are 0.9, near-invisible are 0.8
            // Opacity: hero 1.0, adjacent 0.65, further 0
            // Filter: adjacents have a subtle darkening to accentuate hero

            // Clamp t to [0, 1] for smooth interpolation at boundaries
            const t      = Math.min(absDist, 1);         // 0 = hero, 1 = adjacent
            const t2     = Math.max(0, Math.min(absDist - 1, 1)); // 0-1 for dist 1→2

            // X position: cards spread along track, small gap creates peek-effect
            // 94% leaves a slice of adjacent visible on each edge
            const xPct   = dist * 94;

            // Scale: 1.0 at hero → 0.90 at adjacent → 0.80 at near-invisible
            const scale  = absDist < 1
                ? lerp(1.0, 0.90, t)
                : lerp(0.90, 0.80, t2);

            // Opacity: 1 → 0.65 → 0
            const opacity = absDist < 1
                ? lerp(1.0, 0.65, t)
                : lerp(0.65, 0.0, t2);

            // Brightness: hero is at full, adjacents dimmed slightly
            const bright = lerp(1.0, 0.65, Math.min(absDist, 1));
            
            // Cinematic Depth of Field: center is sharp, adjacents (and mid-swipe) blur beautifully
            const blurPx = lerp(0, 16, Math.min(absDist, 1));

            el.style.transform    = `translateX(${xPct.toFixed(2)}%) scale(${scale.toFixed(4)})`;
            el.style.opacity      = opacity.toFixed(4);
            el.style.filter       = `brightness(${bright.toFixed(3)}) blur(${blurPx.toFixed(1)}px)`;
            el.style.clipPath     = '';
            el.style.zIndex       = String(20 - Math.round(absDist * 5));
            el.style.pointerEvents = (absDist < 0.1 && immersive.classList.contains('is-active'))
                ? 'auto' : 'none';
        });

        updateDots();
    }

    // ── layoutCards: instant snap (no animation), used on open ──────────────
    function layoutCards(targetIdx) {
        targetDepth  = targetIdx;
        currentDepth = targetIdx;
        currentIdx   = targetIdx;
        renderCards();
    }

    // ── navigateTo: animated snap to an integer depth ───────────────────────
    function navigateTo(newIdx, instant) {
        if (newIdx < 0 || newIdx >= cards.length) return;
        targetDepth = newIdx;
        if (instant) {
            currentDepth = newIdx;
            renderCards();
        }
        hidePill();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GESTURE SYSTEM — Horizontal Swipe (X-axis)
    // ─────────────────────────────────────────────────────────────────────────
    // Decoupled from vertical close gesture.
    // Touch: horizontal X delta drives targetDepth.
    // Mouse: horizontal drag on theater.
    // Wheel: deltaX (trackpad horizontal) or deltaY (mouse wheel scroll = time).
    //
    // Velocity-aware snap on release.
    // ══════════════════════════════════════════════════════════════════════════

    const TAP_MAX_MOVE = 12;   // px — max movement still counted as a tap
    const TAP_MAX_TIME = 280;  // ms
    const SWIPE_COMMIT = 0.3;  // fraction of card width → commit navigation early
    const VELOCITY_COMMIT = 0.4; // px/ms → fast flick commits regardless of distance

    let dragStartTime   = 0;
    let dragStartX      = 0;   // initial clientX for tap detection
    let dragTotalDeltaX = 0;   // accumulated |dx| for tap threshold
    let dragVelX        = 0;   // instantaneous velocity (px/ms)
    let dragLastX       = 0;
    let dragLastT       = 0;

    function handleDragStart(clientX) {
        dragging        = true;
        dragStartX      = clientX;
        dragStartY      = clientX; // reuse dragStartY as drag origin for delta calc
        dragTotalDeltaX = 0;
        dragStartTime   = Date.now();
        dragVelX        = 0;
        dragLastX       = clientX;
        dragLastT       = Date.now();
        hidePill();
    }

    function handleDragMove(clientX) {
        if (!dragging) return;

        const dx = clientX - dragLastX;
        const dt = Date.now() - dragLastT || 1;
        dragVelX  = dx / dt;             // px/ms
        dragLastX = clientX;
        dragLastT = Date.now();
        dragTotalDeltaX += Math.abs(dx);

        const theaterW = theater.clientWidth || 390;
        // Swipe RIGHT (dx > 0) → go to OLDER image (lower index = -depthStep)
        // Swipe LEFT  (dx < 0) → go to NEWER image (higher index = +depthStep)
        const depthStep = -(dx / theaterW) * 1.3;
        targetDepth += depthStep;

        // Rubber-band at boundaries
        if (targetDepth < 0) {
            const over = -targetDepth;
            targetDepth = -Math.pow(over, 0.5) * 0.15;
        }
        if (targetDepth > cards.length - 1) {
            const over = targetDepth - (cards.length - 1);
            targetDepth = cards.length - 1 + Math.pow(over, 0.5) * 0.15;
        }
    }

    function handleDragEnd() {
        if (!dragging) return;
        dragging = false;

        const elapsed = Math.max(Date.now() - dragStartTime, 1);
        const isTap   = dragTotalDeltaX < TAP_MAX_MOVE && elapsed < TAP_MAX_TIME;

        if (isTap) {
            // Tap on left 40% → go back. Right 60% → go forward.
            if (cards.length > 1) {
                const theaterRect = theater.getBoundingClientRect();
                const tapFracX    = (dragStartX - theaterRect.left) / theaterRect.width;
                if (tapFracX < 0.4 && currentIdx > 0) {
                    targetDepth = currentIdx - 1;
                } else if (tapFracX >= 0.4 && currentIdx < cards.length - 1) {
                    targetDepth = currentIdx + 1;
                } else {
                    targetDepth = currentIdx; // boundary tap: no-op
                }
            }
            showPillDelayed();
            return;
        }

        // Velocity-based early commit: fast flick commits instantly
        const absVel = Math.abs(dragVelX);
        if (absVel > VELOCITY_COMMIT) {
            // dragVelX < 0 (left swipe) → newer (higher index)
            targetDepth = dragVelX < 0
                ? Math.min(cards.length - 1, currentIdx + 1)
                : Math.max(0, currentIdx - 1);
        } else {
            // Distance-based commit: if pulled > SWIPE_COMMIT of card width, commit
            const drift = targetDepth - currentIdx;
            if (Math.abs(drift) >= SWIPE_COMMIT) {
                targetDepth = drift > 0
                    ? Math.min(cards.length - 1, currentIdx + 1)
                    : Math.max(0, currentIdx - 1);
            } else {
                targetDepth = currentIdx; // not enough — snap back
            }
        }

        showPillDelayed();
    }

    // ── Touch handlers (horizontal X-axis) ──────────────────────────────────
    theater && theater.addEventListener('touchstart', e => {
        handleDragStart(e.touches[0].clientX);
    }, { passive: true });

    theater && theater.addEventListener('touchmove', e => {
        // Only intercept predominantly-horizontal gestures.
        // If the user is clearly swiping down (vertical), let the close-swipe
        // gesture handle it — don't fight both axes.
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - dragStartX);
        const dy = Math.abs(touch.clientY - dragStartX); // dragStartX is still the X origin
        if (dragging && dx > dy) {
            // horizontal dominant — intercept and drive depth
            handleDragMove(touch.clientX);
        } else if (!dragging) {
            // Not yet locked — let parent decide
        }
    }, { passive: true });

    theater && theater.addEventListener('touchend', () => handleDragEnd());
    theater && theater.addEventListener('touchcancel', () => handleDragEnd());

    // ── Mouse drag handlers (desktop horizontal) ─────────────────────────────
    theater && theater.addEventListener('mousedown', e => {
        e.preventDefault();
        handleDragStart(e.clientX);
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        handleDragMove(e.clientX);
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        handleDragEnd();
    });

    // ── Mouse wheel / trackpad scrub ─────────────────────────────────────────
    // Trackpads send both deltaX (two-finger swipe) and deltaY.
    // We honour deltaX for horizontal trackpad swipes (natural photo browsing).
    // deltaY from a mouse scroll wheel also navigates (like iOS Photos pinch).
    // Sensitivity: ~300px of scroll = 1 card width.
    let wheelEndTimer = null;
    theater && theater.addEventListener('wheel', e => {
        e.preventDefault();

        const theaterW = theater.clientWidth || 390;
        // Prefer deltaX (trackpad horizontal swipe). Fall back to deltaY.
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        // LEFT swipe (positive deltaX) or scroll DOWN (positive deltaY) → newer (higher index)
        const depthStep = raw / theaterW * 1.2;
        targetDepth += depthStep;

        // Rubber-band at boundaries
        if (targetDepth < -0.15) targetDepth = -0.15;
        if (targetDepth > cards.length - 1 + 0.15) targetDepth = cards.length - 1 + 0.15;

        clearTimeout(wheelEndTimer);
        wheelEndTimer = setTimeout(() => {
            targetDepth = Math.round(targetDepth);
            if (targetDepth < 0) targetDepth = 0;
            if (targetDepth > cards.length - 1) targetDepth = cards.length - 1;
            showPillDelayed();
        }, 150);

        hidePill();
    }, { passive: false });




    // ── Background crossfade ──────────────────────────────────────────────────
    function updateBgCrossfade() {
        if (imageHistory.length === 0) return;

        bgProg += (bgTProg - bgProg) * 0.10; // ~400ms settle

        const fromEntry = imageHistory[bgFrom];
        const toEntry   = imageHistory[bgTo];

        if (bgAIdx !== bgFrom && fromEntry) {
            bgA.style.backgroundImage = `url('${fromEntry.dataUrl}')`;
            bgAIdx = bgFrom;
        }
        if (bgTo !== bgFrom && bgBIdx !== bgTo && toEntry) {
            bgB.style.backgroundImage = `url('${toEntry.dataUrl}')`;
            bgBIdx = bgTo;
        }

        if (!toEntry) {
            // Target is a loading card without an image yet.
            // Hold the previous background solid (don't crossfade to empty/black).
            bgAOp = 1;
            bgBOp = 0;
            // Freeze progression so it doesn't animate out
            bgProg = 0;
            bgTProg = 0;
        } else {
            bgAOp = 1 - bgProg;
            bgBOp = bgTo !== bgFrom ? bgProg : 0;
        }

        bgA.style.opacity = bgAOp.toFixed(3);
        bgB.style.opacity = bgBOp.toFixed(3);

        // Y-parallax: A rises as it exits, B rises into position from below
        const move = 36; // px
        bgAY += (bgProg * -move - bgAY) * 0.12;
        bgBY += ((1 - bgProg) * move - bgBY) * 0.12;
        bgA.style.translate = '0 ' + bgAY.toFixed(1) + 'px';
        bgB.style.translate = '0 ' + bgBY.toFixed(1) + 'px';
    }

    function animationLoop() {
        requestAnimationFrame(animationLoop);
        // Smooth lerp currentDepth → targetDepth (0.14 = ~300ms settle at 60fps)
        // Guard: only run renderCards when there's visible movement left
        if (Math.abs(currentDepth - targetDepth) > 0.0005) {
            currentDepth += (targetDepth - currentDepth) * 0.14;
            renderCards();
            // Check discovery state as depth approaches a new card
            if (Math.abs(currentDepth - targetDepth) < 0.03) {
                if (window._lum3CheckDiscovery) window._lum3CheckDiscovery();
            }
        }
        updateBgCrossfade();
    }
    animationLoop();

    // ── Action pill + indicator ────────────────────────────────────────────────
    function hidePill() {
        if (actionPill) actionPill.style.opacity = '0';
        hidePrompt();   // prompt hides with the pill during gesture
        clearTimeout(pillTimer);
        pillTimer = setTimeout(showPillDelayed, 1200);
    }

    function showPillDelayed() {
        if (window._lum3CheckDiscovery) window._lum3CheckDiscovery();
        if (actionPill) actionPill.style.opacity = '1';
        showPromptForCurrentIdx();   // prompt re-emerges with the pill
    }

    function updatePositionIndicator() {
        if (!posIndicator || imageHistory.length < 2) return;
        posIndicator.textContent = `${currentIdx + 1}\u2009/\u2009${imageHistory.length}`;
        posIndicator.style.opacity = '0';
        // Force a reflow to restart the transition on rapid index changes
        void posIndicator.offsetWidth;
        posIndicator.classList.add('is-visible');
        clearTimeout(indTimer);
        indTimer = setTimeout(() => { posIndicator.classList.remove('is-visible'); }, 2200);
        if (window._lum3CheckDiscovery) window._lum3CheckDiscovery();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PROMPT LABEL MOTION SYSTEM (SovereignMotionArchitect tokens)
    //
    // Motion tokens (in ms):
    //   exit  : 160ms, cubic-bezier(0.4, 0, 1, 1)    — accelerate out (fast exit)
    //   enter : 320ms, cubic-bezier(0.0, 0, 0.2, 1)  — decelerate in (soft arrive)
    //   gap   : 60ms stagger between exit start and content swap
    //
    // Directional continuity:
    //   newIdx > oldIdx (swipe left / newer) → exit LEFT, enter from RIGHT
    //   newIdx < oldIdx (swipe right / older) → exit RIGHT, enter from LEFT
    //
    // This is pure transform+opacity — GPU-only, no layout reflows.
    // ──────────────────────────────────────────────────────────────────────────
    let promptAnimTimer = null;
    let lastPromptIdx   = -1;         // tracks which prompt is currently shown

    const PROMPT_EXIT_DUR  = 160;    // ms — accelerate out
    const PROMPT_ENTER_DUR = 320;    // ms — decelerate in
    const PROMPT_EXIT_EASE = 'cubic-bezier(0.4, 0.0, 1, 1)';
    const PROMPT_ENTER_EASE = 'cubic-bezier(0.0, 0.0, 0.2, 1)';
    const PROMPT_TRAVEL_PX = 22;     // px — small offset for spatial continuity

    function setPromptTransform(tx, opacity, durationMs, ease) {
        if (!promptLabel) return;
        promptLabel.style.transition = durationMs === 0
            ? 'none'
            : `opacity ${durationMs}ms ${ease}, transform ${durationMs}ms ${ease}`;
        promptLabel.style.opacity   = String(opacity);
        promptLabel.style.transform = `translateX(${tx}px)`;
    }

    // Called when currentIdx settles to a new integer — direction = newIdx - oldIdx.
    function animatePromptTransition(oldIdx, newIdx) {
        if (!promptLabel || !promptText) return;
        clearTimeout(promptAnimTimer);

        const entry = imageHistory[newIdx];
        const hasContent = entry && entry.prompt;
        const direction  = newIdx > oldIdx ? 1 : -1; // 1 = newer, -1 = older
        const exitDir    = -direction;                // text exits toward swipe direction
        const enterFrom  =  direction;                // new text arrives from opposite

        // ── 1. Snap to current exit position (no transition) ─────────────────
        setPromptTransform(0, 1, 0, '');

        if (lastPromptIdx === -1 || !hasContent) {
            // No previous prompt shown — just update and fade in
            if (hasContent) {
                promptText.textContent = entry.prompt;
                // Skip exit, go straight to enter
                setPromptTransform(PROMPT_TRAVEL_PX * enterFrom, 0, 0, '');
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    setPromptTransform(0, 1, PROMPT_ENTER_DUR, PROMPT_ENTER_EASE);
                }));
            } else {
                setPromptTransform(0, 0, 0, '');
            }
            lastPromptIdx = newIdx;
            return;
        }

        // ── 2. Exit: current prompt accelerates out in swipe direction ────────
        // Use requestAnimationFrame to ensure the snap (step 1) is painted first
        requestAnimationFrame(() => {
            setPromptTransform(
                PROMPT_TRAVEL_PX * exitDir,  // exit translation
                0,                           // fade to invisible
                PROMPT_EXIT_DUR,
                PROMPT_EXIT_EASE
            );
        });

        // ── 3. After exit begins: swap content + enter from opposite side ─────
        promptAnimTimer = setTimeout(() => {
            if (!hasContent) {
                lastPromptIdx = newIdx;
                return;
            }
            promptText.textContent = entry.prompt;

            // Instantly reposition to enter origin (opposite side, invisible)
            setPromptTransform(PROMPT_TRAVEL_PX * enterFrom, 0, 0, '');

            // Two-frame trick: guarantees browser sees the snapped state before
            // starting the enter transition (avoids transition-skip bug)
            requestAnimationFrame(() => requestAnimationFrame(() => {
                setPromptTransform(0, 1, PROMPT_ENTER_DUR, PROMPT_ENTER_EASE);
            }));

            lastPromptIdx = newIdx;
        }, PROMPT_EXIT_DUR * 0.6); // Enter begins mid-exit (overlapping motion = cinematic)
    }

    // Initial show or refresh without direction (on open, pill reveal, etc.)
    function showPromptForCurrentIdx() {
        if (!promptLabel || !promptText) return;
        const entry = imageHistory[currentIdx];
        if (!entry || !entry.prompt) {
            setPromptTransform(0, 0, PROMPT_EXIT_DUR, PROMPT_EXIT_EASE);
            return;
        }
        // Only update text if this is a different image
        if (currentIdx !== lastPromptIdx) {
            promptText.textContent = entry.prompt;
            lastPromptIdx = currentIdx;
        }
        // Fade in from slightly below if starting fresh, else just ensure visible
        setPromptTransform(0, 1, PROMPT_ENTER_DUR, PROMPT_ENTER_EASE);
    }

    function hidePrompt() {
        if (!promptLabel) return;
        clearTimeout(promptAnimTimer);
        setPromptTransform(0, 0, PROMPT_EXIT_DUR, PROMPT_EXIT_EASE);
    }

    // Legacy alias used by pill / open hooks below
    function updatePromptLabel() { showPromptForCurrentIdx(); }

    // ── Immersive open / close ────────────────────────────────────────────────
    const outsideGestureBar = shell2.querySelector('.video-gesture-bar');
    const floatingInput2    = shell2.querySelector('#lum3-floating-input');
    const appShell2         = shell2.querySelector('.app-shell');
    const phoneContent2     = shell2.querySelector('.phone-content');

    function openImmersive(dataUrl, index) {
        // Reset any stale drag state from a previous session
        dragging   = false;
        dragDelta  = 0;
        closeActive = false;

        // Clear any stale inline styles on immersive itself
        // (swipe-to-close can leave translateY stuck as inline override)
        immersive.style.transform  = '';
        immersive.style.transition = '';

        immersive.classList.remove('is-closing');  // clear if mid-close
        immersive.classList.add('is-active');

        // ── Fix 1: hide ALL underlying content INSTANTLY before immersive fades in
        // The immersive fades from transparent → opaque over 300ms. During this
        // window, the chat overlay, style-picker grid, and toolbar are all visible
        // through the semi-transparent overlay, causing a "ghost" effect where two
        // UI contexts are simultaneously readable. We kill their opacity to zero
        // BEFORE adding is-active so the first frame is already clean.
        if (chatOverlay) chatOverlay.style.opacity = '0';
        if (opt2Container) opt2Container.style.opacity = '0';
        const toolbar3 = shell2.querySelector('.toolbar');
        if (toolbar3) toolbar3.style.opacity = '0';

        const sys = shell2.querySelector('.sys-ui');
        if (sys) sys.classList.remove('theme-white-text');
        if (floatingInput2) { floatingInput2.style.zIndex = '150'; floatingInput2.classList.add('is-immersive-mode'); }
        if (outsideGestureBar) outsideGestureBar.style.visibility = 'hidden';
        const kb = appShell2 && appShell2.querySelector(':scope > [data-sim-kb]');
        if (kb) kb.style.zIndex = '160';
        if (phoneContent2) phoneContent2.scrollTop = 0;

        // Jump to the correct card instantly — suppress transitions, layout, re-enable
        currentIdx = index;
        cards.forEach(entry => {
            entry.el.style.transition = 'none';
            entry.el.classList.remove('is-dragging');
        });
        layoutCards(index);
        // Force reflow so 'none' takes effect before we re-enable
        void theater.offsetHeight;
        requestAnimationFrame(() => {
            cards.forEach(entry => { entry.el.style.transition = ''; });
        });

        // Seed bg-stage
        bgFrom = index; bgTo = index; bgProg = 0; bgTProg = 0;
        bgAIdx = -1; bgBIdx = -1; bgAY = 0; bgBY = 0;
        if (imageHistory[index]) {
            bgA.style.backgroundImage = `url('${imageHistory[index].dataUrl}')`;
            bgA.style.opacity = '1'; bgAIdx = index;
        }
        bgB.style.opacity = '0';
        updatePositionIndicator();
        updatePromptLabel();
    }

    function closeImmersive() {
        // ── Reset all interaction state ──────────────────────────────────
        dragging    = false;
        dragDelta   = 0;
        closeActive = false;

        // Reset prompt motion state so next open plays a clean enter
        lastPromptIdx = -1;
        hidePrompt();

        // Clear any stale inline transform/transition on immersive itself
        // (e.g. from a swipe-down-to-close gesture)
        immersive.style.transform  = '';
        immersive.style.transition = '';

        // Clean up card inline styles so re-open starts fresh
        cards.forEach(entry => {
            entry.el.style.transform  = '';
            entry.el.style.opacity    = '';
            entry.el.style.filter     = '';
            entry.el.style.transition = '';
            entry.el.classList.remove('is-dragging');
        });

        // ── Animate out ──────────────────────────────────────────────────
        immersive.classList.add('is-closing');
        requestAnimationFrame(() => immersive.classList.remove('is-active'));
        setTimeout(() => {
            if (floatingInput2) { floatingInput2.style.zIndex = ''; floatingInput2.classList.remove('is-immersive-mode'); }
            if (outsideGestureBar) outsideGestureBar.style.visibility = '';
            const kb = appShell2 && appShell2.querySelector(':scope > [data-sim-kb]');
            if (kb) kb.style.zIndex = '';
            if (phoneContent2) phoneContent2.scrollTop = 0;
            immersive.classList.remove('is-closing');
            // Restore all underlying content AFTER immersive has faded out.
            // These were zeroed on open to prevent ghosting during the 300ms enter.
            if (chatOverlay) chatOverlay.style.opacity = '';
            if (opt2Container) opt2Container.style.opacity = '';
            const tb = shell2.querySelector('.toolbar');
            if (tb) tb.style.opacity = '';
        }, 300);
    }

    if (immClose) immClose.addEventListener('click', closeImmersive);

    // Swipe-down to close (when on first card)
    let closeStartY = 0, closeActive = false;
    immersive && immersive.addEventListener('touchstart', e => {
        closeStartY = e.touches[0].clientY;
        closeActive = false;
    }, { passive: true });
    immersive && immersive.addEventListener('touchmove', e => {
        if (currentIdx !== 0 || dragging) return;
        const dy = e.touches[0].clientY - closeStartY;
        if (dy > 20) {
            closeActive = true;
            const pull = Math.min(dy * 0.55, 180);
            immersive.style.transition = 'none';
            immersive.style.transform  = `translateY(${pull.toFixed(0)}px)`;
        }
    }, { passive: true });
    immersive && immersive.addEventListener('touchend', e => {
        if (!closeActive) return;
        closeActive = false;
        const dy     = e.changedTouches[0].clientY - closeStartY;
        const easing = dy > 90 ? 'cubic-bezier(0.4,0,1,1)' : 'cubic-bezier(0.2,0.8,0.2,1)';
        immersive.style.transition = `transform 340ms ${easing}`;
        immersive.style.transform  = dy > 90 ? 'translateY(105%)' : 'translateY(0)';
        if (dy > 90) {
            setTimeout(() => { closeImmersive(); immersive.style.transform = ''; immersive.style.transition = ''; }, 340);
        } else {
            setTimeout(() => { immersive.style.transform = ''; immersive.style.transition = ''; }, 340);
        }
    });

    // ── Generation flow ───────────────────────────────────────────────────────
    const generateFashionImage = (...args) => window.generateFashionImage(...args);

    function startGenerationFlow(prompt, style) {
        if (window.dismissKeyboard) window.dismissKeyboard();
        promptInput.value = '';
        promptInput.style.height = 'auto';
        if (inputRow) inputRow.classList.remove('has-text');
        chatOverlay.classList.add('is-active');
        const loadTurn = appendChatLoading(prompt);

        generateFashionImage(prompt, style, new AbortController().signal)
            .then(dataUrl => {
                loadTurn.remove();
                if (!dataUrl) return;
                imageHistory.push({ dataUrl, prompt });
                const idx = imageHistory.length - 1;
                buildCard(dataUrl, prompt);
                appendChatImage(dataUrl, prompt, idx);
                updatePositionIndicator();
                if (window._lum3OnCardBuilt) window._lum3OnCardBuilt();
            })
            .catch(err => { loadTurn.remove(); console.error('[Luminous Opt2]', err); });
    }

    // Override for in-immersive generation
    const wrappedFlow = function (prompt, style) {
        if (immersive.classList.contains('is-active')) {
            if (window.dismissKeyboard) window.dismissKeyboard();
            promptInput.value = '';
            promptInput.style.height = 'auto';
            if (inputRow) inputRow.classList.remove('has-text');

            const newIdx    = cards.length;
            const loadEntry = buildLoadingCard();

            // Position the loading card as current, push existing current to prev
            navigateTo(newIdx, false);

            const loadTurn = appendChatLoading(prompt);
            generateFashionImage(prompt, style, new AbortController().signal)
                .then(dataUrl => {
                    loadTurn.remove();
                    if (!dataUrl) { loadEntry.el.remove(); cards.pop(); return; }
                    imageHistory.push({ dataUrl, prompt });
                    const idx = imageHistory.length - 1;

                    // Replace loading card content with real image
                    loadEntry.el.classList.remove('is-loading-card');
                    loadEntry.el.innerHTML = '';
                    const vp = document.createElement('div');
                    vp.className = 'lum3-card__viewport';
                    const img = document.createElement('img');
                    img.className = 'lum3-card__img';
                    img.src = dataUrl;
                    img.alt = prompt;
                    img.draggable = false;
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 600ms cubic-bezier(0.0,0.0,0.2,1)';
                    vp.appendChild(img);
                    loadEntry.el.appendChild(vp);
                    requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; }));

                    // Update bg for new settled card
                    bgFrom = currentIdx; bgTo = currentIdx; bgProg = 0; bgTProg = 0;
                    if (bgA) { bgA.style.backgroundImage = `url('${dataUrl}')`; bgA.style.opacity = '1'; bgAIdx = idx; }
                    if (bgB) bgB.style.opacity = '0';
                    appendChatImage(dataUrl, prompt, idx);
                    updatePositionIndicator();
                    if (window._lum3OnCardBuilt) window._lum3OnCardBuilt();
                })
                .catch(err => {
                    loadEntry.el.remove(); cards.splice(newIdx, 1);
                    loadTurn.remove();
                    navigateTo(Math.max(0, newIdx - 1), false);
                    console.error('[Luminous Opt2 Immersive]', err);
                });
        } else {
            startGenerationFlow(prompt, style);
        }
    };

    // Expose wrapped flow globally so sendBtn works in both modes
    if (sendBtn) {
        sendBtn.removeEventListener('click', sendBtn._lum2Handler);
        sendBtn._lum2Handler = () => {
            const p = promptInput && promptInput.value.trim();
            if (p) wrappedFlow(p, selectedStyle);
        };
        sendBtn.addEventListener('click', sendBtn._lum2Handler);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // OPTION 3 — DISCOVERY END CARD SYSTEM
    // ───────────────────────────────────────────────────────────────────────
    // Mirrors the Option 2 discovery system but for the horizontal film strip.
    // ═══════════════════════════════════════════════════════════════════════

    const DISCOVERY_CHIPS3 = [
        { icon: 'sports_kabaddi',  text: 'Ballgown on Mars' },
        { icon: 'palette',         text: 'Neon tribal' },
        { icon: 'wb_sunny',        text: 'Desert mirage' },
        { icon: 'forest',          text: 'Forest goddess' },
        { icon: 'nights_stay',     text: 'Lunar avant-garde' },
    ];

    const MOSAIC_SRCS3 = [
        '../images/salon.png',
        '../images/surreal.png',
        '../images/cyborg.png',
        '../images/oil-painting.png',
    ];

    let discoveryEntry3 = null;
    let chipsAnimated3  = false;

    function buildDiscoveryCard3() {
        const card = document.createElement('div');
        card.className = 'lum3-card lum3-discovery-card';

        const mosaic = document.createElement('div');
        mosaic.className = 'lum3-discovery-mosaic';
        MOSAIC_SRCS3.forEach(src => {
            const cell = document.createElement('div');
            cell.className = 'lum3-discovery-mosaic__cell';
            const img = document.createElement('img');
            img.className = 'lum3-discovery-mosaic__img';
            img.src = src;
            img.alt = '';
            img.draggable = false;
            cell.appendChild(img);
            mosaic.appendChild(cell);
        });
        card.appendChild(mosaic);

        const atmo = document.createElement('div');
        atmo.className = 'lum3-discovery-atmosphere';
        card.appendChild(atmo);

        const content = document.createElement('div');
        content.className = 'lum3-discovery-content';

        const eyebrow = document.createElement('div');
        eyebrow.className = 'lum3-discovery-eyebrow';
        eyebrow.innerHTML = `<span class="material-symbols-outlined">auto_awesome</span> What's next`;
        content.appendChild(eyebrow);

        const headline = document.createElement('p');
        headline.className = 'lum3-discovery-headline';
        headline.textContent = 'Discover a new look';
        content.appendChild(headline);

        const sub = document.createElement('p');
        sub.className = 'lum3-discovery-sub';
        sub.textContent = 'Try a style below or describe your own vision.';
        content.appendChild(sub);

        const chipRail = document.createElement('div');
        chipRail.className = 'lum3-discovery-chips';
        DISCOVERY_CHIPS3.forEach(({ icon, text }) => {
            const chip = document.createElement('button');
            chip.className = 'lum3-discovery-chip';
            chip.innerHTML = `<span class="material-symbols-outlined">${icon}</span>${text}`;
            chip.addEventListener('click', () => {
                if (promptInput) {
                    promptInput.value = text;
                    promptInput.dispatchEvent(new Event('input'));
                    promptInput.focus();
                }
            });
            chipRail.appendChild(chip);
        });
        content.appendChild(chipRail);
        card.appendChild(content);

        theater.appendChild(card);
        const entry = { el: card, isDiscovery: true };
        cards.push(entry);
        discoveryEntry3 = entry;
        return entry;
    }

    function ensureDiscoveryCardLast3() {
        if (discoveryEntry3) {
            const oldIdx = cards.indexOf(discoveryEntry3);
            if (oldIdx !== -1) cards.splice(oldIdx, 1);
            discoveryEntry3.el.remove();
            discoveryEntry3 = null;
        }
        buildDiscoveryCard3();
        chipsAnimated3 = false;
    }

    function checkDiscoveryState3() {
        if (!discoveryEntry3) return;
        const discIdx = cards.indexOf(discoveryEntry3);
        if (Math.round(currentDepth) === discIdx) {
            onDiscoveryEnter3();
        } else {
            onDiscoveryLeave3();
        }
    }

    function onDiscoveryEnter3() {
        immersive.classList.add('is-discovery');
        if (!chipsAnimated3) {
            chipsAnimated3 = true;
            const chips = discoveryEntry3.el.querySelectorAll('.lum3-discovery-chip');
            chips.forEach((c, i) => {
                c.classList.remove('is-visible');
                setTimeout(() => c.classList.add('is-visible'), 80 + i * 60);
            });
        }
    }

    function onDiscoveryLeave3() {
        immersive.classList.remove('is-discovery');
    }

    // Watch for depth changes (option3 uses RAF loop, so we poll on animation)
    const discNavObserver3 = new MutationObserver(() => checkDiscoveryState3());
    if (theater) discNavObserver3.observe(theater, { subtree: true, attributes: true, attributeFilter: ['class'] });

    window._lum3OnCardBuilt = function() {
        ensureDiscoveryCardLast3();
        checkDiscoveryState3();
    };
    window._lum3CheckDiscovery = checkDiscoveryState3;

    // Hook wrappedFlow's in-immersive completion too
    window._lum3InImmersiveCardBuilt = function() {
        ensureDiscoveryCardLast3();
        checkDiscoveryState3();
    };

})();

// ══════════════════════════════════════════════════════════════════════════════
// OPTION 3 — PINCH-TO-ZOOM MODULE
// ─────────────────────────────────────────────────────────────────────────────
// Intercepts two-finger pinch gestures on the lum3-immersive overlay.
// While zoomed (scale > 1.05):
//   • Horizontal swipe-to-navigate is fully suppressed
//   • Single-finger pan translates the image within its clipped boundary
// Double-tap on the current card image resets to 1× with a spring.
// Pinch-in past 1× rubber-bands back to 1× on release.
// ══════════════════════════════════════════════════════════════════════════════
(function initPinchZoom3() {
    'use strict';

    const immersive = document.getElementById('lum3-immersive');
    const theater   = document.getElementById('lum3-lens-container');
    if (!immersive || !theater) return;

    // ── Constants ───────────────────────────────────────────────────────────
    const MIN_SCALE  = 1.0;
    const MAX_SCALE  = 4.0;
    const SPRING_DUR = '400ms';
    const SPRING_EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';
    const DBL_TAP_MS = 280;

    // ── Per-session zoom state ───────────────────────────────────────────────
    let zoomScale = 1;
    let zoomPanX  = 0;
    let zoomPanY  = 0;

    // Pinch tracking
    let pinching        = false;
    let pinchStartDist  = 0;
    let pinchStartScale = 1;

    // Pan tracking (1-finger when zoomed)
    let panActive  = false;
    let panStartX  = 0;
    let panStartY  = 0;
    let panOriginX = 0;
    let panOriginY = 0;

    // Double-tap
    let lastTapTime = 0;
    let lastTapX    = 0;
    let lastTapY    = 0;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function getCurrentImg() {
        // Option 3 uses inline transforms — the "current" card is the one with
        // transform closest to translateX(0). We grab it from lowest |dist|.
        // Simpler: look for the card whose translateX style is near 0%, or
        // we track via the option3 module -- but we can't access its private
        // `currentIdx`. Instead, pick the card whose bounding rect center is
        // closest to the theater's horizontal center.
        const cards = theater.querySelectorAll('.lum3-card');
        if (!cards.length) return null;
        const cx = theater.getBoundingClientRect().left + theater.clientWidth / 2;
        let best = null, bestDist = Infinity;
        cards.forEach(c => {
            const r = c.getBoundingClientRect();
            const d = Math.abs((r.left + r.width / 2) - cx);
            if (d < bestDist) { bestDist = d; best = c; }
        });
        return best ? best.querySelector('.lum3-card__img') : null;
    }

    function touchDist(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function clampPan(scale, px, py, img) {
        if (!img) return { px, py };
        const rect = img.getBoundingClientRect();
        const maxX = Math.max(0, (rect.width  * (scale - 1)) / 2);
        const maxY = Math.max(0, (rect.height * (scale - 1)) / 2);
        return {
            px: Math.max(-maxX, Math.min(maxX, px)),
            py: Math.max(-maxY, Math.min(maxY, py)),
        };
    }

    function applyZoom(scale, px, py, animate) {
        const img = getCurrentImg();
        if (!img) return;
        img.style.transition = animate
            ? `transform ${SPRING_DUR} ${SPRING_EASE}`
            : 'none';
        img.style.transform = `scale(${scale}) translate(${px / scale}px, ${py / scale}px)`;
        img.style.transformOrigin = '50% 50%';
        immersive._zoomLocked = scale > 1.05;
    }

    function resetZoom(animate = true) {
        zoomScale = 1;
        zoomPanX  = 0;
        zoomPanY  = 0;
        const img = getCurrentImg();
        if (img) {
            img.style.transition = animate ? `transform ${SPRING_DUR} ${SPRING_EASE}` : 'none';
            img.style.transform = '';
        }
        immersive._zoomLocked = false;
    }

    // Reset zoom when immersive closes
    const observer = new MutationObserver(() => {
        if (!immersive.classList.contains('is-active')) {
            resetZoom(false);
        }
    });
    observer.observe(immersive, { attributes: true, attributeFilter: ['class'] });

    // ── Touch event handling ─────────────────────────────────────────────────
    immersive.addEventListener('touchstart', onTouchStart, { passive: false });
    immersive.addEventListener('touchmove',  onTouchMove,  { passive: false });
    immersive.addEventListener('touchend',   onTouchEnd,   { passive: false });
    immersive.addEventListener('touchcancel',onTouchEnd,   { passive: false });

    function onTouchStart(e) {
        if (e.touches.length === 2) {
            pinching        = true;
            panActive       = false;
            pinchStartDist  = touchDist(e.touches[0], e.touches[1]);
            pinchStartScale = zoomScale;
            e.stopPropagation();
            e.preventDefault();
        } else if (e.touches.length === 1) {
            if (immersive._zoomLocked) {
                panActive  = true;
                panStartX  = e.touches[0].clientX;
                panStartY  = e.touches[0].clientY;
                panOriginX = zoomPanX;
                panOriginY = zoomPanY;
                e.stopPropagation(); // block horizontal swipe nav
            } else {
                // Double-tap detection
                const now = Date.now();
                const tx  = e.touches[0].clientX;
                const ty  = e.touches[0].clientY;
                const tapDist = Math.sqrt((tx - lastTapX) ** 2 + (ty - lastTapY) ** 2);
                if (now - lastTapTime < DBL_TAP_MS && tapDist < 40) {
                    if (zoomScale > 1.05) {
                        resetZoom(true);
                    } else {
                        zoomScale = 2.5;
                        zoomPanX  = 0;
                        zoomPanY  = 0;
                        applyZoom(zoomScale, zoomPanX, zoomPanY, true);
                    }
                    lastTapTime = 0;
                    e.preventDefault();
                    return;
                }
                lastTapTime = now;
                lastTapX    = tx;
                lastTapY    = ty;
            }
        }
    }

    function onTouchMove(e) {
        if (pinching && e.touches.length === 2) {
            e.preventDefault();
            e.stopPropagation();

            const d = touchDist(e.touches[0], e.touches[1]);
            let newScale = pinchStartScale * (d / pinchStartDist);

            // Rubber-band below MIN
            if (newScale < MIN_SCALE) {
                const over = MIN_SCALE - newScale;
                newScale = MIN_SCALE - Math.sqrt(over) * 0.3;
            }
            newScale = Math.min(MAX_SCALE, newScale);

            zoomScale = newScale;
            const { px, py } = clampPan(zoomScale, zoomPanX, zoomPanY, getCurrentImg());
            zoomPanX = px;
            zoomPanY = py;
            applyZoom(zoomScale, zoomPanX, zoomPanY, false);
        } else if (panActive && e.touches.length === 1 && immersive._zoomLocked) {
            e.preventDefault();
            e.stopPropagation();

            const dx = e.touches[0].clientX - panStartX;
            const dy = e.touches[0].clientY - panStartY;
            const { px, py } = clampPan(
                zoomScale,
                panOriginX + dx,
                panOriginY + dy,
                getCurrentImg()
            );
            zoomPanX = px;
            zoomPanY = py;
            applyZoom(zoomScale, zoomPanX, zoomPanY, false);
        }
    }

    function onTouchEnd(e) {
        if (pinching) {
            pinching = false;
            if (zoomScale < MIN_SCALE + 0.05) {
                resetZoom(true);
            } else {
                applyZoom(zoomScale, zoomPanX, zoomPanY, true);
            }
        }
        if (e.touches.length < 1) {
            panActive = false;
        }
    }

    // Block the theater's own touch handlers (horizontal swipe) while zoomed
    theater.addEventListener('touchstart', e => {
        if (immersive._zoomLocked) {
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });

}());
