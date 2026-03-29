// Option 2 — Time Machine Immersive Gallery
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
    const shell2       = document.getElementById('phone-shell-option2');
    if (!shell2) return; // guard: option2 shell not in DOM

    const promptInput  = shell2.querySelector('.video-floating-input__textarea');
    const inputRow     = shell2.querySelector('.video-floating-input__input-row');
    const sendBtn      = shell2.querySelector('.video-floating-input__send-btn');
    const chatOverlay  = document.getElementById('lum2-chat-overlay');
    const chatHistory  = document.getElementById('lum2-chat-history');
    const immersive    = document.getElementById('lum2-immersive');
    const immClose     = document.getElementById('lum2-immersive-close');
    const theater      = document.getElementById('lum2-card-theater');
    const bgA          = document.getElementById('lum2-bg-a');
    const bgB          = document.getElementById('lum2-bg-b');
    const actionPill   = document.getElementById('lum2-action-pill');
    const posIndicator = document.getElementById('lum2-position-indicator');
    const promptLabel  = document.getElementById('lum2-prompt-label');
    const promptText   = document.getElementById('lum2-prompt-text');

    // ── Prompt Label State & Tuning ───────────────────────────────────────────
    let lastPromptIdx    = -1;
    let promptAnimTimer  = null;
    const PROMPT_ENTER_DUR = 380; // ms
    const PROMPT_EXIT_DUR  = 280; // ms
    const PROMPT_ENTER_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Decelerate out of nowhere
    const PROMPT_EXIT_EASE  = 'cubic-bezier(0.4, 0, 1, 1)';    // Accelerate into distance
    const PROMPT_TRAVEL_Y_PX = 16;   // Option 2 swipe is depth-based, use subtle vertical offset

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
    const opt2Container = shell2.querySelector('#lum2-cards-container');
    if (opt1Grid && opt2Container) {
        const old = opt2Container.querySelector('.cards-grid');
        if (old) old.replaceWith(opt1Grid.cloneNode(true));
    }
    const styleCards = shell2.querySelectorAll('.style-card');
    const opt2Scroll = document.getElementById('lum2-cards-container');
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
        t.className = 'lum-chat-turn';
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
                <button class="lum2-expand-btn" aria-label="Expand" data-index="${index}">
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
        const btn  = t.querySelector('.lum2-expand-btn');
        const open = () => openImmersive(dataUrl, index);
        if (btn)  btn.addEventListener('click', open);
        if (wrap) wrap.addEventListener('click', e => { if (!btn.contains(e.target)) open(); });
    }

    function scrollBottom() {
        const el = document.getElementById('lum2-chat-scroll');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    // ── Card factory ──────────────────────────────────────────────────────────
    function buildCard(dataUrl, prompt) {
        const card = document.createElement('div');
        card.className = 'lum2-card';
        const vp = document.createElement('div');
        vp.className = 'lum2-card__viewport';
        const img = document.createElement('img');
        img.className = 'lum2-card__img';
        img.src = dataUrl;
        img.alt = prompt;
        img.draggable = false;
        vp.appendChild(img);
        
        // Elite Motion: Native Spatial Scaling
        // Embed the prompt label directly into the scaled viewport
        // so it physically inherits the Time Machine Z-depth and opacity.
        if (prompt && prompt.trim() !== '') {
            const lbl = document.createElement('div');
            lbl.className = 'lum2-prompt-label';
            lbl.style.position = 'absolute';
            lbl.style.top = '24px'; /* Sit naturally at the top of the image frame */
            lbl.style.right = '24px';
            lbl.style.left = '24px';
            lbl.style.zIndex = '5';
            lbl.innerHTML = `<span class="lum2-prompt-label__text">${prompt}</span>`;
            vp.appendChild(lbl);
        }
        
        card.appendChild(vp);
        theater.appendChild(card);
        const entry = { el: card };
        cards.push(entry);
        return entry;
    }

    function buildLoadingCard() {
        const card = document.createElement('div');
        card.className = 'lum2-card is-loading-card';
        // Create viewport wrapper for loading content (consistent with regular cards)
        const vp = document.createElement('div');
        vp.className = 'lum2-card__viewport';
        vp.innerHTML = `
            <div class="lum2-loading-content">
                <div class="lum2-loading-label-wrap">
                    <span class="lum2-loading-label">Generating image...</span>
                </div>
            </div>`;
        card.appendChild(vp);
        theater.appendChild(card);
        const entry = { el: card, isLoading: true };
        cards.push(entry);
        return entry;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TIME MACHINE LAYOUT ENGINE
    // Assign CSS classes to each card based on its position relative to currentIdx.
    // This creates the 3D depth stack effect.
    // ══════════════════════════════════════════════════════════════════════════

    // Card state class names — only one should be active at a time
    const CARD_STATES = ['is-deep-past', 'is-prev', 'is-current', 'is-next', 'is-future', 'is-dragging'];

    function clearCardState(cardEl) {
        cardEl.classList.remove(...CARD_STATES);
    }

    function layoutCards(targetIdx, animate) {
        if (typeof targetIdx === 'undefined') targetIdx = currentIdx;

        cards.forEach((entry, i) => {
            const el = entry.el;
            clearCardState(el);

            // ALWAYS clear inline gesture transforms so CSS classes take over.
            // Without this, stale drag transforms persist and override class positions.
            el.style.transform = '';
            el.style.opacity   = '';
            el.style.filter    = '';
            const lbl = el.querySelector('.lum2-prompt-label');
            if (lbl) lbl.style.filter = '';

            const diff = i - targetIdx;

            if (diff <= -2) {
                el.classList.add('is-deep-past');
            } else if (diff === -1) {
                el.classList.add('is-prev');
            } else if (diff === 0) {
                el.classList.add('is-current');
            } else if (diff === 1) {
                el.classList.add('is-next');
            } else {
                el.classList.add('is-future');
            }
        });
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    // Navigate to a card index, triggering the Time Machine depth transition.
    function navigateTo(newIdx, instant) {
        if (newIdx < 0 || newIdx >= cards.length) return;
        const oldIdx = currentIdx;
        currentIdx = newIdx;

        if (instant) {
            // Disable transitions briefly for instant jumps
            cards.forEach(entry => {
                entry.el.style.transition = 'none';
            });
            layoutCards(newIdx);
            // Force reflow then re-enable transitions
            void theater.offsetHeight;
            requestAnimationFrame(() => {
                cards.forEach(entry => {
                    entry.el.style.transition = '';
                });
            });
        } else {
            layoutCards(newIdx);
        }

        // bg-stage crossfade
        bgFrom = oldIdx; bgTo = newIdx; bgProg = 0; bgTProg = 1;
        updatePositionIndicator();
        hidePill();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GESTURE SYSTEM — Vertical swipe to navigate the depth stack
    // Touch/pointer tracking with momentum and snap thresholds.
    // During drag: inline transforms interpolate card positions in real-time.
    // On release: CSS transitions animate to the snapped class positions.
    // ══════════════════════════════════════════════════════════════════════════

    const SWIPE_THRESHOLD = 60;     // px — minimum drag to trigger navigation
    const VELOCITY_THRESH = 0.35;   // px/ms — flick velocity that overrides distance threshold
    const WHEEL_DEBOUNCE  = 120;    // ms — scroll snap-like wheel cooldown
    const TAP_MAX_MOVE    = 10;     // px — max movement to still count as a tap
    const TAP_MAX_TIME    = 300;    // ms — max duration to still count as a tap

    let dragStartTime  = 0;
    let dragStartRawY  = 0;         // raw clientY at start — used for tap zone detection

    // ── Shared drag start / move / end logic ─────────────────────────────────
    // Used by both touch and mouse handlers to avoid duplication.
    function handleDragStart(clientY) {
        dragging       = true;
        dragStartY     = clientY;
        dragStartRawY  = clientY;
        dragStartTime  = Date.now();
        dragDelta      = 0;
        cards.forEach(entry => entry.el.classList.add('is-dragging'));
        hidePill();
    }

    function handleDragMove(clientY) {
        if (!dragging) return;
        dragDelta = clientY - dragStartY;

        // Clamp: rubber-band at boundaries
        const atStart = currentIdx === 0 && dragDelta > 0;
        const atEnd   = currentIdx === cards.length - 1 && dragDelta < 0;
        if (atStart || atEnd) {
            dragDelta *= 0.25;
        }
        applyGestureTransforms(dragDelta);
    }

    function handleDragEnd() {
        if (!dragging) return;
        dragging = false;

        const elapsed  = Math.max(Date.now() - dragStartTime, 1);
        const absDelta = Math.abs(dragDelta);
        const velocity = absDelta / elapsed;

        // ── TAP DETECTION ────────────────────────────────────────────────
        // A tap is a short, low-movement pointer interaction.
        // Upper half of the theater → go to previous image
        // Lower half of the theater → go to next image
        const isTap = absDelta < TAP_MAX_MOVE && elapsed < TAP_MAX_TIME;

        if (isTap && cards.length > 1) {
            // Remove dragging class immediately
            cards.forEach(entry => entry.el.classList.remove('is-dragging'));
            // Clear any minimal inline transforms from micro-movement
            cards.forEach(entry => {
                entry.el.style.transform = '';
                entry.el.style.opacity   = '';
                entry.el.style.filter    = '';
                const lbl = entry.el.querySelector('.lum2-prompt-label');
                if (lbl) lbl.style.filter = '';
            });

            // Determine tap zone relative to the theater
            const theaterRect = theater.getBoundingClientRect();
            const tapRelY     = dragStartRawY - theaterRect.top;
            const tapFraction = tapRelY / theaterRect.height;

            if (tapFraction < 0.45 && currentIdx > 0) {
                // Tapped upper zone → navigate backward
                navigateTo(currentIdx - 1, false);
            } else if (tapFraction >= 0.45 && currentIdx < cards.length - 1) {
                // Tapped lower zone → navigate forward
                navigateTo(currentIdx + 1, false);
            } else {
                // At boundary, snap back
                layoutCards(currentIdx, true);
                showPillDelayed();
            }
            return; // skip drag logic
        }

        // ── DRAG/SWIPE DETECTION ─────────────────────────────────────────
        const swipeUp   = dragDelta < -SWIPE_THRESHOLD || (dragDelta < 0 && velocity > VELOCITY_THRESH);
        const swipeDown = dragDelta > SWIPE_THRESHOLD  || (dragDelta > 0 && velocity > VELOCITY_THRESH);

        cards.forEach(entry => entry.el.classList.remove('is-dragging'));

        let newIdx = currentIdx;
        if (swipeUp && currentIdx < cards.length - 1)   newIdx = currentIdx + 1;
        if (swipeDown && currentIdx > 0)                 newIdx = currentIdx - 1;

        cards.forEach(entry => {
            entry.el.style.transform = '';
            entry.el.style.opacity   = '';
            entry.el.style.filter    = '';
            const lbl = entry.el.querySelector('.lum2-prompt-label');
            if (lbl) lbl.style.filter = '';
        });

        if (newIdx !== currentIdx) {
            navigateTo(newIdx, false);
        } else {
            layoutCards(currentIdx, true);
            showPillDelayed();
        }
    }

    // ── Touch handlers ───────────────────────────────────────────────────────
    theater && theater.addEventListener('touchstart', e => {
        handleDragStart(e.touches[0].clientY);
    }, { passive: true });

    theater && theater.addEventListener('touchmove', e => {
        handleDragMove(e.touches[0].clientY);
    }, { passive: true });

    theater && theater.addEventListener('touchend', () => {
        handleDragEnd();
    });

    // ── Mouse handlers (desktop) ─────────────────────────────────────────────
    // mousedown on theater starts drag; mousemove/mouseup on window so drag
    // continues even if cursor leaves the theater element during fast swipes.
    theater && theater.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent text selection
        handleDragStart(e.clientY);
    });

    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        handleDragMove(e.clientY);
    });

    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        handleDragEnd();
    });

    // ── Mouse wheel / trackpad scroll ────────────────────────────────────────
    // Mac trackpads produce many small-delta events. We accumulate delta across
    // rapid events and check the accumulated value when the series settles.
    let wheelTimeout    = null;
    let wheelAccumDelta = 0;
    theater && theater.addEventListener('wheel', e => {
        e.preventDefault();
        wheelAccumDelta += e.deltaY;

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (wheelAccumDelta > 8 && currentIdx < cards.length - 1) {
                navigateTo(currentIdx + 1, false);
            } else if (wheelAccumDelta < -8 && currentIdx > 0) {
                navigateTo(currentIdx - 1, false);
            }
            wheelAccumDelta = 0; // reset for next gesture
        }, WHEEL_DEBOUNCE);
    }, { passive: false });

    // ── Apply gesture transforms (real-time finger tracking) ──────────────────
    function applyGestureTransforms(delta) {
        const theaterH = theater.clientHeight || 1;
        // Normalize delta to a 0..1 progress value.
        // Apply smoothstep easing — physical objects have inertia,
        // linear mapping feels robotic, eased mapping feels tangible.
        const rawProgress = Math.min(Math.max(delta / theaterH, -1), 1);
        const sign     = rawProgress < 0 ? -1 : 1;
        const absP     = Math.abs(rawProgress);
        // Smoothstep: 3t² - 2t³  (gentle ramp-up near zero, decelerates near 1)
        const eased    = absP * absP * (3 - 2 * absP);
        const progress = sign * eased;

        cards.forEach((entry, i) => {
            const el   = entry.el;
            const lbl  = el.querySelector('.lum2-prompt-label');
            const diff = i - currentIdx;

            // ── Base transforms per position ──
            // These match the CSS class values and we interpolate from them.

            // Current card (diff === 0)
            if (diff === 0) {
                if (progress < 0) {
                    // Swiping UP → current card exits upward into prev position
                    // Values: translateY 0→-12%, translateZ 0→-280px, scale 1→0.81,
                    //         brightness 1→0.52 (matches .is-prev CSS)
                    const t = Math.abs(progress);
                    const y = lerp(0, -12, t);
                    const z = lerp(0, -280, t);
                    const s = lerp(1, 0.81, t);
                    const o = lerp(1, 0.88, t);
                    const b = lerp(1, 0.52, t);
                    const blurAmt = lerp(0, 4, t);
                    el.style.transform = `translateY(${y}%) translateZ(${z}px) scale(${s})`;
                    el.style.opacity   = o;
                    el.style.filter    = `brightness(${b})`;
                    if (lbl) lbl.style.filter = blurAmt < 0.1 ? 'none' : `blur(${blurAmt}px)`;
                } else {
                    // Swiping DOWN → current card exits downward (back to next position)
                    const t = progress;
                    const y = lerp(0, 110, t);
                    el.style.transform = `translateY(${y}%) translateZ(0px) scale(1)`;
                    el.style.opacity   = lerp(1, 0, t);
                    if (lbl) lbl.style.filter = 'none';
                }
            }
            // Next card (diff === 1) — enters from below
            else if (diff === 1) {
                if (progress < 0) {
                    const t = Math.abs(progress);
                    const y = lerp(110, 0, t);
                    el.style.transform = `translateY(${y}%) translateZ(0px) scale(1)`;
                    el.style.opacity   = lerp(0, 1, t);
                    el.style.filter    = `brightness(1)`;
                    if (lbl) lbl.style.filter = 'none';
                }
            }
            // Previous card (diff === -1) — recedes further or comes forward
            else if (diff === -1) {
                if (progress > 0) {
                    // Swiping DOWN → prev card comes forward to become current
                    // Values interpolate from .is-prev CSS to .is-current CSS
                    const t = progress;
                    const y = lerp(-12, 0, t);
                    const z = lerp(-280, 0, t);
                    const s = lerp(0.81, 1, t);
                    const o = lerp(0.88, 1, t);
                    const b = lerp(0.52, 1, t);
                    const blurAmt = lerp(4, 0, t);
                    el.style.transform = `translateY(${y}%) translateZ(${z}px) scale(${s})`;
                    el.style.opacity   = o;
                    el.style.filter    = `brightness(${b})`;
                    if (lbl) lbl.style.filter = blurAmt < 0.1 ? 'none' : `blur(${blurAmt}px)`;
                } else {
                    // Swiping UP → prev card recedes further into deep past
                    // Values interpolate from .is-prev CSS to .is-deep-past CSS
                    const t = Math.abs(progress);
                    const y = lerp(-12, -28, t);
                    const z = lerp(-280, -600, t);
                    const s = lerp(0.81, 0.667, t);
                    const o = lerp(0.88, 0, t);
                    const b = lerp(0.52, 0.12, t);
                    const blurAmt = lerp(4, 8, t);
                    el.style.transform = `translateY(${y}%) translateZ(${z}px) scale(${s})`;
                    el.style.opacity   = o;
                    el.style.filter    = `brightness(${b})`;
                    if (lbl) lbl.style.filter = `blur(${blurAmt}px)`;
                }
            }
            // Deep past (diff === -2) — may emerge as prev if swiping down
            else if (diff === -2) {
                if (progress > 0) {
                    // Values: deep past → prev (matches CSS class transforms)
                    const t = progress;
                    const y = lerp(-28, -12, t);
                    const z = lerp(-600, -280, t);
                    const s = lerp(0.667, 0.81, t);
                    const o = lerp(0, 0.88, t);
                    const b = lerp(0.12, 0.52, t);
                    const blurAmt = lerp(8, 4, t);
                    el.style.transform = `translateY(${y}%) translateZ(${z}px) scale(${s})`;
                    el.style.opacity   = o;
                    el.style.filter    = `brightness(${b})`;
                    if (lbl) lbl.style.filter = `blur(${blurAmt}px)`;
                }
            }
            // Future (diff === 2) — may become next if swiping up
            else if (diff === 2) {
                if (progress < 0) {
                    const t = Math.abs(progress);
                    const y = lerp(120, 110, t);
                    el.style.transform = `translateY(${y}%) translateZ(0px) scale(1)`;
                    el.style.opacity   = lerp(0, 0, t); // stays invisible until it's actually next
                }
            }
        });
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }


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
        updateBgCrossfade();
    }
    animationLoop();

    // ── Action pill + indicator ────────────────────────────────────────────────
    function hidePill() {
        if (actionPill) actionPill.style.opacity = '0';
        clearTimeout(pillTimer);
        pillTimer = setTimeout(showPillDelayed, 1200);
        // Prompt no longer globally hidden down here so it can be seen scaling during drag
    }

    function showPillDelayed() {
        if (actionPill) actionPill.style.opacity = '1';
    }

    // ── Prompt Label Animations (Removed—Spatial DOM now handles this) ─
    function animatePromptTransition() {}
    function showPromptForCurrentIdx() {}
    function hidePrompt() {}

    function updatePositionIndicator() {
        if (!posIndicator || imageHistory.length < 2) return;
        posIndicator.textContent = `${currentIdx + 1}  /  ${imageHistory.length}`;
        posIndicator.style.opacity = '0.85';
        clearTimeout(indTimer);
        indTimer = setTimeout(() => { posIndicator.style.opacity = '0'; }, 2200);
    }

    // ── Immersive open / close ────────────────────────────────────────────────
    const outsideGestureBar = shell2.querySelector('.video-gesture-bar');
    const floatingInput2    = shell2.querySelector('#lum2-floating-input');
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
        showPromptForCurrentIdx();
    }

    function closeImmersive() {
        // ── Reset all interaction state ──────────────────────────────────
        dragging    = false;
        dragDelta   = 0;
        closeActive = false;

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
            const lbl = entry.el.querySelector('.lum2-prompt-label');
            if (lbl) lbl.style.filter = '';
        });

        hidePrompt();
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
                    vp.className = 'lum2-card__viewport';
                    const img = document.createElement('img');
                    img.className = 'lum2-card__img';
                    img.src = dataUrl;
                    img.alt = prompt;
                    img.draggable = false;
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 600ms cubic-bezier(0.0,0.0,0.2,1)';
                    vp.appendChild(img);
                    
                    if (prompt && prompt.trim() !== '') {
                        const lbl = document.createElement('div');
                        lbl.className = 'lum2-prompt-label';
                        lbl.style.position = 'absolute';
                        lbl.style.top = '24px';
                        lbl.style.right = '24px';
                        lbl.style.left = '24px';
                        lbl.innerHTML = `<div class="lum2-prompt-label__text">${prompt}</div>`;
                        lbl.style.filter = 'none';
                        lbl.style.webkitFilter = 'none';
                        vp.appendChild(lbl);
                    }
                    
                    loadEntry.el.appendChild(vp);
                    requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; }));

                    // Update bg for new settled card
                    bgFrom = currentIdx; bgTo = currentIdx; bgProg = 0; bgTProg = 0;
                    if (bgA) { bgA.style.backgroundImage = `url('${dataUrl}')`; bgA.style.opacity = '1'; bgAIdx = idx; }
                    if (bgB) bgB.style.opacity = '0';
                    appendChatImage(dataUrl, prompt, idx);
                    updatePositionIndicator();

                    // ── Cinematic Motion: Send old image to chat history ──
                    setTimeout(() => {
                        if (currentIdx > 0) {
                            const prevCardIndex = currentIdx - 1;
                            const cardEntry = cards[prevCardIndex];
                            if (!cardEntry) return;

                            const originalImg = cardEntry.el.querySelector('img');
                            if (!originalImg) return;

                            const rect = originalImg.getBoundingClientRect();
                            const ghost = document.createElement('img');
                            ghost.src = originalImg.src;
                            ghost.style.position = 'fixed';
                            ghost.style.top = rect.top + 'px';
                            ghost.style.left = rect.left + 'px';
                            ghost.style.width = rect.width + 'px';
                            ghost.style.height = rect.height + 'px';
                            ghost.style.borderRadius = window.getComputedStyle(originalImg).borderRadius || '24px';
                            ghost.style.objectFit = 'cover';
                            ghost.style.zIndex = '900';
                            ghost.style.pointerEvents = 'none';
                            
                            // Start from exact visual state
                            ghost.style.opacity = window.getComputedStyle(cardEntry.el).opacity;
                            ghost.style.filter = window.getComputedStyle(cardEntry.el).filter;

                            document.body.appendChild(ghost);

                            // Hide original briefly
                            cardEntry.el.style.visibility = 'hidden';

                            // Animate cinematic fly out to history
                            ghost.animate([
                                {
                                    transform: 'translate(0px, 0px) scale(1)',
                                    opacity: ghost.style.opacity,
                                    filter: ghost.style.filter
                                },
                                {
                                    transform: 'translate(0px, -500px) scale(0.35) rotate(-6deg)',
                                    opacity: 0,
                                    filter: 'brightness(1.5) blur(12px)'
                                }
                            ], {
                                duration: 850,
                                easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
                                fill: 'forwards'
                            }).onfinish = () => {
                                ghost.remove();
                                cardEntry.el.style.visibility = '';
                            };
                        }
                    }, 400); // Wait slightly for the new image to fade in completely
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


})();

// ══════════════════════════════════════════════════════════════════════════════
// OPTION 2 — PINCH-TO-ZOOM MODULE
// ─────────────────────────────────────────────────────────────────────────────
// Intercepts two-finger pinch gestures on the lum2-immersive overlay.
// While zoomed (scale > 1.05):
//   • Swipe-to-navigate is fully suppressed
//   • Single-finger pan translates the image within its clipped boundary
// Double-tap on the current card image resets to 1× with a spring.
// Pinch-in past 1× rubber-bands back to 1× on release.
// ══════════════════════════════════════════════════════════════════════════════
(function initPinchZoom2() {
    'use strict';

    const immersive = document.getElementById('lum2-immersive');
    const theater   = document.getElementById('lum2-card-theater');
    if (!immersive || !theater) return;

    // ── Constants ───────────────────────────────────────────────────────────
    const MIN_SCALE     = 1.0;
    const MAX_SCALE     = 4.0;
    const SPRING_DUR    = '400ms';
    const SPRING_EASE   = 'cubic-bezier(0.19, 1, 0.22, 1)';
    const DBL_TAP_MS    = 280;     // max gap between taps to count as double-tap

    // ── Per-session zoom state ───────────────────────────────────────────────
    let zoomScale  = 1;
    let zoomPanX   = 0;
    let zoomPanY   = 0;

    // Pinch tracking
    let pinching        = false;
    let pinchStartDist  = 0;
    let pinchStartScale = 1;
    let pinchMidX       = 0;   // midpoint of two fingers in el-space
    let pinchMidY       = 0;

    // Pan tracking (1-finger when zoomed)
    let panActive  = false;
    let panStartX  = 0;
    let panStartY  = 0;
    let panOriginX = 0;  // zoomPanX at pan start
    let panOriginY = 0;

    // Double-tap
    let lastTapTime = 0;
    let lastTapX    = 0;
    let lastTapY    = 0;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function getCurrentCard() {
        return theater.querySelector('.lum2-card.is-current');
    }

    function getCurrentImg() {
        const card = getCurrentCard();
        return card ? card.querySelector('.lum2-card__img') : null;
    }

    function dist(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function midpoint(t1, t2) {
        return {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
        };
    }

    function clampPan(scale, px, py, img) {
        if (!img) return { px, py };
        const rect = img.getBoundingClientRect();
        // How far we can pan in each axis (half the overflow)
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
        // Tell the navigation system: while zoomed, block swipes
        immersive._zoomLocked = scale > 1.05;
    }

    function resetZoom(animate = true) {
        zoomScale = 1;
        zoomPanX  = 0;
        zoomPanY  = 0;
        applyZoom(1, 0, 0, animate);
        immersive._zoomLocked = false;
    }

    // Reset zoom when immersive opens/closes (card changes = stale zoom)
    const observer = new MutationObserver(() => {
        if (!immersive.classList.contains('is-active')) {
            resetZoom(false);
        }
    });
    observer.observe(immersive, { attributes: true, attributeFilter: ['class'] });

    // Also reset zoom whenever the current card changes
    let lastCurrentCard = null;
    const cardObserver = new MutationObserver(() => {
        const card = getCurrentCard();
        if (card !== lastCurrentCard) {
            lastCurrentCard = card;
            resetZoom(false);
        }
    });
    cardObserver.observe(theater, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    // ── Touch event handling ─────────────────────────────────────────────────
    immersive.addEventListener('touchstart', onTouchStart, { passive: false });
    immersive.addEventListener('touchmove',  onTouchMove,  { passive: false });
    immersive.addEventListener('touchend',   onTouchEnd,   { passive: false });
    immersive.addEventListener('touchcancel',onTouchEnd,   { passive: false });

    function onTouchStart(e) {
        if (e.touches.length === 2) {
            // ── Two-finger pinch start ────────────────────────────────────
            pinching        = true;
            panActive       = false;
            pinchStartDist  = dist(e.touches[0], e.touches[1]);
            pinchStartScale = zoomScale;
            const mid = midpoint(e.touches[0], e.touches[1]);
            pinchMidX = mid.x;
            pinchMidY = mid.y;
            // Prevent the underlying navigation drag from starting
            e.stopPropagation();
        } else if (e.touches.length === 1) {
            if (immersive._zoomLocked) {
                // ── One-finger pan while zoomed ───────────────────────────
                panActive  = true;
                panStartX  = e.touches[0].clientX;
                panStartY  = e.touches[0].clientY;
                panOriginX = zoomPanX;
                panOriginY = zoomPanY;
                e.stopPropagation(); // block navigation
            } else {
                // ── Double-tap detection ──────────────────────────────────
                const now = Date.now();
                const tx  = e.touches[0].clientX;
                const ty  = e.touches[0].clientY;
                const tapDist = Math.sqrt((tx - lastTapX) ** 2 + (ty - lastTapY) ** 2);
                if (now - lastTapTime < DBL_TAP_MS && tapDist < 40) {
                    // Double-tap: zoom to 2.5× centred on tap, or reset if already zoomed
                    if (zoomScale > 1.05) {
                        resetZoom(true);
                    } else {
                        zoomScale = 2.5;
                        zoomPanX  = 0;
                        zoomPanY  = 0;
                        applyZoom(zoomScale, zoomPanX, zoomPanY, true);
                    }
                    lastTapTime = 0; // consume
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

            const d = dist(e.touches[0], e.touches[1]);
            let newScale = pinchStartScale * (d / pinchStartDist);

            // Rubber-band below MIN
            if (newScale < MIN_SCALE) {
                const over = MIN_SCALE - newScale;
                newScale = MIN_SCALE - Math.sqrt(over) * 0.3;
            }
            // Hard cap at MAX
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
            const candidate = {
                px: panOriginX + dx,
                py: panOriginY + dy,
            };
            const { px, py } = clampPan(zoomScale, candidate.px, candidate.py, getCurrentImg());
            zoomPanX = px;
            zoomPanY = py;
            applyZoom(zoomScale, zoomPanX, zoomPanY, false);
        }
    }

    function onTouchEnd(e) {
        if (pinching) {
            pinching = false;
            // Rubber-band back to 1× if pinched below minimum
            if (zoomScale < MIN_SCALE + 0.05) {
                resetZoom(true);
            } else {
                // Spring to nearest integer-ish boundary for polish
                const snapped = Math.max(MIN_SCALE, zoomScale);
                zoomScale = snapped;
                applyZoom(zoomScale, zoomPanX, zoomPanY, true);
            }
        }
        if (e.touches.length < 1) {
            panActive = false;
        }
    }

    // Expose lock flag so the main swipe system can check it
    // (Already uses immersive._zoomLocked set in applyZoom above, but also
    //  patch the option2 handleDragStart to guard with this flag.)
    // We do this non-invasively by wrapping the existing theater touchstart:
    const origTheatreTS = theater.ontouchstart;
    theater.addEventListener('touchstart', e => {
        if (immersive._zoomLocked) {
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });

}());
