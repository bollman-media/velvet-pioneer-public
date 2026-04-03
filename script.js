/**
 * Gemini UI Image Editor — Script
 * Handles card selection, template attachment, dynamic placeholders,
 * input bar interactions, ripples, toast feedback, and response screen.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Elements ----------
    const appShell = document.getElementById('app-shell');
    const allCards = document.querySelectorAll('.style-card:not(.style-card--placeholder)');
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('btn-send');
    const micBtn = document.getElementById('btn-mic');
    const attachmentChip = document.getElementById('attachment-chip');
    const attachmentThumb = document.getElementById('attachment-thumb');
    const attachmentLabel = document.getElementById('attachment-label');
    const attachmentClose = document.getElementById('attachment-close');
    const placeholderOverlay = document.getElementById('placeholder-overlay');
    const placeholderPrefix = document.getElementById('placeholder-prefix');
    const placeholderDrum = document.getElementById('placeholder-drum');
    const placeholderTrack = document.getElementById('placeholder-track');
    const addSelfieBtn = document.getElementById('add-selfie-btn');
    const selfieInput = document.getElementById('selfie-input');
    const selfieChip = document.getElementById('selfie-chip');
    const selfieThumb = document.getElementById('selfie-thumb');
    const selfieClose = document.getElementById('selfie-close');

    // ---------- Response Screen Elements ----------
    const responseScreen = document.getElementById('response-screen');
    const backBtn = document.getElementById('back-btn');
    const responseTitle = document.getElementById('response-title');
    const responseThumbStyleImg = document.getElementById('response-thumb-style-img');
    const responseThumbStyleLabel = document.getElementById('response-thumb-style-label');
    const responseThumbSelfie = document.getElementById('response-thumb-selfie');
    const responseThumbSelfieImg = document.getElementById('response-thumb-selfie-img');
    const responsePromptText = document.getElementById('response-prompt-text');
    const responseImageImg = document.getElementById('response-image-img');

    // ---------- State ----------
    let selectedStyle = null;
    let placeholderInterval = null;
    let currentPlaceholderIndex = 0;
    let selfieFile = null;
    let isResponseMode = false;

    // ---------- Prototype Navigation ----------
    const imageShell = document.getElementById('app-shell');
    const musicShell = document.getElementById('music-shell');
    const videoShell = document.getElementById('video-shell');
    const designShell = document.getElementById('design-shell');
    const navTabImage = document.getElementById('nav-tab-image');
    const navTabMusic = document.getElementById('nav-tab-music');
    const navTabVideo = document.getElementById('nav-tab-video');
    const navTabDesign = document.getElementById('nav-tab-design');

    function switchPrototype(tab) {
        // ── Clean up departing shell's running subsystems ──
        try { if (typeof stopPlayerPlayback === 'function') stopPlayerPlayback(); } catch(_){}
        try { if (typeof stopAllMusic === 'function') stopAllMusic(); } catch(_){}
        try { if (typeof stopLyricsKaraoke === 'function') stopLyricsKaraoke(); } catch(_){}
        try { if (typeof stopEditModeLyrics === 'function') stopEditModeLyrics(); } catch(_){}
        try { if (typeof stopClipAudio === 'function') stopClipAudio(); } catch(_){}
        try { if (typeof cancelSpeech === 'function') cancelSpeech(); } catch(_){}
        try { if (typeof stopMoodPanWobble === 'function') stopMoodPanWobble(); } catch(_){}
        if (typeof isShotsMode !== 'undefined' && isShotsMode) {
            try { if (typeof exitShotsMode === 'function') exitShotsMode(); } catch(_){}
        }
        try { if (typeof cancelActiveRequest === 'function') cancelActiveRequest(); } catch(_){}

        // Hide all shells completely
        imageShell.style.display = 'none';
        imageShell.hidden = true;
        musicShell.style.display = 'none';
        musicShell.hidden = true;
        if (videoShell) { videoShell.style.display = 'none'; videoShell.hidden = true; }
        if (designShell) { designShell.style.display = 'none'; designShell.hidden = true; }
        const webImgShell = document.getElementById('web-image-shell');
        if (webImgShell) { webImgShell.style.display = 'none'; webImgShell.hidden = true; }

        // Remove active from all tabs
        navTabImage.classList.remove('prototype-nav__tab--active');
        navTabMusic.classList.remove('prototype-nav__tab--active');
        if (navTabVideo) navTabVideo.classList.remove('prototype-nav__tab--active');
        if (navTabDesign) navTabDesign.classList.remove('prototype-nav__tab--active');

        if (tab === 'music') {
            musicShell.style.display = '';
            musicShell.hidden = false;
            navTabMusic.classList.add('prototype-nav__tab--active');
            // Re-trigger music card animations
            musicShell.querySelectorAll('.music-card').forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = '';
            });
        } else if (tab === 'video') {
            if (videoShell) { videoShell.style.display = ''; videoShell.hidden = false; }
            if (navTabVideo) navTabVideo.classList.add('prototype-nav__tab--active');
        } else if (tab === 'design') {
            if (designShell) { designShell.style.display = 'flex'; designShell.hidden = false; }
            if (navTabDesign) navTabDesign.classList.add('prototype-nav__tab--active');
            // Sync current platform to the design system iframe
            const dsFrame = document.getElementById('design-system-frame');
            const activePlatform = document.querySelector('.nav-tab-dropdown__item--active');
            const plat = activePlatform ? activePlatform.dataset.platform : 'mobile';
            if (dsFrame && dsFrame.contentWindow) {
                dsFrame.contentWindow.postMessage({ type: 'setPlatform', platform: plat }, '*');
            }
        } else {
            // Image tab — check which platform is selected
            navTabImage.classList.add('prototype-nav__tab--active');
            const currentPlatform = document.querySelector('.nav-tab-dropdown__item--active');
            const isWeb = currentPlatform && currentPlatform.dataset.platform === 'web';
            if (isWeb && webImgShell) {
                webImgShell.style.display = 'flex';
                webImgShell.hidden = false;
                // Ensure template surface is shown (reset from response/edit)
                const tmplSurface = document.getElementById('web-img-template-surface');
                const respSurface = document.getElementById('web-img-response-surface');
                const editSurface = document.getElementById('web-img-edit-surface');
                if (tmplSurface) tmplSurface.hidden = false;
                if (respSurface) respSurface.hidden = true;
                if (editSurface) editSurface.hidden = true;
            } else {
                imageShell.style.display = '';
                imageShell.hidden = false;
                // Re-trigger image card animations
                allCards.forEach(card => {
                    card.style.animation = 'none';
                    card.offsetHeight;
                    card.style.animation = '';
                });
            }
        }
    }

    navTabImage.addEventListener('click', () => switchPrototype('image'));
    navTabMusic.addEventListener('click', () => switchPrototype('music'));
    if (navTabVideo) navTabVideo.addEventListener('click', () => switchPrototype('video'));
    if (navTabDesign) navTabDesign.addEventListener('click', () => switchPrototype('design'));

    // ── Hash-based tab init ──
    const hashTab = window.location.hash.replace('#', '');
    if (['image', 'music', 'video', 'design'].includes(hashTab)) {
        switchPrototype(hashTab);
    }

    // Also accept postMessage for same-origin iframe control
    window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'switchTab' && typeof e.data.tab === 'string') {
            switchPrototype(e.data.tab);
        }
    });


    // ---------- Video Card Selection ----------
    const videoCards = videoShell ? videoShell.querySelectorAll('.video-card') : [];
    let selectedVideoCard = null;

    const videoTemplateImages = {
        'cyberpunk': '../images/cyborg.png',
        'civilization': '../images/surreal.png',
        'metalic': '../images/gothic-clay.png',
        'cutout': '../images/watercolor.png',
        'surreal': '../images/steampunk.png',
        'explosive': '../images/explosive.png',
    };

    // Detailed cinematic prompts for each video template
    const videoTemplatePrompts = {
        'cyberpunk': `The music should have a heavy synth cyberpunk sound. 
0-2 SECONDS: VISUAL: Open on a MEDIUM SHOT of a FUTURISTIC MOTORCYCLE, SLEEK, DARK GREY METALLIC, positioned at a THREE-QUARTER ANGLE on a REFLECTIVE, DARK GREY FLOOR, against a PLAIN, DARK BLUE BACKGROUND. DRAMATIC, STUDIO-LIKE LIGHTING highlights its features. The VIBRANT NEON PINK AND TEAL lights are currently OFF or DIM. The MAIN SUBJECT (cyberpunk styled) quickly enters the frame and mounts the motorcycle. CAMERA: Steady, establishing the bike and its initial environment. MOOD: FUTURISTIC, SLEEK, a sense of imminent action.
2-4 SECONDS: VISUAL: The subject is now seated, FACING THE CAMERA with a determined expression. With a decisive action, the NEON PINK AND TEAL lights on the motorcycle FLARE TO LIFE, outlining its contours and wheels with vibrant energy. A futuristic engine hum/whirr starts. CAMERA: A slight, quick RACK FOCUS or subtle ZOOM to the rider's face and the activating lights. MOOD: CYBERPUNK, energizing, ready.
4-8 SECONDS: VISUAL: The motorcycle LURCHES FORWARD and accelerates RAPIDLY TOWARDS THE CAMERA. SIMULTANEOUSLY, the PLAIN DARK BLUE BACKGROUND behind the motorcycle and rider begins to rapidly TRANSFORM into a STYLIZED, VIBRANT SUNSET SKY with deep oranges, fiery reds, purples, with silhouetted futuristic city spires. The REFLECTIVE DARK GREY FLOOR transforms into a wet-look road surface reflecting the neon and sunset. CAMERA: Remains relatively STATIC or employs a VERY SLOW, subtle PULL-BACK. The primary motion is the bike coming towards the static camera, bursting out of an emergent sunset. MOOD: Exhilarating, dynamic, intense.
AT 8 SECONDS (END FRAME): The motorcycle is now VERY CLOSE to the camera, almost filling the frame. The rider's face is sharply in focus. The background is completely dominated by the GLORIOUS CYBERPUNK SUNSET. Neon light trails from the bike linger. MOOD: Powerful, impactful.`,
        'civilization': `0-2 SECONDS: VISUAL: Open on a slightly low-angle shot focusing on the textured, PHOTOGRAPHICALLY DETAILED white MARBLE PATHWAY, perhaps with an imposing CLASSICAL COLUMN partially framing one side of the foreground. The lighting is DRAMATIC yet soft, casting LONG, SOFT SHADOWS that enhance depth. The mood is immediately PEACEFUL and MYSTICAL, hinting at the grandeur beyond the initial frame. CAMERA: Steady, perhaps with a very slight, almost imperceptible drift or slow creep forward, building anticipation. MOOD: Expectant, serene, hinting at otherworldly beauty.
2-5 SECONDS: VISUAL: The YOUNG, SLENDER, DARK-HAIRED WOMAN, wearing her FLOWING WHITE TOGA-LIKE GARMENT, gracefully enters the frame from screen right. Her movement is fluid and unhurried. She steps onto the marble pathway, her back mostly to the viewer, and begins to walk away from the camera. Her posture is SERENE and CONTEMPLATIVE. CAMERA: A gentle, slow PAN or subtle TRACKING movement begins, following her initial steps, keeping her as the central focus. MOOD: Ethereal, a sense of gentle discovery, the beginning of a journey.
5-8 SECONDS: VISUAL: As she continues her slow walk along the pathway, the camera smoothly PULLS BACK AND/OR TILTS UP slightly. This movement progressively reveals the breathtaking scale of the FANTASICAL, DREAMLIKE LANDSCAPE: the PARTIALLY RUINED, CLASSICAL-STYLE WHITE MARBLE CITY nestled within the DRAMATIC BLUE BODY OF WATER. The sky above expands to show its DARK BLUE expanse, punctuated by LUMINOUS CLOUDS and DISTANT STARS. Her figure becomes smaller relative to the vast, SURREAL vista. Light reflects softly off the wet-looking marble and water. CAMERA: Smooth pull-back and/or tilt up, a majestic reveal. MOOD: Awe-inspiring, otherworldly, peaceful, with a strong sense of CLASSICISM. The SURREALIST AESTHETIC is fully established.
AT 8 SECONDS (END FRAME): The woman is now a distinct, yet small, figure walking along the grand pathway towards the majestic, temple-like central building in the distance. The frame is a wide, stunning tableau showcasing the entire surreal environment. CAMERA: Holds steady on this wide, picturesque shot. MOOD: A lingering sense of peace, wonder, and profound mystique.`,
        'metalic': `Starting from his fingers and spreading rapidly upward, his skin turns to chrome-like emerald steel—shiny, smooth, and slightly glowing. Facial features begin to harden and metallicize, while the texture of his clothes remains detailed but slightly reflective. Camera language: mid close-up, straight-on perspective with a shallow depth of field, focus on the transition. Motion: frozen mid-transformation, one side still human, the other fully transformed. Atmosphere: futuristic and mysterious, hint of tension. Styling: cyber-organic fusion, metallic green hues with subtle reflections of the environment, realistic lighting on polished surfaces.`,
        'cutout': `The subject soars through a vibrant, chaotic expanse of outer space, where colossal nebulae swirl in colorful clouds of gas and dust, distant galaxies glitter like scattered jewels, and myriad stars pierce the infinite black. The subject's expression is a mix of exhilaration and determination as streams of cosmic dust and shimmering stellar particles blur past it. Vast, glowing nebulae envelop it, illuminated by sudden flares from nascent stars or the brilliant shockwaves of distant supernovae, casting ethereal, multi-hued glows around it. The subject stretches its arms outward, embracing both the freedom and danger of its flight, its hair floats weightlessly, reacting to its swift movements and the subtle currents of stellar winds. The void around it is electric, charged with cosmic energy and emotion that intensifies with every heartbeat. Each awe-inspiring cosmic event – a distant pulsar's rhythmic beam sweeping past, the silent, brilliant ignition of a new star – seems to amplify its resolve, as if the universe itself is urging it onward. Its swift movement creates a dynamic sense of speed, capturing the raw power of the cosmos and the subject's relentless spirit. Cinema grading, shot on ARRI ALEXA 65 (65 mm Digital Large Format).`,
        'surreal': 'Create a dreamlike 8-second surreal video. Impossible architecture floats in a twilight sky as staircases lead to nowhere and doors open to vast landscapes. Clocks melt, gravity shifts, and the camera drifts through a world where physics bends to imagination. Rich, saturated colors blend with ethereal lighting.',
        'explosive': 'Create an intense 8-second video of dramatic explosions in hyper slow motion. Vibrant bursts of color — deep reds, electric blues, and bright oranges — erupt against a dark background. Shockwaves ripple through the air, debris scatters in beautiful patterns, and the camera captures every detail of the explosive energy.',
    };

    const videoPlaceholderOverlay = document.getElementById('video-placeholder-overlay');
    const videoPlaceholderPrefix = document.getElementById('video-placeholder-prefix');
    const videoPromptInput = document.getElementById('video-prompt-input');
    const videoAttachmentChip = document.getElementById('video-attachment-chip');
    const videoAttachmentThumb = document.getElementById('video-attachment-thumb');
    const videoAttachmentLabel = document.getElementById('video-attachment-label');
    const videoAttachmentClose = document.getElementById('video-attachment-close');

    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const tmpl = card.dataset.vtemplate;

            // Deselect previous
            if (selectedVideoCard) {
                selectedVideoCard.classList.remove('selected');
            }

            // Select new (or deselect if same)
            if (selectedVideoCard === card) {
                selectedVideoCard = null;
                // Animate chip dismiss
                const attachRow = document.getElementById('video-attachment-row');
                const inputContainer = document.querySelector('.video-floating-input__container');
                if (videoAttachmentChip) {
                    videoAttachmentChip.classList.add('removing');
                    videoAttachmentChip.addEventListener('animationend', () => {
                        videoAttachmentChip.hidden = true;
                        videoAttachmentChip.classList.remove('removing');
                        if (attachRow) attachRow.classList.remove('visible');
                        if (inputContainer) inputContainer.classList.remove('has-attachments');
                    }, { once: true });
                }
                if (videoPlaceholderPrefix) videoPlaceholderPrefix.textContent = 'Describe your video';
                // Hide add-photo button
                const vasb = document.getElementById('video-add-selfie-btn');
                if (vasb) vasb.classList.add('hidden');
                updateVideoSendState();
                return;
            }

            selectedVideoCard = card;
            card.classList.add('selected');

            // Show attachment chip with spring animation
            const attachRow = document.getElementById('video-attachment-row');
            const inputContainer = document.querySelector('.video-floating-input__container');
            if (videoAttachmentChip && videoAttachmentThumb && videoAttachmentLabel) {
                videoAttachmentThumb.src = videoTemplateImages[tmpl] || '';
                videoAttachmentLabel.textContent = card.querySelector('.video-card__label').textContent;
                // Reset animation for re-trigger
                videoAttachmentChip.classList.remove('removing');
                videoAttachmentChip.style.animation = 'none';
                void videoAttachmentChip.offsetHeight; // force reflow
                videoAttachmentChip.style.animation = '';
                videoAttachmentChip.hidden = false;
            }

            // Expand the attachments row with smooth transition
            if (attachRow) {
                attachRow.classList.add('visible');
            }
            // Soften container border-radius
            if (inputContainer) {
                inputContainer.classList.add('has-attachments');
            }

            if (videoPlaceholderPrefix) {
                videoPlaceholderPrefix.textContent = 'Describe your video ';
            }
            updateVideoSendState();

            // Show add-photo button when template selected (unless selfie already added)
            const vasb2 = document.getElementById('video-add-selfie-btn');
            const vsc = document.getElementById('video-selfie-chip');
            if (vasb2 && (!vsc || vsc.hidden)) {
                vasb2.classList.remove('hidden');
            }

            // Focus the textarea to open the keyboard (slight delay for animation sequencing)
            if (videoPromptInput) {
                setTimeout(() => videoPromptInput.focus(), 200);
            }
        });
    });

    // Remove attachment chip on close (with dismiss animation)
    if (videoAttachmentClose) {
        videoAttachmentClose.addEventListener('click', (e) => {
            e.stopPropagation();
            const attachRow = document.getElementById('video-attachment-row');
            const inputContainer = document.querySelector('.video-floating-input__container');

            // Animate chip out
            if (videoAttachmentChip) {
                videoAttachmentChip.classList.add('removing');
                videoAttachmentChip.addEventListener('animationend', () => {
                    videoAttachmentChip.hidden = true;
                    videoAttachmentChip.classList.remove('removing');
                    // Collapse the row after chip is gone
                    if (attachRow) attachRow.classList.remove('visible');
                    if (inputContainer) inputContainer.classList.remove('has-attachments');
                }, { once: true });
            }

            if (selectedVideoCard) {
                selectedVideoCard.classList.remove('selected');
                selectedVideoCard = null;
            }
            if (videoPlaceholderPrefix) videoPlaceholderPrefix.textContent = 'Describe your video';
            updateVideoSendState();
        });
    }

    // Video input bar interactions
    const videoMicBtn = document.getElementById('video-btn-mic');
    const videoSendBtn = document.getElementById('video-btn-send');

    function updateVideoSendState() {
        const hasText = videoPromptInput && videoPromptInput.value.trim().length > 0;
        const hasSelfie = videoSelfieFile != null;
        const hasContent = hasText || selectedVideoCard || hasSelfie;
        if (videoMicBtn) videoMicBtn.style.display = hasContent ? 'none' : 'flex';
        if (videoSendBtn) {
            videoSendBtn.style.display = hasContent ? 'flex' : 'none';
            videoSendBtn.disabled = !hasContent;
        }
        // Floating input: toggle has-text class for record → send morph + bg transition
        const floatInputRow = document.querySelector('.video-floating-input__input-row');
        const floatContainer = document.querySelector('.video-floating-input__container');
        if (floatInputRow) {
            floatInputRow.classList.toggle('has-text', hasText);
        }
        if (floatContainer) {
            floatContainer.classList.toggle('has-text', hasText);
        }
    }

    // Show/hide placeholder on input & toggle mic/send
    if (videoPromptInput) {
        videoPromptInput.addEventListener('input', () => {
            videoPromptInput.style.height = 'auto';
            videoPromptInput.style.height = Math.min(videoPromptInput.scrollHeight, 120) + 'px';
            if (videoPlaceholderOverlay) {
                videoPlaceholderOverlay.classList.toggle('hidden', videoPromptInput.value.length > 0);
            }
            updateVideoSendState();
        });
        videoPromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (videoSendBtn && !videoSendBtn.disabled) videoSendBtn.click();
            }
        });
    }

    // ---------- Video Selfie / Add Photo ----------
    const videoAddSelfieBtn = document.getElementById('video-add-selfie-btn');
    const videoSelfieInput = document.getElementById('video-selfie-input');
    const videoSelfieChip = document.getElementById('video-selfie-chip');
    const videoSelfieThumb = document.getElementById('video-selfie-thumb');
    const videoSelfieClose = document.getElementById('video-selfie-close');
    let videoSelfieFile = null;

    if (videoAddSelfieBtn && videoSelfieInput) {
        // Always show the add-photo button (not gated on template selection)
        videoAddSelfieBtn.classList.remove('hidden');

        videoAddSelfieBtn.addEventListener('click', () => {
            videoSelfieInput.click();
        });

        videoSelfieInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            videoSelfieFile = file;
            const url = URL.createObjectURL(file);
            if (videoSelfieThumb) videoSelfieThumb.src = url;
            if (videoSelfieChip) videoSelfieChip.hidden = false;
            videoAddSelfieBtn.classList.add('hidden');
            updateVideoSendState(); // selfie alone enables send
        });
    }

    if (videoSelfieClose) {
        videoSelfieClose.addEventListener('click', (e) => {
            e.stopPropagation();
            clearVideoSelfie();
        });
    }

    function clearVideoSelfie() {
        videoSelfieFile = null;
        if (videoSelfieChip) videoSelfieChip.hidden = true;
        if (videoSelfieInput) videoSelfieInput.value = '';
        if (videoSelfieThumb && videoSelfieThumb.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoSelfieThumb.src);
        }
        if (videoSelfieThumb) videoSelfieThumb.src = '';
        if (videoAddSelfieBtn) videoAddSelfieBtn.classList.remove('hidden');
    }

    // ---------- Video Response Screen ----------
    const videoResponseScreen = document.getElementById('video-response-screen');
    const videoBackBtn = document.getElementById('video-back-btn');
    const videoResponseTitle = document.getElementById('video-response-title');
    const videoResponseThumbTemplateImg = document.getElementById('video-response-thumb-template-img');
    const videoResponseThumbTemplateLabel = document.getElementById('video-response-thumb-template-label');
    const videoResponseThumbPhoto = document.getElementById('video-response-thumb-photo');
    const videoResponseThumbPhotoImg = document.getElementById('video-response-thumb-photo-img');
    const videoResponsePromptText = document.getElementById('video-response-prompt-text');
    const videoPlayerPoster = document.getElementById('video-player-poster');
    let isVideoResponseMode = false;

    function showVideoResponseScreen(template, prompt, selfieFile) {
        if (!videoResponseScreen || !videoShell) return;

        // Populate response header
        const tmplLabel = template
            ? (selectedVideoCard ? selectedVideoCard.querySelector('.video-card__label').textContent : template)
            : (selfieFile ? 'Your video' : 'Custom video');
        const tmplImg = template ? (videoTemplateImages[template] || '') : '';

        if (videoResponseTitle) videoResponseTitle.textContent = tmplLabel;
        if (videoResponseThumbTemplateImg) videoResponseThumbTemplateImg.src = tmplImg;
        if (videoResponseThumbTemplateLabel) videoResponseThumbTemplateLabel.textContent = tmplLabel;
        // Only use template image as poster if we have one
        if (videoPlayerPoster && tmplImg) videoPlayerPoster.src = tmplImg;

        // Build final prompt: user text > template prompt > generic fallback
        const userPrompt = prompt && prompt !== 'Describe your video' ? prompt : '';
        const templatePrompt = template ? (videoTemplatePrompts[template] || '') : '';
        const finalPrompt = userPrompt || templatePrompt || 'Create a cinematic video';

        if (videoResponsePromptText) videoResponsePromptText.textContent = userPrompt || templatePrompt || 'Describe your video';

        // Show selfie thumbnail if provided
        if (videoResponseThumbPhoto && videoResponseThumbPhotoImg && selfieFile) {
            videoResponseThumbPhotoImg.src = URL.createObjectURL(selfieFile);
            videoResponseThumbPhoto.hidden = false;
        } else if (videoResponseThumbPhoto) {
            videoResponseThumbPhoto.hidden = true;
        }

        // Switch to response mode
        videoShell.classList.add('video-shell--response');
        videoResponseScreen.hidden = false;
        isVideoResponseMode = true;

        // Clean input bar for response mode
        if (videoAttachmentChip) videoAttachmentChip.hidden = true;
        if (videoAddSelfieBtn) videoAddSelfieBtn.classList.add('hidden');
        if (videoSelfieChip) videoSelfieChip.hidden = true;
        if (videoPlaceholderPrefix) videoPlaceholderPrefix.textContent = 'Describe your video';
        if (videoPlaceholderOverlay) videoPlaceholderOverlay.classList.remove('hidden');
        if (videoPromptInput) videoPromptInput.value = '';
        updateVideoSendState();

        // Trigger generation — pass selfie and template image as references
        generateVideoWithVeo(finalPrompt, selfieFile, tmplImg);
    }

    // ---------- Veo 3 API Integration ----------
    const videoAnswerText = document.getElementById('video-response-answer-text');
    const videoPlayerPlayPause = document.getElementById('video-player-play-pause');
    const videoPlayerPlayIcon = document.getElementById('video-player-play-icon');

    // ---------- Load Video Into Player ----------
    let videoControlsWired = false;

    function loadVideoIntoPlayer(videoUrl) {
        const videoPlayer = document.getElementById('video-player');
        const viewport = document.getElementById('video-player-viewport');
        const poster = document.getElementById('video-player-poster');

        if (!viewport) {
            console.error('[Veo] ❌ viewport element not found!');
            return;
        }

        console.log('[Veo] Loading video into player:', videoUrl);

        // Remove loading state
        if (videoPlayer) videoPlayer.classList.remove('loading');

        // Get or CREATE the video element
        let video = document.getElementById('video-player-video');
        if (!video) {
            console.log('[Veo] Creating video element dynamically');
            video = document.createElement('video');
            video.id = 'video-player-video';
            video.playsInline = true;
            video.loop = true;
            video.preload = 'auto';
            video.style.cssText = '';
            video.className = 'video-player__video';
            viewport.appendChild(video);
        }

        // Stop any current playback
        video.pause();

        // Set source and show video, hide poster
        video.src = videoUrl;
        video.style.display = 'block';
        if (poster) poster.style.display = 'none';

        // Show play/pause button
        if (videoPlayerPlayPause) videoPlayerPlayPause.style.display = 'flex';

        // Update answer text
        if (videoAnswerText) videoAnswerText.textContent = 'Your video is ready!';

        // Get control elements
        const progressFill = document.getElementById('video-player-progress-fill');
        const progressThumb = document.getElementById('video-player-progress-thumb');
        const progressBar = document.getElementById('video-player-progress-track');
        const progressBarWrap = progressBar ? progressBar.parentElement : null;
        const currentTimeEl = document.getElementById('video-player-current-time');
        const totalTimeEl = document.getElementById('video-player-total-time');
        const soundToggle = document.getElementById('video-player-sound-toggle');
        const soundIcon = document.getElementById('video-player-sound-icon');

        // --- Auto-play (muted to satisfy browser policy) ---
        video.muted = true;
        video.load(); // Force reload with new src
        video.play().then(() => {
            console.log('[Veo] ✅ Autoplay succeeded');
            if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'pause';
            video.muted = false;
            if (soundIcon) soundIcon.textContent = 'volume_up';
        }).catch((err) => {
            console.log('[Veo] ⚠ Autoplay blocked:', err.message);
            if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'play_arrow';
        });

        // Wire controls only once (prevent event listener stacking)
        if (!videoControlsWired) {
            videoControlsWired = true;

            // --- Play/Pause ---
            if (videoPlayerPlayPause) {
                videoPlayerPlayPause.addEventListener('click', () => {
                    const v = document.getElementById('video-player-video');
                    if (!v || !v.src) return;
                    if (v.paused) {
                        v.play();
                        if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'pause';
                    } else {
                        v.pause();
                        if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'play_arrow';
                    }
                });
            }

            // --- Keep icon in sync with actual playback state ---
            video.addEventListener('play', () => {
                if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'pause';
            });
            video.addEventListener('pause', () => {
                if (videoPlayerPlayIcon) videoPlayerPlayIcon.textContent = 'play_arrow';
            });

            // --- Time & Progress ---
            video.addEventListener('loadedmetadata', () => {
                console.log('[Veo] Metadata loaded, duration:', video.duration);
                if (totalTimeEl) totalTimeEl.textContent = formatTime(video.duration);
            });

            let isScrubbing = false;

            video.addEventListener('timeupdate', () => {
                if (video.duration && !isScrubbing) {
                    const pct = (video.currentTime / video.duration) * 100;
                    if (progressFill) progressFill.style.width = pct + '%';
                    if (progressThumb) progressThumb.style.left = pct + '%';
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
                }
            });

            // --- Scrubbing ---
            function scrubTo(e) {
                if (!progressBar || !video.duration) return;
                const rect = progressBar.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                video.currentTime = pct * video.duration;
                if (progressFill) progressFill.style.width = (pct * 100) + '%';
                if (progressThumb) progressThumb.style.left = (pct * 100) + '%';
                if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
            }

            if (progressBar) {
                progressBar.addEventListener('mousedown', (e) => {
                    isScrubbing = true;
                    if (progressBarWrap) progressBarWrap.classList.add('scrubbing');
                    scrubTo(e);
                });

                progressBar.addEventListener('touchstart', (e) => {
                    isScrubbing = true;
                    if (progressBarWrap) progressBarWrap.classList.add('scrubbing');
                    scrubTo(e.touches[0]);
                }, { passive: true });

                progressBar.addEventListener('touchmove', (e) => {
                    if (isScrubbing) scrubTo(e.touches[0]);
                }, { passive: true });

                progressBar.addEventListener('touchend', () => {
                    isScrubbing = false;
                    if (progressBarWrap) progressBarWrap.classList.remove('scrubbing');
                });
            }

            document.addEventListener('mousemove', (e) => {
                if (isScrubbing) scrubTo(e);
            });

            document.addEventListener('mouseup', () => {
                if (isScrubbing) {
                    isScrubbing = false;
                    if (progressBarWrap) progressBarWrap.classList.remove('scrubbing');
                }
            });

            // --- Mute/Unmute ---
            if (soundToggle) {
                soundToggle.addEventListener('click', () => {
                    const v = document.getElementById('video-player-video');
                    if (!v) return;
                    v.muted = !v.muted;
                    if (soundIcon) {
                        soundIcon.textContent = v.muted ? 'volume_off' : 'volume_up';
                    }
                });
            }

            // Log video errors
            video.addEventListener('error', () => {
                console.error('[Veo] Video playback error:', video.error?.message, video.error?.code);
            });
        }

        console.log('[Veo] ✅ Video loaded and controls ready');

        // ── Early prefetch: start extracting keyframes + generating shot
        // variations in the background as soon as the video lands in the
        // response player.  This means the shots are already cached by the
        // time the user opens the editor, making it feel instant.
        const earlyPath = cleanVideoPath(videoUrl);
        if (earlyPath) {
            // Small delay to let the player settle, then fire
            setTimeout(() => startEarlyPrefetch(earlyPath), 500);
        }
    }

    // ---------- Fallback: load latest existing video ----------
    // Listed newest-first so the best video is tried first.
    // Add any newly generated videos to the top of this list before deploying.
    const FALLBACK_VIDEOS = [
        'videos/generated_1773174271100.mp4',
        'videos/generated_1773172427497.mp4',
        'videos/generated_1772379360207.mp4',
        'videos/generated_1772329724953.mp4',
        'videos/generated_1772323308765.mp4',
        'videos/generated_1772321732906.mp4',
        'videos/generated_1772321611969.mp4',
        'videos/generated_1772320569177.mp4',
        'videos/generated_1772320449717.mp4',
    ];

    async function loadFallbackVideo() {
        // Try each video in order until one loads successfully
        for (const pick of FALLBACK_VIDEOS) {
            try {
                // HEAD request to verify the file actually exists on this host
                const check = await fetch(pick, { method: 'HEAD' });
                if (check.ok) {
                    console.log('[Veo] Loading fallback video:', pick);
                    lastEditorVideoPath = '';
                    prefetchCache.clear();
                    loadVideoIntoPlayer(pick);
                    return true;
                }

            } catch (e) {
                // Network error or CORS — skip to next
            }
        }
        console.error('[Veo] No fallback videos found on this host');
        return false;
    }

    async function generateVideoWithVeo(prompt, selfieFile, templateImgUrl) {
        const videoPlayer = document.getElementById('video-player');
        console.log('[Veo] generateVideoWithVeo called, prompt:', prompt?.substring(0, 80));

        // Show loading state
        if (videoAnswerText) videoAnswerText.textContent = 'Generating your video…';
        if (videoPlayerPlayPause) videoPlayerPlayPause.style.display = 'none';
        if (videoPlayer) videoPlayer.classList.add('loading');

        try {
            // Check if the server API is available
            let hasServerApi = false;
            try {
                const statusRes = await fetch('./api/veo-status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    hasServerApi = !!statusData.hasKey;
                }
            } catch (e) {
                console.log('[Veo] No server API detected — loading fallback video');
            }

            if (!hasServerApi) {
                const loaded = await loadFallbackVideo();
                if (!loaded) {
                    if (videoPlayer) videoPlayer.classList.remove('loading');
                    if (videoAnswerText) videoAnswerText.textContent = 'No videos available.';
                    if (videoPlayerPlayPause) videoPlayerPlayPause.style.display = 'flex';
                }
                return;
            }

            // Build request — attach selfie or template image as reference if provided
            const body = { prompt };

            // Prefer selfie over template image as the reference
            const refFile = selfieFile || null;
            const refUrl = !refFile && templateImgUrl ? templateImgUrl : null;

            if (refFile) {
                body.imageBase64 = await fileToBase64(refFile);
                body.mimeType = refFile.type || 'image/jpeg';
            } else if (refUrl) {
                // Fetch template image and convert to base64
                try {
                    const imgRes = await fetch(refUrl);
                    if (imgRes.ok) {
                        const blob = await imgRes.blob();
                        body.imageBase64 = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result.split(',')[1]);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        body.mimeType = blob.type || 'image/jpeg';
                    }
                } catch (e) {
                    console.warn('[Veo] Could not load template image as reference:', e.message);
                }
            }

            console.log('[Veo] Sending request — hasImage:', !!body.imageBase64);
            const res = await fetch('./api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            console.log('[Veo] Response:', res.status, JSON.stringify(data).substring(0, 200));

            if (data.success && data.videoUrl) {
                console.log('[Veo] ✅ New video generated:', data.videoUrl);
                // Reset editor cache so next editor open always gets fresh keyframes
                lastEditorVideoPath = '';
                prefetchCache.clear();
                loadVideoIntoPlayer(data.videoUrl);

            } else {
                console.error('[Veo] ❌ Generation failed:', data.error);
                if (data.error) showToast('Veo: ' + (typeof data.error === 'string' ? data.error : String(data.error)).substring(0, 80));
                const loaded = await loadFallbackVideo();
                if (!loaded) {
                    if (videoAnswerText) videoAnswerText.textContent = 'Video generation failed. Try again.';
                    if (videoPlayerPlayPause) videoPlayerPlayPause.style.display = 'flex';
                    if (videoPlayer) videoPlayer.classList.remove('loading');
                }
            }
        } catch (err) {
            console.error('[Veo] ❌ Fetch error:', err);
            showToast('Veo error: ' + (err.message || String(err)).substring(0, 80));
            const loaded = await loadFallbackVideo();
            if (!loaded) {
                if (videoAnswerText) videoAnswerText.textContent = 'Connection error. Try again.';
                if (videoPlayerPlayPause) videoPlayerPlayPause.style.display = 'flex';
                if (videoPlayer) videoPlayer.classList.remove('loading');
            }
        }
    }


    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                // Remove data:...;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + s.toString().padStart(2, '0');
    }

    function hideVideoResponseScreen() {
        if (!videoResponseScreen || !videoShell) return;

        videoResponseScreen.classList.add('exiting');
        setTimeout(() => {
            videoResponseScreen.classList.remove('exiting');
            videoResponseScreen.hidden = true;
            videoShell.classList.remove('video-shell--response');
            isVideoResponseMode = false;

            // Reset video element (pause, hide, clear src)
            const genVideo = document.getElementById('video-player-video');
            if (genVideo) {
                genVideo.pause();
                genVideo.removeAttribute('src');
                genVideo.load(); // reset internal state
                genVideo.style.display = 'none';
            }
            // Restore poster
            const poster = document.getElementById('video-player-poster');
            if (poster) poster.style.display = '';

            // Reset card selections
            videoCards.forEach(c => c.classList.remove('selected'));
            selectedVideoCard = null;

            // Reset attachments
            if (videoAttachmentChip) videoAttachmentChip.hidden = true;

            // Clear selfie
            clearVideoSelfie();

            // Reset placeholder
            if (videoPlaceholderPrefix) videoPlaceholderPrefix.textContent = 'Describe your video';
            if (videoPlaceholderOverlay) videoPlaceholderOverlay.classList.remove('hidden');

            // Reset prompt
            if (videoPromptInput) videoPromptInput.value = '';
            updateVideoSendState();
        }, 300);
    }

    // Back button
    if (videoBackBtn) {
        videoBackBtn.addEventListener('click', hideVideoResponseScreen);
    }

    // Send button handler
    if (videoSendBtn) {
        videoSendBtn.addEventListener('click', () => {
            const prompt = videoPromptInput ? videoPromptInput.value.trim() : '';

            if (isVideoResponseMode) {
                // Already on response screen — use prompt for regeneration
                if (prompt) {
                    if (videoPromptInput) videoPromptInput.value = '';
                    if (videoPlaceholderOverlay) videoPlaceholderOverlay.classList.remove('hidden');
                    updateVideoSendState();
                    if (videoResponsePromptText) videoResponsePromptText.textContent = prompt;
                    generateVideoWithVeo(prompt, null, null);
                }
                return;
            }

            // Allow submission with: template, selfie, prompt — any combination
            const template = selectedVideoCard ? selectedVideoCard.dataset.vtemplate : null;
            showVideoResponseScreen(template, prompt, videoSelfieFile);
        });
    }
    // ---------- Video Toolbar Scroll Blur ----------
    const videoContent = document.getElementById('video-content');
    const videoGlassToolbar = document.getElementById('video-glass-toolbar');
    if (videoContent && videoGlassToolbar) {
        videoContent.addEventListener('scroll', () => {
            videoGlassToolbar.classList.toggle('video-glass-toolbar--scrolled', videoContent.scrollTop > 2);
        }, { passive: true });
    }
    // ---------- Video Edit Screen ----------
    const videoEditScreen = document.getElementById('video-edit-screen');
    const videoEditClose = document.getElementById('video-edit-close');
    const videoEditDone = document.getElementById('video-edit-done');
    const videoEditBtn = document.getElementById('video-player-edit-btn');
    const videoEditVideo = document.getElementById('video-edit-video');
    const videoEditPlayPause = document.getElementById('video-edit-play-pause');
    const videoEditPlayIcon = document.getElementById('video-edit-play-icon');
    const videoEditCurrentTime = document.getElementById('video-edit-current-time');
    const videoEditTotalTime = document.getElementById('video-edit-total-time');
    const videoEditScrubberFill = document.getElementById('video-edit-scrubber-fill');
    const videoEditScrubberThumb = document.getElementById('video-edit-scrubber-thumb');
    const videoEditScrubberTrack = document.getElementById('video-edit-scrubber-track');
    const videoEditMuteBtn = document.getElementById('video-edit-mute');
    const videoEditMuteIcon = document.getElementById('video-edit-mute-icon');
    const videoEditTools = document.querySelectorAll('.video-edit__tool');
    let videoEditControlsWired = false;

    // ── Navbar state helpers ──────────────────────────────────────────────
    // Starter screen: [X icon] · "Edit" title · [Save] (disabled until dirty)
    function showStarterHeader() {
        const cancelBtn = document.getElementById('video-edit-cancel');
        if (videoEditClose) videoEditClose.hidden = false;
        if (cancelBtn) cancelBtn.hidden = true;
        if (videoEditTitle) { videoEditTitle.hidden = false; videoEditTitle.textContent = 'Edit'; }
        if (videoEditAppbarActions) videoEditAppbarActions.hidden = true;
        if (videoEditDone) {
            videoEditDone.textContent = 'Save';
            videoEditDone.style.color = '';
            videoEditDone.disabled = !videoEditDirty;
        }
    }
    // Sub-tool screen: [Cancel] · [Undo] · [Redo] · [Done]
    function showSubtoolHeader() {
        const cancelBtn = document.getElementById('video-edit-cancel');
        if (videoEditClose) videoEditClose.hidden = true;
        if (cancelBtn) cancelBtn.hidden = false;
        if (videoEditTitle) videoEditTitle.hidden = true;
        if (videoEditAppbarActions) videoEditAppbarActions.hidden = false;
        if (videoEditDone) {
            videoEditDone.textContent = 'Done';
            videoEditDone.style.color = '';
            videoEditDone.disabled = false;
        }
    }
    // Keep setResizeHeader as alias for compatibility with existing call sites
    function setResizeHeader(active) {
        if (active) showSubtoolHeader(); else showStarterHeader();
    }

    function markDirty() {
        videoEditDirty = true;
        if (videoEditDone && videoEditDone.textContent === 'Save') {
            videoEditDone.disabled = false;
        }
    }

    function openVideoEditor() {
        if (!videoEditScreen) return;

        // Reset dirty state for new session
        videoEditDirty = false;
        hideVideoDiscardDialog();

        // Get current video src from response player
        const responseVideo = document.getElementById('video-player-video');
        let currentSrc = responseVideo ? responseVideo.src : '';
        if (!currentSrc) {
            console.log('[VideoEdit] No video to edit');
            return;
        }

        // Pause the response player
        if (responseVideo) responseVideo.pause();

        // Determine the clean path (no ?t=) for cache keying
        const path = cleanVideoPath(currentSrc);

        // Three-way check: path matches, cache exists, AND editor video already has this src loaded
        const editorCurrentPath = cleanVideoPath(videoEditVideo ? videoEditVideo.src : '');
        const isSameVideo = path
            && path === lastEditorVideoPath
            && path === editorCurrentPath
            && prefetchCache.has(path);

        console.log(`[VideoEdit] open — path=${path} last=${lastEditorVideoPath} editorPath=${editorCurrentPath} sameVideo=${isSameVideo}`);

        if (isSameVideo) {
            // Same video re-opened — skip reload, serve everything from cache
            console.log('[VideoEdit] ✅ Same video re-opened, using cached keyframes/shots');
            if (videoEditVideo) {
                videoEditVideo.muted = true;
                if (videoEditMuteIcon) videoEditMuteIcon.textContent = 'volume_off';
            }
        } else {
            // New video (or cache mismatch) — bust browser cache with ?t= and start fresh
            const freshSrc = currentSrc.split('?')[0] + '?t=' + Date.now();
            lastEditorVideoPath = path || '';
            loadedVariationsIndex = -1; // reset so first keyframe tap always generates

            if (videoEditVideo) {
                videoEditVideo.removeAttribute('src');
                videoEditVideo.load();
                videoEditVideo.src = freshSrc;
                videoEditVideo.load();
                videoEditVideo.currentTime = 0;
                videoEditVideo.muted = true;
                if (videoEditMuteIcon) videoEditMuteIcon.textContent = 'volume_off';

                if (path) {
                    if (prefetchCache.has(path)) {
                        // Early prefetch already running/done — reuse it
                        console.log('[VideoEdit] ✅ Early prefetch cache hit — skipping redundant extraction');
                    } else {
                        // No early cache — start fresh on loadeddata
                        prefetchCache.clear();
                        videoEditVideo.addEventListener('loadeddata', () => {
                            startPrefetch(path);
                        }, { once: true });
                    }
                }
            }

            // Reset scrubber to 0 for the new video
            if (videoEditScrubberFill) videoEditScrubberFill.style.width = '0%';
            if (videoEditScrubberThumb) videoEditScrubberThumb.style.left = '0%';
            if (videoEditCurrentTime) videoEditCurrentTime.textContent = '0:00';
        }


        // Show the edit screen
        videoEditScreen.hidden = false;
        videoEditScreen.classList.remove('exiting');

        // Open paused and muted
        if (videoEditVideo) {
            videoEditVideo.pause();
            videoEditVideo.muted = true;
            if (videoEditMuteIcon) videoEditMuteIcon.textContent = 'volume_off';
            if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'play_arrow';
        }

        // Wire controls only once
        if (!videoEditControlsWired) {
            videoEditControlsWired = true;

            // Play/Pause
            if (videoEditPlayPause) {
                videoEditPlayPause.addEventListener('click', () => {
                    if (!videoEditVideo) return;
                    if (videoEditVideo.paused) {
                        videoEditVideo.play();
                        if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'pause';
                    } else {
                        videoEditVideo.pause();
                        if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'play_arrow';
                    }
                });
            }

            // Metadata
            if (videoEditVideo) {
                videoEditVideo.addEventListener('loadedmetadata', () => {
                    if (videoEditTotalTime) videoEditTotalTime.textContent = formatTime(videoEditVideo.duration);
                });

                // Time update
                let editScrubbing = false;
                videoEditVideo.addEventListener('timeupdate', () => {
                    if (videoEditVideo.duration && !editScrubbing) {
                        const pct = (videoEditVideo.currentTime / videoEditVideo.duration) * 100;
                        if (videoEditScrubberFill) videoEditScrubberFill.style.width = pct + '%';
                        if (videoEditScrubberThumb) videoEditScrubberThumb.style.left = pct + '%';
                        if (videoEditCurrentTime) videoEditCurrentTime.textContent = formatTime(videoEditVideo.currentTime);
                    }
                });

                // Scrubbing
                function editScrubTo(e) {
                    if (!videoEditScrubberTrack || !videoEditVideo.duration) return;
                    const rect = videoEditScrubberTrack.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const pct = x / rect.width;
                    videoEditVideo.currentTime = pct * videoEditVideo.duration;
                    if (videoEditScrubberFill) videoEditScrubberFill.style.width = (pct * 100) + '%';
                    if (videoEditScrubberThumb) videoEditScrubberThumb.style.left = (pct * 100) + '%';
                    if (videoEditCurrentTime) videoEditCurrentTime.textContent = formatTime(videoEditVideo.currentTime);
                }

                if (videoEditScrubberTrack) {
                    videoEditScrubberTrack.addEventListener('mousedown', (e) => {
                        editScrubbing = true;
                        editScrubTo(e);
                    });
                    videoEditScrubberTrack.addEventListener('touchstart', (e) => {
                        editScrubbing = true;
                        editScrubTo(e.touches[0]);
                    }, { passive: true });
                    videoEditScrubberTrack.addEventListener('touchmove', (e) => {
                        if (editScrubbing) editScrubTo(e.touches[0]);
                    }, { passive: true });
                    videoEditScrubberTrack.addEventListener('touchend', () => { editScrubbing = false; });
                }

                document.addEventListener('mousemove', (e) => {
                    if (editScrubbing) editScrubTo(e);
                });
                document.addEventListener('mouseup', () => { editScrubbing = false; });
            }

            // Mute/Unmute
            if (videoEditMuteBtn && videoEditVideo) {
                videoEditMuteBtn.addEventListener('click', () => {
                    videoEditVideo.muted = !videoEditVideo.muted;
                    if (videoEditMuteIcon) {
                        videoEditMuteIcon.textContent = videoEditVideo.muted ? 'volume_off' : 'volume_up';
                    }
                });
            }

            // Tool selection
            const videoResizeSubtools = document.getElementById('video-edit-resize-subtools');
            const videoEditViewport = document.getElementById('video-edit-viewport');

            // Map subtool value → CSS class
            const RATIO_CLASSES = {
                landscape: 'video-edit__player-viewport--landscape',
                square: 'video-edit__player-viewport--square',
                portrait: 'video-edit__player-viewport--portrait',
            };

            function applyVideoRatio(ratio) {
                if (!videoEditViewport) return;
                // Remove all ratio classes then apply the chosen one
                Object.values(RATIO_CLASSES).forEach(cls => videoEditViewport.classList.remove(cls));
                if (RATIO_CLASSES[ratio]) videoEditViewport.classList.add(RATIO_CLASSES[ratio]);
                // Toggle portrait layout on the screen element
                if (videoEditScreen) {
                    videoEditScreen.classList.toggle('video-edit-screen--portrait', ratio === 'portrait');
                }
            }

            // Cancel button: deactivate resize tool and restore header
            if (videoEditCancel) {
                videoEditCancel.addEventListener('click', () => {
                    videoEditTools.forEach(t => t.classList.remove('active'));
                    if (videoResizeSubtools) videoResizeSubtools.hidden = true;
                    applyVideoRatio('landscape');
                    setResizeHeader(false);
                });
            }

            videoEditTools.forEach(tool => {
                tool.addEventListener('click', () => {
                    const vtool = tool.dataset.vtool;
                    const isActive = tool.classList.contains('active');
                    videoEditTools.forEach(t => t.classList.remove('active'));

                    if (!isActive) {
                        tool.classList.add('active');
                        videoEditDirty = true; // mark session as edited
                        if (videoResizeSubtools) {
                            if (vtool === 'resize') {
                                videoResizeSubtools.hidden = false;
                                // Default to landscape when opening resize
                                applyVideoRatio('landscape');
                                // Highlight landscape subtool
                                videoResizeSubtools.querySelectorAll('.edit-modal__subtool').forEach(b => {
                                    b.classList.toggle('active', b.dataset.vsubtool === 'landscape');
                                });
                                setResizeHeader(true);
                            } else {
                                videoResizeSubtools.hidden = true;
                                setResizeHeader(false);
                            }
                        }
                    } else {
                        // Deactivated — hide subtools, restore landscape
                        if (videoResizeSubtools) videoResizeSubtools.hidden = true;
                        applyVideoRatio('landscape');
                        setResizeHeader(false);
                    }
                });
            });

            // Resize subtool selection — change aspect ratio on tap
            if (videoResizeSubtools) {
                videoResizeSubtools.querySelectorAll('.edit-modal__subtool').forEach(btn => {
                    btn.addEventListener('click', () => {
                        videoResizeSubtools.querySelectorAll('.edit-modal__subtool')
                            .forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        applyVideoRatio(btn.dataset.vsubtool);
                    });
                });
            }
        }
    }

    function closeVideoEditor() {
        if (!videoEditScreen) return;
        videoEditScreen.classList.add('exiting');
        if (videoEditVideo) {
            videoEditVideo.pause();
        }
        // Hide discard dialog if open
        hideVideoDiscardDialog();
        // Always restore starter header on close
        showStarterHeader();
        // Reset tool selection and subtools
        videoEditTools.forEach(t => t.classList.remove('active'));
        const resizeSub = document.getElementById('video-edit-resize-subtools');
        if (resizeSub) resizeSub.hidden = true;
        // Reset aspect ratio to landscape
        const vp = document.getElementById('video-edit-viewport');
        if (vp) {
            vp.classList.remove(
                'video-edit__player-viewport--landscape',
                'video-edit__player-viewport--square',
                'video-edit__player-viewport--portrait'
            );
        }
        if (videoEditScreen) videoEditScreen.classList.remove('video-edit-screen--portrait');

        setTimeout(() => {
            videoEditScreen.classList.remove('exiting');
            videoEditScreen.hidden = true;

            // Resume response player
            const responseVideo = document.getElementById('video-player-video');
            if (responseVideo && responseVideo.src) {
                responseVideo.play().catch(() => { });
            }
        }, 300);
    }

    // Dirty-state tracking — set true whenever user makes an edit action
    let videoEditDirty = false;

    function showVideoDiscardDialog() {
        const dlg = document.getElementById('video-discard-dialog');
        if (dlg) dlg.hidden = false;
    }
    function hideVideoDiscardDialog() {
        const dlg = document.getElementById('video-discard-dialog');
        if (dlg) dlg.hidden = true;
    }
    function handleVideoCloseAttempt() {
        if (videoEditDirty) {
            showVideoDiscardDialog();
        } else {
            closeVideoEditor();
        }
    }

    // Edit button on video player opens editor
    if (videoEditBtn) {
        videoEditBtn.addEventListener('click', openVideoEditor);
    }

    // X close button — triggers discard dialog if dirty
    if (videoEditClose) {
        videoEditClose.addEventListener('click', handleVideoCloseAttempt);
    }

    // Cancel button (shown in sub-tool modes) — exits sub-tool back to default
    const videoEditCancelBtn = document.getElementById('video-edit-cancel');
    if (videoEditCancelBtn) {
        videoEditCancelBtn.addEventListener('click', () => {
            if (isShotsMode) {
                exitShotsMode();
            } else {
                // In resize mode — deactivate tool, restore default header
                videoEditTools.forEach(t => t.classList.remove('active'));
                const resizeSub = document.getElementById('video-edit-resize-subtools');
                if (resizeSub) resizeSub.hidden = true;
                applyVideoRatio('landscape');
                setResizeHeader(false);
            }
        });
    }

    // Done/Save button
    if (videoEditDone) {
        videoEditDone.addEventListener('click', () => {
            if (isShotsMode) {
                // Done in Shots → return to starter screen
                exitShotsMode();
            } else if (videoEditDone.textContent === 'Done') {
                // Done in any other sub-tool → return to starter screen
                videoEditTools.forEach(t => t.classList.remove('active'));
                const resizeSub = document.getElementById('video-edit-resize-subtools');
                if (resizeSub) resizeSub.hidden = true;
                applyVideoRatio('landscape');
                showStarterHeader();
            } else {
                // Save on starter screen → close editor
                videoEditDirty = false;
                closeVideoEditor();
            }
        });
    }

    // Discard dialog buttons
    const videoDiscardKeep = document.getElementById('video-discard-keep');
    const videoDiscardConfirm = document.getElementById('video-discard-confirm');
    const videoDiscardClose = document.getElementById('video-discard-close');
    const videoDiscardBackdrop = document.getElementById('video-discard-backdrop');
    if (videoDiscardKeep) videoDiscardKeep.addEventListener('click', hideVideoDiscardDialog);
    if (videoDiscardClose) videoDiscardClose.addEventListener('click', hideVideoDiscardDialog);
    if (videoDiscardBackdrop) videoDiscardBackdrop.addEventListener('click', hideVideoDiscardDialog);
    if (videoDiscardConfirm) {
        videoDiscardConfirm.addEventListener('click', () => {
            hideVideoDiscardDialog();
            videoEditDirty = false;
            closeVideoEditor();
        });
    }

    // ---------- Shots Panel Logic ----------
    const videoEditShotsPanel = document.getElementById('video-edit-shots-panel');
    const videoEditToolsSection = document.getElementById('video-edit-tools-section');
    const videoEditGestureBar = document.getElementById('video-edit-gesture-bar');
    const videoEditCancel = document.getElementById('video-edit-cancel');
    const videoEditTitle = document.getElementById('video-edit-title');
    const videoEditCloseBtn = document.getElementById('video-edit-close');
    const keyframesStrip = document.getElementById('video-edit-keyframes-strip');
    const variationsGrid = document.getElementById('video-edit-variations-grid');
    const variationsArea = document.querySelector('.video-edit__variations-area');
    const shotsInputBar = document.querySelector('.video-edit__shots-input-bar');
    const shotsGesture = document.querySelector('.video-edit__shots-gesture');
    let isShotsMode = false;
    let lastExtractedVideoSrc = '';
    let extractedKeyframes = [];
    let selectedKeyframeIndex = -1;
    let loadedVariationsIndex = -1; // which keyframe's shots are currently displayed

    // ── Prefetch cache ─────────────────────────────────────────────────────
    // Keyed by clean video path (no ?t=). Stores:
    //   frames: Promise<Array<{dataUrl, time}>>          — resolves when all 8 frames ready
    //   variations: Array<Promise<Array<variation>>>     — one promise per frame (4 variations each)
    const prefetchCache = new Map();
    let lastEditorVideoPath = ''; // path of the video currently cached

    // Fetch variations for a single frame and return the array
    async function fetchVariationsForFrame(frameDataUrl) {
        const base64 = frameDataUrl.split(',')[1];
        try {
            const res = await fetch('./api/generate-shot-variations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.variations && data.variations.length > 0) return data.variations;
            }
        } catch (e) { /* fall through to canvas fallback */ }
        return null; // null = use canvas fallback when rendering
    }

    // Start background prefetch for a given clean video path
    function startPrefetch(cleanVideoPath) {
        if (prefetchCache.has(cleanVideoPath)) return; // already running or done
        console.log('[Prefetch] Starting background extraction for', cleanVideoPath);

        // Promise that resolves to the 8 extracted frames
        const framesPromise = extractKeyframes(videoEditVideo);

        // Once frames are ready, kick off 8 parallel variation fetches
        const variationPromises = Array.from({ length: 8 }, (_, i) =>
            framesPromise.then(frames => {
                if (!frames[i]) return null;
                console.log(`[Prefetch] Generating variations for frame ${i + 1}/8...`);
                return fetchVariationsForFrame(frames[i].dataUrl);
            })
        );

        prefetchCache.set(cleanVideoPath, { framesPromise, variationPromises });

        // Log when everything is done
        framesPromise.then(frames => console.log(`[Prefetch] ✅ ${frames.length} keyframes ready`));
        Promise.all(variationPromises).then(() => console.log('[Prefetch] ✅ All variations ready'));
    }

    /**
     * Early prefetch — starts background keyframe extraction + shot variation
     * generation using the SERVER-SIDE API (no editor video element needed).
     * Called from loadVideoIntoPlayer so the work begins while the user is
     * still watching the response, not when they open the editor.
     */
    function startEarlyPrefetch(vPath) {
        if (prefetchCache.has(vPath)) return; // already running or done
        console.log('[EarlyPrefetch] 🚀 Starting background keyframe + shot generation for', vPath);

        const NUM_FRAMES = 8;

        // Step 1: Extract keyframes via server API
        const framesPromise = (async () => {
            try {
                const res = await fetch('./api/extract-keyframes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoPath: vPath, numFrames: NUM_FRAMES })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.frames && data.frames.length > 0) {
                        console.log(`[EarlyPrefetch] ✅ ${data.frames.length} keyframes extracted`);
                        return data.frames.map((f, i) => ({
                            dataUrl: 'data:image/jpeg;base64,' + f.base64,
                            time: i // approximate — will be recalculated when editor opens
                        }));
                    }
                }
            } catch (e) {
                console.warn('[EarlyPrefetch] Server keyframe extraction failed:', e.message);
            }
            return []; // empty = editor will fall back to its own extraction
        })();

        // Step 2: Once frames are ready, kick off parallel shot variation generation
        const variationPromises = Array.from({ length: NUM_FRAMES }, (_, i) =>
            framesPromise.then(frames => {
                if (!frames[i]) return null;
                console.log(`[EarlyPrefetch] Generating shot variations for frame ${i + 1}/${NUM_FRAMES}...`);
                return fetchVariationsForFrame(frames[i].dataUrl);
            })
        );

        // Store in the same prefetchCache the editor uses
        lastEditorVideoPath = vPath;
        prefetchCache.set(vPath, { framesPromise, variationPromises });

        framesPromise.then(f => console.log(`[EarlyPrefetch] ✅ ${f.length} keyframes cached`));
        Promise.all(variationPromises).then(results => {
            const ready = results.filter(Boolean).length;
            console.log(`[EarlyPrefetch] ✅ ${ready}/${NUM_FRAMES} shot variations cached`);
        });
    }

    // Get clean path from a video element's src
    function cleanVideoPath(src) {
        const noParam = (src || '').split('?')[0];
        const idx = noParam.indexOf('/videos/');
        return idx >= 0 ? noParam.substring(idx) : null;
    }

    // Undo/Redo state
    const videoEditAppbarActions = document.getElementById('video-edit-appbar-actions');
    const videoEditUndo = document.getElementById('video-edit-undo');
    const videoEditRedo = document.getElementById('video-edit-redo');
    let shotEditHistory = []; // { keyframeIdx, oldDataUrl, newDataUrl }
    let shotEditHistoryPos = -1;

    // Extract 8 keyframes from the video using canvas
    async function extractKeyframes(video) {
        const NUM_FRAMES = 8;
        const duration = video.duration || 8;

        // Try server-side extraction first if we know the video URL
        const videoSrc = video.src || '';
        // Strip cache-bust param (?t=...) before sending path to server
        const cleanSrc = videoSrc.split('?')[0];
        const videoPath = cleanSrc.includes('/videos/') ? cleanSrc.substring(cleanSrc.indexOf('/videos/')) : null;
        if (videoPath) {
            try {
                const res = await fetch('./api/extract-keyframes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoPath, numFrames: NUM_FRAMES })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.frames && data.frames.length > 0) {
                        console.log('[Shots] ✅ Server-side keyframe extraction succeeded');
                        return data.frames.map((f, i) => ({
                            dataUrl: 'data:image/jpeg;base64,' + f.base64,
                            time: (i / NUM_FRAMES) * duration
                        }));
                    }
                }
            } catch (e) {
                console.log('[Shots] Server-side extraction failed, falling back to canvas:', e.message);
            }
        }

        // Client-side canvas fallback
        console.log('[Shots] Extracting keyframes via canvas...');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 360;

        // Ensure video is seekable
        if (video.readyState < 2) {
            await new Promise(resolve => video.addEventListener('loadeddata', resolve, { once: true }));
        }

        const frames = [];
        const wasPaused = video.paused;

        for (let i = 0; i < NUM_FRAMES; i++) {
            const time = (i / NUM_FRAMES) * duration + 0.1;
            video.currentTime = time;

            // Wait for seek with timeout fallback
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, 1500);
                video.addEventListener('seeked', () => { clearTimeout(timeout); resolve(); }, { once: true });
            });

            // Small delay to let the frame render
            await new Promise(r => setTimeout(r, 50));

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Check if frame is blank (all black) — sample center pixel
            const px = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
            const isBlank = px[0] < 5 && px[1] < 5 && px[2] < 5;
            if (isBlank) {
                console.warn(`[Shots] Frame ${i} appears blank, retrying...`);
                await new Promise(r => setTimeout(r, 200));
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            frames.push({
                dataUrl: canvas.toDataURL('image/jpeg', 0.85),
                time: time
            });
        }

        if (!wasPaused) video.play();
        return frames;
    }

    // Render keyframe thumbnails into the strip
    function renderKeyframes(frames) {
        if (!keyframesStrip) return;
        keyframesStrip.innerHTML = '';
        frames.forEach((frame, idx) => {
            const div = document.createElement('div');
            div.className = 'video-edit__keyframe';
            if (frame.dataUrl) {
                const img = document.createElement('img');
                img.src = frame.dataUrl;
                img.alt = `Frame ${idx + 1}`;
                div.appendChild(img);
            } else {
                div.classList.add('placeholder');
            }
            div.addEventListener('click', () => selectKeyframe(idx));
            keyframesStrip.appendChild(div);
        });
    }

    // Highlight a keyframe (visual only, no variation gen)
    function highlightKeyframe(idx) {
        if (selectedKeyframeIndex === idx) return;
        selectedKeyframeIndex = idx;
        const keyframeDivs = keyframesStrip.querySelectorAll('.video-edit__keyframe');
        keyframeDivs.forEach((d, i) => d.classList.toggle('selected', i === idx));
        // Auto-scroll so the selected keyframe is always visible
        if (keyframeDivs[idx]) {
            keyframeDivs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    // Select a keyframe (user tap — seek + pause + serve from cache or generate)
    function selectKeyframe(idx) {
        // Seek video to this frame's time and pause
        if (videoEditVideo && extractedKeyframes[idx]) {
            videoEditVideo.currentTime = extractedKeyframes[idx].time;
            videoEditVideo.pause();
            if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'play_arrow';
        }

        // If this keyframe's shots are already loaded, just highlight + show panel
        if (idx === loadedVariationsIndex && variationsGrid && variationsGrid.children.length > 0) {
            highlightKeyframe(idx);
            showVariationsPanel();
            return;
        }

        highlightKeyframe(idx);
        showVariationsPanel();

        // Check prefetch cache for pre-generated variations
        const vpath = cleanVideoPath(videoEditVideo ? videoEditVideo.src : '');
        const vcached = vpath ? prefetchCache.get(vpath) : null;

        if (vcached && vcached.variationPromises && vcached.variationPromises[idx]) {
            // Show loading cards immediately
            if (variationsGrid) {
                variationsGrid.innerHTML = '';
                for (let i = 0; i < 4; i++) {
                    const card = document.createElement('div');
                    card.className = 'video-edit__variation-card loading';
                    card.innerHTML = `
                        <div class="video-edit__variation-overlay">
                            <div class="video-edit__variation-icon">
                                <span class="material-symbols-outlined">videocam</span>
                            </div>
                            <span class="video-edit__variation-label">Generating...</span>
                        </div>`;
                    variationsGrid.appendChild(card);
                }
            }
            // Await the prefetch promise — may resolve instantly if already done
            vcached.variationPromises[idx].then(variations => {
                if (selectedKeyframeIndex !== idx) return; // user moved on
                if (variations && variations.length > 0) {
                    renderVariations(variations, idx);
                } else if (extractedKeyframes[idx]) {
                    renderVariations(generateCanvasFallbacks(extractedKeyframes[idx].dataUrl), idx);
                }
                loadedVariationsIndex = idx;
            });
        } else {
            // No cache entry — generate now (shows loading cards internally)
            generateVariations(idx).then(() => { loadedVariationsIndex = idx; });
        }
    }

    // Show / hide the variations panel + input bar with fade
    function showVariationsPanel() {
        if (variationsArea) { variationsArea.style.opacity = '1'; variationsArea.style.pointerEvents = 'auto'; }
        if (shotsInputBar) { shotsInputBar.style.opacity = '1'; shotsInputBar.style.pointerEvents = 'auto'; }
        if (shotsGesture) { shotsGesture.style.opacity = '1'; }
    }

    function hideVariationsPanel() {
        if (variationsArea) { variationsArea.style.opacity = '0'; variationsArea.style.pointerEvents = 'none'; }
        if (shotsInputBar) { shotsInputBar.style.opacity = '0'; shotsInputBar.style.pointerEvents = 'none'; }
        if (shotsGesture) { shotsGesture.style.opacity = '0'; }
    }

    // Generate 4 variations for a keyframe
    async function generateVariations(keyframeIdx) {
        if (!variationsGrid || !extractedKeyframes[keyframeIdx]) return;

        // Show loading state
        variationsGrid.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const card = document.createElement('div');
            card.className = 'video-edit__variation-card loading';
            card.innerHTML = `
                <div class="video-edit__variation-overlay">
                    <div class="video-edit__variation-icon">
                        <span class="material-symbols-outlined">videocam</span>
                    </div>
                    <span class="video-edit__variation-label">Generating...</span>
                </div>`;
            variationsGrid.appendChild(card);
        }

        const frameDataUrl = extractedKeyframes[keyframeIdx].dataUrl;
        const base64 = frameDataUrl.split(',')[1];

        try {
            const res = await fetch('./api/generate-shot-variations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.variations && data.variations.length > 0) {
                    renderVariations(data.variations, keyframeIdx);
                    return;
                }
            }
        } catch (e) {
            console.log('[Shots] API variation generation failed, using local fallback');
        }

        // Fallback: generate canvas-cropped variations (no color changes)
        const fallbackVariations = generateCanvasFallbacks(frameDataUrl);
        renderVariations(fallbackVariations, keyframeIdx);
    }

    // Generate  fallback variations via canvas crops (preserves original color grading)
    function generateCanvasFallbacks(srcDataUrl) {
        const img = new Image();
        img.src = srcDataUrl;
        const w = img.naturalWidth || 320;
        const h = img.naturalHeight || 180;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;

        const results = [];

        // Low-angle: crop bottom 60%, stretch to full
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, h * 0.4, w, h * 0.6, 0, 0, w, h);
        results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), label: 'Low-angle' });

        // Side-angle: flip horizontally
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -w, 0, w, h);
        ctx.restore();
        results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), label: 'Side-angle' });

        // Close up: crop center 50%
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, w * 0.25, h * 0.2, w * 0.5, h * 0.6, 0, 0, w, h);
        results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), label: 'Close up' });

        // High-angle: crop top 60%, stretch to full
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h * 0.6, 0, 0, w, h);
        results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), label: 'High-angle' });

        return results;
    }

    // Render variation cards
    function renderVariations(variations, keyframeIdx) {
        if (!variationsGrid) return;
        variationsGrid.innerHTML = '';

        variations.forEach((v, i) => {
            const card = document.createElement('div');
            card.className = 'video-edit__variation-card';

            // Set data-angle for CSS motion animation
            const angleLabel = v.label || `Shot ${i + 1}`;
            const angleKey = angleLabel.toLowerCase().replace(/\s+/g, '-');
            card.setAttribute('data-angle', angleKey);

            const img = document.createElement('img');
            img.src = v.dataUrl || `data:image/jpeg;base64,${v.base64 || ''}`;
            img.alt = `Variation ${i + 1}`;
            if (v.filter) img.style.filter = v.filter;
            card.appendChild(img);

            const label = document.createElement('span');
            label.className = 'video-edit__variation-label';
            label.textContent = angleLabel;
            card.appendChild(label);

            card.addEventListener('click', () => {
                const imgSrc = v.dataUrl || `data:image/jpeg;base64,${v.base64 || ''}`;
                attachShotThumbnail(imgSrc, angleLabel, keyframeIdx);
            });

            variationsGrid.appendChild(card);
        });
    }

    // ---- Thumbnail attachment in input bar ----
    const shotsThumb = document.getElementById('video-edit-shots-thumb');
    const shotsThumbImg = document.getElementById('video-edit-shots-thumb-img');
    const shotsThumbLabel = document.getElementById('video-edit-shots-thumb-label');
    const shotsThumbRemove = document.getElementById('video-edit-shots-thumb-remove');
    const shotsInput = document.getElementById('video-edit-shots-input');
    const shotsSendBtn = document.getElementById('video-edit-shots-send');
    let pendingShotImgSrc = null;
    let pendingShotKeyframeIdx = -1;

    function attachShotThumbnail(imgSrc, label, keyframeIdx) {
        pendingShotImgSrc = imgSrc;
        pendingShotKeyframeIdx = keyframeIdx;
        if (shotsThumbImg) shotsThumbImg.src = imgSrc;
        if (shotsThumbLabel) shotsThumbLabel.textContent = label;
        if (shotsThumb) shotsThumb.hidden = false;
        if (shotsInput) {
            shotsInput.focus();
            shotsInput.placeholder = `Describe changes for ${label}…`;
        }
    }

    function clearShotThumbnail() {
        pendingShotImgSrc = null;
        pendingShotKeyframeIdx = -1;
        if (shotsThumb) shotsThumb.hidden = true;
        if (shotsThumbImg) shotsThumbImg.src = '';
        if (shotsThumbLabel) shotsThumbLabel.textContent = '';
        if (shotsInput) {
            shotsInput.value = '';
            shotsInput.placeholder = 'Describe your shot';
        }
    }

    function submitShotPrompt() {
        if (!pendingShotImgSrc || pendingShotKeyframeIdx < 0) return;

        const userPrompt = shotsInput ? shotsInput.value.trim() : '';
        const imgSrc = pendingShotImgSrc;
        const keyframeIdx = pendingShotKeyframeIdx;

        // Swap the keyframe
        const oldDataUrl = extractedKeyframes[keyframeIdx].dataUrl;
        extractedKeyframes[keyframeIdx].dataUrl = imgSrc;
        renderKeyframes(extractedKeyframes);
        highlightKeyframe(keyframeIdx);

        // Push to undo history
        pushShotEdit(keyframeIdx, oldDataUrl, imgSrc);

        // Regenerate video with the variation + user prompt
        regenerateVideoFromShot(keyframeIdx, imgSrc, userPrompt);

        // Clear thumbnail + dismiss variations
        clearShotThumbnail();
        hideVariationsPanel();

        console.log(`[Shots] Submitted shot for keyframe ${keyframeIdx}${userPrompt ? ` with prompt: "${userPrompt}"` : ''}`);
    }

    // Wire send button + Enter key
    if (shotsSendBtn) shotsSendBtn.addEventListener('click', submitShotPrompt);
    if (shotsInput) shotsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submitShotPrompt(); }
    });
    if (shotsThumbRemove) shotsThumbRemove.addEventListener('click', clearShotThumbnail);

    // ---- Undo / Redo ----
    function pushShotEdit(keyframeIdx, oldDataUrl, newDataUrl) {
        // Truncate any redo history beyond current position
        shotEditHistory = shotEditHistory.slice(0, shotEditHistoryPos + 1);
        shotEditHistory.push({ keyframeIdx, oldDataUrl, newDataUrl });
        shotEditHistoryPos = shotEditHistory.length - 1;
        updateUndoRedoState();
    }

    function undoShotEdit() {
        if (shotEditHistoryPos < 0) return;
        const edit = shotEditHistory[shotEditHistoryPos];
        extractedKeyframes[edit.keyframeIdx].dataUrl = edit.oldDataUrl;
        renderKeyframes(extractedKeyframes);
        highlightKeyframe(edit.keyframeIdx);
        shotEditHistoryPos--;
        updateUndoRedoState();
        regenerateVideoFromShot(edit.keyframeIdx, edit.oldDataUrl);
    }

    function redoShotEdit() {
        if (shotEditHistoryPos >= shotEditHistory.length - 1) return;
        shotEditHistoryPos++;
        const edit = shotEditHistory[shotEditHistoryPos];
        extractedKeyframes[edit.keyframeIdx].dataUrl = edit.newDataUrl;
        renderKeyframes(extractedKeyframes);
        highlightKeyframe(edit.keyframeIdx);
        updateUndoRedoState();
        regenerateVideoFromShot(edit.keyframeIdx, edit.newDataUrl);
    }

    function updateUndoRedoState() {
        const hasEdits = shotEditHistory.length > 0;
        if (videoEditAppbarActions) videoEditAppbarActions.hidden = !hasEdits;
        if (videoEditUndo) videoEditUndo.disabled = shotEditHistoryPos < 0;
        if (videoEditRedo) videoEditRedo.disabled = shotEditHistoryPos >= shotEditHistory.length - 1;
    }

    // Wire undo/redo buttons
    if (videoEditUndo) videoEditUndo.addEventListener('click', undoShotEdit);
    if (videoEditRedo) videoEditRedo.addEventListener('click', redoShotEdit);

    // ---- Video Regeneration ----
    // Generates a 4-second clip from the keyframe's timestamp using the
    // selected shot angle image as a reference, then plays it in the editor.
    async function regenerateVideoFromShot(keyframeIdx, refDataUrl, userPrompt) {
        const keyframe = extractedKeyframes[keyframeIdx];
        const keyframeTime = keyframe ? keyframe.time.toFixed(1) : '0';

        // Build a targeted prompt: extend the video from this moment at this angle
        const promptEl = document.getElementById('video-response-prompt-text');
        const originalPrompt = promptEl ? promptEl.textContent.trim() : 'cinematic video';
        let finalPrompt = `Continue this scene from ${keyframeTime}s, maintaining the exact camera angle and framing shown in the reference image. ${originalPrompt}.`;
        if (userPrompt) finalPrompt += ` ${userPrompt}`;

        const base64 = refDataUrl.split(',')[1];

        // Show loading overlay
        if (videoEditVideo) videoEditVideo.style.opacity = '0.5';
        const viewport = document.getElementById('video-edit-viewport');
        let loadingOverlay = viewport?.querySelector('.video-edit__regen-loading');
        if (!loadingOverlay && viewport) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'video-edit__regen-loading';
            loadingOverlay.innerHTML = '<span class="material-symbols-outlined">autorenew</span><span>Generating 4s clip…</span>';
            viewport.appendChild(loadingOverlay);
        }
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        try {
            const res = await fetch('./api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    imageBase64: base64,
                    mimeType: 'image/jpeg',
                    durationSeconds: 4
                })
            });

            const data = await res.json();

            if (data.success && data.videoUrl) {
                console.log('[Shots] ✅ 4s clip generated:', data.videoUrl);
                // Load the new clip into the editor player
                videoEditVideo.src = data.videoUrl + '?t=' + Date.now();
                videoEditVideo.load();
                videoEditVideo.play().catch(() => { });
                if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'pause';
                // Clear the prefetch cache — new clip means new keyframes needed
                prefetchCache.clear();
                lastEditorVideoPath = cleanVideoPath(data.videoUrl) || '';
            } else {
                console.log('[Shots] Clip generation returned no video:', data.error);
                if (data.error) showToast('Shot clip: ' + data.error.substring(0, 80));
            }
        } catch (e) {
            console.error('[Shots] Clip generation failed:', e);
        } finally {
            if (videoEditVideo) videoEditVideo.style.opacity = '1';
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }

    // Enter Shots sub-mode
    function enterShotsMode() {
        isShotsMode = true;
        videoEditDirty = true;

        // Toggle app bar
        if (videoEditCloseBtn) videoEditCloseBtn.hidden = true;
        if (videoEditCancel) videoEditCancel.hidden = false;
        if (videoEditTitle) videoEditTitle.hidden = true;
        if (videoEditAppbarActions) videoEditAppbarActions.hidden = false;
        if (videoEditDone) {
            videoEditDone.textContent = 'Done';
            videoEditDone.style.color = '';
        }

        // Toggle panels
        if (videoEditToolsSection) videoEditToolsSection.hidden = true;
        if (videoEditGestureBar) videoEditGestureBar.hidden = true;
        if (videoEditShotsPanel) videoEditShotsPanel.hidden = false;

        // Reset undo/redo
        shotEditHistory = [];
        shotEditHistoryPos = -1;
        updateUndoRedoState();

        // ── Clear everything from the previous session ──────────────────
        extractedKeyframes = [];
        selectedKeyframeIndex = -1;
        loadedVariationsIndex = -1;
        hideVariationsPanel();
        clearShotThumbnail();
        if (variationsGrid) variationsGrid.innerHTML = '';

        // Show 8 loading placeholder keyframes
        if (keyframesStrip) {
            keyframesStrip.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const div = document.createElement('div');
                div.className = 'video-edit__keyframe loading';
                keyframesStrip.appendChild(div);
            }
        }

        // ── Serve from prefetch cache or extract fresh keyframes ─────────
        const doRender = () => {
            const path = cleanVideoPath(videoEditVideo ? videoEditVideo.src : '');
            const cached = path ? prefetchCache.get(path) : null;

            const framesPromise = cached
                ? cached.framesPromise          // prefetch already running/done — reuse
                : extractKeyframes(videoEditVideo); // fallback: start now

            framesPromise.then(frames => {
                extractedKeyframes = frames;
                renderKeyframes(frames);
                videoEditVideo.currentTime = 0;
                videoEditVideo.loop = false;
                videoEditVideo.pause();
                if (videoEditPlayIcon) videoEditPlayIcon.textContent = 'play_arrow';
                highlightKeyframe(0);
            });
        };

        // Wait for the video to be ready before extracting
        if (videoEditVideo && videoEditVideo.readyState >= 2) {
            doRender(); // already loaded — go immediately
        } else if (videoEditVideo) {
            videoEditVideo.addEventListener('loadeddata', doRender, { once: true });
        }

    } // end enterShotsMode

    // Exit Shots sub-mode

    function exitShotsMode() {
        isShotsMode = false;

        // Restore app bar — X visible, title visible, Save button
        if (videoEditCloseBtn) videoEditCloseBtn.hidden = false;
        if (videoEditTitle) { videoEditTitle.hidden = false; }
        if (videoEditDone) {
            videoEditDone.textContent = 'Save';
            videoEditDone.style.color = '';
            videoEditDone.disabled = !videoEditDirty;
        }

        // Hide undo/redo
        if (videoEditAppbarActions) videoEditAppbarActions.hidden = true;

        // Toggle panels
        if (videoEditToolsSection) videoEditToolsSection.hidden = false;
        if (videoEditGestureBar) videoEditGestureBar.hidden = false;
        if (videoEditShotsPanel) videoEditShotsPanel.hidden = true;

        // Deselect tools
        videoEditTools.forEach(t => t.classList.remove('active'));
        selectedKeyframeIndex = -1;

        // Restore looping for normal editor
        if (videoEditVideo) videoEditVideo.loop = true;
    }

    // Cancel button exits shots mode
    if (videoEditCancel) {
        videoEditCancel.addEventListener('click', exitShotsMode);
    }

    // --- Playback-driven keyframe highlighting & variation show/hide ---
    if (videoEditVideo) {
        // Highlight keyframe that matches current playback time
        videoEditVideo.addEventListener('timeupdate', () => {
            if (!isShotsMode || extractedKeyframes.length === 0) return;
            const duration = videoEditVideo.duration || 8;
            const idx = Math.min(7, Math.floor((videoEditVideo.currentTime / duration) * 8));
            highlightKeyframe(idx);
        });

        // Pause → show variations for current keyframe
        videoEditVideo.addEventListener('pause', () => {
            if (!isShotsMode) return;
            showVariationsPanel();
            if (selectedKeyframeIndex >= 0) {
                generateVariations(selectedKeyframeIndex);
            }
        });

        // Play → fade out variations
        videoEditVideo.addEventListener('play', () => {
            if (!isShotsMode) return;
            hideVariationsPanel();
        });
    }

    // Override tool click to handle Shots mode entry
    videoEditTools.forEach(tool => {
        tool.addEventListener('click', () => {
            const vtool = tool.dataset.vtool;
            if (vtool === 'shots') {
                enterShotsMode();
            }
        });
    });

    // ---------- Music Card Selection ----------
    const musicCards = musicShell.querySelectorAll('.music-card');
    let selectedMusicCard = null;
    let musicPlaceholderInterval = null;
    let musicPlaceholderIndex = 0;

    // Genre images for attachment chips
    const genreImages = {
        '90s-rap': '../images/90s-rap.png',
        'latin-pop': '../images/latin-pop.png',
        'folk-ballad': '../images/folk-ballad.png',
        '8-bit': '../images/8-bit.png',
        'workout': '../images/workout.png',
        'reggaeton': '../images/reggaeton.png',
    };

    // Genre-specific rotating placeholder phrases
    const genrePlaceholders = {
        '90s-rap': [
            'boom-bap beats with vinyl crackle',
            'gritty East Coast flow with lo-fi piano',
            'old school turntable scratches and hooks',
            'golden-era cypher with jazzy samples',
            'head-nodding beat with classic breakbeats',
        ],
        'latin-pop': [
            'tropical dancehall rhythm with brass',
            'reggaetón pulse with dembow drums',
            'salsa-inspired horns and piano montuno',
            'Caribbean vibes with steel drums',
            'upbeat cumbia groove with accordion',
        ],
        'folk-ballad': [
            'fingerpicked acoustic guitar and harmonica',
            'Appalachian fiddle with gentle vocals',
            'campfire storytelling with banjo arpeggios',
            'wind-swept melody with slide guitar',
            'warm analog folk with upright bass',
        ],
        '8-bit': [
            'chiptune arpeggios with retro SFX',
            'NES-era hero theme with pulse waves',
            'glitchy lo-fi synth and 8-bit drums',
            'pixel-art adventure soundtrack',
            'arcade coin-drop intro with square waves',
        ],
        'workout': [
            'high-energy EDM drop with pounding bass',
            'motivational synth build with snare rolls',
            'fast-tempo drum & bass with vocal chops',
            'gym anthem with heavy 808s and claps',
            'power-up beat with rising synth stabs',
        ],
        'reggaeton': [
            'perreo beat with dembow and brass stabs',
            'tropical boombox groove with synth hooks',
            'urban Latin pulse with autotuned ad-libs',
            'beach party rhythm with steel pans',
            'fiesta beat with congas and reggaetón flow',
        ],
    };

    const MUSIC_DEFAULT_PLACEHOLDER = 'Describe your track';

    // Music input bar elements
    const musicPromptInput = document.getElementById('music-prompt-input');
    const musicSendBtn = document.getElementById('music-btn-send');
    const musicPlaceholderOverlay = document.getElementById('music-placeholder-overlay');
    const musicPlaceholderPrefix = document.getElementById('music-placeholder-prefix');
    const musicPlaceholderDrum = document.getElementById('music-placeholder-drum');
    const musicPlaceholderTrack = document.getElementById('music-placeholder-track');
    const musicAttachmentChip = document.getElementById('music-attachment-chip');
    const musicAttachmentThumb = document.getElementById('music-attachment-thumb');
    const musicAttachmentLabel = document.getElementById('music-attachment-label');
    const musicAttachmentClose = document.getElementById('music-attachment-close');
    const musicAddPhotoBtn = document.getElementById('music-add-photo-btn');
    const musicPhotoInput = document.getElementById('music-photo-input');

    const MUSIC_ITEM_HEIGHT = 22; // px, matches line-height

    function startMusicPlaceholderRotation(genre) {
        stopMusicPlaceholderRotation();

        const phrases = genrePlaceholders[genre] || [MUSIC_DEFAULT_PLACEHOLDER];
        musicPlaceholderIndex = 0;

        // Switch prefix to "Remix: "
        musicPlaceholderPrefix.textContent = 'Remix: ';
        musicPlaceholderDrum.style.display = '';

        // Build vertical stack of phrase items + clone of first for seamless loop
        musicPlaceholderTrack.innerHTML = '';
        const allPhrases = [...phrases, phrases[0]];
        allPhrases.forEach((phrase, i) => {
            const item = document.createElement('span');
            item.className = 'placeholder-drum__item';
            item.textContent = `\u201C${phrase}\u201D`;
            if (i === 0) item.classList.add('placeholder-drum__item--active');
            musicPlaceholderTrack.appendChild(item);
        });

        // Reset track position
        musicPlaceholderTrack.style.transition = 'none';
        musicPlaceholderTrack.style.transform = 'translateY(0)';

        // Rotate every 2.8 seconds
        musicPlaceholderInterval = setInterval(() => {
            const items = musicPlaceholderTrack.querySelectorAll('.placeholder-drum__item');
            const prevIndex = musicPlaceholderIndex;
            musicPlaceholderIndex++;

            items[prevIndex].classList.remove('placeholder-drum__item--active');
            items[musicPlaceholderIndex].classList.add('placeholder-drum__item--active');

            musicPlaceholderTrack.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            musicPlaceholderTrack.style.transform = `translateY(-${musicPlaceholderIndex * MUSIC_ITEM_HEIGHT}px)`;

            if (musicPlaceholderIndex >= phrases.length) {
                setTimeout(() => {
                    musicPlaceholderTrack.style.transition = 'none';
                    musicPlaceholderTrack.style.transform = 'translateY(0)';
                    musicPlaceholderIndex = 0;
                    items.forEach((el, i) => {
                        el.classList.toggle('placeholder-drum__item--active', i === 0);
                    });
                }, 550);
            }
        }, 2800);
    }

    function stopMusicPlaceholderRotation() {
        if (musicPlaceholderInterval) {
            clearInterval(musicPlaceholderInterval);
            musicPlaceholderInterval = null;
        }
    }

    function resetMusicPlaceholder() {
        stopMusicPlaceholderRotation();
        musicPlaceholderPrefix.textContent = MUSIC_DEFAULT_PLACEHOLDER;
        musicPlaceholderDrum.style.display = 'none';
        musicPlaceholderTrack.innerHTML = '';
        musicPlaceholderTrack.style.transform = 'translateY(0)';
    }

    function showMusicAttachment(genre) {
        const imgSrc = genreImages[genre];
        const label = capitalize(genre.replace(/-/g, ' '));

        musicAttachmentThumb.src = imgSrc;
        musicAttachmentThumb.alt = label + ' genre';
        musicAttachmentLabel.textContent = label;
        musicAttachmentChip.hidden = false;
        musicAttachmentChip.style.animation = 'attachSlideIn 0.35s cubic-bezier(0.2, 0, 0, 1) forwards';

        // Show and animate Add photo button
        musicAddPhotoBtn.classList.remove('hidden');
        musicAddPhotoBtn.classList.remove('slide-left', 'slide-right');
        void musicAddPhotoBtn.offsetHeight;
        musicAddPhotoBtn.classList.add('slide-right');
        musicAddPhotoBtn.addEventListener('animationend', () => {
            musicAddPhotoBtn.classList.remove('slide-right');
        }, { once: true });

        startMusicPlaceholderRotation(genre);
    }

    function removeMusicAttachment() {
        musicAttachmentChip.style.animation = 'none';
        musicAttachmentChip.style.opacity = '1';

        requestAnimationFrame(() => {
            musicAttachmentChip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            musicAttachmentChip.style.opacity = '0';
            musicAttachmentChip.style.transform = 'translateY(4px) scale(0.95)';

            setTimeout(() => {
                musicAttachmentChip.hidden = true;
                musicAttachmentChip.style.transition = '';
                musicAttachmentChip.style.opacity = '';
                musicAttachmentChip.style.transform = '';
                musicAttachmentChip.style.animation = '';

                // Hide Add photo button
                musicAddPhotoBtn.classList.remove('slide-left', 'slide-right');
                void musicAddPhotoBtn.offsetHeight;
                musicAddPhotoBtn.classList.add('slide-left');
                musicAddPhotoBtn.addEventListener('animationend', () => {
                    musicAddPhotoBtn.classList.remove('slide-left');
                    musicAddPhotoBtn.classList.add('hidden');
                }, { once: true });
            }, 200);
        });

        // Also remove any attached photo
        const photoChipEl = document.getElementById('music-photo-chip');
        if (photoChipEl && !photoChipEl.hidden) {
            photoChipEl.hidden = true;
            photoChipEl.style.animation = '';
        }
        musicPhotoFile = null;
        musicPhotoDataUrl = null;
        if (musicPhotoInput) musicPhotoInput.value = '';

        selectedMusicCard = null;
        musicCards.forEach(c => c.classList.remove('selected'));
        stopMusicPlaceholderRotation();
        resetMusicPlaceholder();
    }

    musicCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.music-card__play-btn')) return;

            // Ripple effect
            createRipple(e, card);

            // Toggle selection
            if (card.classList.contains('selected')) {
                // Deselect
                card.classList.remove('selected');
                selectedMusicCard = null;
                removeMusicAttachment();
            } else {
                // Remove previous selection
                musicCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedMusicCard = card.dataset.genre;
                showMusicAttachment(card.dataset.genre);
            }

            updateMusicSendState();
        });
    });

    // Music attachment close button
    if (musicAttachmentClose) {
        musicAttachmentClose.addEventListener('click', () => {
            removeMusicAttachment();
            updateMusicSendState();
        });
    }

    // Music add photo button
    if (musicAddPhotoBtn) {
        musicAddPhotoBtn.addEventListener('click', () => {
            musicPhotoInput.click();
        });
    }

    // Music "+" (add attachment) button → opens file picker
    const musicBtnAdd = document.getElementById('music-btn-add');
    if (musicBtnAdd && musicPhotoInput) {
        musicBtnAdd.addEventListener('click', () => {
            musicPhotoInput.click();
        });
    }

    // Play/Pause toggle handler
    let currentlyPlayingCard = null;

    function stopAllMusic() {
        if (currentlyPlayingCard) {
            currentlyPlayingCard.classList.remove('playing');
            const playBtn = currentlyPlayingCard.querySelector('.music-card__play-btn span');
            if (playBtn) playBtn.textContent = 'play_arrow';
            currentlyPlayingCard = null;
        }
    }

    function togglePlayPause(card) {
        const isPlaying = card.classList.contains('playing');
        const genre = card.dataset.genre;
        const playBtn = card.querySelector('.music-card__play-btn span');

        if (isPlaying) {
            stopAllMusic();
            showToast(`Paused: ${genre.replace(/-/g, ' ')}`);
        } else {
            stopAllMusic();
            card.classList.add('playing');
            currentlyPlayingCard = card;
            if (playBtn) playBtn.textContent = 'pause';
            showToast(`Playing: ${genre.replace(/-/g, ' ')}`);
        }
    }

    // Bottom-right play button click
    musicShell.querySelectorAll('.music-card__play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.music-card');
            togglePlayPause(card);
        });
    });

    // Music input bar interactions
    const musicMicBtn = document.getElementById('music-btn-mic');
    function updateMusicSendState() {
        const hasText = musicPromptInput.value.trim().length > 0;
        const hasContent = hasText || selectedMusicCard;
        // Show send when there's content, show mic when empty
        if (musicMicBtn) musicMicBtn.style.display = hasContent ? 'none' : 'flex';
        musicSendBtn.style.display = hasContent ? 'flex' : 'none';
        musicSendBtn.disabled = !hasContent;
    }

    if (musicPromptInput) {
        musicPromptInput.addEventListener('input', () => {
            musicPromptInput.style.height = 'auto';
            musicPromptInput.style.height = Math.min(musicPromptInput.scrollHeight, 120) + 'px';
            const hasText = musicPromptInput.value.trim().length > 0;
            musicPlaceholderOverlay.classList.toggle('hidden', hasText);
            updateMusicSendState();
        });
        musicPromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (musicSendBtn && !musicSendBtn.disabled) musicSendBtn.click();
            }
        });
    }

    // ---------- Music Response Screen ----------
    const musicResponseScreen = document.getElementById('music-response-screen');
    const musicResponseTitle = document.getElementById('music-response-title');
    const musicResponseThumbGenreImg = document.getElementById('music-response-thumb-genre-img');
    const musicResponseThumbGenreLabel = document.getElementById('music-response-thumb-genre-label');
    const musicResponseThumbPhoto = document.getElementById('music-response-thumb-photo');
    const musicResponseThumbPhotoImg = document.getElementById('music-response-thumb-photo-img');
    const musicResponsePromptText = document.getElementById('music-response-prompt-text');
    const musicResponseAnswerText = document.getElementById('music-response-answer-text');
    const musicBackBtn = document.getElementById('music-back-btn');
    const musicPlayerEl = document.getElementById('music-player');
    const musicPlayerArtworkImg = document.getElementById('music-player-artwork-img');
    const musicPlayerPlayPause = document.getElementById('music-player-play-pause');
    const musicPlayerPlayIcon = document.getElementById('music-player-play-icon');
    const musicPlayerSoundToggle = document.getElementById('music-player-sound-toggle');
    const musicPlayerSoundIcon = document.getElementById('music-player-sound-icon');
    const musicPlayerCurrentTime = document.getElementById('music-player-current-time');
    const musicPlayerTotalTime = document.getElementById('music-player-total-time');
    const musicPlayerProgressFill = document.getElementById('music-player-progress-fill');
    const musicPlayerProgressThumb = document.getElementById('music-player-progress-thumb');
    const musicPlayerProgressTrack = document.getElementById('music-player-progress-track');

    let isMusicResponseMode = false;
    let playerIsPlaying = false;
    let playerIsMuted = false;
    let playerProgress = 0; // 0–100
    let playerDuration = 180; // 3 minutes
    let playerCurrentSec = 0;
    let playerInterval = null;

    // Audio playback for response view player
    let playerAudioCtx = null;
    let playerSourceNode = null;
    let playerGainNode = null;
    let playerAudioStartedAt = 0; // AudioContext time when playback started
    let playerAudioOffset = 0;    // where in the buffer we started (sec)

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + String(s).padStart(2, '0');
    }

    function updatePlayerUI() {
        musicPlayerCurrentTime.textContent = formatTime(playerCurrentSec);
        musicPlayerTotalTime.textContent = formatTime(playerDuration);
        const pct = (playerCurrentSec / playerDuration) * 100;
        musicPlayerProgressFill.style.width = pct + '%';
        musicPlayerProgressThumb.style.left = pct + '%';
        musicPlayerPlayIcon.textContent = playerIsPlaying ? 'pause' : 'play_arrow';
        musicPlayerSoundIcon.textContent = playerIsMuted ? 'volume_off' : 'volume_up';
    }

    function _ensurePlayerAudioCtx() {
        if (!playerAudioCtx) {
            playerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Initialize mood effects chain on this context
            initMoodEffects(playerAudioCtx);
            updateMoodAudioEffects();
            startMoodPanWobble();

            playerGainNode = playerAudioCtx.createGain();
            // Route gain → mood effects chain (instead of directly to destination)
            const moodInput = getMoodOutputNode();
            if (moodInput) {
                playerGainNode.connect(moodInput);
            } else {
                playerGainNode.connect(playerAudioCtx.destination);
            }
        }
        if (playerAudioCtx.state === 'suspended') playerAudioCtx.resume();
        playerGainNode.gain.value = playerIsMuted ? 0 : 1;
    }

    function _startPlayerSource() {
        if (!clipAudioBuffer) return;
        _ensurePlayerAudioCtx();

        // Stop any existing source
        if (playerSourceNode) {
            try { playerSourceNode.onended = null; playerSourceNode.stop(); } catch (_) { }
            playerSourceNode = null;
        }

        playerSourceNode = playerAudioCtx.createBufferSource();
        playerSourceNode.buffer = clipAudioBuffer;
        playerSourceNode.connect(playerGainNode);

        const offset = playerCurrentSec % playerDuration;
        playerSourceNode.start(0, offset);
        playerAudioStartedAt = playerAudioCtx.currentTime;
        playerAudioOffset = offset;

        // Apply current trackpad BPM rate immediately
        if (typeof moodPadY !== 'undefined' && playerSourceNode.playbackRate) {
            playerSourceNode.playbackRate.value = 1.0 + moodPadY * 0.15;
        }

        playerSourceNode.onended = () => {
            if (!playerIsPlaying) return;
            // Loop: restart from beginning
            playerCurrentSec = 0;
            _startPlayerSource();
        };
    }

    async function startPlayerPlayback() {
        if (playerInterval) clearInterval(playerInterval);
        playerIsPlaying = true;

        // Load the default MP3 song if not yet available
        if (!clipAudioBuffer) {
            await loadDefaultSongMP3();
        }

        if (!clipAudioBuffer) {
            console.warn('[Music] No audio buffer available');
            playerIsPlaying = false;
            return;
        }

        _startPlayerSource();
        updatePlayerUI();

        playerInterval = setInterval(() => {
            if (playerAudioCtx && playerIsPlaying) {
                const wallElapsed = playerAudioCtx.currentTime - playerAudioStartedAt;
                // Account for variable playback rate (tempo changes from trackpad)
                const rate = (playerSourceNode && playerSourceNode.playbackRate)
                    ? playerSourceNode.playbackRate.value : 1.0;
                playerCurrentSec = (playerAudioOffset + wallElapsed * rate) % playerDuration;
            }
            updatePlayerUI();
        }, 100);
    }

    function pausePlayerPlayback() {
        playerIsPlaying = false;
        if (playerInterval) {
            clearInterval(playerInterval);
            playerInterval = null;
        }
        // Stop audio source
        if (playerSourceNode) {
            try { playerSourceNode.onended = null; playerSourceNode.stop(); } catch (_) { }
            playerSourceNode = null;
        }
        updatePlayerUI();
    }

    function stopPlayerPlayback() {
        pausePlayerPlayback();
        playerCurrentSec = 0;
        playerProgress = 0;
        updatePlayerUI();
    }

    // Album cover creative direction system prompt
    const ALBUM_COVER_SYSTEM_PROMPT = `### ROLE
You are a visionary Creative Director at a prestigious, globally respected design agency in the lineage of Pentagram and COLLINS.
Your work operates at the intersection of art, culture, and design, rejecting safe, trend-driven, "stock image" aesthetics in favor of authored visual systems that feel physical, intentional, and enduring. Every output is treated as an artifact—tactile, edited, and culturally resonant rather than decorative or disposable.

Your creative sensibility is shaped by formal training at institutions such as RISD and Parsons, grounding your work in craft, theory, and disciplined experimentation. Your work has been recognized by Cannes Lions and D&AD for clarity, restraint, and cultural impact.

You are a master of photography, color theory, and visual harmony, with an instinctive command of composition, materiality, and negative space. Every image you direct or approve feels deliberate, tactile, and timeless—never generic, never algorithmic.

### THE CREATIVE DIRECTION
Album artwork should function as a music artifact—physical, tactile, and collectable rather than purely visual. The image must feel authored and intentional, as if it exists as a real object pulled from record-store bins. It should translate seamlessly onto merchandise—especially T-shirts—retaining clarity, attitude, and cultural signal.

### CORE PHILOSOPHY
1. **Concept Over Literalism:** Do not just draw what the lyrics say. If the song is about a broken heart, do NOT draw a heart. Draw a shattered ceramic plate, or a lonely light in a skyscraper.
2. **Juxtaposition, but when Appropriate:** Sometimes a chaotic track needs a stark, minimalist cover; however, a positive happy track should stay simple and light.
3. **Texture is King, but Restrained:** You must fight the plastic AI look. Every image must have defined texture (film grain, canvas weave, halftone dots, paper fibers), but you must Avoid Texture Stacking. Choose one primary material or defect to maintain clarity and restraint.
4. **Embrace Asymmetry:** Reject the "bullseye" or centered composition. Use the Rule of Thirds or extreme edge-alignment to create tension. The focal point should rarely be dead-center unless it is core to the concept.
5. **Edge-to-Edge Energy:** Think of the frame as a window, not a pedestal. Allow shapes and textures to bleed off the edges of the canvas rather than being contained in the middle.

### VISUAL LENSES
Select a visual treatment specific to the music:
* **The Cinematic:** Flash photography, motion blur, cinematic color grading, double exposure, 'Kodak Portra' grain.
* **The Tactile:** Focus on materiality and physical assembly—visible adhesion, fiber-level paper texture, or chemical degradation.
* **The Surreal:** Dream logic, floating objects, defying physics, oil painting impasto.
* **The Graphic:** Bold composition, geometric shapes, high contrast black & white.

### GEOGRAPHIC CUSTOMS
Not all music is from the US or Europe. The image should feel native to the cultural or geographic origin implied by the genre/language. AVOID CULTURAL Clichés.

### STRICT CONSTRAINTS
* NO TEXT: Do not generate any text, words, letters, logos, or watermarks.
* NO PRODUCT RENDERS: Do not render a CD case or vinyl sleeve. Just the 2D artwork itself.
* NO PEOPLE: Do not include any human figures, faces, or body parts. Focus on abstract, symbolic, or environmental imagery.
* COMPOSITION: Avoid centralized, "logo-style" layouts. Use dynamic tension, asymmetric balance, or "The Bleed."
* SHAPES: Avoid over-reliance on circles. Explore rectilinear forms, jagged edges, or organic, amorphous blobs.

### EXECUTION STEPS
1. Analyze the 'Temperature': Is the track cold/distant or warm/intimate?
2. Select the Lens: Choose the visual style that best amplifies (or ironically contradicts) the mood.
3. Apply 'The Flaw': Add a specific imperfection (blur, noise, asymmetry) to ground the image in reality.
4. Generate.`;

    async function generateAlbumCover(genre, userPrompt, signal, referenceImageDataUrl) {
        // API key is handled by the server proxy

        // Hard timeout — don't let the entire call hang more than 20s
        const hardTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Album cover generation timed out')), 20000);
        });

        const doGenerate = async () => {
            const imageInfluence = referenceImageDataUrl
                ? `\n\nThe user has provided a reference image. Use it as visual inspiration for the album art — draw from its color palette, mood, textures, and composition. Do NOT reproduce the image literally; instead, let it influence the artistic direction.`
                : '';

            const fullPrompt = `${ALBUM_COVER_SYSTEM_PROMPT}

### INPUT
Genre: ${genre.replace(/-/g, ' ')}
Song description / mood: ${userPrompt}${imageInfluence}

Generate a square album cover artwork for this track. Remember: NO text, NO people, NO product renders. The artwork should feel like a physical artifact — tactile, authored, and culturally resonant with the ${genre.replace(/-/g, ' ')} genre. Output only the artwork image.`;

            // Build parts array — text first, then optional reference image
            const parts = [{ text: fullPrompt }];

            if (referenceImageDataUrl) {
                const match = referenceImageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
                if (match) {
                    parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            }

            const requestBody = {
                contents: [{
                    parts: parts
                }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                }
            };

            const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig, signal);
            const candidates = data.candidates || [];

            for (const candidate of candidates) {
                for (const part of (candidate.content?.parts || [])) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }

            throw new Error('No image returned from Gemini API');
        };

        return Promise.race([doGenerate(), hardTimeout]);
    }

    function showMusicResponseScreen(genre, userPrompt) {
        isMusicResponseMode = true;
        const label = capitalize(genre.replace(/-/g, ' '));
        const imgSrc = genreImages[genre];

        // Populate response screen
        musicResponseTitle.textContent = 'Song Template';
        musicResponseThumbGenreImg.src = imgSrc;
        musicResponseThumbGenreImg.alt = label + ' genre';
        musicResponseThumbGenreLabel.textContent = label;
        musicResponsePromptText.textContent = userPrompt;

        // Show user photo thumbnail if attached
        if (musicPhotoDataUrl && musicResponseThumbPhoto && musicResponseThumbPhotoImg) {
            musicResponseThumbPhotoImg.src = musicPhotoDataUrl;
            musicResponseThumbPhoto.hidden = false;
        } else if (musicResponseThumbPhoto) {
            musicResponseThumbPhoto.hidden = true;
        }

        // Stop placeholder rotation
        stopMusicPlaceholderRotation();
        musicPlaceholderPrefix.textContent = 'Describe your track';
        musicPlaceholderDrum.style.display = 'none';

        // Hide template attachment row items
        musicAttachmentChip.hidden = true;
        musicAddPhotoBtn.classList.add('hidden');

        // Show the response screen
        musicResponseScreen.hidden = false;
        musicResponseScreen.classList.remove('exiting');
        musicShell.classList.add('music-shell--response');

        // Reset prompt input
        musicPromptInput.value = '';
        updateMusicSendState();
        const hasText = musicPromptInput.value.trim().length > 0;
        musicPlaceholderOverlay.classList.toggle('hidden', hasText);

        // Start loading state — no background image, just shimmer
        musicPlayerArtworkImg.src = '';
        musicPlayerArtworkImg.alt = '';
        musicPlayerEl.classList.add('loading');
        musicResponseAnswerText.textContent = 'Creating your song…';
        playerCurrentSec = 0;
        playerIsPlaying = false;
        updatePlayerUI();

        // Generate album cover via Gemini API
        const abortController = createAbortController();
        generateAlbumCover(genre, userPrompt, abortController.signal, musicPhotoDataUrl)
            .then(dataUrl => {
                musicPlayerArtworkImg.src = dataUrl;
                musicPlayerArtworkImg.alt = label + ' generated album cover';
                musicPlayerEl.classList.remove('loading');
                musicResponseAnswerText.textContent = 'Your song is ready!';
                playerIsMuted = true;
                startPlayerPlayback();
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error('Album cover generation error:', err);
                // Fall back to genre image
                musicPlayerArtworkImg.src = imgSrc;
                musicPlayerEl.classList.remove('loading');
                musicResponseAnswerText.textContent = 'Your song is ready!';
                playerIsMuted = true;
                startPlayerPlayback();
                showToast('Album art generation failed — using genre image');
            });
    }

    function hideMusicResponseScreen() {
        isMusicResponseMode = false;
        stopPlayerPlayback();

        // Animate out
        musicResponseScreen.classList.add('exiting');

        setTimeout(() => {
            musicResponseScreen.hidden = true;
            musicResponseScreen.classList.remove('exiting');
            musicShell.classList.remove('music-shell--response');

            // Reset card selections
            musicCards.forEach(c => c.classList.remove('selected'));
            selectedMusicCard = null;
            musicPhotoFile = null;
            musicPhotoDataUrl = null;
            if (musicResponseThumbPhoto) musicResponseThumbPhoto.hidden = true;
            stopAllMusic();

            // Reset placeholder
            resetMusicPlaceholder();
        }, 300);
    }

    // Music send button handler
    musicSendBtn.addEventListener('click', () => {
        const prompt = musicPromptInput.value.trim();
        if (!prompt && !selectedMusicCard) return;

        if (isMusicResponseMode) {
            showToast(`Generating: "${prompt || 'new track'}"`);
            musicPromptInput.value = '';
            musicPromptInput.style.height = 'auto';
            updateMusicSendState();
            musicPlaceholderOverlay.classList.remove('hidden');
        } else if (selectedMusicCard) {
            showMusicResponseScreen(selectedMusicCard, prompt || 'Make something cool');
        } else {
            showToast(`Generating: "${prompt}"`);
            musicPromptInput.value = '';
            musicPromptInput.style.height = 'auto';
            updateMusicSendState();
            musicPlaceholderOverlay.classList.remove('hidden');
        }
    });

    // Music back button
    if (musicBackBtn) {
        musicBackBtn.addEventListener('click', () => {
            hideMusicResponseScreen();
        });
    }

    // Player play/pause toggle
    if (musicPlayerPlayPause) {
        musicPlayerPlayPause.addEventListener('click', () => {
            if (playerIsPlaying) {
                pausePlayerPlayback();
            } else {
                startPlayerPlayback();
            }
        });
    }

    // Player sound toggle
    if (musicPlayerSoundToggle) {
        musicPlayerSoundToggle.addEventListener('click', () => {
            playerIsMuted = !playerIsMuted;
            // Update gain node in real time
            if (playerGainNode) {
                playerGainNode.gain.value = playerIsMuted ? 0 : 1;
            }
            updatePlayerUI();
        });
    }

    // Progress bar clicking to seek
    if (musicPlayerProgressTrack) {
        const progressBar = musicPlayerProgressTrack.closest('.music-player__progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                playerCurrentSec = pct * playerDuration;
                updatePlayerUI();
                // Restart audio from new position if playing
                if (playerIsPlaying) {
                    _startPlayerSource();
                }
            });
        }
    }

    // ---------- Music Photo Upload (for visual direction) ----------
    let musicPhotoFile = null;
    let musicPhotoDataUrl = null;

    // --- Music Photo Chip Elements ---
    const musicPhotoChip = document.getElementById('music-photo-chip');
    const musicPhotoThumbEl = document.getElementById('music-photo-thumb');
    const musicPhotoLabel = document.getElementById('music-photo-label');
    const musicPhotoCloseBtn = document.getElementById('music-photo-close');

    if (musicPhotoInput) {
        musicPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            musicPhotoFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                musicPhotoDataUrl = ev.target.result;

                // Show the image in the separate photo chip
                if (musicPhotoThumbEl && musicPhotoLabel && musicPhotoChip) {
                    musicPhotoThumbEl.src = musicPhotoDataUrl;
                    musicPhotoLabel.textContent = file.name.length > 16 ? file.name.slice(0, 14) + '…' : file.name;
                    musicPhotoChip.hidden = false;
                    musicPhotoChip.style.animation = 'attachSlideIn 0.35s cubic-bezier(0.2, 0, 0, 1) forwards';
                }

                // Hide the "Add photo" button since photo is now attached
                if (musicAddPhotoBtn) {
                    musicAddPhotoBtn.classList.add('hidden');
                }

                showToast('Photo added — it will influence album art');
            };
            reader.readAsDataURL(file);
        });
    }

    // Remove photo attachment
    if (musicPhotoCloseBtn) {
        musicPhotoCloseBtn.addEventListener('click', () => {
            musicPhotoFile = null;
            musicPhotoDataUrl = null;
            if (musicPhotoChip) {
                musicPhotoChip.style.animation = 'none';
                musicPhotoChip.style.opacity = '1';
                requestAnimationFrame(() => {
                    musicPhotoChip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    musicPhotoChip.style.opacity = '0';
                    musicPhotoChip.style.transform = 'translateY(4px) scale(0.95)';
                    setTimeout(() => {
                        musicPhotoChip.hidden = true;
                        musicPhotoChip.style.transition = '';
                        musicPhotoChip.style.opacity = '';
                        musicPhotoChip.style.transform = '';
                        musicPhotoChip.style.animation = '';
                    }, 200);
                });
            }

            // Re-show "Add photo" button if a genre is selected
            if (selectedMusicCard && musicAddPhotoBtn) {
                musicAddPhotoBtn.classList.remove('hidden');
            }

            // Reset file input so re-picking the same file works
            if (musicPhotoInput) musicPhotoInput.value = '';

            showToast('Photo removed');
        });
    }

    // ---------- Music Edit Screen (Instagram/CapCut Clipper) ----------
    const musicEditScreen = document.getElementById('music-edit-screen');
    const musicEditCloseBtn = document.getElementById('music-edit-close');
    const musicEditDoneBtn = document.getElementById('music-edit-done');
    const musicEditCancelBtn = document.getElementById('music-edit-cancel');
    const musicEditTitle = document.getElementById('music-edit-title');
    const musicEditAppbarActions = document.getElementById('music-edit-appbar-actions');
    const musicEditArtworkImg = document.getElementById('music-edit-artwork-img');
    const musicEditPlayBtn = document.getElementById('music-edit-play-btn');
    const musicEditPlayIcon = document.getElementById('music-edit-play-icon');
    const musicEditWaveformBars = document.getElementById('music-edit-waveform-bars');
    const musicPlayerEditBtn = document.getElementById('music-player-edit-btn');
    const musicEditToolButtons = musicEditScreen ? musicEditScreen.querySelectorAll('.music-edit__tool') : [];

    // ── Music editor navbar helpers ───────────────────────────────────
    let musicEditDirty = false;

    function showMusicStarterHeader() {
        if (musicEditCloseBtn) musicEditCloseBtn.hidden = false;
        if (musicEditCancelBtn) musicEditCancelBtn.hidden = true;
        if (musicEditTitle) { musicEditTitle.hidden = false; musicEditTitle.textContent = 'Edit'; }
        if (musicEditAppbarActions) musicEditAppbarActions.hidden = true;
        if (musicEditDoneBtn) {
            musicEditDoneBtn.textContent = 'Save';
            musicEditDoneBtn.style.color = '';
            musicEditDoneBtn.disabled = !musicEditDirty;
        }
    }

    function showMusicSubtoolHeader() {
        if (musicEditCloseBtn) musicEditCloseBtn.hidden = true;
        if (musicEditCancelBtn) musicEditCancelBtn.hidden = false;
        if (musicEditTitle) musicEditTitle.hidden = true;
        if (musicEditAppbarActions) musicEditAppbarActions.hidden = false;
        if (musicEditDoneBtn) {
            musicEditDoneBtn.textContent = 'Done';
            musicEditDoneBtn.style.color = '';
            musicEditDoneBtn.disabled = false;
        }
    }

    function markMusicDirty() {
        musicEditDirty = true;
        if (musicEditDoneBtn && musicEditDoneBtn.textContent === 'Save') {
            musicEditDoneBtn.disabled = false;
        }
    }

    // Clipper elements
    const clipSelector = document.getElementById('clip-selector');
    const clipHandleLeft = document.getElementById('clip-handle-left');
    const clipHandleRight = document.getElementById('clip-handle-right');
    const clipBody = document.getElementById('clip-body');
    const clipPlayhead = document.getElementById('clip-playhead');
    const waveDimLeft = document.getElementById('waveform-dim-left');
    const waveDimRight = document.getElementById('waveform-dim-right');
    const clipStartTimeEl = document.getElementById('clip-start-time');
    const clipEndTimeEl = document.getElementById('clip-end-time');
    const clipDurationText = document.getElementById('clip-duration-text');
    const waveformViewport = document.getElementById('waveform-viewport');

    // Clipper constants
    let TRACK_DURATION = 180;
    const MIN_CLIP_SECS = 5;
    let MAX_CLIP_SECS = TRACK_DURATION; // full song
    const DEFAULT_CLIP_START = 42;
    const DEFAULT_CLIP_SECS = 15;
    const NUM_WAVEFORM_BARS = 90;

    // Clipper state
    let clipStartSec = DEFAULT_CLIP_START;
    let clipEndSec = DEFAULT_CLIP_START + DEFAULT_CLIP_SECS;
    let waveformBarHeights = [];
    let clipAudioCtx = null;
    let clipAudioBuffer = null;
    let clipSourceNode = null;
    let clipIsPlaying = false;
    let clipPlayheadRAF = null;
    let clipPlayStartedAt = 0;
    let clipPlayOffset = 0;
    let currentClipGenre = null; // track genre so we regenerate on change

    // --- Default Song MP3 Loader ---
    const DEFAULT_SONG_URL = "sample.mp3";
    let mp3Loading = false;
    let mp3Loaded = false;

    async function loadDefaultSongMP3() {
        if (mp3Loaded && clipAudioBuffer) return; // already loaded
        if (mp3Loading) return; // in progress
        mp3Loading = true;

        if (!clipAudioCtx) clipAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (clipAudioCtx.state === 'suspended') clipAudioCtx.resume();

        try {
            const resp = await fetch(encodeURI(DEFAULT_SONG_URL));
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuf = await resp.arrayBuffer();
            clipAudioBuffer = await clipAudioCtx.decodeAudioData(arrayBuf);

            // Update duration to match actual MP3 length
            const realDuration = clipAudioBuffer.duration;
            playerDuration = realDuration;
            TRACK_DURATION = realDuration;
            MAX_CLIP_SECS = realDuration;
            if (clipEndSec > realDuration) clipEndSec = realDuration;
            if (clipStartSec > realDuration - MIN_CLIP_SECS) clipStartSec = 0;

            // Extract waveform heights for the edit-screen visualizer
            const channelData = clipAudioBuffer.getChannelData(0);
            const totalSamples = channelData.length;
            waveformBarHeights = [];
            const samplesPerBar = Math.floor(totalSamples / NUM_WAVEFORM_BARS);
            for (let i = 0; i < NUM_WAVEFORM_BARS; i++) {
                let peak = 0;
                for (let j = i * samplesPerBar; j < (i + 1) * samplesPerBar; j += 8) {
                    peak = Math.max(peak, Math.abs(channelData[j]));
                }
                waveformBarHeights.push(peak);
            }
            const mx = Math.max(...waveformBarHeights, 0.01);
            waveformBarHeights = waveformBarHeights.map(v => Math.max(0.08, v / mx));

            currentClipGenre = 'mp3-default';
            mp3Loaded = true;
            console.log(`[Music] Loaded MP3: ${realDuration.toFixed(1)}s`);
        } catch (err) {
            console.warn('[Music] MP3 load failed, falling back to procedural:', err);
            generateProceduralFallback('90s-rap');
        } finally {
            mp3Loading = false;
        }
    }

    // Keep a lightweight procedural fallback in case MP3 fails
    function generateProceduralFallback(genre) {
        genre = genre || '90s-rap';
        currentClipGenre = genre;
        const sr = 22050;
        const dur = 30; // short fallback
        const len = sr * dur;
        if (!clipAudioCtx) clipAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        clipAudioBuffer = clipAudioCtx.createBuffer(1, len, sr);
        playerDuration = dur;
        const d = clipAudioBuffer.getChannelData(0);
        const bpm = 75;
        const beatSec = 60 / bpm;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const kick = ((t % beatSec) / beatSec) < 0.05 ? Math.sin(2 * Math.PI * 55 * t) * Math.exp(-(t % beatSec) * 15) * 0.4 : 0;
            const chord = Math.sin(2 * Math.PI * 261.6 * t) * 0.05 * Math.exp(-(t % (beatSec * 4)) * 0.8);
            d[i] = Math.max(-1, Math.min(1, kick + chord));
        }
        waveformBarHeights = [];
        const spb = Math.floor(len / NUM_WAVEFORM_BARS);
        for (let i = 0; i < NUM_WAVEFORM_BARS; i++) {
            let peak = 0;
            for (let j = i * spb; j < (i + 1) * spb; j += 8) peak = Math.max(peak, Math.abs(d[j]));
            waveformBarHeights.push(peak);
        }
        const mx = Math.max(...waveformBarHeights, 0.01);
        waveformBarHeights = waveformBarHeights.map(v => Math.max(0.08, v / mx));
    }

    // Wrapper that replaces old generateProceduralAudio — keeps call sites working
    function generateProceduralAudio(genre) {
        // Always prefer the MP3
        loadDefaultSongMP3();
    }

    // --- Waveform Rendering ---
    function renderWaveformBars() {
        if (!musicEditWaveformBars) return;
        musicEditWaveformBars.innerHTML = '';
        waveformBarHeights.forEach(h => {
            const bar = document.createElement('div');
            bar.className = 'music-edit__waveform-bar';
            bar.style.height = Math.round(h * 60) + 'px';
            musicEditWaveformBars.appendChild(bar);
        });
    }

    // --- Clip UI Update ---
    function updateClipUI() {
        if (!clipSelector || !waveformViewport) return;
        const lPct = (clipStartSec / TRACK_DURATION) * 100;
        const wPct = ((clipEndSec - clipStartSec) / TRACK_DURATION) * 100;
        clipSelector.style.left = lPct + '%';
        clipSelector.style.width = wPct + '%';
        if (waveDimLeft) waveDimLeft.style.width = lPct + '%';
        if (waveDimRight) {
            waveDimRight.style.left = (lPct + wPct) + '%';
            waveDimRight.style.width = (100 - lPct - wPct) + '%';
        }
        if (clipStartTimeEl) clipStartTimeEl.textContent = formatTime(clipStartSec);
        if (clipEndTimeEl) clipEndTimeEl.textContent = formatTime(clipEndSec);
        if (clipDurationText) clipDurationText.textContent = Math.round(clipEndSec - clipStartSec) + 's';
    }

    // --- Drag Interaction ---
    let clipDragType = null;
    let clipDragStartX = 0;
    let clipDragOrigStart = 0;
    let clipDragOrigEnd = 0;

    function getPointerX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
    function pxToSec(px) { return waveformViewport ? (px / waveformViewport.offsetWidth) * TRACK_DURATION : 0; }

    function startClipDrag(e, type) {
        e.preventDefault();
        e.stopPropagation();
        clipDragType = type;
        clipDragStartX = getPointerX(e);
        clipDragOrigStart = clipStartSec;
        clipDragOrigEnd = clipEndSec;
        if (clipSelector) clipSelector.classList.add('dragging');
        document.addEventListener('mousemove', onClipDrag);
        document.addEventListener('mouseup', endClipDrag);
        document.addEventListener('touchmove', onClipDrag, { passive: false });
        document.addEventListener('touchend', endClipDrag);
    }

    function onClipDrag(e) {
        if (!clipDragType || !waveformViewport) return;
        e.preventDefault();
        // Clamp pointer to waveform viewport bounds
        const vpRect = waveformViewport.getBoundingClientRect();
        const rawX = getPointerX(e);
        const clampedX = Math.max(vpRect.left, Math.min(vpRect.right, rawX));
        const dSec = pxToSec(clampedX - clipDragStartX);
        if (clipDragType === 'move') {
            const dur = clipDragOrigEnd - clipDragOrigStart;
            let ns = Math.max(0, Math.min(TRACK_DURATION - dur, clipDragOrigStart + dSec));
            clipStartSec = ns;
            clipEndSec = ns + dur;
        } else if (clipDragType === 'resize-left') {
            let ns = clipDragOrigStart + dSec;
            ns = Math.max(Math.max(0, clipDragOrigEnd - MAX_CLIP_SECS), Math.min(clipDragOrigEnd - MIN_CLIP_SECS, ns));
            clipStartSec = ns;
        } else if (clipDragType === 'resize-right') {
            let ne = clipDragOrigEnd + dSec;
            ne = Math.max(clipDragOrigStart + MIN_CLIP_SECS, Math.min(Math.min(TRACK_DURATION, clipDragOrigStart + MAX_CLIP_SECS), ne));
            clipEndSec = ne;
        }
        updateClipUI();
    }

    function endClipDrag() {
        clipDragType = null;
        if (clipSelector) clipSelector.classList.remove('dragging');
        document.removeEventListener('mousemove', onClipDrag);
        document.removeEventListener('mouseup', endClipDrag);
        document.removeEventListener('touchmove', onClipDrag);
        document.removeEventListener('touchend', endClipDrag);
        // If playing, restart at updated selection so loop stays in sync
        if (clipIsPlaying) {
            clipStoppingIntentional = true;
            if (clipSourceNode) { try { clipSourceNode.stop(); } catch (_) { } clipSourceNode = null; }
            clipStoppingIntentional = false;
            _startClipSource();
        }
    }

    if (clipHandleLeft) {
        clipHandleLeft.addEventListener('mousedown', e => startClipDrag(e, 'resize-left'));
        clipHandleLeft.addEventListener('touchstart', e => startClipDrag(e, 'resize-left'), { passive: false });
    }
    if (clipHandleRight) {
        clipHandleRight.addEventListener('mousedown', e => startClipDrag(e, 'resize-right'));
        clipHandleRight.addEventListener('touchstart', e => startClipDrag(e, 'resize-right'), { passive: false });
    }
    if (clipBody) {
        clipBody.addEventListener('mousedown', e => startClipDrag(e, 'move'));
        clipBody.addEventListener('touchstart', e => startClipDrag(e, 'move'), { passive: false });
    }

    // --- Audio Playback (looping selected clip) ---
    let clipStoppingIntentional = false; // flag to distinguish user-stop from loop-restart

    async function playClipAudio() {
        // Load MP3 if not yet available
        if (!clipAudioBuffer) {
            await loadDefaultSongMP3();
        }
        if (!clipAudioBuffer || !clipAudioCtx) return;
        clipStoppingIntentional = false;
        _startClipSource();
        if (clipPlayhead) clipPlayhead.classList.add('active');
        if (musicEditPlayIcon) musicEditPlayIcon.textContent = 'pause';
        animatePlayhead();
    }

    function _startClipSource() {
        // Stop previous source if any
        if (clipSourceNode) { try { clipSourceNode.stop(); } catch (_) { } clipSourceNode = null; }
        if (clipAudioCtx.state === 'suspended') clipAudioCtx.resume();

        // Ensure mood effects are initialized on this context
        if (!moodEffectsReady || (moodFilterNode && moodFilterNode.context !== clipAudioCtx)) {
            moodEffectsReady = false;
            initMoodEffects(clipAudioCtx);
            updateMoodAudioEffects();
            startMoodPanWobble();
        }

        clipSourceNode = clipAudioCtx.createBufferSource();
        clipSourceNode.buffer = clipAudioBuffer;

        // Route through mood effects chain
        const moodInput = getMoodOutputNode();
        if (moodInput) {
            clipSourceNode.connect(moodInput);
        } else {
            clipSourceNode.connect(clipAudioCtx.destination);
        }

        const dur = clipEndSec - clipStartSec;
        clipSourceNode.start(0, clipStartSec, dur);
        clipPlayStartedAt = clipAudioCtx.currentTime;
        clipPlayOffset = clipStartSec;
        clipIsPlaying = true;

        // Apply current trackpad BPM rate immediately
        if (typeof moodPadY !== 'undefined' && clipSourceNode.playbackRate) {
            const rate = 1.0 + moodPadY * 0.15;
            clipSourceNode.playbackRate.value = rate;
        }
        clipSourceNode.onended = () => {
            if (clipStoppingIntentional) return; // user pressed pause
            // Loop: restart the clip from the beginning
            _startClipSource();
        };
    }

    function stopClipAudio() {
        clipStoppingIntentional = true;
        if (clipSourceNode) { try { clipSourceNode.stop(); } catch (_) { } clipSourceNode = null; }
        clipIsPlaying = false;
        if (clipPlayhead) clipPlayhead.classList.remove('active');
        if (musicEditPlayIcon) musicEditPlayIcon.textContent = 'play_arrow';
        cancelAnimationFrame(clipPlayheadRAF);
    }

    function animatePlayhead() {
        if (!clipIsPlaying || !clipPlayhead || !clipSelector) return;
        const elapsed = clipAudioCtx.currentTime - clipPlayStartedAt;
        const clipDur = clipEndSec - clipStartSec;
        // Use modulo so the playhead wraps on loop
        const localPos = elapsed % clipDur;
        clipPlayhead.style.left = ((localPos / clipDur) * 100) + '%';
        clipPlayheadRAF = requestAnimationFrame(animatePlayhead);
    }

    // --- Show/Hide Edit Screen ---
    function showMusicEditScreen() {
        if (!musicEditScreen) return;
        // Copy the artwork from the player
        const playerArt = document.querySelector('.music-player__artwork-img');
        if (playerArt && musicEditArtworkImg) {
            musicEditArtworkImg.src = playerArt.src;
        }
        // Generate waveform bars
        renderWaveformBars();
        // Reset to starter page: no tool active, all panels hidden
        musicEditToolButtons.forEach(t => {
            t.classList.remove('active');
            t.querySelector('.music-edit__tool-btn').classList.remove('music-edit__tool-btn--active');
        });
        showToolPanel('summary'); // Show edit summary screen
        // Reset dirty state for new session
        musicEditDirty = false;
        showMusicStarterHeader();
        musicEditScreen.hidden = false;
        musicEditScreen.classList.remove('exiting');
    }

    function hideMusicEditScreen() {
        if (!musicEditScreen) return;
        stopClipAudio();
        stopLyricsKaraoke();
        // Hide discard dialog if open
        const discardDialog = document.getElementById('music-discard-dialog');
        if (discardDialog) discardDialog.hidden = true;
        musicEditScreen.classList.add('exiting');
        setTimeout(() => { musicEditScreen.hidden = true; musicEditScreen.classList.remove('exiting'); }, 300);
    }

    // Edit button → open edit screen
    if (musicPlayerEditBtn) {
        musicPlayerEditBtn.addEventListener('click', () => showMusicEditScreen());
    }

    // Download button → open clip bottom sheet
    const musicPlayerDownloadBtn = document.getElementById('music-player-download-btn');
    const clipBottomSheet = document.getElementById('clip-bottom-sheet');
    const clipSheetBackdrop = document.getElementById('clip-sheet-backdrop');
    const clipSheetDownloadBtn = document.getElementById('clip-sheet-download-btn');

    function openClipSheet() {
        if (!clipBottomSheet) return;
        clipBottomSheet.hidden = false;
        renderWaveformBars();
    }

    function closeClipSheet() {
        if (!clipBottomSheet) return;
        clipBottomSheet.hidden = true;
    }

    if (musicPlayerDownloadBtn) {
        musicPlayerDownloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openClipSheet();
        });
    }

    if (clipSheetBackdrop) {
        clipSheetBackdrop.addEventListener('click', () => closeClipSheet());
    }

    if (clipSheetDownloadBtn) {
        clipSheetDownloadBtn.addEventListener('click', () => {
            showToast('Track downloaded');
            closeClipSheet();
        });
    }

    // Close button → show discard dialog only if dirty
    if (musicEditCloseBtn) {
        musicEditCloseBtn.addEventListener('click', () => {
            if (musicEditDirty) {
                const discardDialog = document.getElementById('music-discard-dialog');
                if (discardDialog) discardDialog.hidden = false;
            } else {
                hideMusicEditScreen();
            }
        });
    }

    // Cancel button (sub-tool mode) → return to starter screen
    if (musicEditCancelBtn) {
        musicEditCancelBtn.addEventListener('click', () => {
            exitMusicArtSubtool();
            showToolPanel('summary');
            showMusicStarterHeader();
        });
    }

    // Done/Save button
    // Saved mood state (persists after Done)
    let savedMoodX = 0;
    let savedMoodY = 0;
    let moodApplied = false;
    let activeMusicEditTool = 'summary';

    if (musicEditDoneBtn) {
        musicEditDoneBtn.addEventListener('click', () => {
            if (activeMusicEditTool !== 'summary') {
                const toolName = activeMusicEditTool;

                // Save mood settings when leaving mood tool
                if (toolName === 'mood') {
                    savedMoodX = moodPadX;
                    savedMoodY = moodPadY;
                    moodApplied = true;
                }

                // Mark dirty and return to starter screen
                markMusicDirty();
                showToolPanel('summary');
                exitMusicArtSubtool();
                showMusicStarterHeader();
                const toastMsg = toolName === 'lyrics' ? 'Lyrics saved'
                    : toolName === 'mood' ? 'Mood applied to track'
                        : 'Art saved';
                showToast(toastMsg);
            } else {
                // Save on starter screen → close editor
                showToast('Changes applied');
                hideMusicEditScreen();
            }
        });
    }

    // Music Discard dialog buttons
    const musicDiscardKeep = document.getElementById('music-discard-keep');
    const musicDiscardConfirm = document.getElementById('music-discard-confirm');
    const musicDiscardClose = document.getElementById('music-discard-close');
    const musicDiscardBackdrop = document.getElementById('music-discard-backdrop');

    if (musicDiscardKeep) {
        musicDiscardKeep.addEventListener('click', () => {
            document.getElementById('music-discard-dialog').hidden = true;
        });
    }
    if (musicDiscardConfirm) {
        musicDiscardConfirm.addEventListener('click', () => {
            hideMusicEditScreen();
        });
    }
    if (musicDiscardClose) {
        musicDiscardClose.addEventListener('click', () => {
            document.getElementById('music-discard-dialog').hidden = true;
        });
    }
    if (musicDiscardBackdrop) {
        musicDiscardBackdrop.addEventListener('click', () => {
            document.getElementById('music-discard-dialog').hidden = true;
        });
    }

    // Play/Pause in edit screen — plays the clip audio + speaks lyrics
    let editModeLyricsInterval = null;
    let editModeLyricsIndex = 0;
    let editModeLyricsSpoken = new Set();

    function startEditModeLyrics() {
        // Build lyrics data if not already
        const genre = selectedMusicCard || '90s-rap';
        const lyricsRaw = genreLyrics[genre] || genreLyrics['90s-rap'];
        if (!lyricsLineMap || lyricsLineMap.length === 0) {
            buildLineMap(lyricsRaw);
        }
        // Parse word spans in memory (not displayed)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = parseLyricsToHTML(lyricsRaw);
        const wordCount = tempDiv.querySelectorAll('.lyrics-word').length;
        if (wordCount === 0) return;

        editModeLyricsIndex = 0;
        editModeLyricsSpoken = new Set();
        // Speak first line
        speakWordIfLineStartEdit(0);

        editModeLyricsInterval = setInterval(() => {
            editModeLyricsIndex++;
            if (editModeLyricsIndex >= wordCount) {
                editModeLyricsIndex = 0;
                editModeLyricsSpoken = new Set();
            }
            speakWordIfLineStartEdit(editModeLyricsIndex);
        }, 300);
    }

    function speakWordIfLineStartEdit(wordIndex) {
        const line = lyricsLineMap.find(l => l.startWordIndex === wordIndex);
        if (line && !editModeLyricsSpoken.has(wordIndex)) {
            editModeLyricsSpoken.add(wordIndex);
            speakLine(line.text);
        }
    }

    function stopEditModeLyrics() {
        if (editModeLyricsInterval) {
            clearInterval(editModeLyricsInterval);
            editModeLyricsInterval = null;
        }
        cancelSpeech();
    }

    if (musicEditPlayBtn) {
        musicEditPlayBtn.addEventListener('click', () => {
            // If in lyrics editing mode, apply edits first then resume karaoke
            if (activeMusicEditTool === 'lyrics' && lyricsEditing) {
                const newLyrics = musicEditLyricsText?.innerText?.trim();
                if (newLyrics) {
                    const genre = selectedMusicCard || '90s-rap';
                    genreLyrics[genre] = newLyrics;
                    musicEditLyricsText.contentEditable = 'false';
                    lyricsEditing = false;
                    // Re-parse lyrics with word spans
                    musicEditLyricsText.innerHTML = parseLyricsToHTML(newLyrics);
                    buildLineMap(newLyrics);
                    // Clamp resume index
                    const resumeAt = Math.min(lyricsEditResumeIndex, lyricsWordSpans.length - 1);
                    seekLyricsTo(resumeAt);
                    // Resume karaoke + backing track from saved position
                    setTimeout(() => startLyricsKaraoke(false), 200);
                }
                return;
            }

            // If in lyrics karaoke mode, toggle karaoke playback
            if (activeMusicEditTool === 'lyrics') {
                if (lyricsKaraokeInterval) {
                    // Pause karaoke
                    clearInterval(lyricsKaraokeInterval);
                    lyricsKaraokeInterval = null;
                    stopBackingTrack();
                    cancelSpeech();
                    updateScrubberIcon(false);
                    lyricsIsPaused = true;
                } else {
                    // Resume karaoke from current position
                    lyricsIsPaused = false;
                    startLyricsKaraoke(false);
                }
                return;
            }

            // Default: summary/art/mood — toggle clip audio
            if (clipIsPlaying) {
                stopClipAudio();
                stopEditModeLyrics();
            } else {
                playClipAudio();
                startEditModeLyrics();
            }
        });
    }

    // Tool switching — show/hide panels
    const panelArt = document.getElementById('panel-art');
    const panelLyrics = document.getElementById('panel-lyrics');
    const panelMood = document.getElementById('panel-mood');
    const clipSection = document.getElementById('clip-section');

    const musicLyricsInput = document.getElementById('music-edit-lyrics-input');
    const musicLyricsInputText = document.getElementById('music-lyrics-input-text');
    const musicEditArtworkContainer = document.getElementById('music-edit-artwork-container');
    const musicEditLyricsText = document.getElementById('music-edit-lyrics-text');
    const musicToolButtonsRow = document.querySelector('.music-edit__tool-buttons');
    const musicGestureBar = document.querySelector('.music-edit__screen .music-edit__gesture-bar') ||
        document.querySelector('.music-edit__gesture-bar');

    // Helper: show/hide music input bar and sync gesture bar background
    function setMusicInputVisible(visible) {
        if (musicLyricsInput) musicLyricsInput.hidden = !visible;
        if (musicGestureBar) musicGestureBar.classList.toggle('input-visible', visible);
        // Also sync the bottom gesture bar (adjacent to Art/Select input)
        const bottomGestureBar = document.getElementById('music-edit-bottom-gesture-bar');
        if (bottomGestureBar) bottomGestureBar.classList.toggle('input-visible', visible);
    }

    // Genre-specific lyrics
    const genreLyrics = {
        '90s-rap': `[Verse 1]
Yeah, uh, check it out now
Rolling through the city with the windows down
Bass boomin', speakers on a hundred thou
Every corner know my name, every block my ground

[Chorus]
We ride all night, we ride all day
Ninety-something vibes, that's the only way
Heads noddin' to the beat on replay
This is how we do it, what can I say

[Verse 2]
Timberlands laced up, fitted cap low
Freestylin' on the corner, let the cipher flow
Boombox blastin', vinyl on the stereo
Back when hip-hop had a soul, you know`,

        'latin-pop': `[Verso 1]
Bajo la luna llena, bailamos sin parar
El ritmo nos envuelve, no lo puedo evitar
Tu sonrisa brilla como el sol sobre el mar
Esta noche es nuestra, vamos a celebrar

[Coro]
Muévete, muévete, siente la vibración
Tu corazón latiendo al ritmo de esta canción
Muévete, muévete, no pares el calor
Que esta noche eterna es solo para el amor

[Verso 2]
Las palmas al cielo, los pies en la arena
La brisa del Caribe que me lleva y me llena
No importa el mañana, solo importa el ahora
Contigo cada instante vale más que una hora`,

        'folk-ballad': `[Verse 1]
Down by the river where the willows weep
I found a melody I want to keep
The old oak whispers secrets to the breeze
And somewhere distant, church bells find their peace

[Chorus]
Carry me home through the amber fields
Where the harvest moon its lantern wields
Through the winding roads my heart still knows
Back to where the quiet river flows

[Verse 2]
My grandfather's hands upon the worn guitar
He played the songs of every falling star
And mama hummed along beside the fire
While the evening wrapped us higher, ever higher`,

        '8-bit': `[LEVEL 1]
Power up! Here we go again
Jumping over pixels, dodging to the end
Coins are spinning, stars are in the sky
Press start to continue, never say goodbye

[BOSS FIGHT]
Beep boop bop, the dragon's breathing fire
Dodge left, dodge right, jump a little higher
Final hit! The princess has been saved
High score recorded, name forever engraved

[GAME OVER]
Insert another coin to play once more
The chiptune echoes on the arcade floor
Eight bits of glory, sixteen bits of dreams
Nothing is exactly what it seems`,

        'workout': `[Verse 1]
Rise up! No more sleeping in
Every rep's a battle that I'm gonna win
Sweat on my brow, fire in my chest
Push it to the limit, nothing less than best

[Chorus]
Stronger! — we go harder every day
Louder! — nothing standing in my way
Faster! — break the walls that hold me down
This is my arena, this is my crown

[Verse 2]
Sixty seconds resting, then we go again
Count the reps like heartbeats — eight, nine, ten
Mirror shows a fighter who won't ever quit
Every single muscle says I'm built for this`,

        'reggaeton': `[Verso 1]
La noche está encendida, el DJ no para
El bajo retumbando, toda la discoteca estalla
Tu mirada me atrapa como una llamarada
Un paso más cerquita, no me digas nada

[Coro]
Dale, dale, que la noche es joven
Perreo hasta abajo, que el beat se rompe
Dale, dale, siente cómo se mueve
La calle entera sabe que aquí se prende

[Verso 2]
Dembow en los parlantes, sudor en la pista
Tú eres la película, yo soy el artista
Cada movimiento como fuego y brisa
Esta es la energía que nadie improvisa`,
    };

    const lyricsScrubberFill = document.getElementById('lyrics-scrubber-fill');
    const lyricsScrubberThumb = document.getElementById('lyrics-scrubber-thumb');
    let lyricsKaraokeInterval = null;
    let lyricsWordSpans = [];
    let lyricsCurrentWordIndex = 0;

    function parseLyricsToHTML(lyricsText) {
        const lines = lyricsText.split('\n');
        let html = '';
        lyricsWordSpans = [];
        let wordIndex = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                html += '<span class="lyrics-line-break"></span>';
                return;
            }
            // Section headers like [Verse 1], [Chorus]
            if (/^\[.*\]$/.test(trimmed)) {
                html += `<span class="lyrics-section">${trimmed}</span>`;
                return;
            }
            // Regular line — wrap each word
            const words = trimmed.split(/\s+/);
            words.forEach((word, i) => {
                const id = `lw-${wordIndex}`;
                html += `<span class="lyrics-word" id="${id}">${word}</span>`;
                if (i < words.length - 1) html += ' ';
                lyricsWordSpans.push(id);
                wordIndex++;
            });
            html += '<br>';
        });

        return html;
    }

    // Speech synthesis for lyrics
    let lyricsSpeechSynth = window.speechSynthesis;
    let lyricsLineMap = []; // [{startWordIndex, endWordIndex, text}]
    let lyricsSpokenLines = new Set();
    let lyricsCurrentGenre = '';

    // Genre-specific voice settings
    const genreVoiceSettings = {
        '90s-rap': { rate: 1.3, pitch: 0.8 },
        'latin-pop': { rate: 1.1, pitch: 1.1 },
        'folk-ballad': { rate: 0.85, pitch: 1.0 },
        '8-bit': { rate: 1.4, pitch: 1.5 },
        'workout': { rate: 1.2, pitch: 0.9 },
        'reggaeton': { rate: 1.15, pitch: 1.05 },
    };

    function buildLineMap(lyricsText) {
        lyricsLineMap = [];
        const lines = lyricsText.split('\n');
        let wordIndex = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || /^\[.*\]$/.test(trimmed)) return;
            const words = trimmed.split(/\s+/);
            const startIdx = wordIndex;
            wordIndex += words.length;
            lyricsLineMap.push({
                startWordIndex: startIdx,
                endWordIndex: wordIndex - 1,
                text: trimmed
            });
        });
    }

    // Mood vocal overrides (set by mood pad XY)
    let moodVocalPitch = 1.0;
    let moodVocalRate = 1.0;

    function speakLine(text) {
        if (!lyricsSpeechSynth) return;
        const genre = lyricsCurrentGenre || '90s-rap';
        const settings = genreVoiceSettings[genre] || genreVoiceSettings['90s-rap'];
        const utterance = new SpeechSynthesisUtterance(text);
        // Apply base genre settings + mood overrides
        utterance.rate = settings.rate * moodVocalRate;
        utterance.pitch = settings.pitch * moodVocalPitch;
        utterance.volume = 1.0;
        // Pick the most natural voice available
        const voices = lyricsSpeechSynth.getVoices();
        const preferredVoice =
            // Premium/Enhanced voices (macOS/iOS)
            voices.find(v => v.lang.startsWith('en') && /enhanced|premium|neural/i.test(v.name))
            // Samantha (macOS default, good quality)
            || voices.find(v => v.name.includes('Samantha'))
            // Google voices (Chrome)
            || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
            // Any English voice
            || voices.find(v => v.lang.startsWith('en'))
            || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        // For Spanish/Latin genres, try a Spanish voice
        if (genre === 'latin-pop' || genre === 'reggaeton') {
            const spanishVoice = voices.find(v => v.lang.startsWith('es') && /enhanced|premium|neural/i.test(v.name))
                || voices.find(v => v.lang.startsWith('es') && v.name.includes('Google'))
                || voices.find(v => v.lang.startsWith('es'));
            if (spanishVoice) utterance.voice = spanishVoice;
        }
        lyricsSpeechSynth.speak(utterance);
    }

    function speakWordIfLineStart(wordIndex) {
        const line = lyricsLineMap.find(l => l.startWordIndex === wordIndex);
        if (line && !lyricsSpokenLines.has(wordIndex)) {
            lyricsSpokenLines.add(wordIndex);
            speakLine(line.text);
        }
    }

    function cancelSpeech() {
        if (lyricsSpeechSynth) lyricsSpeechSynth.cancel();
    }

    // --- Background Music (Lo-fi Hip Hop from clipAudioBuffer) ---
    let lyricsAudioCtx = null;
    let lyricsBackingNodes = [];
    let lyricsIsPlaying = false;
    let lyricsBackingSource = null;
    let lyricsBackingGain = null;

    // (Legacy chord configs kept for reference but no longer used)
    const genreChords = {
        '90s-rap': { bpm: 90 }, 'latin-pop': { bpm: 110 }, 'folk-ballad': { bpm: 72 },
        '8-bit': { bpm: 140 }, 'workout': { bpm: 128 }, 'reggaeton': { bpm: 95 },
    };

    async function startBackingTrack() {
        if (lyricsIsPlaying) return;

        // Load the default MP3 if not yet available
        if (!clipAudioBuffer) {
            await loadDefaultSongMP3();
        }
        if (!clipAudioBuffer) return;

        if (!lyricsAudioCtx) lyricsAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (lyricsAudioCtx.state === 'suspended') lyricsAudioCtx.resume();

        stopBackingTrack();
        lyricsIsPlaying = true;

        // Create gain node for lower volume background
        lyricsBackingGain = lyricsAudioCtx.createGain();
        lyricsBackingGain.gain.value = 0.3; // 30% volume — sits behind lyrics/voice
        lyricsBackingGain.connect(lyricsAudioCtx.destination);

        // Play the lo-fi buffer on loop
        lyricsBackingSource = lyricsAudioCtx.createBufferSource();
        lyricsBackingSource.buffer = clipAudioBuffer;
        lyricsBackingSource.loop = true;
        lyricsBackingSource.connect(lyricsBackingGain);
        lyricsBackingSource.start(0);
    }

    let lyricsBackingLoopTimeout = null;
    let lyricsDrumTimeout = null;

    function stopBackingTrack() {
        lyricsIsPlaying = false;
        if (lyricsBackingLoopTimeout) { clearTimeout(lyricsBackingLoopTimeout); lyricsBackingLoopTimeout = null; }
        if (lyricsDrumTimeout) { clearTimeout(lyricsDrumTimeout); lyricsDrumTimeout = null; }
        // Stop the lo-fi backing source
        if (lyricsBackingSource) {
            try { lyricsBackingSource.stop(); } catch (e) { }
            lyricsBackingSource = null;
        }
        lyricsBackingGain = null;
        // Also stop any legacy oscillator nodes
        lyricsBackingNodes.forEach(n => { try { n.stop(); } catch (e) { } });
        lyricsBackingNodes = [];
    }

    // --- Scrubber Icon State ---
    const lyricsScrubberIcon = document.getElementById('lyrics-scrubber-icon');

    function updateScrubberIcon(playing) {
        if (lyricsScrubberIcon) {
            lyricsScrubberIcon.textContent = playing ? 'pause' : 'play_arrow';
        }
    }

    function startLyricsKaraoke(fromStart = true) {
        // Stop any existing interval but DON'T reset scrubber position
        if (lyricsKaraokeInterval) {
            clearInterval(lyricsKaraokeInterval);
            lyricsKaraokeInterval = null;
        }
        const totalWords = lyricsWordSpans.length;
        if (totalWords === 0) return;

        if (fromStart) {
            lyricsCurrentWordIndex = 0;
            lyricsSpokenLines = new Set();
            cancelSpeech();
            // Reset all words
            lyricsWordSpans.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.remove('lyrics-word--active', 'lyrics-word--sung');
                }
            });
            // Highlight first word
            const firstEl = document.getElementById(lyricsWordSpans[0]);
            if (firstEl) firstEl.classList.add('lyrics-word--active');
            // Speak first line
            speakWordIfLineStart(0);
        }

        // Start background music
        startBackingTrack();
        updateScrubberIcon(true);

        const wordDuration = 300; // ms per word

        lyricsKaraokeInterval = setInterval(() => {
            // Mark previous word as sung
            const prevEl = document.getElementById(lyricsWordSpans[lyricsCurrentWordIndex]);
            if (prevEl) {
                prevEl.classList.remove('lyrics-word--active');
                prevEl.classList.add('lyrics-word--sung');
            }

            lyricsCurrentWordIndex++;

            if (lyricsCurrentWordIndex >= totalWords) {
                // Loop — reset all words
                lyricsCurrentWordIndex = 0;
                lyricsSpokenLines = new Set();
                cancelSpeech();
                lyricsWordSpans.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.remove('lyrics-word--sung');
                });
            }

            // Highlight current word
            const curEl = document.getElementById(lyricsWordSpans[lyricsCurrentWordIndex]);
            if (curEl) {
                curEl.classList.add('lyrics-word--active');
                // Auto-scroll to keep active word visible
                const scrollContainer = document.getElementById('music-edit-lyrics-scroll');
                if (scrollContainer) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const wordRect = curEl.getBoundingClientRect();
                    if (wordRect.bottom > containerRect.bottom - 20 || wordRect.top < containerRect.top + 20) {
                        curEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }

            // Speak line if this is the start of one
            speakWordIfLineStart(lyricsCurrentWordIndex);

            // Update scrubber
            const pct = (lyricsCurrentWordIndex / totalWords) * 100;
            if (lyricsScrubberFill) lyricsScrubberFill.style.width = pct + '%';
            if (lyricsScrubberThumb) lyricsScrubberThumb.style.left = pct + '%';
        }, wordDuration);
    }

    function stopLyricsKaraoke() {
        if (lyricsKaraokeInterval) {
            clearInterval(lyricsKaraokeInterval);
            lyricsKaraokeInterval = null;
        }
        cancelSpeech();
        stopBackingTrack();
        updateScrubberIcon(false);
        lyricsSpokenLines = new Set();
        // Reset scrubber
        if (lyricsScrubberFill) lyricsScrubberFill.style.width = '0%';
        if (lyricsScrubberThumb) lyricsScrubberThumb.style.left = '0%';
    }

    // Seek lyrics to a specific word index
    function seekLyricsTo(targetIndex) {
        const totalWords = lyricsWordSpans.length;
        if (totalWords === 0) return;
        targetIndex = Math.max(0, Math.min(targetIndex, totalWords - 1));

        // Update all word states
        lyricsWordSpans.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.remove('lyrics-word--active', 'lyrics-word--sung');
            if (i < targetIndex) {
                el.classList.add('lyrics-word--sung');
            } else if (i === targetIndex) {
                el.classList.add('lyrics-word--active');
            }
        });

        lyricsCurrentWordIndex = targetIndex;
        cancelSpeech();
        lyricsSpokenLines = new Set();

        // Update scrubber position
        const pct = (targetIndex / totalWords) * 100;
        if (lyricsScrubberFill) lyricsScrubberFill.style.width = pct + '%';
        if (lyricsScrubberThumb) lyricsScrubberThumb.style.left = pct + '%';

        // Scroll to the active word
        const curEl = document.getElementById(lyricsWordSpans[targetIndex]);
        if (curEl) {
            curEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Scrubber interaction — click to jump (no drag)
    const scrubberTrackEl = document.querySelector('.music-edit__lyrics-scrubber-track');

    function getScrubberIndex(e) {
        if (!scrubberTrackEl || lyricsWordSpans.length === 0) return 0;
        const rect = scrubberTrackEl.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(pct * (lyricsWordSpans.length - 1));
    }

    if (scrubberTrackEl) {
        // Click on track → jump playback head to that position
        scrubberTrackEl.addEventListener('click', (e) => {
            if (lyricsWordSpans.length === 0) return;
            // Don't handle if click was on the thumb (thumb has its own handler)
            if (e.target.closest('.music-edit__lyrics-scrubber-thumb')) return;

            const targetIndex = getScrubberIndex(e);
            seekLyricsTo(targetIndex);
            // Resume playback from new position
            startLyricsKaraoke(false);
        });
    }

    // --- Scrubber thumb: tap to play/pause, drag to scrub ---
    let lyricsIsPaused = false;
    const scrubberThumbEl = document.getElementById('lyrics-scrubber-thumb');
    let thumbDragging = false;
    let thumbDragMoved = false;
    let wasPlayingBeforeDrag = false;

    if (scrubberThumbEl) {
        scrubberThumbEl.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (lyricsWordSpans.length === 0) return;
            thumbDragging = true;
            thumbDragMoved = false;
            wasPlayingBeforeDrag = !!lyricsKaraokeInterval;
            scrubberThumbEl.setPointerCapture(e.pointerId);
            // Pause karaoke while dragging
            if (lyricsKaraokeInterval) {
                clearInterval(lyricsKaraokeInterval);
                lyricsKaraokeInterval = null;
            }
            stopBackingTrack();
            cancelSpeech();
            // Disable transition for responsive dragging
            if (lyricsScrubberFill) lyricsScrubberFill.style.transition = 'none';
            if (lyricsScrubberThumb) lyricsScrubberThumb.style.transition = 'none';
        });

        scrubberThumbEl.addEventListener('pointermove', (e) => {
            if (!thumbDragging) return;
            thumbDragMoved = true;
            const trackRect = scrubberTrackEl.getBoundingClientRect();
            const clientX = e.clientX;
            const pct = Math.max(0, Math.min(1, (clientX - trackRect.left) / trackRect.width));
            const targetIndex = Math.round(pct * (lyricsWordSpans.length - 1));
            seekLyricsTo(targetIndex);
            updateScrubberIcon(false);
        });

        scrubberThumbEl.addEventListener('pointerup', (e) => {
            if (!thumbDragging) return;
            thumbDragging = false;
            // Restore transitions
            if (lyricsScrubberFill) lyricsScrubberFill.style.transition = '';
            if (lyricsScrubberThumb) lyricsScrubberThumb.style.transition = '';

            if (thumbDragMoved) {
                // User dragged — resume playback from new position
                startLyricsKaraoke(false);
            } else {
                // User tapped — toggle play/pause
                if (wasPlayingBeforeDrag) {
                    updateScrubberIcon(false);
                    lyricsIsPaused = true;
                } else {
                    lyricsIsPaused = false;
                    startLyricsKaraoke(false);
                }
            }
        });
    }

    function showToolPanel(toolName) {
        const isSummary = toolName === 'summary';
        const isArt = toolName === 'art';
        const isLyrics = toolName === 'lyrics';
        const isMood = toolName === 'mood';

        // Stop music playback when entering Art mode
        if (isArt) {
            try { stopClipAudio(); } catch (e) { }
            try { pausePlayerPlayback(); } catch (e) { }
        }

        // Stop lyrics karaoke when leaving lyrics mode
        if (!isLyrics) {
            try { stopLyricsKaraoke(); } catch (e) { }
        }

        // Show/hide tool-specific panels
        if (panelArt) panelArt.hidden = !isArt;
        if (panelLyrics) panelLyrics.hidden = !isLyrics;
        if (panelMood) panelMood.hidden = !isMood;

        // Fade out play button when Art tool is active
        const playBtn = document.getElementById('music-edit-play-btn');
        if (playBtn) {
            playBtn.style.opacity = isArt ? '0' : '1';
            playBtn.style.pointerEvents = isArt ? 'none' : 'auto';
        }

        // Show tool-buttons row only on the summary screen
        if (musicToolButtonsRow) {
            musicToolButtonsRow.style.display = isSummary ? '' : 'none';
        }

        // Update header via unified helpers
        if (isSummary) {
            showMusicStarterHeader();
        } else {
            showMusicSubtoolHeader();
        }

        // Track active tool
        activeMusicEditTool = toolName;

        // Show/hide lyrics input bar — only for Art sub-tools, NOT lyrics
        if (musicLyricsInput) {
            // Lyrics mode does NOT show the input bar — user taps lyrics to edit inline
            setMusicInputVisible(false);
        }

        // Lyrics mode: fade to white, show lyrics panel
        if (isLyrics) {
            const genre = selectedMusicCard || '90s-rap';
            const lyricsRaw = genreLyrics[genre] || genreLyrics['90s-rap'];
            lyricsCurrentGenre = genre;
            if (musicEditLyricsText) {
                musicEditLyricsText.innerHTML = parseLyricsToHTML(lyricsRaw);
                buildLineMap(lyricsRaw);
            }
            // Fade entire screen to white
            if (musicEditScreen) musicEditScreen.classList.add('lyrics-mode');
            // Start karaoke + audio after fade
            setTimeout(() => {
                startLyricsKaraoke();
                try { startPlayerPlayback(); } catch (e) { }
            }, 500);
        } else {
            if (musicEditScreen) musicEditScreen.classList.remove('lyrics-mode');
            stopLyricsKaraoke();
        }

        // Mood mode: auto-start track + lyrics so user hears effects
        if (isMood) {
            // Restore saved mood position if previously set
            if (moodApplied) {
                moodPadX = savedMoodX;
                moodPadY = savedMoodY;
                updateMoodAudioEffects();
            }
            setTimeout(() => {
                if (!clipIsPlaying) {
                    playClipAudio();
                    startEditModeLyrics();
                }
            }, 400);
        } else if (!isLyrics) {
            // Stop lyrics TTS when leaving mood (unless going to lyrics mode)
            stopEditModeLyrics();
        }

        // Clear tool button highlighting when on summary
        if (isSummary) {
            musicEditToolButtons.forEach(t => {
                t.classList.remove('active');
                t.querySelector('.music-edit__tool-btn').classList.remove('music-edit__tool-btn--active');
            });
        }
    }

    musicEditToolButtons.forEach(tool => {
        tool.addEventListener('click', () => {
            musicEditToolButtons.forEach(t => {
                t.classList.remove('active');
                t.querySelector('.music-edit__tool-btn').classList.remove('music-edit__tool-btn--active');
            });
            tool.classList.add('active');
            tool.querySelector('.music-edit__tool-btn').classList.add('music-edit__tool-btn--active');
            showToolPanel(tool.dataset.tool);
            // When switching main tools, exit any active art sub-tool
            exitMusicArtSubtool();
            // Auto-default to the Select sub-tool when Art is selected
            if (tool.dataset.tool === 'art') {
                enterMusicArtSubtool('select');
            }
        });
    });

    // --- Lyrics Tap-to-Edit ---
    // When user taps/clicks the lyrics text, pause karaoke and make editable
    let lyricsEditing = false;
    if (musicEditLyricsText) {
        musicEditLyricsText.addEventListener('click', () => {
            if (activeMusicEditTool !== 'lyrics') return;
            if (!lyricsEditing) {
                lyricsEditing = true;
                // Save current playback position
                lyricsEditResumeIndex = lyricsCurrentWordIndex;
                // Pause karaoke but keep scrubber position
                if (lyricsKaraokeInterval) {
                    clearInterval(lyricsKaraokeInterval);
                    lyricsKaraokeInterval = null;
                }
                stopBackingTrack();
                cancelSpeech();
                updateScrubberIcon(false);
                // Make editable — convert word spans to plain text
                const plainText = musicEditLyricsText.innerText;
                musicEditLyricsText.textContent = plainText;
                musicEditLyricsText.contentEditable = 'true';
                musicEditLyricsText.focus();
            }
        });
    }

    // Track resume position for lyrics editing
    let lyricsEditResumeIndex = 0;

    // Done button: if in lyrics editing mode, save edits and return to summary
    if (musicEditDoneBtn) {
        musicEditDoneBtn.addEventListener('click', () => {
            if (activeMusicEditTool === 'lyrics' && lyricsEditing) {
                const newLyrics = musicEditLyricsText?.innerText?.trim();
                if (newLyrics) {
                    // Store updated lyrics
                    const genre = selectedMusicCard || '90s-rap';
                    genreLyrics[genre] = newLyrics;
                }
                // Exit editing mode
                if (musicEditLyricsText) musicEditLyricsText.contentEditable = 'false';
                lyricsEditing = false;
                // Stop any active karaoke/speech
                stopLyricsKaraoke();
                // Let the first Done handler (line ~1741) proceed to return to summary
                // Don't return — fall through
            }
        });
    }

    // --- XY Trackpad Effects ---
    const moodPadSurface = document.getElementById('mood-pad-surface');
    const moodPadFinger = document.getElementById('mood-pad-finger');
    const moodPadRipple = document.getElementById('mood-pad-ripple');
    const moodPadGlow = document.getElementById('mood-pad-glow');
    const moodPadCue = document.getElementById('mood-pad-cue');
    const moodPadMicro = document.getElementById('mood-pad-micro');
    const moodPadHold = document.getElementById('mood-pad-hold');

    // Normalized XY: 0 = center, -1..1 range
    let moodPadX = 0; // left(-1) to right(+1)
    let moodPadY = 0; // bottom(-1) to top(+1)
    let moodPadTouching = false;
    let moodPadGlideTimer = null;

    // ── Mood Audio Effects Engine ──
    let moodFilterNode = null;
    let moodDelayNode = null;
    let moodDelayFeedback = null;
    let moodDelayDry = null;
    let moodDelayWet = null;
    let moodPannerNode = null;
    let moodCompressorNode = null;
    let moodOutputGain = null;
    let moodEffectsReady = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function initMoodEffects(ctx) {
        if (moodEffectsReady) return;
        if (!ctx) return;

        moodFilterNode = ctx.createBiquadFilter();
        moodFilterNode.type = 'lowpass';
        moodFilterNode.frequency.value = 8000;
        moodFilterNode.Q.value = 0.5;

        moodDelayNode = ctx.createDelay(0.5);
        moodDelayNode.delayTime.value = 0;
        moodDelayFeedback = ctx.createGain();
        moodDelayFeedback.gain.value = 0.3;
        moodDelayDry = ctx.createGain();
        moodDelayDry.gain.value = 1.0;
        moodDelayWet = ctx.createGain();
        moodDelayWet.gain.value = 0;

        moodPannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (moodPannerNode) moodPannerNode.pan.value = 0;

        moodCompressorNode = ctx.createDynamicsCompressor();
        moodCompressorNode.threshold.value = -24;
        moodCompressorNode.ratio.value = 1;
        moodCompressorNode.knee.value = 30;
        moodCompressorNode.attack.value = 0.003;
        moodCompressorNode.release.value = 0.25;

        moodOutputGain = ctx.createGain();
        moodOutputGain.gain.value = 1.0;

        moodFilterNode.connect(moodDelayDry);
        moodFilterNode.connect(moodDelayNode);
        moodDelayNode.connect(moodDelayWet);
        moodDelayNode.connect(moodDelayFeedback);
        moodDelayFeedback.connect(moodDelayNode);

        const postMixer = ctx.createGain();
        postMixer.gain.value = 1.0;
        moodDelayDry.connect(postMixer);
        moodDelayWet.connect(postMixer);

        if (moodPannerNode) {
            postMixer.connect(moodPannerNode);
            moodPannerNode.connect(moodCompressorNode);
        } else {
            postMixer.connect(moodCompressorNode);
        }
        moodCompressorNode.connect(moodOutputGain);
        moodOutputGain.connect(ctx.destination);
        moodEffectsReady = true;
    }

    function getMoodOutputNode() {
        return moodFilterNode || null;
    }

    // XY → audio parameter mapping (all capped at 20% perceptual change)
    function updateMoodAudioEffects() {
        if (!moodEffectsReady) return;
        const x = moodPadX; // -1(warm) to +1(bright)
        const y = moodPadY; // -1(intimate) to +1(spacious)
        const r = Math.sqrt(x * x + y * y); // distance from center
        const cap = Math.min(r, 1) * 0.2; // max 20% deviation

        const t = moodFilterNode?.context?.currentTime || 0;
        const sm = 0.12; // smooth time

        // X axis: filter
        if (moodFilterNode) {
            if (x < 0) {
                // LEFT = warm: lowpass, softer
                moodFilterNode.type = 'lowpass';
                moodFilterNode.frequency.setTargetAtTime(lerp(8000, 2800, Math.abs(x)), t, sm);
                moodFilterNode.Q.setTargetAtTime(lerp(0.5, 2.0, Math.abs(x)), t, sm);
            } else {
                // RIGHT = bright: highshelf boost
                moodFilterNode.type = 'highshelf';
                moodFilterNode.frequency.setTargetAtTime(lerp(8000, 6000, x), t, sm);
                moodFilterNode.Q.setTargetAtTime(lerp(0.5, 1.2, x), t, sm);
            }
        }

        // X axis: stereo width - right side widens
        if (moodPannerNode) {
            const pan = x > 0 ? Math.sin(Date.now() / 2000) * x * 0.15 : 0;
            moodPannerNode.pan.setTargetAtTime(pan, t, 0.15);
        }

        // Y axis: delay/reverb — top = spacious
        if (moodDelayNode) {
            const delayAmt = y > 0 ? y * 0.14 : 0;
            moodDelayNode.delayTime.setTargetAtTime(delayAmt, t, sm);
        }
        if (moodDelayWet) {
            const wetAmt = y > 0 ? y * 0.22 : 0;
            moodDelayWet.gain.setTargetAtTime(wetAmt, t, sm);
        }
        if (moodDelayDry) {
            const dryAmt = y > 0 ? 1.0 - y * 0.08 : 1.0;
            moodDelayDry.gain.setTargetAtTime(dryAmt, t, sm);
        }

        // Y axis: compression — bottom = compressed/intimate
        if (moodCompressorNode) {
            if (y < 0) {
                moodCompressorNode.threshold.setTargetAtTime(lerp(-24, -12, Math.abs(y)), t, sm);
                moodCompressorNode.ratio.setTargetAtTime(lerp(1, 4.5, Math.abs(y)), t, sm);
            } else {
                moodCompressorNode.threshold.setTargetAtTime(-24, t, sm);
                moodCompressorNode.ratio.setTargetAtTime(1, t, sm);
            }
        }

        // Output gain (subtle warmth boost left, slight dip top-right)
        if (moodOutputGain) {
            const g = x < 0 ? lerp(1.0, 1.06, Math.abs(x)) : lerp(1.0, 0.96, x);
            moodOutputGain.gain.setTargetAtTime(g, t, sm);
        }

        // Y axis: BPM / tempo via playbackRate
        // Center = 1.0×, up = 1.15× (faster), down = 0.85× (slower)
        const targetRate = 1.0 + y * 0.15; // range: 0.85 – 1.15
        // Apply to whichever audio source is active
        if (playerSourceNode && playerSourceNode.playbackRate) {
            playerSourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.18);
        }
        if (clipSourceNode && clipSourceNode.playbackRate) {
            clipSourceNode.playbackRate.setTargetAtTime(targetRate, t, 0.18);
        }

        // Vocal TTS effects — apply mood to speech synthesis
        // X axis: pitch (warm = lower, bright = higher)
        moodVocalPitch = 1.0 + x * 0.3; // range: 0.7 – 1.3
        // Y axis: speech rate (spacious = slower, intimate = faster)  
        moodVocalRate = 1.0 - y * 0.2; // range: 0.8 – 1.2
    }

    // Panner wobble (subtle stereo drift)
    let moodPanWobbleId = null;
    function startMoodPanWobble() {
        if (moodPanWobbleId) return;
        moodPanWobbleId = setInterval(() => {
            if (!moodEffectsReady || !moodPannerNode) return;
            if (moodPadX > 0.1) {
                const pan = Math.sin(Date.now() / 2000) * moodPadX * 0.15;
                moodPannerNode.pan.setTargetAtTime(pan, moodPannerNode.context.currentTime, 0.15);
            }
        }, 100);
    }
    function stopMoodPanWobble() {
        if (moodPanWobbleId) { clearInterval(moodPanWobbleId); moodPanWobbleId = null; }
    }

    // ── Trackpad Interaction ──
    function moodPadGetXY(e) {
        if (!moodPadSurface) return { x: 0, y: 0 };
        const rect = moodPadSurface.getBoundingClientRect();
        const cx = (e.clientX ?? e.touches?.[0]?.clientX ?? 0);
        const cy = (e.clientY ?? e.touches?.[0]?.clientY ?? 0);
        // Normalize to -1..1 (center = 0,0)
        let nx = ((cx - rect.left) / rect.width) * 2 - 1;
        let ny = -(((cy - rect.top) / rect.height) * 2 - 1); // invert: top = +1
        // Clamp with soft resistance at edges
        const clamp = (v) => {
            if (Math.abs(v) > 0.85) {
                const excess = Math.abs(v) - 0.85;
                return Math.sign(v) * (0.85 + excess * 0.3);
            }
            return Math.max(-1, Math.min(1, v));
        };
        return { x: clamp(nx), y: clamp(ny) };
    }

    function moodPadUpdateVisuals(x, y, px, py) {
        // Position finger indicator
        if (moodPadFinger) {
            moodPadFinger.hidden = false;
            moodPadFinger.style.left = px + 'px';
            moodPadFinger.style.top = py + 'px';
        }

        // Update glow gradient based on quadrant
        if (moodPadGlow) {
            const r = Math.sqrt(x * x + y * y);
            // Color: warm(left)=coral, bright(right)=blue, top=lavender, bottom=amber
            const hue = x < 0 ? lerp(20, 40, -x) : lerp(210, 230, x);
            const sat = 40 + Math.abs(x) * 20;
            const light = y > 0 ? 55 + y * 15 : 45 - Math.abs(y) * 10;
            moodPadGlow.style.background = `radial-gradient(circle at ${(x + 1) * 50}% ${(1 - y) * 50}%, hsla(${hue}, ${sat}%, ${light}%, 0.12), transparent 70%)`;
            moodPadGlow.style.opacity = Math.min(r * 1.5, 1);
        }

        // Microcopy at extreme — show BPM shift info
        const dist = Math.sqrt(x * x + y * y);
        if (moodPadMicro) {
            if (dist > 0.82) {
                const bpmShift = Math.round(y * 15);
                if (Math.abs(y) > 0.3) {
                    moodPadMicro.textContent = bpmShift > 0
                        ? `↑ +${bpmShift}% BPM`
                        : `↓ ${bpmShift}% BPM`;
                } else {
                    moodPadMicro.textContent = 'Easy…';
                }
                moodPadMicro.hidden = false;
                moodPadMicro.classList.add('visible');
            } else {
                moodPadMicro.classList.remove('visible');
            }
        }
    }

    function moodPadFireRipple(px, py) {
        if (!moodPadRipple) return;
        moodPadRipple.classList.remove('active');
        void moodPadRipple.offsetWidth; // reflow
        moodPadRipple.classList.add('active');
    }

    function moodPadGlideToNeutral() {
        if (moodPadGlideTimer) cancelAnimationFrame(moodPadGlideTimer);
        const startX = moodPadX, startY = moodPadY;
        const startTime = performance.now();
        const duration = 1200; // 1.2s glide

        function tick(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
            moodPadX = lerp(startX, 0, ease);
            moodPadY = lerp(startY, 0, ease);
            updateMoodAudioEffects();

            // Visual feedback
            if (moodPadFinger && t < 1) {
                const rect = moodPadSurface.getBoundingClientRect();
                const px = ((moodPadX + 1) / 2) * rect.width;
                const py = ((1 - moodPadY) / 2) * rect.height;
                moodPadUpdateVisuals(moodPadX, moodPadY, px, py);
            }

            if (t < 1) {
                moodPadGlideTimer = requestAnimationFrame(tick);
            } else {
                moodPadGlideTimer = null;
                if (moodPadFinger) moodPadFinger.hidden = true;
                if (moodPadGlow) moodPadGlow.style.opacity = '0';
                if (moodPadMicro) moodPadMicro.classList.remove('visible');
            }
        }
        moodPadGlideTimer = requestAnimationFrame(tick);
    }

    if (moodPadSurface) {
        moodPadSurface.addEventListener('pointerdown', (e) => {
            moodPadTouching = true;
            moodPadSurface.setPointerCapture(e.pointerId);
            if (moodPadGlideTimer) { cancelAnimationFrame(moodPadGlideTimer); moodPadGlideTimer = null; }

            const { x, y } = moodPadGetXY(e);
            moodPadX = x;
            moodPadY = y;

            const rect = moodPadSurface.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            moodPadUpdateVisuals(x, y, px, py);
            moodPadFireRipple(px, py);
            updateMoodAudioEffects();

            if (moodPadCue) moodPadCue.classList.add('hidden');
        });

        moodPadSurface.addEventListener('pointermove', (e) => {
            if (!moodPadTouching) return;
            const { x, y } = moodPadGetXY(e);
            moodPadX = x;
            moodPadY = y;

            const rect = moodPadSurface.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            moodPadUpdateVisuals(x, y, px, py);
            updateMoodAudioEffects();
        });

        moodPadSurface.addEventListener('pointerup', () => {
            moodPadTouching = false;
            // Keep position — don't glide back to neutral
        });

        moodPadSurface.addEventListener('pointercancel', () => {
            moodPadTouching = false;
            // Keep position — don't glide back to neutral
        });
    }










    /* ── orphaned old mood code (safe: all vars null, all if-guards skip) ── */
    const moodSliderTrack = null, moodSliderGlow = null, moodIntensityLabel = null, moodMicrocopy = null, moodSheetEl = null, moodNameEl = null, moodSubtitleEl = null, moodSelector = null;
    let moodDragging = false, currentMoodId = 'golden-hour', moodIntensity = 50;
    const setMoodIntensity = function () { }, getSliderValue = function () { return 0; };
    if (moodSliderTrack) { // always false since null
        const rect = moodSliderTrack.getBoundingClientRect();
        const clientY = 0;
        const y = 0;
        const pct = 0;
    }

    if (moodSliderTrack) {
        moodSliderTrack.addEventListener('pointerdown', (e) => {
            moodDragging = true;
            moodSliderTrack.setPointerCapture(e.pointerId);
            setMoodIntensity(getSliderValue(e));
        });

        moodSliderTrack.addEventListener('pointermove', (e) => {
            if (!moodDragging) return;
            setMoodIntensity(getSliderValue(e));
        });

        moodSliderTrack.addEventListener('pointerup', (e) => {
            moodDragging = false;
        });

        moodSliderTrack.addEventListener('pointercancel', () => {
            moodDragging = false;
        });
    }

    // Mood selector buttons
    if (moodSelector) {
        moodSelector.querySelectorAll('.mood-sheet__mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const moodId = btn.dataset.mood;
                const moodName = btn.dataset.name;
                const moodSub = btn.dataset.sub;
                if (moodId === currentMoodId) return;

                currentMoodId = moodId;

                // Update active state on buttons
                moodSelector.querySelectorAll('.mood-sheet__mood-btn').forEach(b => b.classList.remove('mood-sheet__mood-btn--active'));
                btn.classList.add('mood-sheet__mood-btn--active');

                // Morph name and subtitle with cross-fade
                if (moodNameEl) {
                    moodNameEl.classList.add('switching');
                    if (moodSubtitleEl) moodSubtitleEl.classList.add('switching');
                    setTimeout(() => {
                        moodNameEl.textContent = moodName;
                        if (moodSubtitleEl) moodSubtitleEl.textContent = moodSub;
                        moodNameEl.classList.remove('switching');
                        if (moodSubtitleEl) moodSubtitleEl.classList.remove('switching');
                    }, 250);
                }

                // Background hue shift via data attribute
                if (moodSheetEl) {
                    moodSheetEl.dataset.activeMood = moodId;
                }

                // Update audio effects for new mood
                updateMoodAudioEffects();

                showToast(`${moodName}`);
            });
        });
    }

    // Initialize default mood
    if (moodSheetEl) {
        moodSheetEl.dataset.activeMood = 'golden-hour';
    }
    /* end orphaned old mood code */

    // ── Mood Audio Effects Engine ──
    // Shared Web Audio nodes for mood transformations
    // Chain: source → moodFilter → moodDelay → moodPanner → moodCompressor → moodGain → destination
    if (false) { /* removed duplicate audio engine */
        let moodFilterNode = null;     // BiquadFilterNode
        let moodDelayNode = null;      // DelayNode (simulates reverb/space)
        let moodDelayFeedback = null;  // GainNode (feedback loop for delay)
        let moodDelayDry = null;       // GainNode (dry signal)
        let moodDelayWet = null;       // GainNode (wet signal)
        let moodPannerNode = null;     // StereoPannerNode
        let moodCompressorNode = null; // DynamicsCompressorNode
        let moodOutputGain = null;     // GainNode (final output)
        let moodEffectsReady = false;

        // Mood presets — parameter ranges at 100% intensity (will be scaled by intensity/100)
        // Max 20% perceptual deviation means these are all subtle
        const MOOD_PRESETS = {
            'golden-hour': {
                filterType: 'lowpass',
                filterFreq: [8000, 3200],   // [min-change, max-change] — at 0% = 8000Hz, at 100% = 3200Hz
                filterQ: [0.5, 1.8],
                delayTime: [0, 0.08],       // seconds
                delayWet: [0, 0.12],
                panValue: [0, 0.15],        // stereo spread
                compThreshold: [-24, -18],
                compRatio: [1, 2.5],
                gain: [1.0, 1.05],          // subtle warmth boost
            },
            'underwater': {
                filterType: 'lowpass',
                filterFreq: [8000, 1400],
                filterQ: [0.5, 3.5],
                delayTime: [0, 0.18],
                delayWet: [0, 0.25],
                panValue: [0, 0.05],
                compThreshold: [-24, -20],
                compRatio: [1, 1.5],
                gain: [1.0, 0.92],
            },
            'polite-chaos': {
                filterType: 'bandpass',
                filterFreq: [4000, 2200],
                filterQ: [0.3, 2.0],
                delayTime: [0, 0.06],
                delayWet: [0, 0.10],
                panValue: [0, 0.25],        // noticeable stereo drift
                compThreshold: [-24, -16],
                compRatio: [1, 3.0],
                gain: [1.0, 1.02],
            },
            'weightless': {
                filterType: 'highshelf',
                filterFreq: [4000, 5000],
                filterQ: [0.3, 0.8],
                delayTime: [0, 0.14],
                delayWet: [0, 0.20],
                panValue: [0, 0.10],
                compThreshold: [-24, -22],
                compRatio: [1, 1.3],
                gain: [1.0, 0.96],         // slight volume dip for airiness
            },
            'tiny-club': {
                filterType: 'lowshelf',
                filterFreq: [200, 280],
                filterQ: [0.5, 2.0],
                delayTime: [0, 0.03],
                delayWet: [0, 0.06],
                panValue: [0, 0.04],
                compThreshold: [-24, -10],
                compRatio: [1, 5.0],       // heavier compression for club feel
                gain: [1.0, 1.08],        // low-end warmth boost
            }
        };

        function lerp(a, b, t) { return a + (b - a) * t; }

        function initMoodEffects(ctx) {
            if (moodEffectsReady) return;
            if (!ctx) return;

            // Filter
            moodFilterNode = ctx.createBiquadFilter();
            moodFilterNode.type = 'lowpass';
            moodFilterNode.frequency.value = 8000;
            moodFilterNode.Q.value = 0.5;

            // Delay (simple feedback delay as pseudo-reverb)
            moodDelayNode = ctx.createDelay(0.5);
            moodDelayNode.delayTime.value = 0;
            moodDelayFeedback = ctx.createGain();
            moodDelayFeedback.gain.value = 0.3;
            moodDelayDry = ctx.createGain();
            moodDelayDry.gain.value = 1.0;
            moodDelayWet = ctx.createGain();
            moodDelayWet.gain.value = 0;

            // Panner
            moodPannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
            if (moodPannerNode) moodPannerNode.pan.value = 0;

            // Compressor
            moodCompressorNode = ctx.createDynamicsCompressor();
            moodCompressorNode.threshold.value = -24;
            moodCompressorNode.ratio.value = 1;
            moodCompressorNode.knee.value = 30;
            moodCompressorNode.attack.value = 0.003;
            moodCompressorNode.release.value = 0.25;

            // Output gain
            moodOutputGain = ctx.createGain();
            moodOutputGain.gain.value = 1.0;

            // Wire: filter → dry path → panner → compressor → output
            //                → delay → wet path ↗
            //                  ↖ feedback ←↙
            moodFilterNode.connect(moodDelayDry);
            moodFilterNode.connect(moodDelayNode);
            moodDelayNode.connect(moodDelayWet);
            moodDelayNode.connect(moodDelayFeedback);
            moodDelayFeedback.connect(moodDelayNode);

            const postMixer = ctx.createGain();
            postMixer.gain.value = 1.0;
            moodDelayDry.connect(postMixer);
            moodDelayWet.connect(postMixer);

            if (moodPannerNode) {
                postMixer.connect(moodPannerNode);
                moodPannerNode.connect(moodCompressorNode);
            } else {
                postMixer.connect(moodCompressorNode);
            }
            moodCompressorNode.connect(moodOutputGain);
            moodOutputGain.connect(ctx.destination);

            moodEffectsReady = true;
        }

        function getMoodOutputNode() {
            // Returns the node sources should connect to
            return moodFilterNode || null;
        }

        function updateMoodAudioEffects() {
            if (!moodEffectsReady) return;

            const preset = MOOD_PRESETS[currentMoodId] || MOOD_PRESETS['golden-hour'];
            // Scale intensity: 0-100 maps to 0-0.2 (20% max perceptual change)
            const t = Math.min(1, moodIntensity / 100) * 0.2 / 0.2; // normalized 0-1 within cap
            const cap = Math.min(1, moodIntensity / 100); // raw 0-1

            // Filter
            if (moodFilterNode) {
                moodFilterNode.type = preset.filterType;
                moodFilterNode.frequency.setTargetAtTime(
                    lerp(preset.filterFreq[0], preset.filterFreq[1], cap),
                    moodFilterNode.context.currentTime, 0.1
                );
                moodFilterNode.Q.setTargetAtTime(
                    lerp(preset.filterQ[0], preset.filterQ[1], cap),
                    moodFilterNode.context.currentTime, 0.1
                );
            }

            // Delay
            if (moodDelayNode) {
                moodDelayNode.delayTime.setTargetAtTime(
                    lerp(preset.delayTime[0], preset.delayTime[1], cap),
                    moodDelayNode.context.currentTime, 0.1
                );
            }
            if (moodDelayWet) {
                moodDelayWet.gain.setTargetAtTime(
                    lerp(preset.delayWet[0], preset.delayWet[1], cap),
                    moodDelayWet.context.currentTime, 0.1
                );
            }
            if (moodDelayDry) {
                moodDelayDry.gain.setTargetAtTime(
                    1.0 - lerp(preset.delayWet[0], preset.delayWet[1], cap) * 0.3,
                    moodDelayDry.context.currentTime, 0.1
                );
            }

            // Panner — oscillate slightly for spatial interest
            if (moodPannerNode) {
                const panBase = lerp(preset.panValue[0], preset.panValue[1], cap);
                // Subtle left-right wobble based on time
                const wobble = Math.sin(Date.now() / 2000) * panBase;
                moodPannerNode.pan.setTargetAtTime(wobble, moodPannerNode.context.currentTime, 0.15);
            }

            // Compressor
            if (moodCompressorNode) {
                moodCompressorNode.threshold.setTargetAtTime(
                    lerp(preset.compThreshold[0], preset.compThreshold[1], cap),
                    moodCompressorNode.context.currentTime, 0.1
                );
                moodCompressorNode.ratio.setTargetAtTime(
                    lerp(preset.compRatio[0], preset.compRatio[1], cap),
                    moodCompressorNode.context.currentTime, 0.1
                );
            }

            // Output gain
            if (moodOutputGain) {
                moodOutputGain.gain.setTargetAtTime(
                    lerp(preset.gain[0], preset.gain[1], cap),
                    moodOutputGain.context.currentTime, 0.1
                );
            }
        }

        // Panner wobble animation (updates every ~100ms for subtle stereo drift)
        let moodPanWobbleId = null;
        function startMoodPanWobble() {
            if (moodPanWobbleId) return;
            moodPanWobbleId = setInterval(() => {
                if (!moodEffectsReady || !moodPannerNode) return;
                const preset = MOOD_PRESETS[currentMoodId] || MOOD_PRESETS['golden-hour'];
                const cap = Math.min(1, moodIntensity / 100);
                const panBase = lerp(preset.panValue[0], preset.panValue[1], cap);
                const wobble = Math.sin(Date.now() / 2000) * panBase;
                moodPannerNode.pan.setTargetAtTime(wobble, moodPannerNode.context.currentTime, 0.15);
            }, 100);
        }
        function stopMoodPanWobble() {
            if (moodPanWobbleId) { clearInterval(moodPanWobbleId); moodPanWobbleId = null; }
        }
    } /* end duplicate audio engine if(false) */

    // --- Art Canvas Drawing ---
    const musicArtCanvas = document.getElementById('music-art-draw-canvas');
    const musicArtOverlay = document.getElementById('music-art-overlay');
    const musicArtOverlayGotit = document.getElementById('music-art-overlay-gotit');
    const musicArtEffectsSubtools = document.getElementById('music-art-effects-subtools');
    // Resize tool removed from music editor Art panel
    const musicArtSubtools = document.querySelectorAll('#panel-art .edit-modal__tool[data-tool]');
    let musicArtCtx = musicArtCanvas ? musicArtCanvas.getContext('2d') : null;
    let musicArtDrawing = false;
    let musicArtStrokes = [];
    let musicArtCurrentStroke = [];
    let musicArtEducationShown = false;
    let activeMusicArtTool = null;

    // --- Music Art Erase Tool ---
    const musicEraseCanvas = document.getElementById('music-art-erase-canvas');
    const musicEraseCtx = musicEraseCanvas ? musicEraseCanvas.getContext('2d') : null;
    let musicEraseMode = false;
    let musicEraseDrawing = false;
    let musicErasePoints = [];
    const MUSIC_ERASE_BRUSH_RADIUS = 24;

    function sizeMusicEraseCanvas() {
        if (!musicEraseCanvas || !musicArtCanvas) return;
        musicEraseCanvas.width = musicArtCanvas.offsetWidth;
        musicEraseCanvas.height = musicArtCanvas.offsetHeight;
        musicEraseCanvas.style.width = musicArtCanvas.offsetWidth + 'px';
        musicEraseCanvas.style.height = musicArtCanvas.offsetHeight + 'px';
    }

    // Draw checkerboard + red fill for all accumulated points + cursor ring
    function drawMusicEraseBrush(x, y) {
        if (!musicEraseCtx) return;
        musicEraseCtx.clearRect(0, 0, musicEraseCanvas.width, musicEraseCanvas.height);
        musicEraseCtx.save();
        const R = MUSIC_ERASE_BRUSH_RADIUS;
        const CELL = 8;
        const drift = (performance.now() / 3000 * CELL) % CELL;
        for (const pt of musicErasePoints) {
            musicEraseCtx.save();
            musicEraseCtx.beginPath();
            musicEraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            musicEraseCtx.clip();
            const x0 = Math.floor((pt.x - R - drift) / CELL) * CELL + drift;
            const y0 = Math.floor((pt.y - R - drift) / CELL) * CELL + drift;
            for (let cx = x0; cx < pt.x + R; cx += CELL) {
                for (let cy = y0; cy < pt.y + R; cy += CELL) {
                    const col = Math.floor((cx - drift) / CELL) + Math.floor((cy - drift) / CELL);
                    musicEraseCtx.fillStyle = col % 2 === 0 ? 'rgba(180,180,180,0.5)' : 'rgba(255,255,255,0.5)';
                    musicEraseCtx.fillRect(cx, cy, CELL, CELL);
                }
            }
            // Red tint at 50% opacity on top
            musicEraseCtx.fillStyle = 'rgba(239,68,68,0.5)';
            musicEraseCtx.beginPath();
            musicEraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            musicEraseCtx.fill();
            musicEraseCtx.restore();
        }
        // Cursor ring
        musicEraseCtx.beginPath();
        musicEraseCtx.arc(x, y, R, 0, Math.PI * 2);
        musicEraseCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        musicEraseCtx.lineWidth = 3;
        musicEraseCtx.stroke();
        musicEraseCtx.beginPath();
        musicEraseCtx.arc(x, y, R, 0, Math.PI * 2);
        musicEraseCtx.strokeStyle = 'rgba(255,255,255,0.9)';
        musicEraseCtx.lineWidth = 1.5;
        musicEraseCtx.stroke();
        musicEraseCtx.restore();
    }

    // Draw only accumulated points (no cursor ring) — used on pointerleave and during loading
    function drawMusicErasePointsOnly() {
        if (!musicEraseCtx) return;
        musicEraseCtx.clearRect(0, 0, musicEraseCanvas.width, musicEraseCanvas.height);
        if (musicErasePoints.length === 0) return;
        const R = MUSIC_ERASE_BRUSH_RADIUS;
        const CELL = 8;
        const drift = (performance.now() / 3000 * CELL) % CELL;
        for (const pt of musicErasePoints) {
            musicEraseCtx.save();
            musicEraseCtx.beginPath();
            musicEraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            musicEraseCtx.clip();
            const x0 = Math.floor((pt.x - R - drift) / CELL) * CELL + drift;
            const y0 = Math.floor((pt.y - R - drift) / CELL) * CELL + drift;
            for (let cx = x0; cx < pt.x + R; cx += CELL) {
                for (let cy = y0; cy < pt.y + R; cy += CELL) {
                    const col = Math.floor((cx - drift) / CELL) + Math.floor((cy - drift) / CELL);
                    musicEraseCtx.fillStyle = col % 2 === 0 ? 'rgba(180,180,180,0.5)' : 'rgba(255,255,255,0.5)';
                    musicEraseCtx.fillRect(cx, cy, CELL, CELL);
                }
            }
            musicEraseCtx.fillStyle = 'rgba(239,68,68,0.5)';
            musicEraseCtx.beginPath();
            musicEraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            musicEraseCtx.fill();
            musicEraseCtx.restore();
        }
    }

    function getMusicErasePos(e) {
        const rect = musicEraseCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(clientX - rect.left, musicEraseCanvas.width)),
            y: Math.max(0, Math.min(clientY - rect.top, musicEraseCanvas.height))
        };
    }

    function enterMusicEraseMode() {
        musicEraseMode = true;
        musicErasePoints = [];
        sizeMusicEraseCanvas();
        musicEraseCanvas.hidden = false;
        showMusicSubtoolHeader();
    }

    function exitMusicEraseMode() {
        musicEraseMode = false;
        musicErasePoints = [];
        if (musicEraseCtx) musicEraseCtx.clearRect(0, 0, musicEraseCanvas.width, musicEraseCanvas.height);
        musicEraseCanvas.hidden = true;
        showMusicStarterHeader();
    }

    async function applyMusicEraseToImage() {
        if (musicErasePoints.length === 0) return;
        const artImg = document.getElementById('music-edit-artwork-img');
        if (!artImg) return;
        const previousSrc = artImg.src;

        // Build white-on-black mask at natural image resolution
        const offscreen = document.createElement('canvas');
        offscreen.width = artImg.naturalWidth || artImg.offsetWidth;
        offscreen.height = artImg.naturalHeight || artImg.offsetHeight;
        const offCtx = offscreen.getContext('2d');
        const scaleX = offscreen.width / musicEraseCanvas.width;
        const scaleY = offscreen.height / musicEraseCanvas.height;
        offCtx.fillStyle = '#000';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        offCtx.fillStyle = '#fff';
        for (const pt of musicErasePoints) {
            offCtx.beginPath();
            offCtx.arc(pt.x * scaleX, pt.y * scaleY, MUSIC_ERASE_BRUSH_RADIUS * Math.max(scaleX, scaleY), 0, Math.PI * 2);
            offCtx.fill();
        }

        // Set particle vortex to centroid of painted erase region
        if (musicErasePoints.length > 0) {
            let sumX = 0, sumY = 0;
            for (const pt of musicErasePoints) { sumX += pt.x; sumY += pt.y; }
            vortexCenter = { x: sumX / musicErasePoints.length, y: sumY / musicErasePoints.length };
        } else {
            vortexCenter = null;
        }

        const artworkContainer = document.getElementById('music-edit-artwork-container');
        if (artworkContainer) artworkContainer.classList.add('edit-loading');
        startParticles(artImg);
        showToast('Erasing selected area...');

        const ac = createAbortController();
        try {
            const imageBase64 = await imgSrcToBase64(artImg);
            const maskBase64 = offscreen.toDataURL('image/png').split(',')[1];
            const editPrompt = `The second image is a binary mask (white = erase, black = keep). Remove the object(s) in the white region completely and reconstruct the background naturally.

ERASE RULES:
1. COMPLETE REMOVAL — Every pixel of the masked object must be gone. No ghostly outlines, faint traces, shadows, or color residue from the original object.
2. NATURAL RECONSTRUCTION — Fill the erased area with what would logically be behind the object: continue floor tiles, wall textures, sky gradients, foliage, or whatever the surrounding context implies. Match perspective, vanishing points, and scale.
3. SEAMLESS TEXTURE — The reconstructed area must have identical texture, grain, noise, and pattern density as the surrounding image. No blurring, smearing, or smoothing that differs from the rest of the image.
4. LIGHTING CONTINUITY — Shadows, highlights, and light gradients must flow naturally through the reconstructed area. Remove any shadows that were cast BY the erased object. Preserve shadows cast by other objects.
5. PRESERVE EVERYTHING ELSE — All pixels outside the white mask region must remain exactly unchanged.`;
            const newDataUrl = await eraseWithGemini(imageBase64, maskBase64, editPrompt, ac.signal);

            artImg.src = newDataUrl;
            const playerArt = document.querySelector('.music-player__artwork-img');
            if (playerArt) playerArt.src = newDataUrl;

            if (typeof musicArtUndoStack !== 'undefined') {
                musicArtUndoStack.push({ type: 'effect', name: 'Erase', previousSrc, newSrc: newDataUrl });
                musicArtRedoStack = [];
                updateMusicArtUndoRedoState();
            }
            markMusicDirty();
            showToast('Area erased');
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Music erase error:', err);
            showToast('Erase failed: ' + err.message);
        } finally {
            if (artworkContainer) artworkContainer.classList.remove('edit-loading');
            stopParticles();
            vortexCenter = null;
            musicErasePoints = [];
            if (musicEraseCtx) musicEraseCtx.clearRect(0, 0, musicEraseCanvas.width, musicEraseCanvas.height);
        }
    }

    if (musicEraseCanvas) {
        musicEraseCanvas.addEventListener('pointerdown', (e) => {
            if (!musicEraseMode) return;
            e.preventDefault();
            musicEraseDrawing = true;
            const pos = getMusicErasePos(e);
            musicErasePoints.push(pos);
            drawMusicEraseBrush(pos.x, pos.y);
        });
        musicEraseCanvas.addEventListener('pointermove', (e) => {
            if (!musicEraseMode) return;
            e.preventDefault();
            const pos = getMusicErasePos(e);
            if (musicEraseDrawing) {
                const last = musicErasePoints[musicErasePoints.length - 1];
                if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) > MUSIC_ERASE_BRUSH_RADIUS * 0.5) {
                    musicErasePoints.push(pos);
                }
            }
            drawMusicEraseBrush(pos.x, pos.y);
        });
        musicEraseCanvas.addEventListener('pointerup', async (e) => {
            if (!musicEraseMode || !musicEraseDrawing) return;
            e.preventDefault();
            musicEraseDrawing = false;
            // Keep checkerboard visible while API processes
            drawMusicErasePointsOnly();
            await applyMusicEraseToImage();
        });
        musicEraseCanvas.addEventListener('pointerleave', () => {
            if (musicEraseMode && musicEraseCtx) {
                drawMusicErasePointsOnly();
            }
        });
    }

    function resizeMusicArtCanvas() {

        if (!musicArtCanvas) return;
        const parent = musicArtCanvas.parentElement;
        if (!parent) return;
        musicArtCanvas.width = parent.offsetWidth;
        musicArtCanvas.height = parent.offsetHeight;
        redrawMusicArtStrokes();
    }

    // Use same doodle colors as image editor (defaults, will be overridden if image analyzed)
    const musicDoodleColors = ['#FF1493', '#FF00FF', '#FF69B4'];
    const musicDoodleShadowColor = 'rgba(0, 0, 0, 0.5)';

    function isMusicClosedStroke(stroke) {
        if (stroke.length < 10) return false;
        const first = stroke[0], last = stroke[stroke.length - 1];
        const dist = Math.hypot(last.x - first.x, last.y - first.y);
        return dist < 30;
    }

    function drawMusicStroke(ctx, stroke) {
        if (stroke.length < 2) return;
        // Calculate bounding box for gradient
        let minX = stroke[0].x, maxX = stroke[0].x;
        let minY = stroke[0].y, maxY = stroke[0].y;
        for (let i = 1; i < stroke.length; i++) {
            if (stroke[i].x < minX) minX = stroke[i].x;
            if (stroke[i].x > maxX) maxX = stroke[i].x;
            if (stroke[i].y < minY) minY = stroke[i].y;
            if (stroke[i].y > maxY) maxY = stroke[i].y;
        }
        const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
        grad.addColorStop(0, musicDoodleColors[0]);
        grad.addColorStop(0.5, musicDoodleColors[1]);
        grad.addColorStop(1, musicDoodleColors[2]);

        const closed = isMusicClosedStroke(stroke);

        // If closed shape, draw the fill first
        if (closed) {
            const fillGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
            fillGrad.addColorStop(0, musicDoodleColors[0] + '26');
            fillGrad.addColorStop(0.5, musicDoodleColors[1] + '26');
            fillGrad.addColorStop(1, musicDoodleColors[2] + '26');
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = fillGrad;
            ctx.fill();
            ctx.restore();
        }

        // Draw the stroke outline
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.56;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = musicDoodleShadowColor;
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    function redrawMusicArtStrokes() {
        if (!musicArtCtx || !musicArtCanvas) return;
        musicArtCtx.clearRect(0, 0, musicArtCanvas.width, musicArtCanvas.height);
        musicArtStrokes.forEach(stroke => {
            if (!Array.isArray(stroke) || stroke.length < 2) return;
            drawMusicStroke(musicArtCtx, stroke);
        });
    }

    function clearMusicArtCanvas() {
        musicArtStrokes = [];
        musicArtCurrentStroke = [];
        if (musicArtCtx && musicArtCanvas) {
            musicArtCtx.clearRect(0, 0, musicArtCanvas.width, musicArtCanvas.height);
        }
    }

    // --- Music Art Marquee Selection (Text tool) ---
    let musicMarqueeSelection = null;
    let musicMarqueeMode = 'idle';
    let musicMarqueeOrigin = null;
    let musicMarchingAntsOffset = 0;
    let musicMarchingAntsRAF = null;
    let musicDetectedOriginalText = null;

    function renderMusicMarquee() {
        if (!musicArtCtx || !musicArtCanvas || !musicMarqueeSelection) return;
        musicArtCtx.clearRect(0, 0, musicArtCanvas.width, musicArtCanvas.height);
        const s = musicMarqueeSelection;

        // Dim area outside selection
        musicArtCtx.save();
        musicArtCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        musicArtCtx.fillRect(0, 0, musicArtCanvas.width, musicArtCanvas.height);
        musicArtCtx.clearRect(s.x, s.y, s.w, s.h);
        musicArtCtx.restore();

        // Marching ants border
        musicArtCtx.save();
        musicArtCtx.strokeStyle = '#fff';
        musicArtCtx.lineWidth = 1.5;
        musicArtCtx.setLineDash([6, 4]);
        musicArtCtx.lineDashOffset = -musicMarchingAntsOffset;
        musicArtCtx.strokeRect(s.x, s.y, s.w, s.h);
        musicArtCtx.restore();

        // Second pass with offset for contrast
        musicArtCtx.save();
        musicArtCtx.strokeStyle = 'rgba(168, 199, 250, 0.8)';
        musicArtCtx.lineWidth = 1.5;
        musicArtCtx.setLineDash([6, 4]);
        musicArtCtx.lineDashOffset = -(musicMarchingAntsOffset + 5);
        musicArtCtx.strokeRect(s.x, s.y, s.w, s.h);
        musicArtCtx.restore();

        // Corner handles
        const handleSize = 8;
        musicArtCtx.fillStyle = '#8AB4F8';
        const corners = [
            [s.x, s.y], [s.x + s.w, s.y],
            [s.x, s.y + s.h], [s.x + s.w, s.y + s.h]
        ];
        for (const [cx, cy] of corners) {
            musicArtCtx.beginPath();
            musicArtCtx.arc(cx, cy, handleSize / 2, 0, Math.PI * 2);
            musicArtCtx.fill();
        }
    }

    function startMusicMarchingAnts() {
        if (musicMarchingAntsRAF) return;
        const animate = () => {
            musicMarchingAntsOffset = (musicMarchingAntsOffset + 0.3) % 20;
            if (musicMarqueeSelection) {
                renderMusicMarquee();
                musicMarchingAntsRAF = requestAnimationFrame(animate);
            }
        };
        musicMarchingAntsRAF = requestAnimationFrame(animate);
    }

    function stopMusicMarchingAnts() {
        if (musicMarchingAntsRAF) {
            cancelAnimationFrame(musicMarchingAntsRAF);
            musicMarchingAntsRAF = null;
        }
    }

    function clearMusicMarquee() {
        musicMarqueeSelection = null;
        musicMarqueeMode = 'idle';
        musicDetectedOriginalText = null;
        stopMusicMarchingAnts();
        if (musicArtCtx && musicArtCanvas) {
            musicArtCtx.clearRect(0, 0, musicArtCanvas.width, musicArtCanvas.height);
        }
    }

    // Text detection flow for music editor - mirrors image editor
    async function detectMusicTextInRegion() {
        if (!musicMarqueeSelection || musicMarqueeSelection.w < 3 || musicMarqueeSelection.h < 3) {
            clearMusicMarquee();
            return;
        }

        if (musicLyricsInputText) {
            musicLyricsInputText.disabled = true;
            musicLyricsInputText.value = '';
            musicLyricsInputText.placeholder = 'Detecting text...';
        }

        startMusicMarchingAnts();

        try {
            const imageBase64 = await imgSrcToBase64(musicEditArtworkImg);
            // API key is handled by the server proxy

            const canvasW = musicArtCanvas.width;
            const canvasH = musicArtCanvas.height;
            const x1Pct = Math.round((musicMarqueeSelection.x / canvasW) * 100);
            const y1Pct = Math.round((musicMarqueeSelection.y / canvasH) * 100);
            const x2Pct = Math.round(((musicMarqueeSelection.x + musicMarqueeSelection.w) / canvasW) * 100);
            const y2Pct = Math.round(((musicMarqueeSelection.y + musicMarqueeSelection.h) / canvasH) * 100);

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Look at this image. The user has selected a rectangular region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%) (left%, top% to right%, bottom%). What text is inside or overlapping that selected region? Return ONLY the exact text string found in that region, nothing else. No quotes, no explanation. If there is no text in that region, return "NO_TEXT_FOUND".`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: imageBase64,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT'],
                }
            };

            const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig);
            const candidates = data.candidates || [];
            let detectedText = '';

            for (const candidate of candidates) {
                for (const part of (candidate.content?.parts || [])) {
                    if (part.text) {
                        detectedText = part.text.trim();
                        break;
                    }
                }
                if (detectedText) break;
            }

            if (!detectedText || detectedText === 'NO_TEXT_FOUND') {
                showToast('No text found — you can add new text');
                musicDetectedOriginalText = null;
                if (musicLyricsInputText) {
                    musicLyricsInputText.value = '';
                    musicLyricsInputText.disabled = false;
                    musicLyricsInputText.placeholder = 'Type text to add';
                    musicLyricsInputText.focus();
                }
                return;
            }

            // Found text — populate input for editing
            musicDetectedOriginalText = detectedText;
            showToast(`Found: "${detectedText}"`);
            if (musicLyricsInputText) {
                musicLyricsInputText.value = detectedText;
                musicLyricsInputText.disabled = false;
                musicLyricsInputText.placeholder = 'Edit the text';
                musicLyricsInputText.focus();
                musicLyricsInputText.select();
            }
        } catch (err) {
            console.error('Music text detection error:', err);
            showToast('Text detection failed');
            if (musicLyricsInputText) {
                musicLyricsInputText.disabled = false;
                musicLyricsInputText.placeholder = 'Type text to add';
            }
        }
    }

    if (musicArtCanvas) {
        musicArtCanvas.addEventListener('pointerdown', (e) => {
            if (!activeMusicArtTool || activeMusicArtTool === 'effects') return;
            musicArtCanvas.setPointerCapture(e.pointerId);
            const rect = musicArtCanvas.getBoundingClientRect();
            const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            if (activeMusicArtTool === 'text') {
                // Text tool — start marquee selection
                clearMusicMarquee();
                musicMarqueeMode = 'drawing';
                musicMarqueeOrigin = pos;
                musicMarqueeSelection = { x: pos.x, y: pos.y, w: 0, h: 0 };
            } else {
                // Select tool — start freehand doodle
                musicArtDrawing = true;
                musicArtCurrentStroke = [pos];
            }
        });

        musicArtCanvas.addEventListener('pointermove', (e) => {
            const rect = musicArtCanvas.getBoundingClientRect();
            const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            if (activeMusicArtTool === 'text' && musicMarqueeMode === 'drawing' && musicMarqueeOrigin) {
                // Text tool — update marquee
                let x = Math.min(musicMarqueeOrigin.x, pos.x);
                let y = Math.min(musicMarqueeOrigin.y, pos.y);
                let w = Math.abs(pos.x - musicMarqueeOrigin.x);
                let h = Math.abs(pos.y - musicMarqueeOrigin.y);
                // Clamp to canvas
                x = Math.max(0, x);
                y = Math.max(0, y);
                w = Math.min(w, musicArtCanvas.width - x);
                h = Math.min(h, musicArtCanvas.height - y);
                musicMarqueeSelection = { x, y, w, h };
                renderMusicMarquee();
                return;
            }

            if (!musicArtDrawing) return;

            // Select tool — draw doodle stroke
            musicArtCurrentStroke.push(pos);
            const prev = musicArtCurrentStroke[musicArtCurrentStroke.length - 2];
            const grad = musicArtCtx.createLinearGradient(prev.x, prev.y, pos.x, pos.y);
            grad.addColorStop(0, musicDoodleColors[0]);
            grad.addColorStop(1, musicDoodleColors[2]);
            musicArtCtx.save();
            musicArtCtx.beginPath();
            musicArtCtx.strokeStyle = grad;
            musicArtCtx.lineWidth = 3.56;
            musicArtCtx.lineCap = 'round';
            musicArtCtx.lineJoin = 'round';
            musicArtCtx.shadowColor = musicDoodleShadowColor;
            musicArtCtx.shadowBlur = 4;
            musicArtCtx.shadowOffsetX = 2;
            musicArtCtx.shadowOffsetY = 2;
            musicArtCtx.moveTo(prev.x, prev.y);
            musicArtCtx.lineTo(pos.x, pos.y);
            musicArtCtx.stroke();
            musicArtCtx.restore();
        });

        musicArtCanvas.addEventListener('pointerup', () => {
            if (activeMusicArtTool === 'text' && musicMarqueeMode === 'drawing') {
                // Text tool — finish marquee
                musicMarqueeMode = 'idle';
                musicMarqueeOrigin = null;
                if (musicMarqueeSelection && musicMarqueeSelection.w >= 3 && musicMarqueeSelection.h >= 3) {
                    startMusicMarchingAnts();
                    // Detect text in the selected region
                    detectMusicTextInRegion();
                    // Enable undo
                    const undoBtn = document.getElementById('music-edit-undo');
                    if (undoBtn) undoBtn.disabled = false;
                } else {
                    clearMusicMarquee();
                }
                return;
            }

            if (!musicArtDrawing) return;
            musicArtDrawing = false;
            if (musicArtCurrentStroke.length > 1) {
                musicArtStrokes.push([...musicArtCurrentStroke]);
                redrawMusicArtStrokes();
                if (musicLyricsInputText) {
                    musicLyricsInputText.disabled = false;
                    musicLyricsInputText.placeholder = 'Describe what to change';
                    musicLyricsInputText.focus();
                }
                const undoBtn = document.getElementById('music-edit-undo');
                if (undoBtn) undoBtn.disabled = false;
            }
            musicArtCurrentStroke = [];
        });
    }

    // Education overlay dismiss
    if (musicArtOverlayGotit) {
        musicArtOverlayGotit.addEventListener('click', () => {
            if (musicArtOverlay) musicArtOverlay.classList.add('hidden');
            musicArtEducationShown = true;
        });
    }

    // --- Music Art Particle Animation (mirrors image editor vortex) ---
    const musicParticleCanvas = document.getElementById('music-art-particle-canvas');
    const musicPCtx = musicParticleCanvas ? musicParticleCanvas.getContext('2d') : null;
    let musicParticles = [];
    let musicParticleAnimId = null;
    let musicParticleFade = 0;
    let musicVortexCenter = null;

    function musicNoise2D(x, y) {
        return (
            Math.sin(x * 1.2 + y * 0.9) * 0.5 +
            Math.sin(x * 0.7 - y * 1.3 + 2.1) * 0.3 +
            Math.sin(x * 2.1 + y * 0.4 - 1.7) * 0.2
        );
    }

    function createMusicParticle(w, h, forceEdge) {
        const depth = Math.random();
        let x, y;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = Math.random() * w; y = -2; }
        else if (side === 1) { x = w + 2; y = Math.random() * h; }
        else if (side === 2) { x = Math.random() * w; y = h + 2; }
        else { x = -2; y = Math.random() * h; }
        if (!forceEdge && Math.random() < 0.5) {
            x = Math.random() * w;
            y = Math.random() * h;
        }
        return {
            x, y, depth,
            size: 0.8 + depth * 2 + Math.random() * 1.2,
            baseAlpha: 0.04 + depth * 0.09,
            noiseOffX: Math.random() * 1000,
            noiseOffY: Math.random() * 1000,
            orbitDir: Math.random() < 0.5 ? 1 : -1,
            angularBase: 0.0015 + Math.random() * 0.003,
            shimmerCycle: 3000 + Math.random() * 8000,
            shimmerPhase: Math.random() * Math.PI * 2,
            birth: performance.now() + Math.random() * 1500,
        };
    }

    function respawnMusicParticle(p, w, h) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { p.x = Math.random() * w; p.y = -2; }
        else if (side === 1) { p.x = w + 2; p.y = Math.random() * h; }
        else if (side === 2) { p.x = Math.random() * w; p.y = h + 2; }
        else { p.x = -2; p.y = Math.random() * h; }
        p.birth = performance.now();
        p.orbitDir = Math.random() < 0.5 ? 1 : -1;
    }

    function initMusicParticles() {
        if (!musicParticleCanvas) return;
        const w = musicParticleCanvas.width || 400;
        const h = musicParticleCanvas.height || 400;
        const count = Math.floor((w * h) / 85);
        musicParticles = [];
        for (let i = 0; i < Math.min(count, 3600); i++) {
            musicParticles.push(createMusicParticle(w, h, false));
        }
    }

    function drawMusicParticles(now) {
        if (!musicPCtx || !musicParticleCanvas.width) return;
        const w = musicParticleCanvas.width;
        const h = musicParticleCanvas.height;
        const cx = musicVortexCenter ? musicVortexCenter.x : w / 2;
        const cy = musicVortexCenter ? musicVortexCenter.y : h / 2;
        const maxDist = Math.max(Math.sqrt(cx * cx + cy * cy), 1);

        musicPCtx.clearRect(0, 0, w, h);

        for (const p of musicParticles) {
            const age = now - p.birth;
            if (age < 0) continue;
            const birthFade = Math.min(age / 800, 1);
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
            const normDist = dist / maxDist;
            const gravity = 0.15 / (normDist + 0.05);
            const angularVel = p.angularBase * p.orbitDir / (normDist + 0.1);
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle + Math.PI / 2) * angularVel * dist * 0.015;
            p.y += Math.sin(angle + Math.PI / 2) * angularVel * dist * 0.015;
            p.x -= (dx / dist) * gravity * 0.6;
            p.y -= (dy / dist) * gravity * 0.6;
            const t = now * 0.00005;
            p.x += musicNoise2D(p.noiseOffX + t, p.noiseOffY) * 0.15;
            p.y += musicNoise2D(p.noiseOffY + t, p.noiseOffX) * 0.15;
            const centerFade = Math.min(normDist * 3, 1);
            if (dist < 6) { respawnMusicParticle(p, w, h); continue; }
            if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
                respawnMusicParticle(p, w, h); continue;
            }
            const shimmerT = (now + p.shimmerPhase * 1000) / p.shimmerCycle;
            const shimmerWave = Math.pow(Math.max(0, Math.sin(shimmerT * Math.PI * 2)), 4);
            const shimmerBoost = shimmerWave * 0.12;
            const alpha = (p.baseAlpha + shimmerBoost) * birthFade * musicParticleFade * centerFade;
            if (alpha < 0.005) continue;
            musicPCtx.save();
            const r = p.size * 1.2;
            const grad = musicPCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.3})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
            musicPCtx.fillStyle = grad;
            musicPCtx.beginPath();
            musicPCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
            musicPCtx.fill();
            if (p.depth > 0.5) {
                musicPCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
                musicPCtx.beginPath();
                musicPCtx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
                musicPCtx.fill();
            }
            musicPCtx.restore();
        }
    }

    function animateMusicParticles(now) {
        drawMusicParticles(now);
        musicParticleAnimId = requestAnimationFrame(animateMusicParticles);
    }

    function startMusicParticles() {
        if (!musicParticleCanvas || musicParticleAnimId) return;
        // Set vortex center from music doodle strokes
        musicVortexCenter = null;
        if (musicArtStrokes && musicArtStrokes.length > 0) {
            let sumX = 0, sumY = 0, count = 0;
            for (const stroke of musicArtStrokes) {
                if (Array.isArray(stroke)) {
                    for (const pt of stroke) { sumX += pt.x; sumY += pt.y; count++; }
                }
            }
            if (count > 0) musicVortexCenter = { x: sumX / count, y: sumY / count };
        }
        // Size canvas to artwork
        const artImg = document.getElementById('music-edit-artwork-img');
        if (artImg) {
            const rect = artImg.getBoundingClientRect();
            musicParticleCanvas.width = rect.width;
            musicParticleCanvas.height = rect.height;
            musicParticleCanvas.style.width = rect.width + 'px';
            musicParticleCanvas.style.height = rect.height + 'px';
        }
        initMusicParticles();
        musicParticleFade = 0;
        musicParticleCanvas.classList.add('active');
        const fadeIn = () => {
            musicParticleFade = Math.min(musicParticleFade + 0.02, 1);
            if (musicParticleFade < 1 && musicParticleAnimId) requestAnimationFrame(fadeIn);
        };
        requestAnimationFrame(fadeIn);
        musicParticleAnimId = requestAnimationFrame(animateMusicParticles);
    }

    function stopMusicParticles() {
        if (!musicParticleAnimId) return;
        musicParticleCanvas.classList.remove('active');
        const fadeOut = () => {
            musicParticleFade = Math.max(musicParticleFade - 0.015, 0);
            if (musicParticleFade > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                cancelAnimationFrame(musicParticleAnimId);
                musicParticleAnimId = null;
                if (musicPCtx && musicParticleCanvas.width) {
                    musicPCtx.clearRect(0, 0, musicParticleCanvas.width, musicParticleCanvas.height);
                }
                musicParticles = [];
            }
        };
        requestAnimationFrame(fadeOut);
    }

    // Auto-start/stop particles when edit-loading class toggles on artwork container
    const musicArtworkContainerEl = document.getElementById('music-edit-artwork-container');
    if (musicArtworkContainerEl) {
        const musicParticleObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class') {
                    if (musicArtworkContainerEl.classList.contains('edit-loading')) {
                        startMusicParticles();
                    } else {
                        stopMusicParticles();
                    }
                }
            }
        });
        musicParticleObserver.observe(musicArtworkContainerEl, { attributes: true });
    }

    // Undo for art drawing
    const musicUndoBtn = document.getElementById('music-edit-undo');
    if (musicUndoBtn) {
        musicUndoBtn.addEventListener('click', () => {
            // If in text mode with a marquee, clear the marquee first
            if (activeMusicArtTool === 'text' && musicMarqueeSelection) {
                clearMusicMarquee();
                musicUndoBtn.disabled = true;
                if (musicLyricsInputText) {
                    musicLyricsInputText.disabled = true;
                    musicLyricsInputText.placeholder = 'Tap text or draw a selection';
                    musicLyricsInputText.value = '';
                }
                return;
            }
            if (musicArtStrokes.length > 0) {
                musicArtStrokes.pop();
                redrawMusicArtStrokes();
                if (musicArtStrokes.length === 0) {
                    musicUndoBtn.disabled = true;
                    if (musicLyricsInputText) {
                        musicLyricsInputText.disabled = true;
                        if (activeMusicArtTool === 'select') {
                            musicLyricsInputText.placeholder = 'Draw on image to select area';
                        } else if (activeMusicArtTool === 'text') {
                            musicLyricsInputText.placeholder = 'Tap text or draw a selection';
                        }
                    }
                }
            }
        });
    }

    function enterMusicArtSubtool(toolId) {
        activeMusicArtTool = toolId;
        const toolName = toolId.charAt(0).toUpperCase() + toolId.slice(1);

        // Highlight the active sub-tool
        musicArtSubtools.forEach(t => t.classList.remove('active'));
        const activeBtn = document.querySelector(`#panel-art .edit-modal__tool[data-tool="${toolId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update header: hide close + title, show cancel + undo/redo
        if (musicEditCloseBtn) musicEditCloseBtn.hidden = true;
        if (musicEditCancelBtn) musicEditCancelBtn.hidden = false;
        if (musicEditTitle) musicEditTitle.hidden = true;
        if (musicEditAppbarActions) musicEditAppbarActions.hidden = false;

        // Reset canvas
        clearMusicArtCanvas();
        resizeMusicArtCanvas();

        if (toolId === 'select') {
            // Enable canvas drawing
            if (musicArtCanvas) {
                musicArtCanvas.style.pointerEvents = 'auto';
                musicArtCanvas.style.cursor = 'crosshair';
            }
            // Show education overlay on first use
            if (!musicArtEducationShown && musicArtOverlay) {
                musicArtOverlay.classList.remove('hidden');
            }
            // Show input bar (disabled until drawing)
            setMusicInputVisible(true);
            if (musicLyricsInputText) {
                musicLyricsInputText.disabled = true;
                musicLyricsInputText.placeholder = 'Draw on image to select area';
                musicLyricsInputText.value = '';
            }
            // Hide other subtools
            if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = true;


        } else if (toolId === 'text') {
            // Enable canvas drawing for text selection
            if (musicArtCanvas) {
                musicArtCanvas.style.pointerEvents = 'auto';
                musicArtCanvas.style.cursor = 'crosshair';
            }
            // Show input bar (disabled until selection)
            setMusicInputVisible(true);
            if (musicLyricsInputText) {
                musicLyricsInputText.disabled = true;
                musicLyricsInputText.placeholder = 'Tap text or draw a selection';
                musicLyricsInputText.value = '';
            }
            // Hide other subtools
            if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = true;




        } else if (toolId === 'effects') {
            // Disable canvas drawing
            if (musicArtCanvas) {
                musicArtCanvas.style.pointerEvents = 'none';
                musicArtCanvas.style.cursor = '';
            }
            // Show effects sub-tools, hide other sub-tools and input bar
            if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = false;

            setMusicInputVisible(false);
        }

        // Change Done button text
        if (musicEditDoneBtn) musicEditDoneBtn.textContent = 'Done';

        showToast(toolName);
    }

    function exitMusicArtSubtool() {
        if (!activeMusicArtTool) return;
        activeMusicArtTool = null;

        // Remove active from sub-tools
        musicArtSubtools.forEach(t => t.classList.remove('active'));

        // Restore header
        if (musicEditCloseBtn) musicEditCloseBtn.hidden = false;
        if (musicEditCancelBtn) musicEditCancelBtn.hidden = true;
        if (musicEditTitle) {
            musicEditTitle.hidden = false;
            musicEditTitle.textContent = 'Edit';
        }
        if (musicEditAppbarActions) musicEditAppbarActions.hidden = true;

        // Restore Done button text
        if (musicEditDoneBtn) musicEditDoneBtn.textContent = 'Save';

        // Disable canvas drawing
        if (musicArtCanvas) {
            musicArtCanvas.style.pointerEvents = 'none';
            musicArtCanvas.style.cursor = '';
        }
        clearMusicArtCanvas();
        clearMusicMarquee();

        // Hide education overlay
        if (musicArtOverlay) musicArtOverlay.classList.add('hidden');

        // Hide all sub-tools
        if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = true;


        // Hide the input bar (Art panel doesn't need it)
        setMusicInputVisible(false);
        if (musicLyricsInputText) {
            musicLyricsInputText.disabled = false;
            musicLyricsInputText.placeholder = 'Describe your lyrics';
            musicLyricsInputText.value = '';
        }

        // Reset undo
        if (musicUndoBtn) musicUndoBtn.disabled = true;
    }

    // Sub-tool click handlers
    musicArtSubtools.forEach(tool => {
        tool.addEventListener('click', () => {
            const toolId = tool.dataset.tool;
            if (activeMusicArtTool === toolId) {
                // Toggle off if same tool clicked
                exitMusicArtSubtool();
            } else {
                enterMusicArtSubtool(toolId);
            }
        });
    });

    // Cancel button → return to summary from lyrics/art, or exit art sub-tool
    if (musicEditCancelBtn) {
        musicEditCancelBtn.addEventListener('click', () => {
            // Exit erase mode if active
            if (musicEraseMode) {
                exitMusicEraseMode();
                showToolPanel('art');
                return;
            }
            if (activeMusicArtTool) {
                // In an art sub-tool → exit sub-tool back to art panel
                exitMusicArtSubtool();
            } else {
                // In lyrics or art top-level → return to summary
                lyricsEditing = false;
                showToolPanel('summary');
            }
        });
    }

    // --- Music Art Send Button → doodle + prompt → regenerate album art ---
    const musicLyricsSendBtn = document.getElementById('music-lyrics-send-btn');
    if (musicLyricsSendBtn) {
        musicLyricsSendBtn.addEventListener('click', async () => {
            const editText = musicLyricsInputText?.value?.trim();
            if (!editText) return;

            // Disable input while processing
            if (musicLyricsInputText) {
                musicLyricsInputText.disabled = true;
                musicLyricsInputText.value = '';
                musicLyricsInputText.placeholder = 'Generating...';
            }
            musicLyricsSendBtn.disabled = true;

            // Show loading shimmer on artwork
            const artworkContainer = document.getElementById('music-edit-artwork-container');
            if (artworkContainer) artworkContainer.classList.add('edit-loading');

            // Create abort controller
            const ac = createAbortController();

            try {
                // Get the current album art as base64
                const imageBase64 = await imgSrcToBase64(musicEditArtworkImg);

                // Build prompt based on active art sub-tool
                let editPrompt;
                if (activeMusicArtTool === 'text' && musicDetectedOriginalText && musicMarqueeSelection) {
                    // Text replacement mode — detected existing text
                    const canvasW = musicArtCanvas.width;
                    const canvasH = musicArtCanvas.height;
                    const x1Pct = Math.round((musicMarqueeSelection.x / canvasW) * 100);
                    const y1Pct = Math.round((musicMarqueeSelection.y / canvasH) * 100);
                    const x2Pct = Math.round(((musicMarqueeSelection.x + musicMarqueeSelection.w) / canvasW) * 100);
                    const y2Pct = Math.round(((musicMarqueeSelection.y + musicMarqueeSelection.h) / canvasH) * 100);
                    editPrompt = `In this image, change the text "${musicDetectedOriginalText}" to "${editText}" at approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). Keep everything else exactly the same — same style, same font, same colors, same layout. Only change the text content.`;
                } else if (activeMusicArtTool === 'text' && musicMarqueeSelection) {
                    // Add new text mode — marquee drawn but no existing text found
                    const canvasW = musicArtCanvas.width;
                    const canvasH = musicArtCanvas.height;
                    const x1Pct = Math.round((musicMarqueeSelection.x / canvasW) * 100);
                    const y1Pct = Math.round((musicMarqueeSelection.y / canvasH) * 100);
                    const x2Pct = Math.round(((musicMarqueeSelection.x + musicMarqueeSelection.w) / canvasW) * 100);
                    const y2Pct = Math.round(((musicMarqueeSelection.y + musicMarqueeSelection.h) / canvasH) * 100);
                    editPrompt = `In this image, add the text "${editText}" in the region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). The text should blend naturally with the image style. Keep everything else exactly the same.`;
                } else {
                    // Select mode — generic edit
                    editPrompt = `Edit this album artwork image: ${editText}. Maintain the same overall artistic style.`;
                }

                // Call Gemini API to edit the image
                const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);

                // Crossfade to new artwork
                if (musicEditArtworkImg) {
                    musicEditArtworkImg.style.transition = 'opacity 0.3s ease';
                    musicEditArtworkImg.style.opacity = '0';
                    await new Promise(r => setTimeout(r, 300));
                    musicEditArtworkImg.src = newDataUrl;
                    musicEditArtworkImg.onload = () => {
                        musicEditArtworkImg.style.opacity = '1';
                    };
                }

                // Also update the player artwork
                const playerArtworkImg = document.querySelector('.music-player__artwork-img');
                if (playerArtworkImg) playerArtworkImg.src = newDataUrl;

                showToast('Art updated');
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('Music art edit error:', err);
                showToast('Edit failed: ' + err.message);
            } finally {
                // Remove loading shimmer
                if (artworkContainer) artworkContainer.classList.remove('edit-loading');

                // Clear doodle strokes and marquee
                clearMusicArtCanvas();
                clearMusicMarquee();

                // Re-enable input
                if (musicLyricsInputText) {
                    musicLyricsInputText.disabled = false;
                    if (activeMusicArtTool === 'select') {
                        musicLyricsInputText.placeholder = 'Draw on image to select area';
                    } else if (activeMusicArtTool === 'text') {
                        musicLyricsInputText.placeholder = 'Tap text or draw a selection';
                    } else {
                        musicLyricsInputText.placeholder = 'Describe what to change';
                    }
                }
                musicLyricsSendBtn.disabled = false;

                // Reset undo
                if (musicUndoBtn) musicUndoBtn.disabled = true;
            }
        });

        // Enable send button when input has text
        if (musicLyricsInputText) {
            musicLyricsInputText.addEventListener('input', () => {
                musicLyricsSendBtn.disabled = !musicLyricsInputText.value.trim();
            });
            // Submit on Enter key
            musicLyricsInputText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    musicLyricsSendBtn.click();
                }
            });
        }
    }

    // ───────────────────────────────────────────────────
    // Music Effects Controller (uses shared factory)
    // ───────────────────────────────────────────────────
    const musicEffectsCtrl = createEffectsController({
        getImage: () => musicEditArtworkImg,
        getContainer: () => document.getElementById('music-edit-artwork-container'),
        lightingPanelId: 'music-lighting-panel',
        portraitPanelId: 'music-portrait-panel',
        lightingPrefix: 'music-lighting',
        portraitPrefix: 'music-portrait',
        enterErase: () => enterMusicEraseMode(),
        onImageUpdated: (newSrc /*, effectName, previousSrc */) => {
            // Sync the player artwork thumbnail
            const playerArt = document.querySelector('.music-player__artwork-img');
            if (playerArt) playerArt.src = newSrc;
            markMusicDirty();
        },
        hideUI: () => {
            if (musicEditCancelBtn) musicEditCancelBtn.style.display = 'none';
            if (musicEditAppbarActions) musicEditAppbarActions.style.display = 'none';
            if (musicLyricsInput) musicLyricsInput.hidden = true;
            const toolsRow = document.querySelector('#panel-art .edit-modal__tools-row');
            if (toolsRow) toolsRow.style.display = 'none';
            const toolBtns = document.querySelector('.music-edit__tool-buttons');
            if (toolBtns) toolBtns.style.display = 'none';
        },
        restoreUI: () => {
            if (musicEditCancelBtn) { musicEditCancelBtn.hidden = false; musicEditCancelBtn.style.display = ''; }
            if (musicEditAppbarActions) { musicEditAppbarActions.hidden = false; musicEditAppbarActions.style.display = ''; }
            const toolsRow = document.querySelector('#panel-art .edit-modal__tools-row');
            if (toolsRow) toolsRow.style.display = '';
            const toolBtns = document.querySelector('.music-edit__tool-buttons');
            if (toolBtns) toolBtns.style.display = '';
        },
        hideEffectsSubtools: () => { if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = true; },
        showEffectsSubtools: () => { if (musicArtEffectsSubtools) musicArtEffectsSubtools.hidden = false; },
    });
    musicEffectsCtrl.init();

    // --- Music Art Effects Sub-tool Click Handlers ---
    const musicArtPanel = document.getElementById('panel-art');
    if (musicArtPanel) {
        musicArtPanel.querySelectorAll('.edit-modal__subtool').forEach(btn => {
            btn.addEventListener('click', async () => {
                const subtoolId = btn.dataset.subtool;
                const parentEl = btn.closest('.edit-modal__subtools');
                const parentToolId = parentEl?.dataset.parent;

                if (parentToolId === 'effects') {
                    musicArtEffectsSubtools?.querySelectorAll('.edit-modal__subtool').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    await musicEffectsCtrl.handleEffectsSubtool(subtoolId);
                }
            });
        });
    }



    // ---------- Global Abort Controller for API Cancellation ----------
    let activeAbortController = null;

    function createAbortController() {
        // Cancel any existing request first
        cancelActiveRequest();
        activeAbortController = new AbortController();
        return activeAbortController;
    }

    function cancelActiveRequest() {
        if (activeAbortController) {
            activeAbortController.abort();
            activeAbortController = null;
        }
    }

    // ---------- Image Map ----------
    const styleImages = {
        'salon': '../images/salon.png',
        'monochrome': '../images/monochrome.png',
        'color-blocking': '../images/color-blocking.png',
        'surreal': '../images/surreal.png',
        'cyborg': '../images/cyborg.png',
        'gothic-clay': '../images/gothic-clay.png',
        'risograph': '../images/risograph.png',
        'steampunk': '../images/steampunk.png',
        'explosive': '../images/explosive.png',
        'oil-painting': '../images/oil-painting.png',
        'runway': '../images/runway.png',
        'old-cartoon': '../images/old-cartoon.png',
    };

    // ---------- Dynamic Placeholder Text Per Style ----------
    const stylePlaceholders = {
        'salon': [
            'give me a fresh new hairstyle',
            'transform my hair into a precision bob',
            'reimagine my look with salon-quality hair',
            'style my hair like a luxury editorial',
            'give me a modern architectural cut',
        ],
        'monochrome': [
            'make it a dramatic black & white portrait',
            'turn it into a moody film noir scene',
            'give it high-contrast monochrome shadows',
            'reimagine it as a vintage B&W photo',
            'strip the color for a stark silhouette',
        ],
        'color-blocking': [
            'turn it into bold flat color shapes',
            'reimagine it as pop-art blocks',
            'give it vivid geometric color panels',
            'make it a bright color-blocked poster',
            'transform it into abstract flat art',
        ],
        'surreal': [
            'place yourself in a surrealist painting',
            'make it float among melting clocks',
            'add impossible architecture around it',
            'blend it into a dreamlike landscape',
            'warp reality with surreal distortions',
        ],
        'cyborg': [
            'transform into an android version',
            'add translucent skin panels with neon circuitry',
            'make it a Kraftwerk-inspired cyborg',
            'give it liquid metal reflections',
            'reimagine with industrial haze and red neon',
        ],
        'gothic-clay': [
            'sculpt it into a dark clay figurine',
            'add gothic gargoyles around it',
            'turn it into an ornate baroque relief',
            'give it a moody stone cathedral vibe',
            'reimagine it as a weathered clay bust',
        ],
        'risograph': [
            'print it in layered halftone inks',
            'give it a grainy retro poster look',
            'add misregistered color overlays',
            'turn it into a vintage risograph zine',
            'layer it with semi-transparent ink washes',
        ],
        'steampunk': [
            'surround it with brass gears and pipes',
            'transform it into a clockwork invention',
            'add Victorian copper goggles and steam',
            'reimagine it inside a steam-powered lab',
            'give it an industrial bronze makeover',
        ],
        'explosive': [
            'make it burst with neon paint splatters',
            'add a shockwave of vibrant color',
            'surround it with explosive energy trails',
            'shatter it into flying color fragments',
            'give it a high-energy paint detonation',
        ],
        'oil-painting': [
            'paint it with rich impasto brushstrokes',
            'give it a Vanity Fair editorial mood',
            'add dramatic Rembrandt lighting',
            'reimagine it as a cinematic portrait',
            'make it look epic',
        ],
        'runway': [
            'dress it in Saint Laurent tailoring',
            'place it in a Turrell light field',
            'give it a luxury editorial mood',
            'add atmospheric color transitions',
            'reimagine it as a high-fashion portrait',
        ],
        'old-cartoon': [
            'turn me into a 1930s cartoon character',
            'give it a rubber hose animation style',
            'make it look like an old Fleischer cartoon',
            'transform it into a vintage black & white toon',
            'add pie-cut eyes and bouncy limbs',
        ],
    };

    // ---------- Sample prompts for response screen ----------
    const samplePrompts = [
        'give me a funny expression',
        'make it look dramatic',
        'add a dreamy vibe',
        'transform me into this style',
        'make it look epic',
    ];

    const DEFAULT_PLACEHOLDER = 'Describe your image';
    const RESPONSE_PLACEHOLDER = 'Describe your image';

    // ---------- Card Selection → Toggle Attachment ----------
    allCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const style = card.dataset.style;

            // Ripple effect
            createRipple(e, card);

            // Toggle selection
            if (card.classList.contains('selected')) {
                // Deselect
                card.classList.remove('selected');
                selectedStyle = null;
                removeAttachment();
            } else {
                // Remove previous selection
                allCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedStyle = style;
                showAttachment(style);
            }

            updateSendState();
        });
    });

    // ---------- Gemini API — routed through server proxy ----------
    // The server proxy (/api/studio-generate, /api/studio-edit) holds the API key.
    // No key is ever exposed to the browser or the user.
    const STUDIO_GENERATE_URL = '/api/studio-generate';
    const STUDIO_EDIT_URL     = '/api/studio-edit';

    // Legacy constants kept for reference / potential direct-call fallback in dev
    const GEMINI_API_URL      = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
    const GEMINI_FALLBACK_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

    async function callStudioProxy(endpoint, contents, generationConfig, signal) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig }),
            signal: signal || undefined,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || err.error || `Server error: ${response.status}`);
        }
        return response.json();
    }

    // getApiKey is retained for the auto-text-scan (detectTextInRegion / autoScanTextRegions)
    // which calls Gemini directly. Image generate/edit/restyle go through the server proxy.
    const REVOKED_KEY = 'AIzaSyBB_UX81p6Cm_Y8MMvTdgySZKdD-R2oItA';
    function getApiKey() {
        let key = localStorage.getItem('gemini_api_key');
        if (key === REVOKED_KEY) { localStorage.removeItem('gemini_api_key'); key = null; }
        if (!key) {
            key = prompt('Enter your Gemini API key for text detection.\n\nGet one free at: https://aistudio.google.com/apikey');
            if (key) localStorage.setItem('gemini_api_key', key.trim());
        }
        return key ? key.trim() : null;
    }

    // Style-specific restyle prompts
    const stylePrompts = {
        'salon': 'Create a high-fashion beauty editorial portrait centered on the transformation and refinement of the subject\'s hair, executed with elite salon craftsmanship and modern fashion awareness. If a reference image is provided and contains a person, preserve their identity faithfully. If the person has little or no visible hair — shaved, closely cropped, thinning, or bald — thoughtfully reimagine and regrow their hair in a way that feels natural, believable, and aligned with their features. The result should never appear artificial or exaggerated, but rather as if guided by a world-class stylist. Hair regrowth should respect: natural hairlines, realistic density, believable growth patterns, appropriate texture, facial structure, age, bone structure. Avoid overly thick, theatrical, wig-like, or digitally perfect hair. Subtle realism signals luxury. Favor precision-driven styles with strong structure — architectural bobs, tailored short cuts, controlled length, disciplined layers, sculptural natural texture — always executed with restraint. Design the hairstyle as if it could influence upcoming salon trends rather than follow them. Hair should appear exceptionally healthy, luminous, and touchable, with dimension and professional finish. Frame the subject relatively close so the haircut functions as the visual architecture of the portrait. Lighting is refined and directional, revealing structure and shine while preserving natural skin texture. Wardrobe remains minimal and elevated to keep attention on the hair. Expression is relaxed and confident — the quiet assurance of someone wearing their best look. Background should be tonal, clean, or softly diffused. No visual noise. Capture with editorial restraint and pristine clarity, avoiding heavy retouching. The final image should feel like a luxury beauty campaign announcing a defining new look — modern, timeless, and culturally elevated. Style cues: luxury hair transformation, realistic hair regrowth, precision haircut, editorial beauty, elite salon aesthetic, sculptural hair.',
        'monochrome': 'A dramatic Leica Monochrom–style black-and-white portrait, high-fashion editorial aesthetic, extremely sharp knife-edge lighting cutting across the frame, hard directional light forming precise geometric boundaries between light and shadow, the subject partially intersected by the light boundary so only one side of the face is illuminated, sculptural contrast emphasizing bone structure and facial geometry, deep inky blacks shaped by strong negative fill, crisp highlight roll-off with no diffusion, rich tonal separation rather than pure white clipping, minimalist background, timeless modern elegance, subtle organic film grain characteristic of Leica Monochrom, exceptional micro-contrast, sharp yet natural detail, frame feels like a luxury monochrome editorial portrait.',
        'color-blocking': 'The attached image is the main subject. A cinematic portrait photograph mixing the dreamlike unease of David Lynch with the bold, painterly color and flat graphic space of David Hockney paintings. The subject is posed with stillness and ambiguity, centered or slightly off-center, facing the camera but emotionally distant. The expression is calm yet unsettling — neutral on the surface, charged underneath. The environment feels recognizable but subtly wrong: a domestic or poolside setting, a room with clean modern lines, simplified architecture, or an outdoor space rendered with flattened perspective and intentional artificiality. Color is bright, saturated, and unapologetic — turquoise blues, mint greens, lemon yellow, coral, lavender, soft pinks — arranged in clean planes like a Hockney painting. Shadows are crisp and graphic, sometimes unnaturally shaped. Lighting is controlled and slightly uncanny — even illumination with hints of directional light that create tension rather than drama. Nothing feels spontaneous; everything feels staged and deliberate. Styling is minimal and modern, using solid colors and simple silhouettes that echo the palette of the environment. Clothing blends into or contrasts sharply with the background through color blocking. Composition emphasizes geometry and negative space, with strong horizontals and verticals, flattened depth, and a sense of artificial calm. Captured with clean, high-resolution clarity, subtle film grain, and restrained contrast — realism infused with psychological strangeness. The overall mood is sunlit but ominous, serene yet disturbing — like a perfect afternoon that feels slightly haunted. Style cues: bright color portrait photography, painterly flat color fields, uncanny calm, psychological tension, geometric composition, modernist realism, cinematic stillness. Optional negative constraints: no fantasy elements, no heavy surrealism, no motion blur, no grunge textures, no exaggerated expressions.',
        'surreal': 'Restyle this image in a surrealist dreamlike style inspired by Salvador Dali, with impossible architecture, melting elements, and ethereal atmosphere.',
        'cyborg': 'The attached image is the main subject. Medium shot, focusing on an android version of the user. Primary features: Inflatable, taut skin layers; translucent air panels exposing inner circuitry pulsing with red neon light. Camera operation: Slow lateral pan across the subject. Visual effects: Reflections that ripple like liquid metal. Setting: Static industrial environment with a soft, synthetic atmospheric haze. Style cue: Human anatomy re-engineered by Kraftwerk\'s stage designer.',
        'gothic-clay': 'A handcrafted stop-motion claymation scene strongly inspired by the gothic whimsy of Tim Burton, blended with the Victorian illustrative influence of Edward Gorey, featuring an intentionally random, dreamlike gothic background — mismatched pointed archways, uneven staircases that lead nowhere, oddly placed doors, crooked picture frames, scattered candles, tilted towers, and asymmetrical architectural elements that feel surreal yet carefully handmade. Everything should appear physically constructed rather than digitally rendered, with imperfect sculpted clay, visible fingerprints, soft dents, uneven edges, layered paint, and miniature set textures. Use a rich but restrained storybook palette of deep plum, midnight blue, moss green, antique gold, and desaturated teal, lit with moody practical-style lighting that resembles a real stop-motion stage. Center an eccentric character with elongated limbs, a slender silhouette, oversized expressive eyes, and theatrical posture, embracing charming physical imperfections. The tone should feel whimsical, slightly melancholic, and playfully macabre rather than frightening. If a reference image is provided and depicts a human, faithfully preserve the person\'s likeness and distinguishing features while translating them into this handcrafted claymation style. Format: 16:9, ultra-high detail, shallow depth of field, cinematic miniature realism, full bleed.',
        'risograph': 'Create a punk zine–inspired risograph poster with raw, DIY energy and a strong graphic attitude. The background must always be exactly one solid, flat color per image, filling the entire frame edge to edge. The background color should change every generation and be chosen from bold, unexpected, high-impact hues—fluorescent pink, toxic green, safety orange, electric blue, blood red, acid yellow, deep purple, or other striking ink-heavy colors. The background must never include gradients, textures, shading, noise, or multiple tones—pure color block only. All foreground imagery is printed on top using a very limited set of risograph spot inks, with an aggressive punk-zine approach: rough silhouettes, torn-paper shapes, cut-out collage forms, and imperfect edges. Heavy misregistration is mandatory—ink layers are visibly offset, overlapping, and slightly out of alignment, creating accidental color mixes and visual tension. Misregistration should feel chaotic but intentional, like a rushed late-night print run. Texture is loud and physical: uneven ink density, roller streaks, ink bleed, feathered edges, crushed blacks, coarse halftone dots, and visible paper grain. Halftones are chunky and imperfect, with broken dots and over-inked areas. There are no smooth gradients, no digital effects, and no polish—everything should feel copied, printed, overworked, and slightly abused. The composition is confrontational and collage-driven, with high contrast against the solid background color. The image should feel like a punk zine cover or folded poster—angry, expressive, handmade, and meant to be wheatpasted, stapled, or photocopied. Do not include any text, typography, letters, numbers, logos, symbols, borders, or graphic marks of any kind—purely visual imagery only. If a reference image is provided, the generated image must accurately and faithfully represent the reference in subject, likeness, facial features, expression, pose, proportions, and overall composition. No reinterpretation or redesign of identity is allowed—only the punk zine risograph treatment, heavy misregistration, raw print texture, and variable single-color background may be applied.',
        'steampunk': 'An epic cinematic steampunk world illuminated with masterful, high-contrast lighting — warm golden backlight mixed with cool atmospheric shadows, volumetric rays cutting through steam and industrial haze — featuring a heroic figure in intricately detailed Victorian mechanical attire with leather straps, polished brass instruments, and ornate goggles, standing atop a vast skyline of airships, smokestacks, and towering clockwork structures. The character\'s face should have subtle, realistic dust and soot from the environment, adding grit and lived-in authenticity without obscuring their features. Surround the scene with drifting particles, floating ash, and fine mechanical debris to enhance depth and realism. Textures are ultra-detailed: aged metal, rivets, burnished copper, weathered leather, and analog gauges. Composition should feel monumental and mythic, like a frame from a big-budget sci-fi epic. Style tags: epic steampunk, cinematic lighting, dramatic atmosphere, ultra-detailed, Victorian futurism, legendary concept art. Format: 16:9, ultra-high detail, sharp focus, full bleed.',
        'explosive': 'A hyper-dramatic, cinematic portrait where the subject appears transported into a high-budget film special-effects moment, frozen at the exact instant of an explosion. The subject is captured mid-stillness, calm and unwavering, while the world around them detonates. The face remains sharp, composed, and emotionally controlled — untouched by panic — creating a powerful contrast between inner stillness and external chaos. A massive explosion blooms behind and around the subject, frozen in time: fireballs expanding outward in sculptural arcs, shards of debris, sparks, embers, and dust suspended in midair, shockwave ripples visible in smoke and light. The explosion feels cinematic and physically real, not exaggerated or cartoonish — detailed flame texture, realistic smoke density, glowing embers caught mid-trajectory. Lighting is extreme and cinematic: a bright, explosive backlight silhouettes the subject with fiery rim light, warm highlights from the blast sculpt the edges of the face and body, cooler fill light preserves skin tone and facial detail, maintaining portrait clarity. The color palette is high-impact and film-graded: molten orange and amber from fire, deep blacks and charcoal smoke, hints of electric blue or steel gray in shadows. Motion is implied but completely frozen — hair, fabric, smoke, and debris all suspended, as if time has stopped for a single frame. The background dissolves into darkness, smoke, and light, creating a sense of infinite space and scale. Texture is hyper-detailed: skin remains natural, fabric fibers visible, smoke volumetric, sparks sharp and luminous. Captured with cinema-grade realism, high dynamic range, dramatic contrast, subtle film grain, and epic scale — like a paused frame from a major theatrical release. The overall feeling is apocalyptic, iconic, and mythic — a portrait where identity survives destruction, frozen at the most dramatic possible instant.',
        'oil-painting': 'Transform this image into a cinematic, painterly portrait in the style of Annie Leibovitz. Use soft, diffused lighting with Rembrandt-inspired shadows that sculpt the face and body. Balance a warm, golden key light with subtle fill, creating depth and richness in skin tones. Add gentle vignetting to draw focus to the subject. The background should feel atmospheric and painterly, with subdued colors and soft gradients, as if lit by a large studio softbox or window light. Preserve fine detail in textures (fabric, skin, hair) while keeping an overall timeless, editorial mood. The result should evoke a Vanity Fair-style portrait: dramatic, intimate, and cinematic, with a sense of narrative in the environment.',
        'old-cartoon': 'Transform the photo into a vintage 1930s rubber hose animation style, black and white, pie-cut eyes, grainy film texture, bouncy and exaggerated features.',
        'runway': 'A formal, ultra-luxury fashion editorial portrait staged within a monumental luminous environment inspired by a James Turrell light installation, now featuring a carefully controlled multi-color atmosphere that defines space through perceptual color relationships. If a reference image is provided and contains a person, preserve their identity faithfully while dressing them in impeccably tailored formal runway attire inspired by Saint Laurent precision and Balenciaga modern discipline. Favor timeless authority — sculptural tailoring, formal coats, architectural dresses, refined monochrome ensembles. Avoid casual styling, streetwear, logos, or theatrical couture. The subject stands within a seamless field of diffused light where architectural edges dissolve. The environment should feel infinite and immersive. Introduce two to three harmonized colors that blend slowly across the space — never abrupt, never neon. Transitions should feel atmospheric, as if the light itself has depth. Example color pairings: deep cobalt fading into atmospheric violet, warm ivory transitioning to muted gold, oxblood melting into shadowed plum, cool steel drifting into midnight blue, bone dissolving into soft rose haze. Avoid rainbow effects or high-saturation clashes. Color must signal luxury through restraint. Lighting remains soft and volumetric, wrapping the subject evenly while maintaining clear facial visibility: eyes gently defined, skin tones natural within the color field, slight tonal separation guiding attention to the face. The wardrobe should remain slightly darker or more tonally grounded than portions of the environment to preserve silhouette authority. The pose is composed and editorial — formal yet relaxed, confident without stiffness. Expression is emotionally controlled and self-possessed. Composition is spacious with intentional negative space, allowing color to operate as architecture rather than background. Capture with pristine clarity, velvet tonal transitions, and subtle film texture. Avoid digital gloss or aggressive contrast. The final image should feel like a future-classic luxury editorial, balancing formal fashion authority with immersive perceptual color — sophisticated, timeless, and culturally elevated. Style cues: multi-color light field, perceptual color space, luxury editorial portrait, formal runway styling, turrell-inspired lighting, chromatic restraint, museum-grade fashion.',
    };

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Convert an <img> src (data URL or regular URL) to base64
    function imgSrcToBase64(imgEl) {
        return new Promise((resolve, reject) => {
            try {
                const src = imgEl.src;
                // If already a data URL, extract the base64 part
                if (src.startsWith('data:')) {
                    resolve(src.split(',')[1]);
                    return;
                }
                // Otherwise draw to canvas to get base64
                const canvas = document.createElement('canvas');
                canvas.width = imgEl.naturalWidth;
                canvas.height = imgEl.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgEl, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl.split(',')[1]);
            } catch (e) {
                reject(e);
            }
        });
    }

    async function eraseWithGemini(imageBase64, maskBase64, editPrompt, signal) {
        const parts = [
            { text: `Edit this image: ${editPrompt}` },
            { inline_data: { mime_type: 'image/png', data: imageBase64 } },
            { inline_data: { mime_type: 'image/png', data: maskBase64 } },
        ];
        const contents = [{ parts }];
        const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
        const data = await callStudioProxy(STUDIO_EDIT_URL, contents, generationConfig, signal);
        const candidates = data.candidates || [];
        for (const candidate of candidates) {
            for (const part of (candidate.content?.parts || [])) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error('No image returned from Gemini API');
    }

    // Edit image using Gemini API — sends current image + edit prompt
    async function editWithGemini(imageBase64, editPrompt, signal, referenceImageBase64, maskBase64, preCompositeBase64) {
        const parts = [
            { text: `Edit this image: ${editPrompt}` },
            { inline_data: { mime_type: 'image/png', data: imageBase64 } },
        ];
        if (referenceImageBase64) {
            parts.push(
                { text: 'REFERENCE IMAGE (the subject to insert):' },
                { inline_data: { mime_type: 'image/png', data: referenceImageBase64 } }
            );
        }
        if (maskBase64) {
            parts.push(
                { text: 'MASK IMAGE (white = where to place the subject, black = preserve). The shape, contour, and proportions of the white area define how the reference subject should be reshaped and cropped:' },
                { inline_data: { mime_type: 'image/png', data: maskBase64 } }
            );
        }
        if (preCompositeBase64) {
            parts.push(
                { text: 'PRE-COMPOSITE IMAGE (the reference image has been roughly pasted at the doodle location on the base image — use this as your starting point for placement, then refine the edges, style, and blending to make it seamless):' },
                { inline_data: { mime_type: 'image/png', data: preCompositeBase64 } }
            );
        }
        const contents = [{ parts }];
        const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
        const data = await callStudioProxy(STUDIO_EDIT_URL, contents, generationConfig, signal);
        const candidates = data.candidates || [];
        for (const candidate of candidates) {
            for (const part of (candidate.content?.parts || [])) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error('No image returned from Gemini API');
    }

    async function restyleWithGemini(file, style, userPrompt, signal) {
        const base64Image = await fileToBase64(file);
        const mimeType = file.type || 'image/jpeg';
        const baseStylePrompt = stylePrompts[style] || `Restyle this image in a ${style} art style.`;
        const fullPrompt = userPrompt
            ? `${baseStylePrompt} Additional instructions: ${userPrompt}`
            : baseStylePrompt;
        const contents = [{
            parts: [
                { text: fullPrompt },
                { inline_data: { mime_type: mimeType, data: base64Image } },
            ]
        }];
        const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
        const data = await callStudioProxy(STUDIO_GENERATE_URL, contents, generationConfig, signal);
        const candidates = data.candidates || [];
        for (const candidate of candidates) {
            for (const part of (candidate.content?.parts || [])) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        throw new Error('No image returned from Gemini API');
    }

    async function generateWithGemini(style, userPrompt, signal) {
        let fullPrompt;
        if (style) {
            const baseStylePrompt = stylePrompts[style] || `Generate an image in a ${style} art style.`;
            fullPrompt = userPrompt
                ? `Generate an image with the following style: ${baseStylePrompt}. Subject/scene: ${userPrompt}`
                : `Generate an image with the following style: ${baseStylePrompt}`;
        } else {
            fullPrompt = userPrompt || 'Generate a beautiful image';
        }

        const contents = [{ parts: [{ text: fullPrompt }] }];
        const generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
        const data = await callStudioProxy(STUDIO_GENERATE_URL, contents, generationConfig, signal);
        const candidates = data.candidates || [];
        for (const candidate of candidates) {
            for (const part of (candidate.content?.parts || [])) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error('No image returned from Gemini API');
    }

    // ---------- Response Screen ----------
    const responseAnswerText = document.querySelector('.response-answer__text');

    function showResponseScreen(style, userPrompt) {
        isResponseMode = true;
        const label = style ? capitalize(style) : 'Generated';
        const imgSrc = style ? styleImages[style] : null;

        // Populate response screen
        responseTitle.textContent = style ? label + ' image' : 'Generated image';

        // Style thumb — only show when a template was selected
        if (style && imgSrc) {
            responseThumbStyleImg.src = imgSrc;
            responseThumbStyleImg.alt = label + ' style';
            responseThumbStyleLabel.textContent = label;
            document.getElementById('response-thumb-style').hidden = false;
        } else {
            document.getElementById('response-thumb-style').hidden = true;
        }

        // Use the actual user prompt
        responsePromptText.textContent = userPrompt;

        // Show/hide selfie thumbnail
        if (selfieFile && selfieThumb.src) {
            responseThumbSelfie.hidden = false;
            responseThumbSelfieImg.src = selfieThumb.src;
        } else {
            responseThumbSelfie.hidden = true;
        }

        // Stop placeholder rotation, switch to response mode placeholder
        stopPlaceholderRotation();
        placeholderPrefix.textContent = RESPONSE_PLACEHOLDER;
        placeholderDrum.style.display = 'none';

        // Hide template attachment row items
        attachmentChip.hidden = true;
        addSelfieBtn.classList.add('hidden');
        selfieChip.hidden = true;

        // Show the response screen
        responseScreen.hidden = false;
        responseScreen.classList.remove('exiting');
        appShell.classList.add('app-shell--response');

        // Reset prompt input
        promptInput.value = '';
        updateSendState();
        updatePlaceholderVisibility();

        // If selfie is attached, call Gemini API to restyle it
        if (selfieFile) {
            responseImageImg.style.display = 'none';
            responseImageImg.style.filter = '';
            responseImageImg.alt = '';
            responseAnswerText.textContent = 'Restyling your image…';
            responseImageImg.closest('.response-image').classList.add('loading');

            restyleWithGemini(selfieFile, style, userPrompt)
                .then(dataUrl => {
                    responseImageImg.src = dataUrl;
                    responseImageImg.alt = label + ' restyled photo';
                    responseImageImg.style.display = '';
                    responseAnswerText.textContent = 'Here\'s your restyled image';
                    responseImageImg.closest('.response-image').classList.remove('loading');
                })
                .catch(err => {
                    if (err.name === 'AbortError') return;
                    console.error('Gemini API error:', err);
                    responseImageImg.src = imgSrc;
                    responseImageImg.alt = 'Generated image';
                    responseImageImg.style.display = '';
                    responseAnswerText.textContent = 'Could not restyle — showing template preview';
                    responseImageImg.closest('.response-image').classList.remove('loading');
                    showToast('Restyle failed: ' + err.message);
                });
        } else {
            // No selfie — generate image from style + prompt
            responseImageImg.style.display = 'none';
            responseImageImg.style.filter = '';
            responseImageImg.alt = '';
            responseAnswerText.textContent = 'Generating your image…';
            responseImageImg.closest('.response-image').classList.add('loading');

            generateWithGemini(style, userPrompt)
                .then(dataUrl => {
                    responseImageImg.src = dataUrl;
                    responseImageImg.alt = label + ' generated image';
                    responseImageImg.style.display = '';
                    responseAnswerText.textContent = 'Here\'s your generated image';
                    responseImageImg.closest('.response-image').classList.remove('loading');
                })
                .catch(err => {
                    if (err.name === 'AbortError') return;
                    console.error('Gemini API error:', err);
                    responseImageImg.src = imgSrc;
                    responseImageImg.alt = 'Generated image';
                    responseImageImg.style.display = '';
                    responseAnswerText.textContent = 'Could not generate — showing template preview';
                    responseImageImg.closest('.response-image').classList.remove('loading');
                    showToast('Generation failed: ' + err.message);
                });
        }
    }

    function hideResponseScreen() {
        isResponseMode = false;
        cancelActiveRequest(); // Cancel any in-flight API request

        // Animate out
        responseScreen.classList.add('exiting');

        setTimeout(() => {
            responseScreen.hidden = true;
            responseScreen.classList.remove('exiting');
            appShell.classList.remove('app-shell--response');

            // Reset card selections
            allCards.forEach(c => c.classList.remove('selected'));
            selectedStyle = null;
            responseImageImg.style.filter = '';

            // Reset placeholder to default
            resetPlaceholder();

            // Clear selfie state and restore add photo button
            clearSelfie();
            addSelfieBtn.classList.remove('hidden');

            // Reset prompt
            promptInput.value = '';
            updateSendState();
            updatePlaceholderVisibility();
        }, 300);
    }

    // Back button
    backBtn.addEventListener('click', hideResponseScreen);

    // ---------- Template Attachment (kept for future use) ----------
    function showAttachment(style) {
        const imgSrc = styleImages[style];
        const label = capitalize(style);

        attachmentThumb.src = imgSrc;
        attachmentThumb.alt = label + ' style';
        attachmentLabel.textContent = label;
        attachmentChip.hidden = false;
        attachmentChip.style.animation = 'attachSlideIn 0.35s cubic-bezier(0.2, 0, 0, 1) forwards';

        // Show and animate Add photo button sliding right
        addSelfieBtn.classList.remove('hidden');
        addSelfieBtn.classList.remove('slide-left', 'slide-right');
        void addSelfieBtn.offsetHeight; // force reflow
        addSelfieBtn.classList.add('slide-right');
        addSelfieBtn.addEventListener('animationend', () => {
            addSelfieBtn.classList.remove('slide-right');
        }, { once: true });

        startPlaceholderRotation(style);
    }

    function removeAttachment() {
        attachmentChip.style.animation = 'none';
        attachmentChip.style.opacity = '1';

        requestAnimationFrame(() => {
            attachmentChip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            attachmentChip.style.opacity = '0';
            attachmentChip.style.transform = 'translateY(4px) scale(0.95)';

            setTimeout(() => {
                attachmentChip.hidden = true;
                attachmentChip.style.transition = '';
                attachmentChip.style.opacity = '';
                attachmentChip.style.transform = '';
                attachmentChip.style.animation = '';

                // Animate Add photo button sliding left then hide
                addSelfieBtn.classList.remove('slide-left', 'slide-right');
                void addSelfieBtn.offsetHeight;
                addSelfieBtn.classList.add('slide-left');
                addSelfieBtn.addEventListener('animationend', () => {
                    addSelfieBtn.classList.remove('slide-left');
                    addSelfieBtn.classList.add('hidden');
                }, { once: true });
            }, 200);
        });

        selectedStyle = null;
        allCards.forEach(c => c.classList.remove('selected'));
        clearSelfie();
        stopPlaceholderRotation();
        resetPlaceholder();
    }

    attachmentClose.addEventListener('click', (e) => {
        e.stopPropagation();
        removeAttachment();
        updateSendState();
    });

    // ---------- Selfie ----------
    addSelfieBtn.addEventListener('click', () => {
        selfieInput.click();
    });

    selfieInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selfieFile = file;
        const url = URL.createObjectURL(file);
        selfieThumb.src = url;
        selfieChip.hidden = false;
        addSelfieBtn.classList.add('hidden');
    });

    selfieClose.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelfie();
    });

    function clearSelfie() {
        selfieFile = null;
        selfieChip.hidden = true;
        selfieInput.value = '';
        if (selfieThumb.src.startsWith('blob:')) {
            URL.revokeObjectURL(selfieThumb.src);
        }
        selfieThumb.src = '';
        addSelfieBtn.classList.remove('hidden');
    }

    // ---------- Placeholder Drum ----------
    const ITEM_HEIGHT = 22; // px, matches line-height

    function startPlaceholderRotation(style) {
        stopPlaceholderRotation();

        const phrases = stylePlaceholders[style] || [DEFAULT_PLACEHOLDER];
        currentPlaceholderIndex = 0;

        // Switch prefix to "Restyle: "
        placeholderPrefix.textContent = 'Restyle: ';
        placeholderDrum.style.display = '';

        // Build vertical stack of phrase items + clone of first for seamless loop
        placeholderTrack.innerHTML = '';
        const allPhrases = [...phrases, phrases[0]]; // append clone of first
        allPhrases.forEach((phrase, i) => {
            const item = document.createElement('span');
            item.className = 'placeholder-drum__item';
            item.textContent = `\u201C${phrase}\u201D`;
            if (i === 0) item.classList.add('placeholder-drum__item--active');
            placeholderTrack.appendChild(item);
        });

        // Reset track position
        placeholderTrack.style.transition = 'none';
        placeholderTrack.style.transform = 'translateY(0)';

        // Rotate every 2.8 seconds
        placeholderInterval = setInterval(() => {
            const items = placeholderTrack.querySelectorAll('.placeholder-drum__item');
            const prevIndex = currentPlaceholderIndex;
            currentPlaceholderIndex++;

            // Deactivate previous item (scale down + fade)
            items[prevIndex].classList.remove('placeholder-drum__item--active');

            // Activate next item (scale up + fade in)
            items[currentPlaceholderIndex].classList.add('placeholder-drum__item--active');

            // Slide the entire track up by one line height
            placeholderTrack.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            placeholderTrack.style.transform = `translateY(-${currentPlaceholderIndex * ITEM_HEIGHT}px)`;

            // If we just scrolled to the clone (last item), seamlessly reset
            if (currentPlaceholderIndex >= phrases.length) {
                setTimeout(() => {
                    // Disable transitions for instant reset
                    placeholderTrack.style.transition = 'none';
                    placeholderTrack.style.transform = 'translateY(0)';
                    currentPlaceholderIndex = 0;

                    // Reset active classes
                    items.forEach((el, i) => {
                        el.classList.toggle('placeholder-drum__item--active', i === 0);
                    });
                }, 550); // slightly after the 0.5s transition ends
            }
        }, 2800);
    }

    function stopPlaceholderRotation() {
        if (placeholderInterval) {
            clearInterval(placeholderInterval);
            placeholderInterval = null;
        }
    }

    function resetPlaceholder() {
        stopPlaceholderRotation();
        placeholderPrefix.textContent = DEFAULT_PLACEHOLDER;
        placeholderDrum.style.display = 'none';
        placeholderTrack.innerHTML = '';
        placeholderTrack.style.transform = 'translateY(0)';
    }

    function updatePlaceholderVisibility() {
        const hasText = promptInput.value.trim().length > 0;
        placeholderOverlay.classList.toggle('hidden', hasText);
    }

    // ---------- Input Bar ----------
    promptInput.addEventListener('input', () => {
        autoResize(promptInput);
        updateSendState();
        updatePlaceholderVisibility();
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    const imgMicBtn = document.getElementById('btn-mic');
    function updateSendState() {
        const hasText = promptInput.value.trim().length > 0;
        // Show send when there's text, show mic when empty
        if (imgMicBtn) imgMicBtn.style.display = hasText ? 'none' : 'flex';
        sendBtn.style.display = hasText ? 'flex' : 'none';
        sendBtn.disabled = !hasText;
    }

    function handleSend() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        if (isResponseMode) {
            // Already on response screen, just show toast
            showToast(`Generating: "${truncate(prompt, 30)}"`);
            promptInput.value = '';
            autoResize(promptInput);
            updateSendState();
            updatePlaceholderVisibility();
        } else {
            // Navigate to response screen — with or without a template
            showResponseScreen(selectedStyle, prompt);
        }
    }

    // ---------- Mic Button Feedback ----------
    micBtn.addEventListener('click', () => {
        micBtn.classList.toggle('active');
        if (micBtn.classList.contains('active')) {
            micBtn.querySelector('.material-symbols-outlined').textContent = 'mic';
            showToast('Listening…');
        }
        setTimeout(() => {
            micBtn.classList.remove('active');
        }, 2000);
    });

    // ---------- Ripple ----------
    function createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // ---------- Toast ----------
    let toastTimeout = null;

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.classList.add('toast');
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.setAttribute('aria-atomic', 'true');
            document.body.appendChild(toast);
        }

        toast.classList.remove('visible');
        clearTimeout(toastTimeout);
        toast.textContent = message;
        void toast.offsetWidth;
        toast.classList.add('visible');

        toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2500);
    }

    // ---------- Helpers ----------
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }

    function truncate(str, max) {
        return str.length > max ? str.slice(0, max) + '…' : str;
    }

    // ---------- App Bar Buttons ----------
    document.getElementById('menu-btn')?.addEventListener('click', () => {
        showToast('Chat history');
    });

    document.getElementById('avatar-btn')?.addEventListener('click', () => {
        showToast('Profile');
    });

    document.getElementById('btn-add')?.addEventListener('click', () => {
        showToast('Add attachment');
    });

    document.getElementById('btn-image-fx')?.addEventListener('click', () => {
        showToast('ImageFX mode active');
    });

    // ---------- Response Screen Action Buttons ----------
    document.getElementById('response-menu-btn')?.addEventListener('click', () => {
        showToast('More options');
    });

    document.getElementById('btn-share-img')?.addEventListener('click', () => {
        showToast('Share image');
    });

    document.getElementById('btn-download-img')?.addEventListener('click', () => {
        showToast('Image downloaded');
    });

    document.getElementById('btn-thumbup')?.addEventListener('click', () => {
        showToast('Thanks for the feedback!');
    });

    document.getElementById('btn-thumbdown')?.addEventListener('click', () => {
        showToast('Thanks for the feedback!');
    });

    document.getElementById('btn-share-response')?.addEventListener('click', () => {
        showToast('Share response');
    });

    document.getElementById('btn-copy-response')?.addEventListener('click', () => {
        showToast('Response copied');
    });


    // ==========================================================================
    // SHARED SUBTOOL CONTROLLERS
    // Surface-agnostic factory for Effects sub-tools (Remove BG, Lighting,
    // Portrait, Erase). Pass a config object describing the surface; get back
    // a controller with handleEffectsSubtool(subtoolId) and panel open/close fns.
    //
    // cfg = {
    //   getImage()          → <img> element for this surface
    //   getContainer()      → loading-spinner container element
    //   lightingPanelId     → id of the lighting panel element
    //   portraitPanelId     → id of the portrait panel element
    //   lightingPrefix      → id prefix for lighting sliders, e.g. 'lighting' or 'music-lighting'
    //   portraitPrefix      → id prefix for portrait sliders, e.g. 'portrait' or 'music-portrait'
    //   enterErase()        → fn to enter erase mode for this surface
    //   onImageUpdated(newSrc, effectName)  → fn called after a successful API edit
    //                                         (push undo, sync secondary images, etc.)
    //   hideUI()            → fn to hide appbar/tools when a panel opens
    //   restoreUI()         → fn to restore appbar/tools when a panel closes
    //   hideEffectsSubtools()  → fn to hide the effects subtools row
    //   showEffectsSubtools()  → fn to show the effects subtools row
    //   onLoadingStart()    → optional fn called when API call starts
    //   onLoadingEnd()      → optional fn called when API call ends
    // }
    // ==========================================================================
    function createEffectsController(cfg) {
        let lightingActive = false;
        let lightingPos = { x: 50, y: 30 };
        let lightingSourceEl = null;
        let lightingOverlayEl = null;
        let portraitActive = false;

        // ── Helpers ──────────────────────────────────────────────────────────
        function slider(name) { return document.getElementById(`${cfg.lightingPrefix}-${name}`); }
        function sliderVal(name) { return document.getElementById(`${cfg.lightingPrefix}-${name}-val`); }
        function pSlider(name) { return document.getElementById(`${cfg.portraitPrefix}-${name}`); }
        function pSliderVal(name) { return document.getElementById(`${cfg.portraitPrefix}-${name}-val`); }
        function lightingPanel() { return document.getElementById(cfg.lightingPanelId); }
        function portraitPanel() { return document.getElementById(cfg.portraitPanelId); }

        // ── Lighting panel ────────────────────────────────────────────────────
        function openLighting() {
            const panel = lightingPanel();
            if (!panel) return;
            lightingActive = true;
            panel.hidden = false;
            cfg.hideUI();
            cfg.hideEffectsSubtools();

            // Reset sliders
            const defaults = { intensity: 60, warmth: 50, ambient: 40, exposure: 50, shadows: 50, highlights: 50, contrast: 50 };
            for (const [name, val] of Object.entries(defaults)) {
                const s = slider(name); const v = sliderVal(name);
                if (s) s.value = val; if (v) v.textContent = val;
            }
            panel.querySelectorAll('.lighting-dir-btn').forEach(b => b.classList.remove('active'));
            panel.querySelector('.lighting-dir-btn[data-dir="center"]')?.classList.add('active');
            lightingPos = { x: 50, y: 30 };
            createLightingSource();
            updateLightingPreview();
            showToast('Drag the light source on the image');
        }

        function closeLighting() {
            const panel = lightingPanel();
            if (panel) panel.hidden = true;
            lightingActive = false;
            removeLightingSource();
            removeLightingOverlay();
            const img = cfg.getImage();
            if (img) img.style.filter = '';
            cfg.restoreUI();
            cfg.showEffectsSubtools();
        }

        function updateLightingPreview() {
            if (!lightingActive) return;
            const img = cfg.getImage();
            if (!img) return;
            if (!lightingOverlayEl) createLightingOverlay();

            const intensity = parseInt(slider('intensity')?.value || 60);
            const warmth = parseInt(slider('warmth')?.value || 50);
            const ambient = parseInt(slider('ambient')?.value || 40);
            const exposure = parseInt(slider('exposure')?.value || 50);
            const shadows = parseInt(slider('shadows')?.value || 50);
            const highlights = parseInt(slider('highlights')?.value || 50);
            const contrast = parseInt(slider('contrast')?.value || 50);

            const brightnessVal = 0.7 + (exposure / 100) * 0.8;
            const contrastVal = 0.8 + (contrast / 100) * 0.6;
            const saturateVal = 0.8 + (warmth / 100) * 0.6;
            const ambientBright = 0.85 + (ambient / 100) * 0.3;
            img.style.filter = `brightness(${brightnessVal * ambientBright}) contrast(${contrastVal}) saturate(${saturateVal})`;

            if (lightingOverlayEl) {
                const intensityAlpha = (intensity / 100) * 0.6;
                const warmthR = Math.round(255 * (warmth / 100));
                const warmthG = Math.round(200 * (1 - warmth / 100));
                const warmthB = Math.round(100 * (1 - warmth / 100));
                const shadowAlpha = (shadows / 100) * 0.3;
                lightingOverlayEl.style.background =
                    `radial-gradient(circle at ${lightingPos.x}% ${lightingPos.y}%, ` +
                    `rgba(${warmthR},${warmthG},${warmthB},${intensityAlpha}) 0%, ` +
                    `rgba(0,0,0,${shadowAlpha}) 100%)`;
            }
        }

        function createLightingSource() {
            removeLightingSource();
            const img = cfg.getImage();
            if (!img) return;
            const container = img.parentElement;
            lightingSourceEl = document.createElement('div');
            lightingSourceEl.className = 'lighting-source';
            lightingSourceEl.style.left = lightingPos.x + '%';
            lightingSourceEl.style.top = lightingPos.y + '%';
            container.appendChild(lightingSourceEl);

            lightingSourceEl.addEventListener('pointerdown', e => {
                e.preventDefault();
                const move = ev => {
                    const rect = container.getBoundingClientRect();
                    lightingPos.x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                    lightingPos.y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
                    lightingSourceEl.style.left = lightingPos.x + '%';
                    lightingSourceEl.style.top = lightingPos.y + '%';
                    updateLightingPreview();
                };
                const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
            });
        }

        function removeLightingSource() {
            if (lightingSourceEl) { lightingSourceEl.remove(); lightingSourceEl = null; }
        }

        function createLightingOverlay() {
            removeLightingOverlay();
            const img = cfg.getImage();
            if (!img) return;
            lightingOverlayEl = document.createElement('div');
            lightingOverlayEl.className = 'lighting-overlay';
            img.parentElement.appendChild(lightingOverlayEl);
        }

        function removeLightingOverlay() {
            if (lightingOverlayEl) { lightingOverlayEl.remove(); lightingOverlayEl = null; }
        }

        async function applyLighting() {
            const intensity = parseInt(slider('intensity')?.value || 60);
            const warmth = parseInt(slider('warmth')?.value || 50);
            const ambient = parseInt(slider('ambient')?.value || 40);
            const exposure = parseInt(slider('exposure')?.value || 50);
            const shadows = parseInt(slider('shadows')?.value || 50);
            const highlights = parseInt(slider('highlights')?.value || 50);
            const contrast = parseInt(slider('contrast')?.value || 50);

            const img = cfg.getImage();
            if (img) img.style.filter = '';
            closeLighting();

            const container = cfg.getContainer();
            if (container) container.classList.add('edit-loading');
            startParticles(img);
            showToast('Applying lighting...');
            const ac = createAbortController();
            const previousSrc = img?.src;

            try {
                const imageBase64 = await imgSrcToBase64(img);
                const intensityDesc = intensity > 66 ? 'dramatic' : intensity > 33 ? 'moderate' : 'subtle';
                const warmthDesc = warmth > 60 ? 'warm golden' : warmth < 40 ? 'cool blue' : 'neutral';
                const shadowsDesc = shadows > 60 ? 'deep' : shadows < 40 ? 'lifted' : 'natural';
                const highlightsDesc = highlights > 60 ? 'bright' : highlights < 40 ? 'muted' : 'balanced';
                const dirBtn = lightingPanel()?.querySelector('.lighting-dir-btn.active');
                const dir = dirBtn?.dataset.dir || 'center';
                const dirMap = { 'top-left': 'upper-left', 'top': 'top', 'top-right': 'upper-right', 'left': 'left', 'center': 'center', 'right': 'right', 'bottom-left': 'lower-left', 'bottom': 'bottom', 'bottom-right': 'lower-right' };
                const dirDesc = dirMap[dir] || 'center';

                const editPrompt = `Relight this image with ${intensityDesc} ${warmthDesc} lighting coming from the ${dirDesc}. ` +
                    `Ambient light level: ${ambient > 60 ? 'bright fill light' : ambient < 40 ? 'dark moody' : 'natural ambient'}. ` +
                    `Shadows should be ${shadowsDesc}, highlights should be ${highlightsDesc}. ` +
                    `Exposure: ${exposure > 60 ? 'slightly overexposed' : exposure < 40 ? 'slightly underexposed' : 'correct'}. ` +
                    `Contrast: ${contrast > 60 ? 'high contrast' : contrast < 40 ? 'low contrast' : 'natural'}. ` +
                    `Preserve the subject and composition exactly. Only change the lighting.`;

                const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);
                img.style.transition = 'opacity 0.3s ease';
                img.style.opacity = '0';
                await new Promise(r => setTimeout(r, 300));
                img.src = newDataUrl;
                img.style.opacity = '1';
                cfg.onImageUpdated(newDataUrl, 'lighting', previousSrc);
                showToast('Lighting applied');
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('[Effects] Lighting error:', err);
                showToast('Lighting failed: ' + err.message);
            } finally {
                if (container) container.classList.remove('edit-loading');
                stopParticles();
                vortexCenter = null;
            }
        }

        // ── Portrait panel ────────────────────────────────────────────────────
        function openPortrait() {
            const panel = portraitPanel();
            if (!panel) return;
            portraitActive = true;
            panel.hidden = false;
            cfg.hideUI();
            cfg.hideEffectsSubtools();

            const defaults = { depth: 60, bokeh: 50, halation: 35, vignette: 40 };
            for (const [name, val] of Object.entries(defaults)) {
                const s = pSlider(name); const v = pSliderVal(name);
                if (s) s.value = val; if (v) v.textContent = val;
            }
            updatePortraitPreview();
            showToast('Adjust portrait settings');
        }

        function closePortrait() {
            const panel = portraitPanel();
            if (panel) panel.hidden = true;
            portraitActive = false;
            const img = cfg.getImage();
            if (img) img.style.filter = '';
            cfg.restoreUI();
            cfg.showEffectsSubtools();
        }

        function updatePortraitPreview() {
            if (!portraitActive) return;
            const img = cfg.getImage();
            if (!img) return;
            const depth = parseInt(pSlider('depth')?.value || 60);
            const bokeh = parseInt(pSlider('bokeh')?.value || 50);
            const halation = parseInt(pSlider('halation')?.value || 35);
            const vignette = parseInt(pSlider('vignette')?.value || 40);
            const blurPx = (depth / 100) * 6;
            const brightness = 1 + (halation / 100) * 0.15;
            const saturate = 1 + (bokeh / 100) * 0.3;
            const contrastVal = 1 + (vignette / 100) * 0.2;
            img.style.filter = `blur(${blurPx * 0.3}px) brightness(${brightness}) saturate(${saturate}) contrast(${contrastVal})`;
        }

        async function applyPortrait() {
            const depth = parseInt(pSlider('depth')?.value || 60);
            const bokeh = parseInt(pSlider('bokeh')?.value || 50);
            const halation = parseInt(pSlider('halation')?.value || 35);
            const vignette = parseInt(pSlider('vignette')?.value || 40);

            const img = cfg.getImage();
            if (img) img.style.filter = '';
            closePortrait();

            const container = cfg.getContainer();
            if (container) container.classList.add('edit-loading');
            startParticles(img);
            showToast('Applying portrait mode...');
            const ac = createAbortController();
            const previousSrc = img?.src;

            try {
                const imageBase64 = await imgSrcToBase64(img);
                const depthDesc = depth > 66 ? 'very strong' : depth > 33 ? 'moderate' : 'subtle';
                const bokehDesc = bokeh > 66 ? 'creamy, swirling' : bokeh > 33 ? 'soft circular' : 'gentle';
                const editPrompt =
                    `Apply a professional portrait mode effect. Add a ${depthDesc} depth-of-field blur to the background while keeping the main subject in sharp focus. ` +
                    `The bokeh should be ${bokehDesc}. ` +
                    (halation > 40 ? 'Add a gentle halation glow around bright highlights. ' : '') +
                    (vignette > 30 ? 'Add a subtle vignette to the edges. ' : '') +
                    `Keep the subject perfectly sharp and detailed.`;

                const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);
                img.style.transition = 'opacity 0.3s ease';
                img.style.opacity = '0';
                await new Promise(r => setTimeout(r, 300));
                img.src = newDataUrl;
                img.style.opacity = '1';
                cfg.onImageUpdated(newDataUrl, 'portrait', previousSrc);
                showToast('Portrait mode applied');
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('[Effects] Portrait error:', err);
                showToast('Portrait mode failed: ' + err.message);
            } finally {
                if (container) container.classList.remove('edit-loading');
                stopParticles();
                vortexCenter = null;
            }
        }

        // ── Remove Background ─────────────────────────────────────────────────
        async function applyRemoveBg() {
            const img = cfg.getImage();
            const container = cfg.getContainer();
            vortexCenter = null;
            if (container) container.classList.add('edit-loading');
            startParticles(img);
            showToast('Removing background...');
            const ac = createAbortController();
            const previousSrc = img?.src;

            try {
                const imageBase64 = await imgSrcToBase64(img);
                const editPrompt = 'Remove the background from this image completely. Keep only the main subject with a transparent or pure white background. Preserve all details of the subject.';
                const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);

                if (container) container.classList.remove('edit-loading');
                img.classList.add('dissolve-out');
                await new Promise(r => setTimeout(r, 600));
                img.classList.remove('dissolve-out');
                img.classList.add('dissolve-in');
                img.src = newDataUrl;
                await new Promise(r => { img.onload = r; setTimeout(r, 200); });
                requestAnimationFrame(() => img.classList.add('reveal'));
                await new Promise(r => setTimeout(r, 600));
                img.classList.remove('dissolve-in', 'reveal');

                cfg.onImageUpdated(newDataUrl, 'removebg', previousSrc);
                showToast('Background removed');
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('[Effects] Remove BG error:', err);
                showToast('Remove background failed: ' + err.message);
                img?.classList.remove('dissolve-out', 'dissolve-in', 'reveal');
            } finally {
                if (container) container.classList.remove('edit-loading');
                stopParticles();
                vortexCenter = null;
            }
        }

        // ── Wire up panel buttons ─────────────────────────────────────────────
        function init() {
            // Lighting sliders
            ['intensity', 'warmth', 'ambient', 'exposure', 'shadows', 'highlights', 'contrast'].forEach(name => {
                const s = slider(name); const v = sliderVal(name);
                if (s && v) s.addEventListener('input', () => { v.textContent = s.value; updateLightingPreview(); });
            });
            // Lighting direction buttons
            const lPanel = lightingPanel();
            if (lPanel) {
                const dirMap = { 'top-left': { x: 15, y: 15 }, 'top': { x: 50, y: 10 }, 'top-right': { x: 85, y: 15 }, 'left': { x: 10, y: 50 }, 'center': { x: 50, y: 30 }, 'right': { x: 90, y: 50 }, 'bottom-left': { x: 15, y: 85 }, 'bottom': { x: 50, y: 90 }, 'bottom-right': { x: 85, y: 85 } };
                lPanel.querySelectorAll('.lighting-dir-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        lPanel.querySelectorAll('.lighting-dir-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const pos = dirMap[btn.dataset.dir];
                        if (pos) { lightingPos = { ...pos }; if (lightingSourceEl) { lightingSourceEl.style.left = lightingPos.x + '%'; lightingSourceEl.style.top = lightingPos.y + '%'; } updateLightingPreview(); }
                    });
                });
                lPanel.querySelector(`#${cfg.lightingPrefix}-close-btn`)?.addEventListener('click', closeLighting);
                lPanel.querySelector(`#${cfg.lightingPrefix}-apply-btn`)?.addEventListener('click', applyLighting);
            }
            // Portrait sliders
            ['depth', 'bokeh', 'halation', 'vignette'].forEach(name => {
                const s = pSlider(name); const v = pSliderVal(name);
                if (s && v) s.addEventListener('input', () => { v.textContent = s.value; updatePortraitPreview(); });
            });
            const pPanel = portraitPanel();
            if (pPanel) {
                pPanel.querySelector(`#${cfg.portraitPrefix}-close-btn`)?.addEventListener('click', closePortrait);
                pPanel.querySelector(`#${cfg.portraitPrefix}-apply-btn`)?.addEventListener('click', applyPortrait);
            }
        }

        // ── Public API ────────────────────────────────────────────────────────
        return {
            init,
            openLighting,
            closeLighting,
            openPortrait,
            closePortrait,
            async handleEffectsSubtool(subtoolId) {
                if (subtoolId === 'erase') { cfg.enterErase(); return; }
                if (subtoolId === 'removebg') { await applyRemoveBg(); return; }
                if (subtoolId === 'lighting') { openLighting(); return; }
                if (subtoolId === 'portrait') { openPortrait(); return; }
            }
        };
    }

    // ---------- Edit Modal ----------

    const editModal = document.getElementById('edit-modal');
    const editModalImage = document.getElementById('edit-modal-image');
    const editTools = editModal.querySelectorAll('.edit-modal__tool');
    const editImageOverlay = document.getElementById('edit-image-overlay');
    const editUndoBtn = document.getElementById('edit-undo-btn');
    const editRedoBtn = document.getElementById('edit-redo-btn');
    const drawCanvas = document.getElementById('edit-draw-canvas');
    const drawCtx = drawCanvas.getContext('2d');

    // --- Erase Tool (image editor) ---
    const eraseCanvas = document.getElementById('edit-erase-canvas');
    const eraseCtx = eraseCanvas ? eraseCanvas.getContext('2d') : null;
    let eraseMode = false;
    let eraseDrawing = false;
    let erasePoints = [];
    const ERASE_BRUSH_RADIUS = 24;

    function sizeEraseCanvas() {
        if (!eraseCanvas || !editModalImage) return;
        const rect = editModalImage.getBoundingClientRect();
        const container = drawCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        eraseCanvas.width = containerRect.width;
        eraseCanvas.height = containerRect.height;
        eraseCanvas.style.left = '0px';
        eraseCanvas.style.top = '0px';
        eraseCanvas.style.width = containerRect.width + 'px';
        eraseCanvas.style.height = containerRect.height + 'px';
    }

    function drawEraseBrush(x, y, isPreview) {
        if (!eraseCtx) return;
        eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);

        eraseCtx.save();

        // Draw all accumulated erase points as checkerboard circles
        const R = ERASE_BRUSH_RADIUS;
        const CELL = 8; // checkerboard cell size in px
        // Slow diagonal drift — cycles every 3s
        const drift = (performance.now() / 3000 * CELL) % CELL;

        for (const pt of erasePoints) {
            eraseCtx.save();
            // Clip to circle
            eraseCtx.beginPath();
            eraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            eraseCtx.clip();

            // Draw animated checkerboard inside the circle
            const x0 = Math.floor((pt.x - R - drift) / CELL) * CELL + drift;
            const y0 = Math.floor((pt.y - R - drift) / CELL) * CELL + drift;
            for (let cx = x0; cx < pt.x + R; cx += CELL) {
                for (let cy = y0; cy < pt.y + R; cy += CELL) {
                    const col = Math.floor((cx - drift) / CELL) + Math.floor((cy - drift) / CELL);
                    eraseCtx.fillStyle = col % 2 === 0 ? 'rgba(180,180,180,0.5)' : 'rgba(255,255,255,0.5)';
                    eraseCtx.fillRect(cx, cy, CELL, CELL);
                }
            }
            // Red tint at 50% opacity on top
            eraseCtx.fillStyle = 'rgba(239,68,68,0.5)';
            eraseCtx.beginPath();
            eraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            eraseCtx.fill();
            eraseCtx.restore();
        }

        // Draw cursor ring at current position (white with dark outline)
        eraseCtx.beginPath();
        eraseCtx.arc(x, y, R, 0, Math.PI * 2);
        eraseCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        eraseCtx.lineWidth = 3;
        eraseCtx.stroke();
        eraseCtx.beginPath();
        eraseCtx.arc(x, y, R, 0, Math.PI * 2);
        eraseCtx.strokeStyle = 'rgba(255,255,255,0.9)';
        eraseCtx.lineWidth = 1.5;
        eraseCtx.stroke();

        eraseCtx.restore();
    }
    // Draw only the accumulated erase points (no cursor ring) — used on pointer leave and during loading
    function drawErasePointsOnly() {
        if (!eraseCtx) return;
        eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);
        if (erasePoints.length === 0) return;
        const R = ERASE_BRUSH_RADIUS;
        const CELL = 8;
        const drift = (performance.now() / 3000 * CELL) % CELL;
        for (const pt of erasePoints) {
            eraseCtx.save();
            eraseCtx.beginPath();
            eraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            eraseCtx.clip();
            // Animated checkerboard
            const x0 = Math.floor((pt.x - R - drift) / CELL) * CELL + drift;
            const y0 = Math.floor((pt.y - R - drift) / CELL) * CELL + drift;
            for (let cx = x0; cx < pt.x + R; cx += CELL) {
                for (let cy = y0; cy < pt.y + R; cy += CELL) {
                    const col = Math.floor((cx - drift) / CELL) + Math.floor((cy - drift) / CELL);
                    eraseCtx.fillStyle = col % 2 === 0 ? 'rgba(180,180,180,0.5)' : 'rgba(255,255,255,0.5)';
                    eraseCtx.fillRect(cx, cy, CELL, CELL);
                }
            }
            // Red tint at 50% opacity on top
            eraseCtx.fillStyle = 'rgba(239,68,68,0.5)';
            eraseCtx.beginPath();
            eraseCtx.arc(pt.x, pt.y, R, 0, Math.PI * 2);
            eraseCtx.fill();
            eraseCtx.restore();
        }
    }


    function getEraseCanvasPos(e) {
        const rect = eraseCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(clientX - rect.left, eraseCanvas.width)),
            y: Math.max(0, Math.min(clientY - rect.top, eraseCanvas.height))
        };
    }

    function enterEraseMode() {
        eraseMode = true;
        erasePoints = [];
        sizeEraseCanvas();
        eraseCanvas.hidden = false;
        drawCanvas.style.pointerEvents = 'none';
        editModalImage.closest('.edit-modal__canvas').classList.add('erase-mode');

        // Show sub-tool navbar
        const cancelBtn = document.getElementById('edit-cancel-btn');
        const closeBtn = document.getElementById('edit-close-btn');
        const appbarCenter = editModal.querySelector('.edit-modal__appbar-center');
        const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
        const doneTopBtn = document.getElementById('edit-done-top-btn');
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (closeBtn) closeBtn.hidden = true;
        if (cancelBtn) { cancelBtn.hidden = false; cancelBtn.style.display = ''; cancelBtn.textContent = 'Cancel'; }
        if (appbarCenter) appbarCenter.hidden = true;
        if (appbarActions) appbarActions.hidden = false;
        if (doneTopBtn) doneTopBtn.style.display = 'none';
        if (subtoolDoneBtn) { subtoolDoneBtn.hidden = false; subtoolDoneBtn.style.display = ''; subtoolDoneBtn.textContent = 'Done'; subtoolDoneBtn.classList.add('disabled'); }
    }

    function exitEraseMode() {
        eraseMode = false;
        erasePoints = [];
        if (eraseCtx) eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);
        eraseCanvas.hidden = true;
        drawCanvas.style.pointerEvents = '';
        editModalImage.closest('.edit-modal__canvas').classList.remove('erase-mode');
        enterStarterPage();
    }

    async function applyEraseToImage() {
        if (erasePoints.length === 0) return;
        const previousSrc = editModalImage.src;

        // Build a mask image: white on black where user painted
        const offscreen = document.createElement('canvas');
        offscreen.width = editModalImage.naturalWidth;
        offscreen.height = editModalImage.naturalHeight;
        const offCtx = offscreen.getContext('2d');

        // Scale factor from canvas display coords to natural image coords
        const scaleX = editModalImage.naturalWidth / eraseCanvas.width;
        const scaleY = editModalImage.naturalHeight / eraseCanvas.height;

        offCtx.fillStyle = '#000';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        offCtx.fillStyle = '#fff';
        for (const pt of erasePoints) {
            offCtx.beginPath();
            offCtx.arc(pt.x * scaleX, pt.y * scaleY, ERASE_BRUSH_RADIUS * Math.max(scaleX, scaleY), 0, Math.PI * 2);
            offCtx.fill();
        }

        // Set particle vortex to centroid of painted erase region
        if (erasePoints.length > 0) {
            let sumX = 0, sumY = 0;
            for (const pt of erasePoints) { sumX += pt.x; sumY += pt.y; }
            vortexCenter = { x: sumX / erasePoints.length, y: sumY / erasePoints.length };
        } else {
            vortexCenter = null;
        }

        // Show loading state + particles
        const canvasContainer = editModalImage.closest('.edit-modal__canvas');
        canvasContainer.classList.add('edit-loading');
        startParticles();
        showToast('Erasing selected area...');


        const ac = createAbortController();
        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const maskBase64 = offscreen.toDataURL('image/png').split(',')[1];
            const editPrompt = `The second image is a binary mask (white = erase, black = keep). Remove the object(s) in the white region completely and reconstruct the background naturally.

ERASE RULES:
1. COMPLETE REMOVAL — Every pixel of the masked object must be gone. No ghostly outlines, faint traces, shadows, or color residue from the original object.
2. NATURAL RECONSTRUCTION — Fill the erased area with what would logically be behind the object: continue floor tiles, wall textures, sky gradients, foliage, or whatever the surrounding context implies. Match perspective, vanishing points, and scale.
3. SEAMLESS TEXTURE — The reconstructed area must have identical texture, grain, noise, and pattern density as the surrounding image. No blurring, smearing, or smoothing that differs from the rest of the image.
4. LIGHTING CONTINUITY — Shadows, highlights, and light gradients must flow naturally through the reconstructed area. Remove any shadows that were cast BY the erased object. Preserve shadows cast by other objects.
5. PRESERVE EVERYTHING ELSE — All pixels outside the white mask region must remain exactly unchanged.`;
            const newDataUrl = await eraseWithGemini(imageBase64, maskBase64, editPrompt, ac.signal);

            editModalImage.src = newDataUrl;
            responseImageImg.src = newDataUrl;

            pushEditAction({ type: 'effect', name: 'Erase', previousSrc, newSrc: newDataUrl });
            showToast('Area erased');

            // Enable Done
            const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
            if (subtoolDoneBtn) subtoolDoneBtn.classList.remove('disabled');
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Erase error:', err);
            showToast('Erase failed: ' + err.message);
        } finally {
            canvasContainer.classList.remove('edit-loading');
            stopParticles();
            vortexCenter = null;
            // Clear brush strokes after apply
            erasePoints = [];
            if (eraseCtx) eraseCtx.clearRect(0, 0, eraseCanvas.width, eraseCanvas.height);
        }
    }

    // Erase canvas pointer events
    if (eraseCanvas) {
        eraseCanvas.addEventListener('pointerdown', (e) => {
            if (!eraseMode) return;
            e.preventDefault();
            eraseDrawing = true;
            const pos = getEraseCanvasPos(e);
            erasePoints.push(pos);
            drawEraseBrush(pos.x, pos.y, false);
        });
        eraseCanvas.addEventListener('pointermove', (e) => {
            if (!eraseMode) return;
            e.preventDefault();
            const pos = getEraseCanvasPos(e);
            if (eraseDrawing) {
                // Only add point if moved enough (avoid duplicates)
                const last = erasePoints[erasePoints.length - 1];
                if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) > ERASE_BRUSH_RADIUS * 0.5) {
                    erasePoints.push(pos);
                }
            }
            drawEraseBrush(pos.x, pos.y, !eraseDrawing);
        });
        eraseCanvas.addEventListener('pointerup', async (e) => {
            if (!eraseMode || !eraseDrawing) return;
            e.preventDefault();
            eraseDrawing = false;
            // Keep checkerboard visible (without cursor ring) while API processes
            drawErasePointsOnly();
            await applyEraseToImage();
        });
        eraseCanvas.addEventListener('pointerleave', (e) => {
            if (eraseMode && eraseCtx) {
                // Redraw accumulated points as checkerboard without cursor ring
                drawErasePointsOnly();
            }
        });
    }

    let editUndoStack = [];
    let editRedoStack = [];
    let isDrawing = false;
    let currentStroke = [];
    let allStrokes = [];
    let originalImageSrc = null; // Store original image for Resize "Original" revert
    let detectedOriginalText = null; // Store text detected by Text tool for replacement
    let activeTextToolMode = false; // Whether Text tool is in tap-to-detect mode

    // Floating text overlay (draggable text extracted from marquee)
    let floatingTextEl = null;
    let floatingTextPos = null; // { x, y, w, h } in canvas coordinates
    let floatingTextDrag = { active: false, offsetX: 0, offsetY: 0 };
    let doodleTrashEl = null; // Trash icon for closed doodle shapes

    // Tap-to-place text cursor (Text tool)
    let textCursorEl = null;     // Blinking cursor element
    let textPreviewEl = null;    // Live text preview element
    let textCursorPos = null;    // { x, y } in canvas coordinates

    // Text highlight overlays (auto-detected text regions)
    let textHighlightEls = [];   // Array of highlight DOM elements
    let detectedTextRegions = []; // Array of { text, bounds: { x1, y1, x2, y2 } } in percentages



    // --- Persistent education overlay ---
    const EDUCATION_DISMISSED_KEY = 'edit_education_dismissed';

    function isEducationDismissed() {
        return localStorage.getItem(EDUCATION_DISMISSED_KEY) === 'true';
    }

    function dismissEducation() {
        localStorage.setItem(EDUCATION_DISMISSED_KEY, 'true');
        editImageOverlay.classList.add('hidden');
    }

    // --- Edit Modal Cancel During Loading ---
    let editLoadingCancelHandler = null;

    function showEditLoadingCancel(onCancel) {
        const cancelBtn = document.getElementById('edit-cancel-btn');
        const closeBtn = document.getElementById('edit-close-btn');
        const doneBtn = document.getElementById('edit-done-top-btn');
        const subtoolDone = document.getElementById('edit-subtool-done-btn');
        const appbarCenter = editModal.querySelector('.edit-modal__appbar-center');

        // Show Cancel, hide other nav items
        if (cancelBtn) {
            cancelBtn.hidden = false;
            cancelBtn.textContent = 'Cancel';
        }
        if (closeBtn) closeBtn.hidden = true;
        if (appbarCenter) appbarCenter.hidden = true;
        if (doneBtn) doneBtn.style.display = 'none';
        if (subtoolDone) { subtoolDone.hidden = true; subtoolDone.style.display = 'none'; }

        // Remove previous handler if any
        if (editLoadingCancelHandler) {
            cancelBtn.removeEventListener('click', editLoadingCancelHandler);
        }
        editLoadingCancelHandler = () => {
            cancelActiveRequest();
            hideEditLoadingCancel();
            // Clean up loading state
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
            showToast('Cancelled');
            if (onCancel) onCancel();
        };
        cancelBtn.addEventListener('click', editLoadingCancelHandler);
    }

    function hideEditLoadingCancel() {
        const cancelBtn = document.getElementById('edit-cancel-btn');
        if (cancelBtn && editLoadingCancelHandler) {
            cancelBtn.removeEventListener('click', editLoadingCancelHandler);
            editLoadingCancelHandler = null;
        }
        if (cancelBtn) cancelBtn.hidden = true;
    }

    const editPillDoneRow = document.getElementById('edit-pill-done-row');
    const editPillDoneBtn = document.getElementById('edit-pill-done-btn');
    const editCloseBtn = document.getElementById('edit-close-btn');
    const editAppbarCenter = editModal.querySelector('.edit-modal__appbar-center');
    const editDoneTopBtn = document.getElementById('edit-done-top-btn');
    const editCancelBtn = document.getElementById('edit-cancel-btn');

    function isToolActive() {
        return !!editModal.querySelector('.edit-modal__tool.active');
    }

    function updateUndoRedoState() {
        editUndoBtn.disabled = editUndoStack.length === 0;
        editRedoBtn.disabled = editRedoStack.length === 0;
        const hasEdits = editUndoStack.length > 0;

        // Done pill row — always hidden (appbar Done/Save handles this)
        if (editPillDoneRow) {
            editPillDoneRow.hidden = true;
        }

        // Save/Done button visibility
        if (editDoneTopBtn) {
            const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
            const doneVisible = subtoolDoneBtn && !subtoolDoneBtn.hidden;
            const toolActive = isToolActive();
            // Hide when a deeper subtool Done button is showing (erase/lighting/portrait)
            if (lightingActive || portraitActive || doneVisible) {
                editDoneTopBtn.style.display = 'none';
            } else if (toolActive) {
                // Subtool mode: show 'Done'
                editDoneTopBtn.textContent = 'Done';
                editDoneTopBtn.style.display = '';
                editDoneTopBtn.style.visibility = 'visible';
                editDoneTopBtn.classList.remove('disabled');
            } else {
                // Summary mode: show 'Save' (disabled until edits exist)
                editDoneTopBtn.textContent = 'Save';
                editDoneTopBtn.style.display = '';
                editDoneTopBtn.style.visibility = 'visible';
                if (hasEdits) {
                    editDoneTopBtn.classList.remove('disabled');
                } else {
                    editDoneTopBtn.classList.add('disabled');
                }
            }
        }
    }

    // Disable other tools when doodle strokes exist on canvas or Resize/Effects is active
    function updateToolButtonStates() {
        const hasStrokes = allStrokes.length > 0;
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const activeToolId = activeToolEl?.dataset.tool;
        const isSelectOrText = activeToolId === 'select' || activeToolId === 'text';
        const isResizeOrEffects = activeToolId === 'resize' || activeToolId === 'effects';
        const shouldDisableOthers = (isSelectOrText && hasStrokes) || isResizeOrEffects;

        editTools.forEach(tool => {
            const toolId = tool.dataset.tool;
            if (toolId === activeToolId) return; // Don't disable the active tool
            tool.disabled = shouldDisableOthers;
            tool.style.opacity = shouldDisableOthers ? '0.3' : '';
            tool.style.pointerEvents = shouldDisableOthers ? 'none' : '';
        });

        // Show Cancel button when Select or Text tool active, or Resize/Effects active
        if (editCancelBtn) {
            const showCancel = activeToolId === 'select' ||
                activeToolId === 'text' ||
                isResizeOrEffects;
            editCancelBtn.hidden = !showCancel;
            editCancelBtn.style.display = showCancel ? '' : 'none';
        }
    }

    function pushEditAction(action) {
        editUndoStack.push(action);
        editRedoStack = [];
        updateUndoRedoState();
    }

    // --- Drawing Canvas ---
    function sizeDrawCanvas() {
        const img = editModalImage;
        if (!img.naturalWidth) return;
        const canvasContainer = drawCanvas.parentElement;
        const containerRect = canvasContainer.getBoundingClientRect();
        drawCanvas.width = containerRect.width;
        drawCanvas.height = containerRect.height;
        drawCanvas.style.left = '0px';
        drawCanvas.style.top = '0px';
        drawCanvas.style.width = containerRect.width + 'px';
        drawCanvas.style.height = containerRect.height + 'px';
        // Size particle canvas to match
        if (particleCanvas) {
            particleCanvas.width = containerRect.width;
            particleCanvas.height = containerRect.height;
            particleCanvas.style.left = '0px';
            particleCanvas.style.top = '0px';
            particleCanvas.style.width = containerRect.width + 'px';
            particleCanvas.style.height = containerRect.height + 'px';
        }
        redrawStrokes();
        renderCanvas();
    }

    // ─── Ambient Particle Overlay (Loading State) ───
    const particleCanvas = document.getElementById('edit-particle-canvas');
    const pCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
    let particles = [];
    let particleAnimId = null;
    let particleFade = 0; // 0 = invisible, 1 = full
    let vortexCenter = null; // {x, y} in particle canvas coords, null = image center

    // Simple 2D noise approximation using sine harmonics
    function noise2D(x, y) {
        return (
            Math.sin(x * 1.2 + y * 0.9) * 0.5 +
            Math.sin(x * 0.7 - y * 1.3 + 2.1) * 0.3 +
            Math.sin(x * 2.1 + y * 0.4 - 1.7) * 0.2
        );
    }

    function createParticle(w, h, forceEdge) {
        const depth = Math.random();
        // Always spawn from edges for continuous inward flow
        let x, y;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = Math.random() * w; y = -2; }
        else if (side === 1) { x = w + 2; y = Math.random() * h; }
        else if (side === 2) { x = Math.random() * w; y = h + 2; }
        else { x = -2; y = Math.random() * h; }

        // For initial spawn, scatter some inside too
        if (!forceEdge && Math.random() < 0.5) {
            x = Math.random() * w;
            y = Math.random() * h;
        }

        return {
            x, y, depth,
            size: 0.8 + depth * 2 + Math.random() * 1.2,
            baseAlpha: 0.04 + depth * 0.09,
            noiseOffX: Math.random() * 1000,
            noiseOffY: Math.random() * 1000,
            orbitDir: Math.random() < 0.5 ? 1 : -1, // CW or CCW
            angularBase: 0.0015 + Math.random() * 0.003,
            shimmerCycle: 3000 + Math.random() * 8000,
            shimmerPhase: Math.random() * Math.PI * 2,
            birth: performance.now() + Math.random() * 1500,
        };
    }

    function respawnParticle(p, w, h) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { p.x = Math.random() * w; p.y = -2; }
        else if (side === 1) { p.x = w + 2; p.y = Math.random() * h; }
        else if (side === 2) { p.x = Math.random() * w; p.y = h + 2; }
        else { p.x = -2; p.y = Math.random() * h; }
        p.birth = performance.now();
        p.orbitDir = Math.random() < 0.5 ? 1 : -1;
    }

    function initParticles() {
        if (!particleCanvas) return;
        const w = particleCanvas.width || 400;
        const h = particleCanvas.height || 600;
        const count = Math.floor((w * h) / 85);
        particles = [];
        for (let i = 0; i < Math.min(count, 3600); i++) {
            particles.push(createParticle(w, h, false));
        }
    }

    function drawParticles(now) {
        if (!pCtx || !particleCanvas.width) return;
        const w = particleCanvas.width;
        const h = particleCanvas.height;
        const cx = vortexCenter ? vortexCenter.x : w / 2;
        const cy = vortexCenter ? vortexCenter.y : h / 2;
        const maxDist = Math.max(Math.sqrt(cx * cx + cy * cy), 1);

        pCtx.clearRect(0, 0, w, h);

        for (const p of particles) {
            const age = now - p.birth;
            if (age < 0) continue;
            const birthFade = Math.min(age / 800, 1);

            // Distance from center
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
            const normDist = dist / maxDist; // 0 = center, 1 = corner

            // Black hole gravity: pull increases as 1/dist (with soft limit)
            const gravity = 0.15 / (normDist + 0.05);

            // Angular velocity increases closer to center (Kepler-like)
            const angularVel = p.angularBase * p.orbitDir / (normDist + 0.1);

            // Apply orbital motion (tangential)
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle + Math.PI / 2) * angularVel * dist * 0.015;
            p.y += Math.sin(angle + Math.PI / 2) * angularVel * dist * 0.015;

            // Apply gravitational pull (radial inward)
            p.x -= (dx / dist) * gravity * 0.6;
            p.y -= (dy / dist) * gravity * 0.6;

            // Subtle noise wobble for organic feel
            const t = now * 0.00005;
            p.x += noise2D(p.noiseOffX + t, p.noiseOffY) * 0.15;
            p.y += noise2D(p.noiseOffY + t, p.noiseOffX) * 0.15;

            // Fade out near center (event horizon) — then respawn at edge
            const centerFade = Math.min(normDist * 3, 1); // fades below ~33% from center
            if (dist < 6) {
                respawnParticle(p, w, h);
                continue;
            }

            // Out of bounds — respawn
            if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
                respawnParticle(p, w, h);
                continue;
            }

            // Shimmer pulse
            const shimmerT = (now + p.shimmerPhase * 1000) / p.shimmerCycle;
            const shimmerWave = Math.pow(Math.max(0, Math.sin(shimmerT * Math.PI * 2)), 4);
            const shimmerBoost = shimmerWave * 0.12;

            // Final alpha — fades near center (event horizon)
            const alpha = (p.baseAlpha + shimmerBoost) * birthFade * particleFade * centerFade;
            if (alpha < 0.005) continue;

            // Draw crisp (no blur — particles sit above blurred image)
            pCtx.save();

            // Tight radial gradient — minimal glow
            const r = p.size * 1.2;
            const grad = pCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.3})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

            pCtx.fillStyle = grad;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
            pCtx.fill();

            // Core bright point for foreground particles
            if (p.depth > 0.5) {
                pCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
                pCtx.beginPath();
                pCtx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
                pCtx.fill();
            }

            pCtx.restore();
        }
    }

    function animateParticles(now) {
        drawParticles(now);
        particleAnimId = requestAnimationFrame(animateParticles);
    }

    function startParticles(targetImg) {
        if (!particleCanvas || particleAnimId) return;
        // Position particle canvas over the target image (default: editModalImage)
        const img = targetImg || editModalImage;
        const imgRect = img.getBoundingClientRect();
        const modalRect = (img.closest('.edit-modal') || img.closest('.music-edit__screen') || document.body).getBoundingClientRect();
        if (imgRect.width && imgRect.height) {
            particleCanvas.style.left = (imgRect.left - modalRect.left) + 'px';
            particleCanvas.style.top = (imgRect.top - modalRect.top) + 'px';
            particleCanvas.width = imgRect.width;
            particleCanvas.height = imgRect.height;
            particleCanvas.style.width = imgRect.width + 'px';
            particleCanvas.style.height = imgRect.height + 'px';
        }
        // vortexCenter is set directly before edit-loading starts
        // (draw canvas and particle canvas share the same coordinate space)
        initParticles();
        particleFade = 0;
        particleCanvas.classList.add('active');
        // Fade in
        const fadeIn = () => {
            particleFade = Math.min(particleFade + 0.02, 1);
            if (particleFade < 1 && particleAnimId) requestAnimationFrame(fadeIn);
        };
        requestAnimationFrame(fadeIn);
        particleAnimId = requestAnimationFrame(animateParticles);
    }

    function stopParticles() {
        if (!particleAnimId) return;
        particleCanvas.classList.remove('active');
        // Fade out gracefully
        const fadeOut = () => {
            particleFade = Math.max(particleFade - 0.015, 0);
            if (particleFade > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                cancelAnimationFrame(particleAnimId);
                particleAnimId = null;
                if (pCtx && particleCanvas.width) {
                    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
                }
                particles = [];
            }
        };
        requestAnimationFrame(fadeOut);
    }

    // Observe edit-loading class on canvas container to auto-start/stop
    const canvasContainerEl = editModalImage.closest('.edit-modal__canvas');
    if (canvasContainerEl) {
        const particleObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class') {
                    if (canvasContainerEl.classList.contains('edit-loading')) {
                        startParticles();
                    } else {
                        stopParticles();
                    }
                }
            }
        });
        particleObserver.observe(canvasContainerEl, { attributes: true });
    }

    // ─── Seamless Crossfade Helper ───
    // Smoothly transitions from loading blur → deep blur → swap src → cinematic unblur
    async function seamlessCrossfade(newDataUrl) {
        const cc = editModalImage.closest('.edit-modal__canvas');

        // Step 1: Freeze current blur state so removing animation doesn't cause a jump
        const computed = getComputedStyle(cc);
        const currentFilter = computed.filter || 'none';
        cc.style.filter = currentFilter;
        cc.classList.remove('edit-loading');

        // Force a reflow so the inline filter takes effect before transition
        void cc.offsetHeight;

        // Step 2: Deepen blur to mask the swap
        cc.classList.add('crossfade-blur');
        cc.style.filter = ''; // let CSS class take over with transition
        await new Promise(r => setTimeout(r, 650));

        // Step 3: Swap src while deeply blurred — the change is invisible
        editModalImage.src = newDataUrl;
        responseImageImg.src = newDataUrl;

        // Wait for image to actually load  
        await new Promise(r => {
            if (editModalImage.complete) { r(); return; }
            editModalImage.onload = r;
            setTimeout(r, 300); // fallback
        });

        // Step 4: Cinematic unblur reveal
        cc.classList.remove('crossfade-blur');
        cc.classList.add('crossfade-reveal');
        await new Promise(r => setTimeout(r, 1300));

        // Cleanup
        cc.classList.remove('crossfade-reveal');
        cc.style.filter = '';
        vortexCenter = null; // reset for next edit
    }

    // Set vortexCenter directly from current edit context.
    // Draw canvas and particle canvas share the same coordinate space,
    // so no scaling is needed.
    function setVortexFromEdit() {
        vortexCenter = null;
        try {
            // 1. Doodle strokes — centroid of all drawn points
            if (allStrokes && allStrokes.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                for (const stroke of allStrokes) {
                    if (Array.isArray(stroke)) {
                        for (const pt of stroke) {
                            sumX += pt.x; sumY += pt.y; count++;
                        }
                    } else if (stroke && stroke.bounds) {
                        const b = stroke.bounds;
                        sumX += b.x + b.w / 2; sumY += b.y + b.h / 2; count++;
                    }
                }
                if (count > 0) {
                    vortexCenter = { x: sumX / count, y: sumY / count };
                    console.log('[Vortex] doodle center:', vortexCenter);
                    return;
                }
            }

            // 2. Floating text position
            if (floatingTextPos) {
                vortexCenter = {
                    x: floatingTextPos.x + floatingTextPos.w / 2,
                    y: floatingTextPos.y + floatingTextPos.h / 2
                };
                console.log('[Vortex] text center:', vortexCenter);
                return;
            }

            // 3. Marquee selection
            if (marqueeSelection) {
                vortexCenter = {
                    x: marqueeSelection.x + marqueeSelection.w / 2,
                    y: marqueeSelection.y + marqueeSelection.h / 2
                };
                console.log('[Vortex] marquee center:', vortexCenter);
                return;
            }

            // 4. Lighting source (percentage → pixel)
            if (lightingActive && lightingPos) {
                vortexCenter = {
                    x: (lightingPos.x / 100) * drawCanvas.width,
                    y: (lightingPos.y / 100) * drawCanvas.height
                };
                console.log('[Vortex] lighting center:', vortexCenter);
                return;
            }

            console.log('[Vortex] no edit context, using image center');
        } catch (e) {
            console.warn('[Vortex] error:', e);
            vortexCenter = null;
        }
    }

    // --- Dynamic doodle color based on image contrast ---
    let doodleColors = ['#FF1493', '#FF00FF', '#FF69B4']; // default pink fallback
    let doodleShadowColor = 'rgba(0, 0, 0, 0.5)';

    function analyzeDoodleColor() {
        try {
            const img = editModalImage;
            if (!img || !img.naturalWidth) return;

            // Sample image at small size for performance
            const sampleCanvas = document.createElement('canvas');
            const sampleSize = 64;
            sampleCanvas.width = sampleSize;
            sampleCanvas.height = sampleSize;
            const sCtx = sampleCanvas.getContext('2d');
            sCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const data = sCtx.getImageData(0, 0, sampleSize, sampleSize).data;

            // Calculate average RGB and luminance
            let totalR = 0, totalG = 0, totalB = 0;
            const pixelCount = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                totalR += data[i];
                totalG += data[i + 1];
                totalB += data[i + 2];
            }
            const avgR = totalR / pixelCount;
            const avgG = totalG / pixelCount;
            const avgB = totalB / pixelCount;
            const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;

            // Calculate dominant hue
            const max = Math.max(avgR, avgG, avgB);
            const min = Math.min(avgR, avgG, avgB);
            let hue = 0;
            if (max !== min) {
                const d = max - min;
                if (max === avgR) hue = ((avgG - avgB) / d + (avgG < avgB ? 6 : 0)) * 60;
                else if (max === avgG) hue = ((avgB - avgR) / d + 2) * 60;
                else hue = ((avgR - avgG) / d + 4) * 60;
            }

            // Pick contrasting color palette based on luminance and hue
            if (luminance > 0.7) {
                // Light image → use deep, saturated dark colors
                if (hue >= 30 && hue < 90) {
                    // Warm/yellow image → deep indigo/purple
                    doodleColors = ['#4A00E0', '#7B2FF7', '#9B59B6'];
                } else if (hue >= 90 && hue < 200) {
                    // Green/cyan image → deep crimson/red
                    doodleColors = ['#DC143C', '#FF1744', '#E91E63'];
                } else {
                    // Blue/pink/red image → deep emerald/teal
                    doodleColors = ['#00695C', '#00897B', '#009688'];
                }
                doodleShadowColor = 'rgba(0, 0, 0, 0.3)';
            } else if (luminance < 0.35) {
                // Dark image → use bright, vivid colors
                if (hue >= 180 && hue < 300) {
                    // Cool/blue image → bright warm (cyan-to-lime)
                    doodleColors = ['#00E5FF', '#76FF03', '#00E676'];
                } else if (hue >= 30 && hue < 180) {
                    // Warm/green image → bright magenta/pink
                    doodleColors = ['#FF1493', '#FF00FF', '#FF69B4'];
                } else {
                    // Red/neutral image → bright cyan/electric blue
                    doodleColors = ['#00E5FF', '#18FFFF', '#00B0FF'];
                }
                doodleShadowColor = 'rgba(0, 0, 0, 0.6)';
            } else {
                // Mid-tone image → use bright, high-saturation accent
                if (hue >= 0 && hue < 60) {
                    // Red/orange image → bright cyan
                    doodleColors = ['#00BCD4', '#00E5FF', '#26C6DA'];
                } else if (hue >= 60 && hue < 180) {
                    // Yellow/green image → bright magenta
                    doodleColors = ['#E040FB', '#FF1493', '#FF4081'];
                } else {
                    // Blue/purple image → bright orange/gold
                    doodleColors = ['#FF9100', '#FFAB00', '#FFC400'];
                }
                doodleShadowColor = 'rgba(0, 0, 0, 0.45)';
            }
        } catch (e) {
            console.warn('Doodle color analysis failed:', e);
        }
    }

    // Re-analyze whenever the edit image changes
    const origOnload = editModalImage.onload;
    editModalImage.addEventListener('load', () => {
        analyzeDoodleColor();
    });

    // --- Freehand stroke rendering (Select tool) ---
    function isClosedStroke(stroke) {
        if (stroke.length < 8) return false; // need enough points for a shape
        const first = stroke[0];
        const last = stroke[stroke.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Calculate bounding box diagonal for relative threshold
        let minX = first.x, maxX = first.x, minY = first.y, maxY = first.y;
        for (let i = 1; i < stroke.length; i++) {
            if (stroke[i].x < minX) minX = stroke[i].x;
            if (stroke[i].x > maxX) maxX = stroke[i].x;
            if (stroke[i].y < minY) minY = stroke[i].y;
            if (stroke[i].y > maxY) maxY = stroke[i].y;
        }
        const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
        // Closed if endpoints are within 15% of the shape's diagonal
        return diagonal > 20 && dist < diagonal * 0.15;
    }

    function drawStrokeWithShadow(ctx, stroke) {
        // Calculate bounding box for gradient
        let minX = stroke[0].x, maxX = stroke[0].x;
        let minY = stroke[0].y, maxY = stroke[0].y;
        for (let i = 1; i < stroke.length; i++) {
            if (stroke[i].x < minX) minX = stroke[i].x;
            if (stroke[i].x > maxX) maxX = stroke[i].x;
            if (stroke[i].y < minY) minY = stroke[i].y;
            if (stroke[i].y > maxY) maxY = stroke[i].y;
        }
        const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
        grad.addColorStop(0, doodleColors[0]);
        grad.addColorStop(0.5, doodleColors[1]);
        grad.addColorStop(1, doodleColors[2]);

        const closed = isClosedStroke(stroke);

        // If closed shape, draw the fill first
        if (closed) {
            const fillGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
            fillGrad.addColorStop(0, doodleColors[0] + '26'); // ~15% opacity
            fillGrad.addColorStop(0.5, doodleColors[1] + '26');
            fillGrad.addColorStop(1, doodleColors[2] + '26');
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = fillGrad;
            ctx.fill();
            ctx.restore();
        }

        // Draw the stroke outline
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.56;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = doodleShadowColor;
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        if (closed) ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    function redrawStrokes() {
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const toolId = activeToolEl?.dataset.tool;
        if ((toolId === 'select' || (toolId !== 'select' && allStrokes.length > 0 && Array.isArray(allStrokes[0])))) {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            allStrokes.forEach(stroke => {
                if (!Array.isArray(stroke) || stroke.length < 2) return;
                drawStrokeWithShadow(drawCtx, stroke);
            });
        }
    }

    // --- Doodle Trash Icon (for closed shapes) ---
    function showDoodleTrash() {
        removeDoodleTrash();
        // Find the last closed stroke
        let closedStroke = null;
        for (let i = allStrokes.length - 1; i >= 0; i--) {
            if (Array.isArray(allStrokes[i]) && isClosedStroke(allStrokes[i])) {
                closedStroke = allStrokes[i];
                break;
            }
        }
        if (!closedStroke) return;

        // Find the stroke point closest to the top-right area of the shape
        // to position the trash icon right on the doodle line
        let minX = closedStroke[0].x, maxX = closedStroke[0].x;
        let minY = closedStroke[0].y, maxY = closedStroke[0].y;
        for (let i = 1; i < closedStroke.length; i++) {
            if (closedStroke[i].x < minX) minX = closedStroke[i].x;
            if (closedStroke[i].x > maxX) maxX = closedStroke[i].x;
            if (closedStroke[i].y < minY) minY = closedStroke[i].y;
            if (closedStroke[i].y > maxY) maxY = closedStroke[i].y;
        }

        // Target the top-right corner of the bounding box
        const targetX = maxX;
        const targetY = minY;

        // Find the stroke point nearest to that target
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < closedStroke.length; i++) {
            const dx = closedStroke[i].x - targetX;
            const dy = closedStroke[i].y - targetY;
            const d = dx * dx + dy * dy;
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        const anchorPt = closedStroke[bestIdx];

        const container = drawCanvas.parentElement;
        doodleTrashEl = document.createElement('button');
        doodleTrashEl.className = 'doodle-trash';
        doodleTrashEl.type = 'button';
        doodleTrashEl.title = 'Delete selection';
        doodleTrashEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        // White circle with black X
        doodleTrashEl.style.color = '#000';
        doodleTrashEl.style.background = '#fff';

        // Calculate image bounds relative to container
        const imgRect = editModalImage.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgRight = imgLeft + imgRect.width;
        const imgBottom = imgTop + imgRect.height;

        const btnSize = 28; // approximate size of the trash button
        const margin = 4;   // margin from edges

        // Default: position above-right of the anchor point
        let posX = anchorPt.x + 2;
        let posY = anchorPt.y - 30;

        // Clamp within image bounds
        // If too far right, shift left
        if (posX + btnSize > imgRight - margin) {
            posX = imgRight - btnSize - margin;
        }
        // If too far left, shift right
        if (posX < imgLeft + margin) {
            posX = imgLeft + margin;
        }
        // If too high (above image), put below the anchor instead
        if (posY < imgTop + margin) {
            posY = anchorPt.y + 10;
        }
        // If too low, clamp to bottom
        if (posY + btnSize > imgBottom - margin) {
            posY = imgBottom - btnSize - margin;
        }

        doodleTrashEl.style.left = posX + 'px';
        doodleTrashEl.style.top = posY + 'px';
        container.appendChild(doodleTrashEl);

        doodleTrashEl.addEventListener('click', (e) => {
            e.stopPropagation();
            // Clear all doodle strokes
            allStrokes = [];
            editUndoStack = [];
            editRedoStack = [];
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            removeDoodleTrash();
            updateUndoRedoState();
            updateToolButtonStates();
            // Reset input bar
            const editInput = document.getElementById('edit-input-text');
            const editSendBtn = document.getElementById('edit-send-btn');
            if (editInput) { editInput.disabled = true; editInput.placeholder = 'Draw on image to select area'; editInput.value = ''; }
            if (editSendBtn) editSendBtn.disabled = true;
            showToast('Selection cleared');
        });
    }

    function removeDoodleTrash() {
        if (doodleTrashEl) {
            doodleTrashEl.remove();
            doodleTrashEl = null;
        }
    }

    function getCanvasPos(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(clientX - rect.left, drawCanvas.width)),
            y: Math.max(0, Math.min(clientY - rect.top, drawCanvas.height))
        };
    }

    // ========================================
    // MARQUEE SELECTION TOOL (Text tool)
    // ========================================
    let marqueeSelection = null;
    let marqueeMode = 'idle';
    let marqueeOrigin = null;
    let marqueeDragOffset = null;
    let marqueeResizeHandle = '';
    let marqueeResizeOrigin = null;
    let marqueeShift = false;
    let marqueeAlt = false;
    let marchingAntsOffset = 0;
    let marchingAntsRAF = null;
    let autoTextRegions = [];   // [{text, x, y, w, h, area}] from auto-scan
    let ghostBoxRAF = null;     // for ghost box pulse animation
    let ghostBoxPhase = 0;      // 0→1 pulse phase
    const HANDLE_SIZE = 8;
    const HANDLE_HIT = 12;

    function normalizeSelection(sel) {
        if (!sel) return null;
        let { x, y, w, h } = sel;
        if (w < 0) { x += w; w = -w; }
        if (h < 0) { y += h; h = -h; }
        return { x, y, w, h };
    }

    function clampSelection(sel) {
        if (!sel) return null;
        let { x, y, w, h } = sel;
        x = Math.max(0, x);
        y = Math.max(0, y);
        w = Math.min(w, drawCanvas.width - x);
        h = Math.min(h, drawCanvas.height - y);
        return { x, y, w, h };
    }

    function hitTestSelection(pos) {
        if (!marqueeSelection) return { type: 'outside' };
        const s = marqueeSelection;
        const hh = HANDLE_HIT;
        const corners = [
            { name: 'nw', cx: s.x, cy: s.y },
            { name: 'ne', cx: s.x + s.w, cy: s.y },
            { name: 'sw', cx: s.x, cy: s.y + s.h },
            { name: 'se', cx: s.x + s.w, cy: s.y + s.h },
        ];
        for (const c of corners) {
            if (Math.abs(pos.x - c.cx) <= hh && Math.abs(pos.y - c.cy) <= hh) return { type: 'handle', handle: c.name };
        }
        const edges = [
            { name: 'n', cx: s.x + s.w / 2, cy: s.y },
            { name: 's', cx: s.x + s.w / 2, cy: s.y + s.h },
            { name: 'w', cx: s.x, cy: s.y + s.h / 2 },
            { name: 'e', cx: s.x + s.w, cy: s.y + s.h / 2 },
        ];
        for (const ed of edges) {
            if (Math.abs(pos.x - ed.cx) <= hh && Math.abs(pos.y - ed.cy) <= hh) return { type: 'handle', handle: ed.name };
        }
        if (pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h) return { type: 'inside' };
        return { type: 'outside' };
    }

    function getHandleCursor(handle) {
        return { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' }[handle] || 'crosshair';
    }

    function renderCanvas() {
        // Don't clear if Select tool is active with strokes
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const toolId = activeToolEl?.dataset.tool;
        if (toolId === 'select') return; // Select tool uses redrawStrokes

        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        if (!marqueeSelection || marqueeSelection.w < 2 || marqueeSelection.h < 2) return;
        const s = marqueeSelection;
        drawCtx.save();
        drawCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        drawCtx.beginPath();
        drawCtx.rect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.moveTo(s.x, s.y);
        drawCtx.lineTo(s.x, s.y + s.h);
        drawCtx.lineTo(s.x + s.w, s.y + s.h);
        drawCtx.lineTo(s.x + s.w, s.y);
        drawCtx.closePath();
        drawCtx.fill('evenodd');
        drawCtx.restore();
        drawCtx.save();
        drawCtx.strokeStyle = '#fff';
        drawCtx.lineWidth = 1.5;
        drawCtx.setLineDash([6, 4]);
        drawCtx.lineDashOffset = -marchingAntsOffset;
        drawCtx.strokeRect(s.x, s.y, s.w, s.h);
        drawCtx.restore();
        drawCtx.save();
        drawCtx.strokeStyle = 'rgba(168, 199, 250, 0.8)';
        drawCtx.lineWidth = 1.5;
        drawCtx.setLineDash([6, 4]);
        drawCtx.lineDashOffset = -(marchingAntsOffset + 5);
        drawCtx.strokeRect(s.x, s.y, s.w, s.h);
        drawCtx.restore();
        [{ x: s.x, y: s.y }, { x: s.x + s.w, y: s.y }, { x: s.x, y: s.y + s.h }, { x: s.x + s.w, y: s.y + s.h }].forEach(h => {
            drawCtx.save();
            drawCtx.fillStyle = '#fff';
            drawCtx.shadowColor = 'rgba(0,0,0,0.3)';
            drawCtx.shadowBlur = 3;
            drawCtx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
            drawCtx.restore();
            drawCtx.save();
            drawCtx.fillStyle = '#A8C7FA';
            drawCtx.fillRect(h.x - HANDLE_SIZE / 2 + 1.5, h.y - HANDLE_SIZE / 2 + 1.5, HANDLE_SIZE - 3, HANDLE_SIZE - 3);
            drawCtx.restore();
        });
    }

    function startMarchingAnts() {
        if (marchingAntsRAF) return;
        function animate() {
            marchingAntsOffset = (marchingAntsOffset + 0.3) % 20;
            if (marqueeSelection) { renderCanvas(); marchingAntsRAF = requestAnimationFrame(animate); }
            else { marchingAntsRAF = null; }
        }
        marchingAntsRAF = requestAnimationFrame(animate);
    }

    function stopMarchingAnts() {
        if (marchingAntsRAF) { cancelAnimationFrame(marchingAntsRAF); marchingAntsRAF = null; }
    }

    // ─── Ghost Text Boxes ────────────────────────────────────────────────
    // Renders auto-detected text bounding boxes as glowing ghost outlines.
    // Larger text = more opaque (more prominent in the image hierarchy)
    // Smaller text = more transparent (secondary, subtle)
    function renderGhostBoxes() {
        if (!autoTextRegions.length) return;
        const pulse = Math.sin(ghostBoxPhase) * 0.12 + 0.88; // gentle 12% breath
        const maxArea = autoTextRegions[0].area; // sorted descending
        const minArea = autoTextRegions[autoTextRegions.length - 1].area;
        const areaRange = Math.max(maxArea - minArea, 1);

        drawCtx.save();
        drawCtx.setLineDash([]);
        for (const region of autoTextRegions) {
            const { x, y, w, h, area } = region;
            // Opacity: largest text → 0.85, smallest text → 0.25
            const norm = (area - minArea) / areaRange; // 0..1
            const opacity = (0.25 + norm * 0.60) * pulse;

            // Corner radius for elegance
            const r = Math.min(4, w * 0.1, h * 0.1);

            // Background fill — very subtle, so the image shows through
            drawCtx.globalAlpha = opacity * 0.12;
            drawCtx.fillStyle = '#A8C7FA';
            drawCtx.beginPath();
            drawCtx.roundRect(x, y, w, h, r);
            drawCtx.fill();

            // Border — crisp white + Material You blue inner glow
            drawCtx.globalAlpha = opacity;
            drawCtx.strokeStyle = 'rgba(255,255,255,0.9)';
            drawCtx.lineWidth = 1.5;
            drawCtx.beginPath();
            drawCtx.roundRect(x, y, w, h, r);
            drawCtx.stroke();

            // Inner accent stroke
            drawCtx.globalAlpha = opacity * 0.55;
            drawCtx.strokeStyle = '#A8C7FA';
            drawCtx.lineWidth = 0.75;
            drawCtx.beginPath();
            drawCtx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, Math.max(r - 1.5, 0));
            drawCtx.stroke();
        }
        drawCtx.globalAlpha = 1;
        drawCtx.restore();
    }

    function startGhostBoxPulse() {
        if (ghostBoxRAF) return;
        function animate() {
            if (!autoTextRegions.length) { ghostBoxRAF = null; return; }
            ghostBoxPhase += 0.022; // ~60fps → ~2.8s period
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            renderGhostBoxes();
            ghostBoxRAF = requestAnimationFrame(animate);
        }
        ghostBoxRAF = requestAnimationFrame(animate);
    }

    function stopGhostBoxPulse() {
        if (ghostBoxRAF) { cancelAnimationFrame(ghostBoxRAF); ghostBoxRAF = null; }
    }

    // Gemini scan: ask for ALL text regions in the image at once
    async function autoScanTextRegions() {
        autoTextRegions = [];
        stopGhostBoxPulse();
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

        // Show scanning indicator
        const editInput = document.getElementById('edit-input-text');
        if (editInput) { editInput.placeholder = 'Scanning for text…'; editInput.disabled = true; }

        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Analyze this image and detect ALL visible text elements. For each distinct text element (headline, body copy, caption, label, etc.), return a JSON object with:
- "text": the exact text string
- "bounds": { "x1": left%, "y1": top%, "x2": right%, "y2": bottom% } as percentages of image dimensions

Return ONLY a JSON array of these objects, sorted from largest to smallest by bounding box area. If there is no text in the image return []. Example: [{"text":"Hello World","bounds":{"x1":5,"y1":8,"x2":60,"y2":22}}]`
                        },
                        { inline_data: { mime_type: 'image/png', data: imageBase64 } }
                    ]
                }],
                generationConfig: { responseMimeType: 'application/json' }
            };

            const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig);
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const regions = JSON.parse(cleaned);
            if (!Array.isArray(regions) || !regions.length) {
                if (editInput) { editInput.placeholder = 'Tap text or draw a selection'; editInput.disabled = false; }
                return;
            }

            // Convert percentage bounds → canvas pixel coords
            // Use imgRect (the rendered image rect inside the canvas)
            const imgRect = editModalImage.getBoundingClientRect();
            const canvasRect = drawCanvas.getBoundingClientRect();
            const imgOffsetX = imgRect.left - canvasRect.left;
            const imgOffsetY = imgRect.top  - canvasRect.top;

            autoTextRegions = regions.map(r => {
                const b = r.bounds;
                const rx = imgOffsetX + (b.x1 / 100) * imgRect.width;
                const ry = imgOffsetY + (b.y1 / 100) * imgRect.height;
                const rw = ((b.x2 - b.x1) / 100) * imgRect.width;
                const rh = ((b.y2 - b.y1) / 100) * imgRect.height;
                return { text: r.text, x: rx, y: ry, w: rw, h: rh, area: rw * rh };
            }).sort((a, b) => b.area - a.area);

            if (editInput) { editInput.placeholder = 'Tap a text region to select'; editInput.disabled = false; }
            startGhostBoxPulse();

        } catch (err) {
            console.warn('[AutoScan] Text scan failed:', err);
            if (editInput) { editInput.placeholder = 'Tap text or draw a selection'; editInput.disabled = false; }
        }
    }

    // --- Floating Text (draggable text overlay for Text tool) ---
    function createFloatingText(text, bounds) {
        removeFloatingText();
        const container = drawCanvas.parentElement;

        floatingTextPos = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };

        floatingTextEl = document.createElement('div');
        floatingTextEl.className = 'edit-modal__floating-text';
        floatingTextEl.style.left = bounds.x + 'px';
        floatingTextEl.style.top = bounds.y + 'px';
        floatingTextEl.style.minWidth = Math.max(bounds.w, 60) + 'px';
        floatingTextEl.style.minHeight = Math.max(bounds.h, 30) + 'px';

        // Only add text span if there's actual text content
        // When empty, leave the container :empty so CSS "Add text" placeholder shows
        if (text) {
            const textNode = document.createElement('span');
            textNode.className = 'floating-text__content';
            textNode.textContent = text;
            floatingTextEl.appendChild(textNode);
        }

        container.appendChild(floatingTextEl);

        // Dim the image to focus on the text overlay
        editModalImage.classList.add('text-overlay-active');

        // Hide marquee visuals — floating text replaces it
        stopMarchingAnts();
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

        // Only make draggable for new text (not detected existing text)
        if (detectedOriginalText) {
            // Existing text — lock in place, no dragging
            floatingTextEl.classList.add('locked');
            floatingTextEl.style.cursor = 'default';

            // Add trash icon to delete the detected text
            const trashBtn = document.createElement('button');
            trashBtn.className = 'floating-text__trash';
            trashBtn.type = 'button';
            trashBtn.title = 'Remove text from image';
            trashBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
            floatingTextEl.appendChild(trashBtn);

            trashBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const textToRemove = detectedOriginalText;
                if (!textToRemove) return;

                // Show loading state
                trashBtn.disabled = true;
                trashBtn.style.opacity = '0.4';
                setVortexFromEdit();
                editModalImage.closest('.edit-modal__canvas').classList.add('edit-loading');
                showToast('Removing text…');

                // Create abort controller and show cancel in nav
                const ac = createAbortController();
                showEditLoadingCancel(() => enterStarterPage());

                try {
                    const imageBase64 = await imgSrcToBase64(editModalImage);
                    const removePrompt = `Remove the text "${textToRemove}" from this image completely. Fill in the area where the text was with the surrounding background, making it look natural as if the text was never there. Keep everything else exactly the same.`;
                    const newDataUrl = await editWithGemini(imageBase64, removePrompt, ac.signal);

                    await seamlessCrossfade(newDataUrl);

                    showToast('Text removed');
                } catch (err) {
                    if (err.name === 'AbortError') return; // User cancelled
                    console.error('Text removal error:', err);
                    showToast('Failed to remove text: ' + err.message);
                } finally {
                    hideEditLoadingCancel();
                    editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
                    // Clean up
                    allStrokes = [];
                    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                    clearSelection();
                    enterStarterPage();
                }
            });
        } else {
            // New text — allow dragging
            floatingTextEl.addEventListener('pointerdown', onFloatingTextDown);
        }
    }

    function onFloatingTextDown(e) {
        e.preventDefault();
        e.stopPropagation();
        floatingTextDrag.active = true;
        const rect = floatingTextEl.getBoundingClientRect();
        floatingTextDrag.offsetX = e.clientX - rect.left;
        floatingTextDrag.offsetY = e.clientY - rect.top;
        floatingTextEl.setPointerCapture(e.pointerId);
        floatingTextEl.style.cursor = 'grabbing';
        floatingTextEl.classList.add('dragging');
        editModalImage.classList.add('text-dragging-active');

        floatingTextEl.addEventListener('pointermove', onFloatingTextMove);
        floatingTextEl.addEventListener('pointerup', onFloatingTextUp);
    }

    function onFloatingTextMove(e) {
        if (!floatingTextDrag.active || !floatingTextEl) return;
        const container = drawCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const newX = e.clientX - containerRect.left - floatingTextDrag.offsetX;
        const newY = e.clientY - containerRect.top - floatingTextDrag.offsetY;
        floatingTextEl.style.left = newX + 'px';
        floatingTextEl.style.top = newY + 'px';
        floatingTextPos.x = newX;
        floatingTextPos.y = newY;
    }

    function onFloatingTextUp(e) {
        floatingTextDrag.active = false;
        if (floatingTextEl) {
            floatingTextEl.style.cursor = 'grab';
            floatingTextEl.classList.remove('dragging');
            editModalImage.classList.remove('text-dragging-active');
            floatingTextEl.removeEventListener('pointermove', onFloatingTextMove);
            floatingTextEl.removeEventListener('pointerup', onFloatingTextUp);
        }
    }

    function updateFloatingTextContent(text) {
        if (floatingTextEl) {
            let contentSpan = floatingTextEl.querySelector('.floating-text__content');
            if (text) {
                // If there's text, ensure a content span exists
                if (!contentSpan) {
                    contentSpan = document.createElement('span');
                    contentSpan.className = 'floating-text__content';
                    floatingTextEl.appendChild(contentSpan);
                }
                contentSpan.textContent = text;
            } else {
                // If text is empty, remove the span so :empty placeholder shows
                if (contentSpan) contentSpan.remove();
            }
        }
    }

    function removeFloatingText() {
        if (floatingTextEl) {
            floatingTextEl.removeEventListener('pointerdown', onFloatingTextDown);
            floatingTextEl.remove();
            floatingTextEl = null;
        }
        floatingTextPos = null;
        floatingTextDrag = { active: false, offsetX: 0, offsetY: 0 };
        // Remove image dim
        editModalImage.classList.remove('text-overlay-active');
    }

    // --- Tap-to-Place Text Cursor (Text tool) ---
    function placeTextCursor(x, y) {
        removeTextCursor();
        removeFloatingText();
        // Deselect any highlighted text (but keep highlights visible)
        textHighlightEls.forEach(el => el.classList.remove('text-highlight--selected'));
        detectedOriginalText = null;
        floatingTextPos = null;
        marqueeSelection = null;
        marqueeMode = 'idle';
        stopMarchingAnts();

        const container = drawCanvas.parentElement;
        textCursorPos = { x, y };

        // Show tap ripple animation
        const ripple = document.createElement('div');
        ripple.className = 'text-tap-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        container.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());

        // Create blinking cursor
        textCursorEl = document.createElement('div');
        textCursorEl.className = 'text-cursor-indicator';
        textCursorEl.style.left = x + 'px';
        textCursorEl.style.top = (y - 14) + 'px'; // Center vertically on tap point
        container.appendChild(textCursorEl);

        // Dim image for focus
        editModalImage.classList.add('text-overlay-active');

        // Enable input bar
        const editInput = document.getElementById('edit-input-text');
        const editSendBtn = document.getElementById('edit-send-btn');
        if (editInput) {
            editInput.disabled = false;
            editInput.placeholder = 'Type text to add';
            editInput.value = '';
            editInput.focus();
        }
        if (editSendBtn) editSendBtn.disabled = false;

        allStrokes = [{ type: 'textCursor', pos: { x, y } }];
        pushEditAction({ type: 'stroke', data: { type: 'textCursor', pos: { x, y } } });
        updateToolButtonStates();
    }

    function updateTextPreview(text) {
        const container = drawCanvas.parentElement;
        if (!textCursorPos) return;

        if (!text) {
            // Remove preview if text is empty, show cursor again
            if (textPreviewEl) { textPreviewEl.remove(); textPreviewEl = null; }
            if (textCursorEl) textCursorEl.style.display = '';
            return;
        }

        // Hide the blinking cursor when text is showing
        if (textCursorEl) textCursorEl.style.display = 'none';

        if (!textPreviewEl) {
            textPreviewEl = document.createElement('div');
            textPreviewEl.className = 'text-preview-overlay';
            container.appendChild(textPreviewEl);
        }

        textPreviewEl.textContent = text;
        textPreviewEl.style.left = textCursorPos.x + 'px';
        textPreviewEl.style.top = (textCursorPos.y - 12) + 'px';
    }

    function removeTextCursor() {
        if (textCursorEl) { textCursorEl.remove(); textCursorEl = null; }
        if (textPreviewEl) { textPreviewEl.remove(); textPreviewEl = null; }
        textCursorPos = null;
        editModalImage.classList.remove('text-overlay-active');
    }

    // --- Text Highlight Auto-Detection (Text tool) ---
    async function detectAllTextInImage() {
        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const apiKey = getApiKey();
            if (!apiKey) throw new Error('No API key provided');

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Analyze this image and find ALL text elements visible in it. For each text element, return its content and bounding box as percentages of the image dimensions. Return a JSON array with this format: [{"text": "exact text", "bounds": {"x1": left%, "y1": top%, "x2": right%, "y2": bottom%}}]. The percentages should be integers from 0 to 100. Group words that are part of the same line or phrase together as a single entry. If there is no text in the image, return an empty array []. Return ONLY the JSON array, nothing else — no markdown, no code fences.`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: imageBase64,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT'],
                }
            };

            const response = await fetchWithFallback(apiKey, requestBody);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const candidates = data.candidates || [];
            let rawText = '';
            for (const candidate of candidates) {
                for (const part of (candidate.content?.parts || [])) {
                    if (part.text) { rawText = part.text.trim(); break; }
                }
                if (rawText) break;
            }

            // Clean JSON from potential markdown code fences
            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

            const regions = JSON.parse(rawText);
            if (!Array.isArray(regions)) return [];
            // Validate each region
            return regions.filter(r => r.text && r.bounds && typeof r.bounds.x1 === 'number');
        } catch (err) {
            console.error('Text detection error:', err);
            return [];
        }
    }

    function showTextHighlights(regions) {
        removeTextHighlights();
        if (!regions || regions.length === 0) return;

        detectedTextRegions = regions;
        const container = drawCanvas.parentElement;
        const img = editModalImage;
        const imgRect = img.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const imgOffsetX = imgRect.left - containerRect.left;
        const imgOffsetY = imgRect.top - containerRect.top;
        const imgW = imgRect.width;
        const imgH = imgRect.height;

        regions.forEach((region, index) => {
            const { bounds, text } = region;
            const el = document.createElement('div');
            el.className = 'text-highlight';
            el.title = text;
            el.dataset.regionIndex = index;

            // Convert percentages to pixel positions relative to the container
            const left = imgOffsetX + (bounds.x1 / 100) * imgW;
            const top = imgOffsetY + (bounds.y1 / 100) * imgH;
            const width = ((bounds.x2 - bounds.x1) / 100) * imgW;
            const height = ((bounds.y2 - bounds.y1) / 100) * imgH;

            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.width = width + 'px';
            el.style.height = height + 'px';

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                selectTextHighlight(index);
            });

            container.appendChild(el);
            textHighlightEls.push(el);
        });
    }

    function selectTextHighlight(index) {
        const region = detectedTextRegions[index];
        if (!region) return;

        // Remove cursor/preview if active
        removeTextCursor();

        // Visually select this highlight
        textHighlightEls.forEach((el, i) => {
            el.classList.toggle('text-highlight--selected', i === index);
        });

        // Set up for text editing
        detectedOriginalText = region.text;

        // Convert bounds to canvas coordinates for the marquee position
        const img = editModalImage;
        const imgRect = img.getBoundingClientRect();
        const containerRect = drawCanvas.parentElement.getBoundingClientRect();
        const imgOffsetX = imgRect.left - containerRect.left;
        const imgOffsetY = imgRect.top - containerRect.top;
        const imgW = imgRect.width;
        const imgH = imgRect.height;

        const bounds = region.bounds;
        floatingTextPos = {
            x: imgOffsetX + (bounds.x1 / 100) * imgW,
            y: imgOffsetY + (bounds.y1 / 100) * imgH,
            w: ((bounds.x2 - bounds.x1) / 100) * imgW,
            h: ((bounds.y2 - bounds.y1) / 100) * imgH,
        };

        // Populate input with detected text
        const editInput = document.getElementById('edit-input-text');
        const editSendBtn = document.getElementById('edit-send-btn');
        if (editInput) {
            editInput.value = region.text;
            editInput.disabled = false;
            editInput.placeholder = 'Edit the text';
            editInput.focus();
            editInput.select();
        }
        if (editSendBtn) editSendBtn.disabled = false;

        allStrokes = [{ type: 'textHighlight', regionIndex: index }];
        pushEditAction({ type: 'stroke', data: { type: 'textHighlight', regionIndex: index } });
        updateToolButtonStates();
        showToast(`Selected: "${region.text}"`);
    }

    function removeTextHighlights() {
        textHighlightEls.forEach(el => el.remove());
        textHighlightEls = [];
        detectedTextRegions = [];
    }

    // --- Lighting Studio ---
    let lightingActive = false;
    let lightingSourceEl = null;
    let lightingOverlayEl = null;
    let lightingPos = { x: 50, y: 30 }; // percentage position of light source
    let lightingDrag = { active: false, startX: 0, startY: 0 };
    let lightingLimits = null; // stores per-slider safe ranges based on image analysis

    /**
     * Analyze the current image to extract lighting characteristics.
     * Samples pixels to compute brightness histogram, shadow/highlight density,
     * contrast range, average saturation, and color warmth.
     */
    function analyzeImageLighting() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Sample at a reduced resolution for speed (max 200px wide)
        const maxDim = 200;
        const scale = Math.min(1, maxDim / editModalImage.naturalWidth);
        canvas.width = Math.round(editModalImage.naturalWidth * scale);
        canvas.height = Math.round(editModalImage.naturalHeight * scale);

        try {
            ctx.drawImage(editModalImage, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.warn('[Lighting] Could not analyze image (CORS?):', e);
            return null;
        }

        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.warn('[Lighting] Could not read pixel data:', e);
            return null;
        }

        const data = imageData.data;
        const pixelCount = data.length / 4;

        // Accumulators
        let totalBrightness = 0;
        let totalSaturation = 0;
        let totalWarmth = 0; // positive = warm, negative = cool
        let minBrightness = 255;
        let maxBrightness = 0;
        const brightnessHistogram = new Array(256).fill(0);

        // Shadow/highlight pixel counts (based on luminance thresholds)
        let shadowPixels = 0;    // luminance < 50
        let darkPixels = 0;      // luminance < 80
        let midPixels = 0;       // luminance 80-175
        let brightPixels = 0;    // luminance > 175
        let highlightPixels = 0; // luminance > 220

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            // Perceived luminance (ITU-R BT.709)
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const lumInt = Math.round(lum);

            totalBrightness += lum;
            brightnessHistogram[Math.min(255, lumInt)]++;
            if (lum < minBrightness) minBrightness = lum;
            if (lum > maxBrightness) maxBrightness = lum;

            if (lum < 50) shadowPixels++;
            if (lum < 80) darkPixels++;
            if (lum >= 80 && lum <= 175) midPixels++;
            if (lum > 175) brightPixels++;
            if (lum > 220) highlightPixels++;

            // Saturation (simplified HSL saturation)
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const chroma = maxC - minC;
            const sat = maxC > 0 ? chroma / maxC : 0;
            totalSaturation += sat;

            // Warmth: positive if red-dominant, negative if blue-dominant
            totalWarmth += (r - b) / 255;
        }

        const avgBrightness = totalBrightness / pixelCount;       // 0-255
        const avgSaturation = totalSaturation / pixelCount;       // 0-1
        const avgWarmth = totalWarmth / pixelCount;                // -1 to 1
        const contrastRange = maxBrightness - minBrightness;      // 0-255
        const shadowDensity = shadowPixels / pixelCount;          // 0-1
        const darkDensity = darkPixels / pixelCount;              // 0-1
        const highlightDensity = highlightPixels / pixelCount;    // 0-1
        const brightDensity = brightPixels / pixelCount;          // 0-1

        // Compute dynamic range using 5th and 95th percentile
        let p5 = 0, p95 = 255;
        let cumulative = 0;
        for (let i = 0; i < 256; i++) {
            cumulative += brightnessHistogram[i];
            if (cumulative >= pixelCount * 0.05 && p5 === 0) p5 = i;
            if (cumulative >= pixelCount * 0.95) { p95 = i; break; }
        }
        const dynamicRange = p95 - p5; // 0-255

        return {
            avgBrightness,      // 0-255: overall brightness of image
            avgSaturation,      // 0-1: color richness
            avgWarmth,          // -1 to 1: cool (blue) vs warm (red)
            contrastRange,      // 0-255: max - min luminance
            dynamicRange,       // 0-255: 5th to 95th percentile range
            shadowDensity,      // 0-1: fraction of very dark pixels
            darkDensity,        // 0-1: fraction of dark pixels
            highlightDensity,   // 0-1: fraction of very bright pixels
            brightDensity,      // 0-1: fraction of bright pixels
            p5Brightness: p5,   // 5th percentile luminance
            p95Brightness: p95, // 95th percentile luminance
        };
    }

    /**
     * Compute safe slider ranges based on image analysis.
     * The principle: prevent the combined effect of all sliders from
     * producing a washed-out, blacked-out, or unnatural result.
     */
    function computeLightingLimits(analysis) {
        if (!analysis) {
            // Default: slightly constrained ranges (prevent extremes)
            return {
                intensity: { min: 0, max: 85 },
                warmth: { min: 10, max: 90 },
                ambient: { min: 10, max: 90 },
                exposure: { min: 15, max: 85 },
                shadows: { min: 10, max: 90 },
                highlights: { min: 10, max: 90 },
                contrast: { min: 10, max: 85 },
            };
        }

        const {
            avgBrightness, avgSaturation, avgWarmth, contrastRange,
            dynamicRange, shadowDensity, darkDensity, highlightDensity,
            brightDensity, p5Brightness, p95Brightness
        } = analysis;

        // Normalize avgBrightness to 0-1 scale
        const normBright = avgBrightness / 255;

        // --- EXPOSURE ---
        // Dark images: don't allow going much darker; bright images: don't allow going much brighter
        // Slider 50 = neutral, 0 = darkest (0.3x brightness), 100 = brightest (1.8x)
        let exposureMin, exposureMax;
        if (normBright < 0.25) {
            // Already dark — floor at 25 (don't darken much more), allow brightening
            exposureMin = 25;
            exposureMax = 90;
        } else if (normBright < 0.40) {
            exposureMin = 18;
            exposureMax = 88;
        } else if (normBright > 0.75) {
            // Already bright — cap how bright it can go, allow darkening
            exposureMin = 12;
            exposureMax = 72;
        } else if (normBright > 0.60) {
            exposureMin = 12;
            exposureMax = 78;
        } else {
            // Mid-range — balanced limits
            exposureMin = 15;
            exposureMax = 85;
        }

        // --- CONTRAST ---
        // High native contrast: limit how much more we add
        // Low native contrast: limit how flat we can go
        let contrastMin, contrastMax;
        const normContrast = dynamicRange / 255;
        if (normContrast > 0.8) {
            // Already high contrast — don't add too much more
            contrastMin = 15;
            contrastMax = 72;
        } else if (normContrast > 0.6) {
            contrastMin = 12;
            contrastMax = 78;
        } else if (normContrast < 0.3) {
            // Low contrast/flat image — don't make it even flatter
            contrastMin = 25;
            contrastMax = 85;
        } else {
            contrastMin = 10;
            contrastMax = 85;
        }

        // --- SHADOWS ---
        // If image already has deep shadows, don't crush them further
        // If image has very few shadows, don't allow extreme lifting
        let shadowsMin, shadowsMax;
        if (shadowDensity > 0.3) {
            // Lots of deep shadows — protect them from going even darker
            shadowsMin = 25;
            shadowsMax = 90;
        } else if (darkDensity > 0.5) {
            shadowsMin = 20;
            shadowsMax = 88;
        } else if (shadowDensity < 0.05 && darkDensity < 0.15) {
            // Barely any shadows — no need to lift, mild crush OK
            shadowsMin = 15;
            shadowsMax = 80;
        } else {
            shadowsMin = 12;
            shadowsMax = 88;
        }

        // --- HIGHLIGHTS ---
        // If image already has blown-out highlights, limit blowing more
        // If image is dark, allow more highlight push
        let highlightsMin, highlightsMax;
        if (highlightDensity > 0.25) {
            // Already clipped highlights — protect from more blowout
            // Lower values = blow out, so raise the min
            highlightsMin = 25;
            highlightsMax = 90;
        } else if (brightDensity > 0.5) {
            highlightsMin = 18;
            highlightsMax = 88;
        } else if (highlightDensity < 0.05) {
            // No clipping — more freedom
            highlightsMin = 10;
            highlightsMax = 85;
        } else {
            highlightsMin = 12;
            highlightsMax = 88;
        }

        // --- INTENSITY (light source strength) ---
        // Bright images: limit how intense the light overlay can get
        let intensityMax;
        if (normBright > 0.7) {
            intensityMax = 70; // bright image — dial it back
        } else if (normBright > 0.55) {
            intensityMax = 80;
        } else {
            intensityMax = 90;
        }

        // --- AMBIENT (fill light / shadow density) ---
        // Dark images: don't allow ambient to go super low (would black out)
        // Bright images: keep some constraint on ambient too
        let ambientMin, ambientMax;
        if (normBright < 0.3) {
            ambientMin = 22;
            ambientMax = 90;
        } else if (normBright > 0.7) {
            ambientMin = 8;
            ambientMax = 82;
        } else {
            ambientMin = 12;
            ambientMax = 88;
        }

        // --- WARMTH ---
        // Slightly constrain to prevent extreme tinting
        // If image is already very warm/cool, constrain the opposite direction less
        let warmthMin = 8, warmthMax = 92;
        if (avgWarmth > 0.15) {
            // Already warm — don't allow extreme warmth
            warmthMax = 82;
        } else if (avgWarmth < -0.15) {
            // Already cool — don't allow extreme coolness
            warmthMin = 18;
        }

        return {
            intensity: { min: 0, max: intensityMax },
            warmth: { min: warmthMin, max: warmthMax },
            ambient: { min: ambientMin, max: ambientMax },
            exposure: { min: exposureMin, max: exposureMax },
            shadows: { min: shadowsMin, max: shadowsMax },
            highlights: { min: highlightsMin, max: highlightsMax },
            contrast: { min: contrastMin, max: contrastMax },
        };
    }

    /**
     * Apply the computed limits to slider elements.
     * Updates min/max attributes, clamps current values, and updates display.
     */
    function applyLightingLimits(limits) {
        if (!limits) return;
        lightingLimits = limits;

        const sliderNames = ['intensity', 'warmth', 'ambient', 'exposure', 'shadows', 'highlights', 'contrast'];
        const defaultValues = { intensity: 60, warmth: 50, ambient: 40, exposure: 50, shadows: 50, highlights: 50, contrast: 50 };

        sliderNames.forEach(name => {
            const slider = document.getElementById(`lighting-${name}`);
            const valEl = document.getElementById(`lighting-${name}-val`);
            if (!slider || !valEl) return;

            const { min, max } = limits[name];

            // Set slider range — this constrains the thumb positions
            slider.min = min;
            slider.max = max;

            // Clamp the default value within the safe range
            const defaultVal = defaultValues[name];
            const clampedVal = Math.max(min, Math.min(max, defaultVal));
            slider.value = clampedVal;
            valEl.textContent = clampedVal;
        });
    }

    // Remove background (image editor — has checkerboard + cancel button + responseImageImg sync)
    async function handleImageRemoveBg() {
        const canvasContainer = editModalImage.closest('.edit-modal__canvas');
        setVortexFromEdit();
        canvasContainer.classList.add('edit-loading');
        showToast('Removing background...');
        const ac = createAbortController();
        showEditLoadingCancel(() => enterStarterPage());
        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const editPrompt = 'Remove the background from this image completely. Keep only the main subject with a transparent or pure white background. Preserve all details of the subject.';
            const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);

            canvasContainer.classList.remove('edit-loading');
            editModalImage.classList.add('dissolve-out');
            await new Promise(r => setTimeout(r, 800));

            canvasContainer.classList.add('show-checkerboard');
            editModalImage.classList.remove('dissolve-out');
            editModalImage.classList.add('dissolve-in');
            editModalImage.src = newDataUrl;
            responseImageImg.src = newDataUrl;

            await new Promise(r => { editModalImage.onload = r; setTimeout(r, 200); });
            requestAnimationFrame(() => editModalImage.classList.add('reveal'));
            await new Promise(r => setTimeout(r, 800));
            editModalImage.classList.remove('dissolve-in', 'reveal');

            pushEditAction({ type: 'effect', name: 'removebg' });
            showToast('Background removed');
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Remove BG error:', err);
            showToast('Remove background failed: ' + err.message);
            editModalImage.classList.remove('edit-loading', 'dissolve-out', 'dissolve-in', 'reveal');
        } finally {
            hideEditLoadingCancel();
            requestAnimationFrame(sizeDrawCanvas);
            enterStarterPage();
        }
    }

    function openLightingPanel() {

        const panel = document.getElementById('lighting-panel');
        if (!panel) return;
        lightingActive = true;
        panel.hidden = false;

        // Hide all appbar elements when lighting is active
        if (editCancelBtn) editCancelBtn.style.display = 'none';
        if (editDoneTopBtn) editDoneTopBtn.style.display = 'none';
        const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
        if (appbarActions) appbarActions.style.display = 'none';
        // Initially hide Done button (will appear after Apply Lighting)
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = true;
            subtoolDoneBtn.style.display = 'none';
        }

        // Analyze the current image and compute safe slider limits
        const analysis = analyzeImageLighting();
        const limits = computeLightingLimits(analysis);

        // First reset sliders to HTML defaults (full range), then apply limits
        ['intensity', 'warmth', 'ambient', 'exposure', 'shadows', 'highlights', 'contrast'].forEach(name => {
            const slider = document.getElementById(`lighting-${name}`);
            if (slider) { slider.min = 0; slider.max = 100; }
        });

        // Apply image-aware limits (sets min/max and default values)
        applyLightingLimits(limits);

        // Reset direction to center
        document.querySelectorAll('.lighting-dir-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.lighting-dir-btn[data-dir="center"]')?.classList.add('active');
        lightingPos = { x: 50, y: 30 };

        // Create the light source indicator on the image
        try {
            createLightingSource();
            updateLightingPreview();
        } catch (e) {
            console.error('[Lighting] Error in setup:', e);
        }

        showToast('Lighting adjusted for your image');
    }

    function closeLightingPanel() {
        const panel = document.getElementById('lighting-panel');
        if (panel) panel.hidden = true;
        lightingActive = false;
        lightingLimits = null;
        removeLightingSource();
        removeLightingOverlay();
        // Clear CSS filters from image
        editModalImage.style.filter = '';

        // Reset slider ranges back to full 0-100
        ['intensity', 'warmth', 'ambient', 'exposure', 'shadows', 'highlights', 'contrast'].forEach(name => {
            const slider = document.getElementById(`lighting-${name}`);
            if (slider) { slider.min = 0; slider.max = 100; }
        });

        // Restore Cancel and undo/redo (but NOT Save — caller manages Save/Done)
        if (editCancelBtn) {
            editCancelBtn.hidden = false;
            editCancelBtn.style.display = '';
        }
        const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
        if (appbarActions) {
            appbarActions.hidden = false;
            appbarActions.style.display = '';
        }

        // Hide Done button
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = true;
            subtoolDoneBtn.style.display = 'none';
        }
    }

    function createLightingSource() {
        removeLightingSource();
        const container = drawCanvas.parentElement;
        const imgRect = editModalImage.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        lightingSourceEl = document.createElement('div');
        lightingSourceEl.className = 'lighting-source';
        updateLightSourcePosition();
        container.appendChild(lightingSourceEl);

        // Dragging for the light source
        lightingSourceEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            lightingDrag = { active: true, startX: e.clientX, startY: e.clientY };
            lightingSourceEl.setPointerCapture(e.pointerId);
        });

        lightingSourceEl.addEventListener('pointermove', (e) => {
            if (!lightingDrag.active) return;
            const imgRect = editModalImage.getBoundingClientRect();
            const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
            const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
            lightingPos.x = Math.max(0, Math.min(100, x));
            lightingPos.y = Math.max(0, Math.min(100, y));
            updateLightSourcePosition();
            updateLightingPreview();

            // Update direction button to match position
            updateDirectionFromPosition();
        });

        lightingSourceEl.addEventListener('pointerup', () => {
            lightingDrag.active = false;
        });
    }

    function updateLightSourcePosition() {
        if (!lightingSourceEl) return;
        const imgRect = editModalImage.getBoundingClientRect();
        const containerRect = drawCanvas.parentElement.getBoundingClientRect();
        const imgOffsetX = imgRect.left - containerRect.left;
        const imgOffsetY = imgRect.top - containerRect.top;

        const left = imgOffsetX + (lightingPos.x / 100) * imgRect.width;
        const top = imgOffsetY + (lightingPos.y / 100) * imgRect.height;
        lightingSourceEl.style.left = left + 'px';
        lightingSourceEl.style.top = top + 'px';
    }

    function removeLightingSource() {
        if (lightingSourceEl) {
            lightingSourceEl.remove();
            lightingSourceEl = null;
        }
    }

    function createLightingOverlay() {
        removeLightingOverlay();
        const container = drawCanvas.parentElement;
        lightingOverlayEl = document.createElement('div');
        lightingOverlayEl.className = 'lighting-overlay';
        container.insertBefore(lightingOverlayEl, drawCanvas);
    }

    function removeLightingOverlay() {
        if (lightingOverlayEl) {
            lightingOverlayEl.remove();
            lightingOverlayEl = null;
        }
    }

    function updateLightingPreview() {
        if (!lightingActive) return;
        if (!lightingOverlayEl) createLightingOverlay();

        // Read all slider values
        const intensity = parseInt(document.getElementById('lighting-intensity')?.value || 60);
        const warmth = parseInt(document.getElementById('lighting-warmth')?.value || 50);
        const ambient = parseInt(document.getElementById('lighting-ambient')?.value || 40);
        const exposure = parseInt(document.getElementById('lighting-exposure')?.value || 50);
        const shadows = parseInt(document.getElementById('lighting-shadows')?.value || 50);
        const highlights = parseInt(document.getElementById('lighting-highlights')?.value || 50);
        const contrast = parseInt(document.getElementById('lighting-contrast')?.value || 50);

        // === CSS Filters on the image ===

        // Exposure → brightness: 0 → 0.3 (very dark), 50 → 1.0, 100 → 1.8 (very bright)
        const exposureBrightness = 0.3 + (exposure / 100) * 1.5;

        // Contrast: 0 → 0.5 (flat), 50 → 1.0, 100 → 1.8 (punchy)
        const contrastVal = 0.5 + (contrast / 100) * 1.3;

        // Shadows: 0 = crush blacks (darken lows), 50 = natural, 100 = lift shadows (brighten lows)
        // We approximate by shifting the black point via brightness + inverse contrast adjustment
        const shadowShift = (shadows - 50) / 50; // -1 to +1
        const shadowBrightness = 1.0 + shadowShift * 0.12; // 0.88 to 1.12

        // Highlights: 0 = blow out (brighter highs), 50 = natural, 100 = recover (pull down highs)
        const highlightShift = (highlights - 50) / 50; // -1 to +1
        const highlightBrightness = 1.0 - highlightShift * 0.1; // brighten when low, darken when high

        // Combined brightness
        const totalBrightness = exposureBrightness * shadowBrightness * highlightBrightness;

        // Warmth → color temperature shift via CSS filter chain
        // Cool tones: sepia + hue-rotate to blue
        // Warm tones: sepia for amber shift
        let warmthFilter = '';
        if (warmth > 55) {
            const w = (warmth - 50) / 50; // 0 to 1
            warmthFilter = `sepia(${(w * 0.35).toFixed(2)}) saturate(${(1 + w * 0.4).toFixed(2)})`;
        } else if (warmth < 45) {
            const c = (50 - warmth) / 50; // 0 to 1
            warmthFilter = `sepia(${(c * 0.2).toFixed(2)}) saturate(${(1 + c * 0.3).toFixed(2)}) hue-rotate(${Math.round(c * 190)}deg)`;
        }

        // Apply combined CSS filter to the image
        const filterStr = `brightness(${totalBrightness.toFixed(3)}) contrast(${contrastVal.toFixed(3)}) ${warmthFilter}`.trim();
        editModalImage.style.filter = filterStr;

        // === Radial gradient overlay (light position + intensity + ambient) ===

        // Light source color from warmth (for the gradient glow)
        let r, g, b;
        if (warmth < 50) {
            const t = warmth / 50;
            r = Math.round(140 + t * 115);
            g = Math.round(170 + t * 85);
            b = 255;
        } else {
            const t = (warmth - 50) / 50;
            r = 255;
            g = Math.round(255 - t * 55);
            b = Math.round(255 - t * 155);
        }

        const lightAlpha = (intensity / 100) * 0.45;
        const lightColor = `rgba(${r}, ${g}, ${b}, ${lightAlpha})`;

        // Ambient controls darkening of areas away from the light source
        // Low ambient = dark vignette around the light, High ambient = no darkening
        const ambientDarkness = ((100 - ambient) / 100) * 0.45;
        const darkColor = `rgba(0, 0, 0, ${ambientDarkness.toFixed(2)})`;

        // Composite gradient: bright at light position → transparent → dark at edges
        if (lightingOverlayEl) {
            lightingOverlayEl.style.background =
                `radial-gradient(ellipse at ${lightingPos.x}% ${lightingPos.y}%, ` +
                `${lightColor} 0%, ` +
                `rgba(0, 0, 0, 0) 50%, ` +
                `${darkColor} 100%)`;
        }
    }

    function updateDirectionFromPosition() {
        const x = lightingPos.x;
        const y = lightingPos.y;
        let dir = 'center';
        if (y < 33) {
            if (x < 33) dir = 'top-left';
            else if (x > 66) dir = 'top-right';
            else dir = 'top';
        } else if (y > 66) {
            if (x < 33) dir = 'bottom-left';
            else if (x > 66) dir = 'bottom-right';
            else dir = 'bottom';
        } else {
            if (x < 33) dir = 'left';
            else if (x > 66) dir = 'right';
            else dir = 'center';
        }

        document.querySelectorAll('.lighting-dir-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.lighting-dir-btn[data-dir="${dir}"]`)?.classList.add('active');
    }

    function setLightPositionFromDirection(dir) {
        const positions = {
            'top-left': { x: 15, y: 15 },
            'top': { x: 50, y: 10 },
            'top-right': { x: 85, y: 15 },
            'left': { x: 10, y: 50 },
            'center': { x: 50, y: 50 },
            'right': { x: 90, y: 50 },
            'bottom-left': { x: 15, y: 85 },
            'bottom': { x: 50, y: 90 },
            'bottom-right': { x: 85, y: 85 },
        };
        const pos = positions[dir] || positions['center'];
        lightingPos.x = pos.x;
        lightingPos.y = pos.y;
        updateLightSourcePosition();
        updateLightingPreview();
    }

    async function applyLighting() {
        const intensity = parseInt(document.getElementById('lighting-intensity')?.value || 60);
        const warmth = parseInt(document.getElementById('lighting-warmth')?.value || 50);
        const ambient = parseInt(document.getElementById('lighting-ambient')?.value || 40);
        const exposure = parseInt(document.getElementById('lighting-exposure')?.value || 50);
        const shadows = parseInt(document.getElementById('lighting-shadows')?.value || 50);
        const highlights = parseInt(document.getElementById('lighting-highlights')?.value || 50);
        const contrast = parseInt(document.getElementById('lighting-contrast')?.value || 50);

        // --- Map warmth to Kelvin color temperature ---
        // 0 = 8000K (very cool/blue daylight), 50 = 5500K (neutral daylight), 100 = 2700K (warm tungsten)
        const kelvin = Math.round(8000 - (warmth / 100) * 5300);
        let colorTempDesc;
        if (kelvin >= 7000) colorTempDesc = `very cool blue daylight (approximately ${kelvin}K), similar to open shade or overcast sky`;
        else if (kelvin >= 6000) colorTempDesc = `cool daylight (approximately ${kelvin}K), similar to cloudy sky or shade`;
        else if (kelvin >= 5000) colorTempDesc = `neutral white daylight (approximately ${kelvin}K), similar to midday sun or electronic flash`;
        else if (kelvin >= 4000) colorTempDesc = `slightly warm white light (approximately ${kelvin}K), similar to late afternoon sun`;
        else if (kelvin >= 3200) colorTempDesc = `warm golden light (approximately ${kelvin}K), similar to golden hour sunlight or halogen bulbs`;
        else colorTempDesc = `very warm amber/tungsten light (approximately ${kelvin}K), similar to candlelight or incandescent bulbs`;

        // --- Map intensity to exposure/brightness ---
        let intensityDesc;
        if (intensity < 15) intensityDesc = 'very dim, barely noticeable key light — subtle luminance lift only';
        else if (intensity < 30) intensityDesc = 'soft, gentle key light — like a window on an overcast day, low contrast';
        else if (intensity < 50) intensityDesc = 'moderate key light — clearly directional but not harsh, like diffused studio strobe';
        else if (intensity < 70) intensityDesc = 'strong, prominent key light — clearly defined highlights, like a beauty dish or softbox at close range';
        else if (intensity < 85) intensityDesc = 'very bright key light — high-key-style, intense highlights, visible specular reflections';
        else intensityDesc = 'extremely intense, dramatic key light — harsh highlights, blown-out hot spots near the source, strong contrast';

        // --- Map ambient to key-to-fill lighting ratio ---
        let ambientDesc;
        if (ambient < 15) ambientDesc = 'almost no fill light (8:1 key-to-fill ratio). Deep, inky black shadows. Very dramatic, noir-like contrast. Shadow side of face/subject should be nearly black';
        else if (ambient < 30) ambientDesc = 'minimal fill (4:1 key-to-fill ratio). Deep shadows with some detail barely visible. Moody, cinematic look';
        else if (ambient < 45) ambientDesc = 'moderate fill (3:1 key-to-fill ratio). Shadows are visible and directional but still reveal detail. Classic portrait lighting';
        else if (ambient < 60) ambientDesc = 'balanced fill (2:1 key-to-fill ratio). Gentle shadow gradients, most detail preserved in shadows. Commercial/editorial look';
        else if (ambient < 80) ambientDesc = 'generous fill (1.5:1 key-to-fill ratio). Very soft shadows, almost flat. Beauty/fashion lighting style';
        else ambientDesc = 'nearly flat lighting (1:1 ratio). Minimal shadow differentiation, uniform illumination across the entire subject';

        // --- Compute precise light direction using angles ---
        // Convert percentage position to angle from center (0,0 = top-left, 100,100 = bottom-right)
        const centerX = 50, centerY = 50;
        const dx = lightingPos.x - centerX;
        const dy = lightingPos.y - centerY;
        const angleDeg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
        const distFromCenter = Math.round(Math.sqrt(dx * dx + dy * dy));

        // Clock position (12 o'clock = top)
        let clockAngle = ((angleDeg + 90 + 360) % 360); // rotate so 0° = 12 o'clock
        let clockPos = Math.round((clockAngle / 360) * 12);
        if (clockPos === 0) clockPos = 12;
        const clockStr = clockPos + " o'clock";

        // Natural direction description
        let verticalPos, horizontalPos;
        if (lightingPos.y < 20) verticalPos = 'high above';
        else if (lightingPos.y < 40) verticalPos = 'slightly above';
        else if (lightingPos.y < 60) verticalPos = 'at eye level with';
        else if (lightingPos.y < 80) verticalPos = 'slightly below';
        else verticalPos = 'well below';

        if (lightingPos.x < 20) horizontalPos = 'far camera-left of';
        else if (lightingPos.x < 40) horizontalPos = 'to the camera-left of';
        else if (lightingPos.x < 60) horizontalPos = 'directly in front of';
        else if (lightingPos.x < 80) horizontalPos = 'to the camera-right of';
        else horizontalPos = 'far camera-right of';

        // Shadow direction (opposite of light direction)
        let shadowDir;
        if (lightingPos.x < 40 && lightingPos.y < 40) shadowDir = 'Shadows should fall toward the bottom-right of the subject';
        else if (lightingPos.x > 60 && lightingPos.y < 40) shadowDir = 'Shadows should fall toward the bottom-left of the subject';
        else if (lightingPos.x < 40 && lightingPos.y > 60) shadowDir = 'Shadows should fall toward the upper-right of the subject';
        else if (lightingPos.x > 60 && lightingPos.y > 60) shadowDir = 'Shadows should fall toward the upper-left of the subject';
        else if (lightingPos.y < 30) shadowDir = 'Shadows should fall directly downward beneath the subject';
        else if (lightingPos.y > 70) shadowDir = 'Shadows should be cast upward (under-lighting effect, dramatic)';
        else if (lightingPos.x < 30) shadowDir = 'Shadows should fall to the right side of the subject';
        else if (lightingPos.x > 70) shadowDir = 'Shadows should fall to the left side of the subject';
        else shadowDir = 'Shadows should be relatively centered/even (frontal light)';

        // Edge/rim light detection
        const isRimLight = distFromCenter > 40;
        const rimNote = isRimLight ?
            'Because the light is positioned far from center, include a visible rim/edge light on the side nearest the light source, with light wrapping around the contour edges of the subject.' :
            '';

        // --- Map exposure to EV stops ---
        // 0 = -3 EV (very dark), 50 = 0 EV (no change), 100 = +3 EV (very bright)
        const evStops = ((exposure - 50) / 50) * 3; // range: -3 to +3
        let exposureDesc;
        if (Math.abs(evStops) < 0.3) exposureDesc = 'Keep the overall exposure unchanged (0 EV adjustment)';
        else if (evStops < -2) exposureDesc = `Significantly underexpose the image (approximately ${evStops.toFixed(1)} EV). The scene should appear very dark, moody, and low-key`;
        else if (evStops < -1) exposureDesc = `Darken the overall exposure moderately (approximately ${evStops.toFixed(1)} EV). The image should feel dimmer and more subdued`;
        else if (evStops < 0) exposureDesc = `Slightly reduce overall exposure (approximately ${evStops.toFixed(1)} EV). A subtle darkening of the entire scene`;
        else if (evStops < 1) exposureDesc = `Slightly brighten overall exposure (approximately +${evStops.toFixed(1)} EV). A subtle lift to the entire scene`;
        else if (evStops < 2) exposureDesc = `Brighten the overall exposure moderately (approximately +${evStops.toFixed(1)} EV). The scene should feel lighter and more airy`;
        else exposureDesc = `Significantly overexpose the image (approximately +${evStops.toFixed(1)} EV). The scene should appear very bright, high-key, and washed with light`;

        // --- Map shadows slider ---
        // 0 = crush shadows to pure black, 50 = no change, 100 = fully recover shadow detail
        let shadowsDesc;
        if (shadows < 15) shadowsDesc = 'Crush all shadow areas to near-pure black. No detail should be visible in dark regions — dramatic, high-contrast shadow clipping';
        else if (shadows < 35) shadowsDesc = 'Darken shadow regions significantly. Most shadow detail should be lost, with only the darkest tones remaining. Moody and contrasty';
        else if (shadows < 45) shadowsDesc = 'Keep shadows as they naturally fall from the lighting — no recovery or crushing applied';
        else if (shadows < 55) shadowsDesc = 'Keep shadow tones natural with no adjustment';
        else if (shadows < 70) shadowsDesc = 'Gently lift shadows to recover some detail in darker areas while maintaining a sense of depth and dimension';
        else if (shadows < 85) shadowsDesc = 'Substantially lift shadows — reveal significant detail in dark areas. Shadows should feel open and transparent';
        else shadowsDesc = 'Fully recover all shadow detail. Even the darkest areas should show texture and information, as if using heavy shadow recovery in post-processing';

        // --- Map highlights slider ---
        // 0 = clip highlights to pure white, 50 = no change, 100 = fully recover highlights
        let highlightsDesc;
        if (highlights < 15) highlightsDesc = 'Allow highlights to blow out to pure white. Specular areas and bright surfaces should clip freely — bright, ethereal look';
        else if (highlights < 35) highlightsDesc = 'Allow highlights to run hot with some clipping in the brightest areas. A slightly overexposed, dreamy quality in bright zones';
        else if (highlights < 45) highlightsDesc = 'Keep highlights natural — no recovery or clipping adjustment';
        else if (highlights < 55) highlightsDesc = 'Keep highlight tones natural with no adjustment';
        else if (highlights < 70) highlightsDesc = 'Gently pull back highlights to recover some detail in bright areas while maintaining luminosity';
        else if (highlights < 85) highlightsDesc = 'Substantially recover highlights — bring back detail in bright and overexposed areas. Tame specular hotspots';
        else highlightsDesc = 'Fully recover all highlight detail. No clipping in bright areas — even the brightest surfaces should retain texture and tonal information';

        // --- Map contrast slider ---
        // 0 = very flat/low contrast, 50 = neutral, 100 = very high contrast
        let contrastDesc;
        if (contrast < 15) contrastDesc = 'Apply very low contrast — the image should look flat and matte, with a narrow tonal range. Minimal difference between light and dark areas';
        else if (contrast < 35) contrastDesc = 'Reduce contrast for a softer, more muted look. Gentle tonal gradations with less punch';
        else if (contrast < 45) contrastDesc = 'Keep contrast at a natural level — no adjustment';
        else if (contrast < 55) contrastDesc = 'Maintain natural contrast with no adjustment';
        else if (contrast < 70) contrastDesc = 'Increase contrast slightly for more tonal punch. Darks should be a bit darker and lights a bit brighter';
        else if (contrast < 85) contrastDesc = 'Apply strong contrast — deep blacks and bright whites with an impactful, punchy look';
        else contrastDesc = 'Apply very high contrast — dramatic separation between darks and lights, with deep rich blacks and bright crisp whites. Bold and cinematic';

        // Build sections only for non-default values to keep prompt focused
        const exposureSection = Math.abs(evStops) >= 0.3 ? `EXPOSURE: ${exposureDesc}.\n\n` : '';
        const shadowsSection = (shadows < 45 || shadows > 55) ? `SHADOW TONES: ${shadowsDesc}.\n\n` : '';
        const highlightsSection = (highlights < 45 || highlights > 55) ? `HIGHLIGHT TONES: ${highlightsDesc}.\n\n` : '';
        const contrastSection = (contrast < 45 || contrast > 55) ? `CONTRAST: ${contrastDesc}.\n\n` : '';

        const editPrompt =
            `RELIGHTING INSTRUCTION: Change the lighting of this image precisely as described below. ` +
            `Do NOT change the subject, pose, composition, framing, or background content — ONLY modify the lighting, shadows, and highlights.\n\n` +
            `KEY LIGHT POSITION: The primary light source is positioned ${verticalPos} and ${horizontalPos} the subject ` +
            `(${clockStr} position, at ${Math.round(lightingPos.x)}% from left edge, ${Math.round(lightingPos.y)}% from top edge of the frame). ` +
            `${distFromCenter < 10 ? 'This is nearly frontal/flat lighting.' : ''}\n\n` +
            `KEY LIGHT QUALITY: ${intensityDesc}.\n\n` +
            `COLOR TEMPERATURE: ${colorTempDesc}. Apply this color cast to all illuminated surfaces — highlights, midtones, and skin tones should reflect this temperature.\n\n` +
            `AMBIENT / FILL: ${ambientDesc}.\n\n` +
            `SHADOWS: ${shadowDir}. Shadow edges should be ${intensity > 60 ? 'relatively hard and well-defined' : 'soft and gradual'} given the key light intensity.\n\n` +
            `${rimNote ? 'RIM LIGHT: ' + rimNote + '\n\n' : ''}` +
            exposureSection + shadowsSection + highlightsSection + contrastSection +
            `PHYSICS: Ensure realistic light falloff (inverse square law), proper specular highlights on reflective/glossy surfaces, ` +
            `correct subsurface scattering on skin (especially ears and thin areas), and natural caustics. ` +
            `The lighting should look physically plausible and professionally executed.`;

        const previousSrc = editModalImage.src;
        // Directly set vortex center to light source position before panel closes
        vortexCenter = {
            x: (lightingPos.x / 100) * drawCanvas.width,
            y: (lightingPos.y / 100) * drawCanvas.height
        };
        console.log('[Vortex] lighting center:', vortexCenter, 'from lightingPos:', lightingPos);
        closeLightingPanel();
        editModalImage.closest('.edit-modal__canvas').classList.add('edit-loading');
        showToast('Applying lighting...');

        // Show undo/redo + Done disabled during loading
        if (editDoneTopBtn) editDoneTopBtn.style.display = 'none';
        editUndoBtn.disabled = true;
        editRedoBtn.disabled = true;
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = false;
            subtoolDoneBtn.style.display = '';
            subtoolDoneBtn.classList.add('disabled');
        }

        // Create abort controller and show cancel in nav
        const ac = createAbortController();
        showEditLoadingCancel(() => {
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
            updateUndoRedoState();
        });

        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);

            await seamlessCrossfade(newDataUrl);

            pushEditAction({ type: 'effect', name: 'lighting', previousSrc, newSrc: newDataUrl });
            showToast('Lighting applied');
        } catch (err) {
            if (err.name === 'AbortError') return; // User cancelled
            console.error('Lighting error:', err);
            showToast('Lighting failed: ' + err.message);
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
        } finally {
            hideEditLoadingCancel();
            requestAnimationFrame(sizeDrawCanvas);
            // Re-enable Done and undo/redo
            if (subtoolDoneBtn) {
                subtoolDoneBtn.classList.remove('disabled');
            }
            updateUndoRedoState();
        }
    }

    // --- Lighting Panel Event Listeners ---
    document.getElementById('lighting-close-btn')?.addEventListener('click', closeLightingPanel);
    document.getElementById('lighting-apply-btn')?.addEventListener('click', applyLighting);

    // Direction buttons
    document.querySelectorAll('.lighting-dir-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lighting-dir-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setLightPositionFromDirection(btn.dataset.dir);
        });
    });

    // Sliders
    ['intensity', 'warmth', 'ambient', 'exposure', 'shadows', 'highlights', 'contrast'].forEach(name => {
        const slider = document.getElementById(`lighting-${name}`);
        const valEl = document.getElementById(`lighting-${name}-val`);
        if (slider && valEl) {
            slider.addEventListener('input', () => {
                valEl.textContent = slider.value;
                updateLightingPreview();
            });
        }
    });

    // ─── Portrait Mode ───
    let portraitActive = false;
    let portraitFocusPos = { x: 50, y: 50 }; // percentage position of focus center
    let portraitFocusEl = null;
    let portraitDrag = { active: false };

    function openPortraitPanel() {
        const panel = document.getElementById('portrait-panel');
        if (!panel) return;
        portraitActive = true;
        panel.hidden = false;

        // Hide appbar elements (same pattern as lighting)
        if (editCancelBtn) editCancelBtn.style.display = 'none';
        if (editDoneTopBtn) editDoneTopBtn.style.display = 'none';
        const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
        if (appbarActions) appbarActions.style.display = 'none';
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) { subtoolDoneBtn.hidden = true; subtoolDoneBtn.style.display = 'none'; }

        // Reset sliders to defaults
        const defaults = { depth: 60, bokeh: 50, halation: 35, vignette: 40 };
        for (const [name, val] of Object.entries(defaults)) {
            const slider = document.getElementById(`portrait-${name}`);
            const valEl = document.getElementById(`portrait-${name}-val`);
            if (slider) slider.value = val;
            if (valEl) valEl.textContent = val;
        }

        // Reset focus position to center
        portraitFocusPos = { x: 50, y: 50 };

        // Create focus point + overlays
        createPortraitFocusPoint();
        createPortraitOverlays();
        updatePortraitPreview();
        showToast('Drag the focus target to set the sharp area');
    }

    function closePortraitPanel(restoreAppbar = true) {
        const panel = document.getElementById('portrait-panel');
        if (panel) panel.hidden = true;
        portraitActive = false;
        removePortraitOverlays();
        removePortraitFocusPoint();
        editModalImage.style.filter = '';

        if (restoreAppbar) {
            // Restore Cancel button
            if (editCancelBtn) { editCancelBtn.hidden = false; editCancelBtn.style.display = ''; }
            // Restore undo/redo
            const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
            if (appbarActions) { appbarActions.hidden = false; appbarActions.style.display = ''; }
            // Update button states
            updateUndoRedoState();
        }
    }

    // --- Focus point (draggable crosshair) ---
    function createPortraitFocusPoint() {
        removePortraitFocusPoint();
        const container = drawCanvas.parentElement;
        if (!container) return;

        portraitFocusEl = document.createElement('div');
        portraitFocusEl.className = 'portrait-focus-point';
        updatePortraitFocusPosition();
        container.appendChild(portraitFocusEl);

        // Drag handlers
        portraitFocusEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            portraitDrag.active = true;
            portraitFocusEl.setPointerCapture(e.pointerId);
        });

        portraitFocusEl.addEventListener('pointermove', (e) => {
            if (!portraitDrag.active) return;
            const imgRect = editModalImage.getBoundingClientRect();
            const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
            const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
            portraitFocusPos.x = Math.max(5, Math.min(95, x));
            portraitFocusPos.y = Math.max(5, Math.min(95, y));
            updatePortraitFocusPosition();
            updatePortraitPreview();
        });

        portraitFocusEl.addEventListener('pointerup', () => {
            portraitDrag.active = false;
        });
    }

    function updatePortraitFocusPosition() {
        if (!portraitFocusEl) return;
        const imgRect = editModalImage.getBoundingClientRect();
        const containerRect = drawCanvas.parentElement.getBoundingClientRect();
        const imgOffsetX = imgRect.left - containerRect.left;
        const imgOffsetY = imgRect.top - containerRect.top;

        const left = imgOffsetX + (portraitFocusPos.x / 100) * imgRect.width;
        const top = imgOffsetY + (portraitFocusPos.y / 100) * imgRect.height;
        portraitFocusEl.style.left = left + 'px';
        portraitFocusEl.style.top = top + 'px';
    }

    function removePortraitFocusPoint() {
        if (portraitFocusEl) {
            portraitFocusEl.remove();
            portraitFocusEl = null;
        }
    }

    let portraitBlurClone = null;   // blurred copy of the image for real depth-of-field
    let portraitBokehEl = null;     // scattered luminous bokeh circles
    let portraitHalationEl = null;  // bright screen-blend glow
    let portraitVignetteEl = null;  // edge darkening

    function createPortraitOverlays() {
        removePortraitOverlays();
        const container = editModalImage.closest('.edit-modal__canvas');
        if (!container) return;

        // Clone the image for realistic depth blur
        portraitBlurClone = editModalImage.cloneNode(true);
        portraitBlurClone.className = 'portrait-blur-clone';
        portraitBlurClone.removeAttribute('id');
        portraitBlurClone.draggable = false;
        // Position clone exactly over the original image using computed rects
        const imgRect = editModalImage.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = imgRect.top - containerRect.top;
        const left = imgRect.left - containerRect.left;
        portraitBlurClone.style.cssText = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: ${imgRect.width}px;
            height: ${imgRect.height}px;
            object-fit: cover;
            pointer-events: none;
            z-index: 3;
        `;
        container.appendChild(portraitBlurClone);

        // Bokeh circles overlay
        portraitBokehEl = document.createElement('div');
        portraitBokehEl.className = 'portrait-bokeh-overlay';
        container.appendChild(portraitBokehEl);

        // Halation glow overlay
        portraitHalationEl = document.createElement('div');
        portraitHalationEl.className = 'portrait-halation-overlay';
        container.appendChild(portraitHalationEl);

        // Vignette overlay
        portraitVignetteEl = document.createElement('div');
        portraitVignetteEl.className = 'portrait-vignette-overlay';
        container.appendChild(portraitVignetteEl);
    }

    function removePortraitOverlays() {
        if (portraitBlurClone) { portraitBlurClone.remove(); portraitBlurClone = null; }
        if (portraitBokehEl) { portraitBokehEl.remove(); portraitBokehEl = null; }
        if (portraitHalationEl) { portraitHalationEl.remove(); portraitHalationEl = null; }
        if (portraitVignetteEl) { portraitVignetteEl.remove(); portraitVignetteEl = null; }
    }

    function updatePortraitPreview() {
        if (!portraitActive) return;
        const depth = parseInt(document.getElementById('portrait-depth')?.value || 60);
        const bokeh = parseInt(document.getElementById('portrait-bokeh')?.value || 50);
        const halation = parseInt(document.getElementById('portrait-halation')?.value || 35);
        const vignette = parseInt(document.getElementById('portrait-vignette')?.value || 40);

        // 1. DEPTH — blurred image clone with radial mask
        //    The clone sits on top of the original image, blurred,
        //    with a CSS mask that makes the center transparent so the sharp original shows through
        if (portraitBlurClone) {
            const blurPx = (depth / 100) * 12; // 0 to 12px real image blur
            const focusSize = 55 - (depth / 100) * 20;
            const brightBoost = 1 + (halation / 100) * 0.08;

            if (blurPx > 0.5) {
                portraitBlurClone.style.filter = `blur(${blurPx.toFixed(1)}px) brightness(${brightBoost.toFixed(3)}) saturate(0.85)`;
                const fx = portraitFocusPos.x.toFixed(1);
                const fy = portraitFocusPos.y.toFixed(1);
                const maskGrad = `radial-gradient(ellipse ${focusSize}% ${focusSize * 0.85}% at ${fx}% ${fy}%, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 65%, black 80%)`;
                portraitBlurClone.style.maskImage = maskGrad;
                portraitBlurClone.style.webkitMaskImage = maskGrad;
                portraitBlurClone.style.opacity = '1';
            } else {
                portraitBlurClone.style.opacity = '0';
            }
        }

        // 2. BOKEH — luminous orbs in the blurred region
        if (portraitBokehEl) {
            if (bokeh > 5 && depth > 10) {
                const count = Math.floor((bokeh / 100) * 10) + 4;
                const alpha = 0.08 + (bokeh / 100) * 0.22;
                const circles = [];
                const positions = [
                    [12, 15], [82, 10], [8, 75], [88, 80],
                    [20, 85], [75, 20], [90, 50], [5, 45],
                    [30, 8], [65, 90], [50, 12], [45, 88],
                    [15, 50], [85, 45]
                ];
                for (let i = 0; i < Math.min(count, positions.length); i++) {
                    const [px, py] = positions[i];
                    const size = 20 + (bokeh / 100) * 45 + (i % 3) * 12;
                    const a = alpha * (0.5 + (i % 4) * 0.2);
                    circles.push(
                        `radial-gradient(circle ${size}px at ${px}% ${py}%, rgba(255,252,240,${a.toFixed(3)}) 0%, rgba(255,248,220,${(a * 0.2).toFixed(3)}) 55%, transparent 100%)`
                    );
                }
                portraitBokehEl.style.background = circles.join(', ');
                portraitBokehEl.style.opacity = '1';
            } else {
                portraitBokehEl.style.opacity = '0';
            }
        }

        // 3. HALATION — warm glow bloom from center (screen blend)
        if (portraitHalationEl) {
            const haloStr = (halation / 100) * 0.35;
            if (haloStr > 0.01) {
                portraitHalationEl.style.background = `radial-gradient(ellipse 75% 70% at ${portraitFocusPos.x.toFixed(1)}% ${portraitFocusPos.y.toFixed(1)}%,
                    rgba(255,248,230,${haloStr.toFixed(3)}) 0%,
                    rgba(255,240,210,${(haloStr * 0.4).toFixed(3)}) 30%,
                    rgba(255,235,200,${(haloStr * 0.1).toFixed(3)}) 55%,
                    transparent 75%)`;
                portraitHalationEl.style.mixBlendMode = 'screen';
                portraitHalationEl.style.opacity = '1';
            } else {
                portraitHalationEl.style.opacity = '0';
            }
        }

        // 4. IMAGE FILTER — subject pop on the original sharp image
        const contrastBoost = 1 + (depth / 100) * 0.1;
        const satBoost = 1 + (bokeh / 100) * 0.08;
        const imgBright = 1 + (halation / 100) * 0.04;
        editModalImage.style.filter = `contrast(${contrastBoost.toFixed(3)}) saturate(${satBoost.toFixed(3)}) brightness(${imgBright.toFixed(3)})`;

        // 5. VIGNETTE — cinematic edge darkening
        if (portraitVignetteEl) {
            const vigStr = (vignette / 100) * 0.7;
            if (vigStr > 0.02) {
                portraitVignetteEl.style.background = `radial-gradient(ellipse 65% 60% at ${portraitFocusPos.x.toFixed(1)}% ${portraitFocusPos.y.toFixed(1)}%,
                    transparent 20%,
                    rgba(0,0,0,${(vigStr * 0.1).toFixed(3)}) 45%,
                    rgba(0,0,0,${(vigStr * 0.35).toFixed(3)}) 65%,
                    rgba(0,0,0,${(vigStr * 0.7).toFixed(3)}) 80%,
                    rgba(0,0,0,${vigStr.toFixed(3)}) 100%)`;
                portraitVignetteEl.style.opacity = '1';
            } else {
                portraitVignetteEl.style.opacity = '0';
            }
        }
    }

    async function applyPortrait() {
        const depth = parseInt(document.getElementById('portrait-depth')?.value || 60);
        const bokeh = parseInt(document.getElementById('portrait-bokeh')?.value || 50);
        const halation = parseInt(document.getElementById('portrait-halation')?.value || 35);
        const warmth = 55; // fixed natural warmth
        const vignette = parseInt(document.getElementById('portrait-vignette')?.value || 40);

        // Map slider values to descriptive terms
        const depthDesc = depth < 30 ? 'subtle, gentle depth separation'
            : depth < 60 ? 'moderate depth-of-field with natural background softening'
                : depth < 80 ? 'pronounced cinematic depth-of-field with strong subject isolation'
                    : 'extreme shallow depth-of-field, dramatic subject isolation with heavily defocused background';

        const bokehDesc = bokeh < 25 ? 'minimal bokeh'
            : bokeh < 50 ? 'soft, understated bokeh highlights'
                : bokeh < 75 ? 'luminous, clearly visible bokeh orbs with gentle variation in size and brightness'
                    : 'dramatic, large bokeh highlights with beautiful circular light forms, creamy light diffusion';

        const halationDesc = halation < 25 ? 'no visible halation'
            : halation < 50 ? 'subtle halation glow around bright areas'
                : halation < 75 ? 'visible halation and light wrap — highlights bloom softly into surrounding areas'
                    : 'strong cinematic halation, generous light wrap, analog warmth bleeding from highlights';

        const warmthDesc = warmth < 30 ? 'cool, neutral tones'
            : warmth < 50 ? 'slightly warm, natural skin tone preservation'
                : warmth < 70 ? 'warm golden-hour tones with gentle warmth in highlights and skin'
                    : 'rich warm amber glow, golden light suffusing the entire frame';

        const vignetteDesc = vignette < 20 ? 'no vignette'
            : vignette < 50 ? 'subtle natural vignette gently guiding the eye to the subject'
                : vignette < 75 ? 'noticeable cinematic vignette, edges darken to frame the subject'
                    : 'strong dramatic vignette, deep edge darkening creating an intimate spotlight effect';

        const prompt = `Create an advanced cinematic portrait mode effect on this image. ` +
            `The focus center point is at approximately ${Math.round(portraitFocusPos.x)}% from the left edge and ${Math.round(portraitFocusPos.y)}% from the top edge of the image. ` +
            `Keep the area around this focus point sharp and in-focus, and gradually increase blur with distance from this point.\n\n` +
            `DEPTH OF FIELD: ${depthDesc}. Apply a soft depth-driven blur that increases gradually with distance from the focus point, ` +
            `resembling real optical falloff combined with cinematic diffusion. No artificial masking edges.\n\n` +
            `BOKEH: ${bokehDesc}. Generate bokeh highlights from bright background areas using soft-edged circular light forms ` +
            `with subtle variation in size, brightness, and depth softness.\n\n` +
            `HALATION & LIGHT WRAP: ${halationDesc}. Introduce gentle light wrap around the subject where background luminance ` +
            `softly influences edges and skin tones. Simulate micro lens breathing and natural optical imperfection.\n\n` +
            `COLOR & WARMTH: ${warmthDesc}. Background elements should feel calm and memory-like, ` +
            `slightly desaturated relative to the subject while preserving color harmony.\n\n` +
            `VIGNETTE: ${vignetteDesc}.\n\n` +
            `SKIN & SUBJECT: Maintain absolute skin realism with natural texture — NO artificial smoothing, NO beauty filter. ` +
            `Preserve all facial details, pores, and natural imperfections.\n\n` +
            `OVERALL FEEL: The world quietly recedes while attention settles on the subject — ` +
            `cinematic, restrained, elegant, and emotionally immersive. ` +
            `The image should feel captured through a premium cinema lens, not processed by software. ` +
            `Keep the subject's identity, pose, expression, clothing, and all details exactly the same.`;

        const previousSrc = editModalImage.src;
        // Set particle vortex to focus point position
        vortexCenter = {
            x: (portraitFocusPos.x / 100) * drawCanvas.width,
            y: (portraitFocusPos.y / 100) * drawCanvas.height
        };
        // Close the bottom sheet but stay in effects tab
        closePortraitPanel(false);
        editModalImage.closest('.edit-modal__canvas').classList.add('edit-loading');
        showToast('Applying portrait mode...');

        if (editDoneTopBtn) editDoneTopBtn.style.display = 'none';
        editUndoBtn.disabled = true;
        editRedoBtn.disabled = true;
        // Hide Done button entirely during loading
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = true;
            subtoolDoneBtn.style.display = 'none';
        }

        // Create abort controller and show cancel in nav
        const ac = createAbortController();
        showEditLoadingCancel(() => {
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
            updateUndoRedoState();
        });

        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const newDataUrl = await editWithGemini(imageBase64, prompt, ac.signal);

            pushEditAction({ type: 'effect', name: 'portrait', previousSrc, newSrc: newDataUrl });
            await seamlessCrossfade(newDataUrl);
            showToast('Portrait mode applied');
        } catch (err) {
            if (err.name === 'AbortError') return; // User cancelled
            console.error('Portrait mode error:', err);
            showToast('Portrait mode failed: ' + err.message);
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
        } finally {
            hideEditLoadingCancel();
            requestAnimationFrame(sizeDrawCanvas);
            // Show Done button now that loading is complete
            if (subtoolDoneBtn) {
                subtoolDoneBtn.hidden = false;
                subtoolDoneBtn.style.display = '';
                subtoolDoneBtn.classList.remove('disabled');
            }
            // Show undo/redo buttons
            const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
            if (appbarActions) { appbarActions.hidden = false; appbarActions.style.display = ''; }
            updateUndoRedoState();
        }
    }

    // Portrait panel event listeners
    document.getElementById('portrait-close-btn')?.addEventListener('click', closePortraitPanel);
    document.getElementById('portrait-apply-btn')?.addEventListener('click', applyPortrait);

    ['depth', 'bokeh', 'halation', 'vignette'].forEach(name => {
        const slider = document.getElementById(`portrait-${name}`);
        const valEl = document.getElementById(`portrait-${name}-val`);
        if (slider && valEl) {
            slider.addEventListener('input', () => {
                valEl.textContent = slider.value;
                updatePortraitPreview();
            });
        }
    });



    function clearSelection() {
        marqueeSelection = null;
        marqueeMode = 'idle';
        stopMarchingAnts();
        // Also kill any ghost box animation
        stopGhostBoxPulse();
        autoTextRegions = [];
        removeFloatingText();
        removeTextCursor();
        removeTextHighlights();
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        if (activeToolEl && activeToolEl.dataset.tool === 'text') {
            const editInput = document.getElementById('edit-input-text');
            const editSendBtn = document.getElementById('edit-send-btn');
            if (editInput) { editInput.disabled = true; editInput.placeholder = 'Tap text or draw a selection'; editInput.value = ''; }
            if (editSendBtn) editSendBtn.disabled = true;
        }
        updateToolButtonStates();
    }

    // After marquee is drawn on Text tool, detect text in the region
    async function detectTextInRegion() {
        if (!marqueeSelection || marqueeSelection.w < 3 || marqueeSelection.h < 3) {
            clearSelection();
            return;
        }

        const editInput = document.getElementById('edit-input-text');
        const editSendBtn = document.getElementById('edit-send-btn');

        // Show detecting state
        if (editInput) {
            editInput.disabled = true;
            editInput.value = '';
            editInput.placeholder = 'Detecting text...';
        }
        if (editSendBtn) editSendBtn.disabled = true;

        startMarchingAnts();

        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);

            // Calculate region as percentage
            const x1Pct = Math.round((marqueeSelection.x / drawCanvas.width) * 100);
            const y1Pct = Math.round((marqueeSelection.y / drawCanvas.height) * 100);
            const x2Pct = Math.round(((marqueeSelection.x + marqueeSelection.w) / drawCanvas.width) * 100);
            const y2Pct = Math.round(((marqueeSelection.y + marqueeSelection.h) / drawCanvas.height) * 100);

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Look at this image. The user has selected a rectangular region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%) (left%, top% to right%, bottom%). What text is inside or overlapping that selected region? Return ONLY the exact text string found in that region, nothing else. No quotes, no explanation. If there is no text in that region, return "NO_TEXT_FOUND".`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: imageBase64,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT'],
                }
            };

            const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig);
            const candidates = data.candidates || [];
            let detectedText = '';

            for (const candidate of candidates) {
                for (const part of (candidate.content?.parts || [])) {
                    if (part.text) {
                        detectedText = part.text.trim();
                        break;
                    }
                }
                if (detectedText) break;
            }

            if (!detectedText || detectedText === 'NO_TEXT_FOUND') {
                showToast('No text found — you can add new text');
                detectedOriginalText = null;
                allStrokes = [{ type: 'marquee', bounds: { ...marqueeSelection } }];
                pushEditAction({ type: 'stroke', data: { type: 'marquee', bounds: { ...marqueeSelection } } });
                // Create empty floating text for new text entry
                createFloatingText('', marqueeSelection);
                if (editInput) {
                    editInput.value = '';
                    editInput.disabled = false;
                    editInput.placeholder = 'Type text to add';
                    editInput.focus();
                }
                if (editSendBtn) editSendBtn.disabled = false;
                updateToolButtonStates();
                return;
            }

            // Store original text and populate input
            detectedOriginalText = detectedText;
            allStrokes = [{ type: 'marquee', bounds: { ...marqueeSelection } }];
            pushEditAction({ type: 'stroke', data: { type: 'marquee', bounds: { ...marqueeSelection } } });
            // Create floating text with detected text
            createFloatingText(detectedText, marqueeSelection);
            if (editInput) {
                editInput.value = detectedText;
                editInput.disabled = false;
                editInput.placeholder = 'Edit the text';
                editInput.focus();
                editInput.select();
            }
            if (editSendBtn) editSendBtn.disabled = false;
            updateToolButtonStates();
            showToast(`Detected: "${detectedText}"`);

        } catch (err) {
            console.error('Text detection error:', err);
            showToast('Text detection failed: ' + err.message);
            if (editInput) {
                editInput.disabled = false;
                editInput.placeholder = 'Tap text or draw a selection';
            }
        }
    }

    // Tap-to-detect: user clicks a point, we find the nearest text and its bounding box
    async function detectTextAtPoint(clickX, clickY) {
        const editInput = document.getElementById('edit-input-text');
        const editSendBtn = document.getElementById('edit-send-btn');

        // Show detecting state
        if (editInput) {
            editInput.disabled = true;
            editInput.value = '';
            editInput.placeholder = 'Detecting text...';
        }
        if (editSendBtn) editSendBtn.disabled = true;

        try {
            const imageBase64 = await imgSrcToBase64(editModalImage);
            const apiKey = getApiKey();
            if (!apiKey) throw new Error('No API key provided');

            // Calculate click position as percentage of the image
            // The image is centered in the container, so we need to map canvas coords to image coords
            const img = editModalImage;
            const imgRect = img.getBoundingClientRect();
            const containerRect = drawCanvas.parentElement.getBoundingClientRect();
            const imgOffsetX = imgRect.left - containerRect.left;
            const imgOffsetY = imgRect.top - containerRect.top;
            const imgRelX = clickX - imgOffsetX;
            const imgRelY = clickY - imgOffsetY;
            const xPct = Math.round((imgRelX / imgRect.width) * 100);
            const yPct = Math.round((imgRelY / imgRect.height) * 100);

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Look at this image. The user clicked at approximately (${xPct}%, ${yPct}%) of the image. Find the text element that is at or nearest to that point. Return a JSON object with this format: {"text": "the exact text", "bounds": {"x1": left%, "y1": top%, "x2": right%, "y2": bottom%}}. The bounds should be percentages of the image dimensions. If there is no text in the image or near that point, return {"text": "NO_TEXT_FOUND", "bounds": null}. Return ONLY the JSON, nothing else.`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: imageBase64,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseModalities: ['TEXT'],
                }
            };

            const response = await fetchWithFallback(apiKey, requestBody);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const candidates = data.candidates || [];
            let resultText = '';

            for (const candidate of candidates) {
                for (const part of (candidate.content?.parts || [])) {
                    if (part.text) {
                        resultText = part.text.trim();
                        break;
                    }
                }
                if (resultText) break;
            }

            // Parse JSON response — strip markdown code fences if present
            let parsed;
            try {
                const cleaned = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (parseErr) {
                // Fallback: try to extract just the text
                console.warn('Could not parse JSON response:', resultText);
                showToast('Could not detect text at that point');
                if (editInput) {
                    editInput.disabled = false;
                    editInput.placeholder = 'Tap text or draw a selection';
                }
                return;
            }

            if (!parsed.text || parsed.text === 'NO_TEXT_FOUND' || !parsed.bounds) {
                showToast('No text found at that point');
                if (editInput) {
                    editInput.disabled = false;
                    editInput.placeholder = 'Tap on text or draw a selection';
                }
                return;
            }

            // Convert percentage bounds to canvas pixel coordinates
            const bounds = parsed.bounds;
            const canvasW = drawCanvas.width;
            const canvasH = drawCanvas.height;
            const bx = imgOffsetX + (bounds.x1 / 100) * imgRect.width;
            const by = imgOffsetY + (bounds.y1 / 100) * imgRect.height;
            const bw = ((bounds.x2 - bounds.x1) / 100) * imgRect.width;
            const bh = ((bounds.y2 - bounds.y1) / 100) * imgRect.height;

            // Set up marquee and floating text
            marqueeSelection = { x: bx, y: by, w: bw, h: bh };
            detectedOriginalText = parsed.text;
            allStrokes = [{ type: 'marquee', bounds: { ...marqueeSelection } }];
            pushEditAction({ type: 'stroke', data: { type: 'marquee', bounds: { ...marqueeSelection } } });

            // Create floating text at detected bounds
            createFloatingText(parsed.text, marqueeSelection);

            if (editInput) {
                editInput.value = parsed.text;
                editInput.disabled = false;
                editInput.placeholder = 'Edit the text';
                editInput.focus();
                editInput.select();
            }
            if (editSendBtn) editSendBtn.disabled = false;
            updateToolButtonStates();
            showToast(`Selected: "${parsed.text}"`);

        } catch (err) {
            console.error('Text point detection error:', err);
            showToast('Text detection failed: ' + err.message);
            if (editInput) {
                editInput.disabled = false;
                editInput.placeholder = 'Tap text or draw a selection';
            }
        }
    }

    // --- Pointer Event Handlers (both Select doodle + Text marquee) ---
    drawCanvas.addEventListener('pointerdown', (e) => {
        if (!isToolActive()) return;
        // Don't start new interactions if floating text is active and being dragged
        if (floatingTextEl && floatingTextDrag.active) return;
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const toolId = activeToolEl?.dataset.tool;

        if (toolId === 'select') {
            // Freehand doodle mode
            isDrawing = true;
            currentStroke = [getCanvasPos(e)];
            drawCanvas.setPointerCapture(e.pointerId);
            removeDoodleTrash(); // Hide trash while drawing new stroke
            // Clear canvas if starting fresh (no existing strokes)
            if (allStrokes.length === 0) {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            }
        } else if (toolId === 'text') {
            // Marquee selection mode
            e.preventDefault();
            const pos = getCanvasPos(e);
            drawCanvas.setPointerCapture(e.pointerId);
            marqueeShift = e.shiftKey;
            marqueeAlt = e.altKey;

            // ── Ghost box hit test ────────────────────────────────────────
            // If the user taps inside a pre-detected ghost box, select it
            // immediately without waiting for another Gemini round-trip.
            if (autoTextRegions.length) {
                const hitRegion = autoTextRegions.find(r =>
                    pos.x >= r.x && pos.x <= r.x + r.w &&
                    pos.y >= r.y && pos.y <= r.y + r.h
                );
                if (hitRegion) {
                    stopGhostBoxPulse();
                    autoTextRegions = [];
                    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                    marqueeSelection = { x: hitRegion.x, y: hitRegion.y, w: hitRegion.w, h: hitRegion.h };
                    detectedOriginalText = hitRegion.text;
                    allStrokes = [{ type: 'marquee', bounds: { ...marqueeSelection } }];
                    pushEditAction({ type: 'stroke', data: { type: 'marquee', bounds: { ...marqueeSelection } } });
                    createFloatingText(hitRegion.text, marqueeSelection);
                    const editInput = document.getElementById('edit-input-text');
                    const editSendBtn = document.getElementById('edit-send-btn');
                    if (editInput) {
                        editInput.value = hitRegion.text;
                        editInput.disabled = false;
                        editInput.placeholder = 'Edit the text';
                        editInput.focus();
                        editInput.select();
                    }
                    if (editSendBtn) editSendBtn.disabled = false;
                    updateToolButtonStates();
                    showToast(`Selected: "${hitRegion.text}"`);
                    marqueeMode = 'idle';
                    return;
                }
            }
            // ─────────────────────────────────────────────────────────────

            const hit = hitTestSelection(pos);
            if (hit.type === 'handle' && marqueeSelection) {
                marqueeMode = 'resizing';
                marqueeResizeHandle = hit.handle;
                marqueeResizeOrigin = { ...marqueeSelection };
                marqueeOrigin = pos;
            } else if (hit.type === 'inside' && marqueeSelection) {
                marqueeMode = 'moving';
                marqueeDragOffset = { x: pos.x - marqueeSelection.x, y: pos.y - marqueeSelection.y };
            } else {
                // User is drawing a custom marquee — clear ghost boxes
                stopGhostBoxPulse();
                autoTextRegions = [];
                marqueeMode = 'drawing';
                marqueeOrigin = pos;
                marqueeSelection = { x: pos.x, y: pos.y, w: 0, h: 0 };
                detectedOriginalText = null;
                stopMarchingAnts();
            }
        }
    });

    drawCanvas.addEventListener('pointermove', (e) => {
        if (!isToolActive()) return;
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const toolId = activeToolEl?.dataset.tool;

        if (toolId === 'select') {
            // Freehand doodle mode
            if (!isDrawing) return;
            const pos = getCanvasPos(e);
            currentStroke.push(pos);
            const prev = currentStroke[currentStroke.length - 2];

            const grad = drawCtx.createLinearGradient(prev.x, prev.y, pos.x, pos.y);
            grad.addColorStop(0, doodleColors[0]);
            grad.addColorStop(1, doodleColors[2]);

            drawCtx.save();
            drawCtx.beginPath();
            drawCtx.strokeStyle = grad;
            drawCtx.lineWidth = 3.56;
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.shadowColor = doodleShadowColor;
            drawCtx.shadowBlur = 4;
            drawCtx.shadowOffsetX = 2;
            drawCtx.shadowOffsetY = 2;
            drawCtx.moveTo(prev.x, prev.y);
            drawCtx.lineTo(pos.x, pos.y);
            drawCtx.stroke();
            drawCtx.restore();
        } else if (toolId === 'text') {
            // Marquee selection mode
            const pos = getCanvasPos(e);
            marqueeShift = e.shiftKey;
            marqueeAlt = e.altKey;

            if (marqueeMode === 'drawing' && marqueeOrigin) {
                let x = marqueeOrigin.x, y = marqueeOrigin.y;
                let w = pos.x - x, h = pos.y - y;
                if (marqueeAlt) {
                    x = marqueeOrigin.x - Math.abs(w);
                    y = marqueeOrigin.y - Math.abs(h);
                    w = Math.abs(w) * 2 * Math.sign(w || 1);
                    h = Math.abs(h) * 2 * Math.sign(h || 1);
                }
                if (marqueeShift) {
                    const size = Math.max(Math.abs(w), Math.abs(h));
                    w = size * Math.sign(w || 1);
                    h = size * Math.sign(h || 1);
                    if (marqueeAlt) { x = marqueeOrigin.x - size; y = marqueeOrigin.y - size; w = size * 2; h = size * 2; }
                }
                marqueeSelection = clampSelection(normalizeSelection({ x, y, w, h }));
                renderCanvas();
            } else if (marqueeMode === 'moving' && marqueeSelection && marqueeDragOffset) {
                let newX = Math.max(0, Math.min(pos.x - marqueeDragOffset.x, drawCanvas.width - marqueeSelection.w));
                let newY = Math.max(0, Math.min(pos.y - marqueeDragOffset.y, drawCanvas.height - marqueeSelection.h));
                marqueeSelection.x = newX;
                marqueeSelection.y = newY;
                renderCanvas();
            } else if (marqueeMode === 'resizing' && marqueeResizeOrigin && marqueeSelection) {
                const orig = marqueeResizeOrigin;
                const dx = pos.x - marqueeOrigin.x, dy = pos.y - marqueeOrigin.y;
                let newSel = { ...orig };
                const hd = marqueeResizeHandle;
                if (hd.includes('e')) newSel.w = orig.w + dx;
                if (hd.includes('w')) { newSel.x = orig.x + dx; newSel.w = orig.w - dx; }
                if (hd.includes('s')) newSel.h = orig.h + dy;
                if (hd.includes('n')) { newSel.y = orig.y + dy; newSel.h = orig.h - dy; }
                if (marqueeShift) { const sz = Math.max(Math.abs(newSel.w), Math.abs(newSel.h)); newSel.w = sz; newSel.h = sz; }
                marqueeSelection = clampSelection(normalizeSelection(newSel));
                renderCanvas();
            } else if (marqueeMode === 'idle') {
                const hit = hitTestSelection(pos);
                if (hit.type === 'handle') drawCanvas.style.cursor = getHandleCursor(hit.handle);
                else if (hit.type === 'inside') drawCanvas.style.cursor = 'move';
                else drawCanvas.style.cursor = 'crosshair';
            }
        }
    });

    drawCanvas.addEventListener('pointerup', (e) => {
        const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
        const toolId = activeToolEl?.dataset.tool;

        if (toolId === 'select') {
            // Freehand doodle mode
            if (!isDrawing) return;
            isDrawing = false;
            if (currentStroke.length > 1) {
                allStrokes.push([...currentStroke]);
                pushEditAction({ type: 'stroke', data: [...currentStroke] });
                // Redraw to detect closed shapes and fill them
                redrawStrokes();
                const editInput = document.getElementById('edit-input-text');
                const editSendBtn = document.getElementById('edit-send-btn');
                if (editInput) {
                    editInput.disabled = false;
                    editInput.placeholder = 'Describe your edit';
                    editInput.focus();
                }
                if (editSendBtn) editSendBtn.disabled = false;
                updateToolButtonStates();
                // Show trash icon if any stroke forms a closed shape
                const hasClosedShape = allStrokes.some(s => Array.isArray(s) && isClosedStroke(s));
                if (hasClosedShape) showDoodleTrash();
            }
            currentStroke = [];
        } else if (toolId === 'text') {
            // Marquee selection mode — finalize and detect text
            if (marqueeMode === 'drawing') {
                marqueeSelection = clampSelection(normalizeSelection(marqueeSelection));
                if (marqueeSelection && marqueeSelection.w >= 3 && marqueeSelection.h >= 3) {
                    // Full marquee drawn — detect text in the region
                    detectTextInRegion();
                } else {
                    // Tiny selection = click/tap — detect text at that point
                    const clickPos = getCanvasPos(e);
                    clearSelection();
                    detectTextAtPoint(clickPos.x, clickPos.y);
                }
            } else if (marqueeMode === 'moving' || marqueeMode === 'resizing') {
                marqueeSelection = clampSelection(normalizeSelection(marqueeSelection));
                startMarchingAnts();
            }
            marqueeMode = 'idle';
        }
    });

    drawCanvas.addEventListener('pointercancel', () => {
        isDrawing = false;
        currentStroke = [];
        marqueeMode = 'idle';
        marqueeOrigin = null;
        redrawStrokes();
        renderCanvas();
    });

    // Escape key clears selection
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && marqueeSelection) {
            clearSelection();
        }
    });



    // --- Open / Close ---
    const editToolsRow = editModal.querySelector('.edit-modal__tools-row');

    // Keywords that suggest the image contains text
    const TEXT_KEYWORDS = /\b(text|word|letter|title|heading|caption|quote|sign|label|typography|font|slogan|tagline|headline|subtitle|banner|poster|logo|writing|written|message|greeting|card)\b/i;

    function imageHasText() {
        const prompt = (responsePromptText?.textContent || '').trim();
        return TEXT_KEYWORDS.test(prompt);
    }

    function enterStarterPage() {
        editTools.forEach(t => {
            t.classList.remove('active');
            t.disabled = false;
            t.style.opacity = '';
            t.style.pointerEvents = '';
        });
        hideAllSubtools();
        closeLightingPanel();
        closePortraitPanel();
        const editInputBar2 = editModal.querySelector('.edit-modal__input');
        const editGestureBar2 = editModal.querySelector('.edit-modal__gesture-bar');
        if (editInputBar2) editInputBar2.hidden = true;
        if (editGestureBar2) editGestureBar2.classList.remove('input-visible');

        // Show X and Edit Image on starter page
        editCloseBtn.hidden = false;
        if (editAppbarCenter) editAppbarCenter.hidden = false;

        // Disable drawing on starter page
        drawCanvas.style.pointerEvents = 'none';
        drawCanvas.style.cursor = '';

        // Reset text tool mode
        activeTextToolMode = false;
        detectedOriginalText = null;
        removeDoodleTrash();

        // Hide undo/redo on starter page
        const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
        if (appbarActions) appbarActions.hidden = true;

        // Hide Done button on starter page
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = true;
            subtoolDoneBtn.style.display = 'none';
        }

        // Hide Cancel on starter page
        if (editCancelBtn) { editCancelBtn.hidden = true; editCancelBtn.style.display = 'none'; }

        updateUndoRedoState();
    }

    function openEditModal() {
        editModalImage.src = responseImageImg.src;
        editModal.hidden = false;
        editModal.style.display = '';

        // Reset edit history & drawing
        editUndoStack = [];
        editRedoStack = [];
        allStrokes = [];

        clearSelection();
        removeDoodleTrash();

        // Clear any checkerboard background from previous effects
        const canvasContainer = editModalImage.closest('.edit-modal__canvas');
        if (canvasContainer) canvasContainer.classList.remove('show-checkerboard');

        // Store original image for Resize "Original" revert
        originalImageSrc = responseImageImg.src;

        // Always show tools row — Select, Text, Resize, and Effects are always available.
        // Text detection is now handled dynamically via auto-scan when the Text tool is activated.
        editToolsRow.hidden = false;
        const textToolBtn = document.getElementById('edit-tool-text');
        if (textToolBtn) textToolBtn.hidden = false;

        // Enter starter page state
        enterStarterPage();

        // Always hide education overlay on modal open — it shows on first Select tool use
        editImageOverlay.classList.add('hidden');

        // Size the drawing canvas once the image loads
        editModalImage.onload = () => {
            requestAnimationFrame(sizeDrawCanvas);
            analyzeDoodleColor();
        };
        // Also try immediately in case cached
        requestAnimationFrame(sizeDrawCanvas);
        analyzeDoodleColor();
    }

    // Detect if image is a real photograph — enable/disable portrait subtool
    async function classifyImageForPortrait() {
        const portraitBtns = document.querySelectorAll('[data-subtool="portrait"]');
        // Hide portrait buttons until classified
        portraitBtns.forEach(btn => { btn.style.display = 'none'; });

        try {
            const apiKey = getApiKey();
            if (!apiKey) {
                // No API key — show button as fallback
                portraitBtns.forEach(btn => { btn.style.display = ''; });
                return;
            }

            const imageBase64 = await imgSrcToBase64(editModalImage);
            // Use gemini-2.0-flash for fast, reliable text classification
            const classifyUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
            const requestBody = {
                contents: [{
                    parts: [
                        { text: 'Look at this image carefully. Is this a real photograph (taken with a camera)? It should NOT be an illustration, sketch, cartoon, drawing, painting, digital art, 3D render, graphic design, or any other non-photographic image. Answer with exactly one word: "yes" or "no".' },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: imageBase64,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    maxOutputTokens: 5,
                }
            };

            const response = await fetch(`${classifyUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                console.warn('[Portrait] Classification API error:', response.status);
                portraitBtns.forEach(btn => { btn.style.display = ''; });
                return;
            }
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || '';
            const isPhoto = text.startsWith('yes');

            portraitBtns.forEach(btn => {
                btn.style.display = isPhoto ? '' : 'none';
            });
            console.log('[Portrait] Classification:', text, '→', isPhoto ? 'enabled' : 'disabled');
        } catch (err) {
            console.warn('[Portrait] Classification failed, showing button as fallback:', err);
            portraitBtns.forEach(btn => { btn.style.display = ''; });
        }
    }

    function closeEditModal() {
        // Sync final edited image back to the response screen
        responseImageImg.src = editModalImage.src;

        // Clear all edit history
        editUndoStack.length = 0;
        editRedoStack.length = 0;
        allStrokes.length = 0;
        originalImageSrc = null;

        // Reset Done button
        const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
        if (subtoolDoneBtn) {
            subtoolDoneBtn.hidden = true;
            subtoolDoneBtn.style.display = 'none';
            subtoolDoneBtn.classList.remove('disabled');
        }

        // Play dismiss animation, then hide
        editModal.classList.add('dismissing');

        function onDismissEnd() {
            editModal.removeEventListener('animationend', onDismissEnd);
            editModal.classList.remove('dismissing');
            editModal.hidden = true;
            editModal.style.display = 'none';
            // Clear drawing
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            // Hide discard dialog if open
            const discardDialog = document.getElementById('edit-discard-dialog');
            if (discardDialog) discardDialog.hidden = true;
        }

        editModal.addEventListener('animationend', onDismissEnd, { once: true });

        // Safety fallback in case animationend doesn't fire
        setTimeout(() => {
            if (!editModal.hidden) {
                onDismissEnd();
            }
        }, 400);
    }

    function hasUnsavedEdits() {
        return originalImageSrc && editModalImage.src !== originalImageSrc;
    }

    function handleCloseAttempt() {
        if (hasUnsavedEdits()) {
            // Show discard confirmation dialog
            const discardDialog = document.getElementById('edit-discard-dialog');
            if (discardDialog) discardDialog.hidden = false;
        } else {
            closeEditModal();
        }
    }

    document.getElementById('btn-edit-img').addEventListener('click', openEditModal);
    document.getElementById('edit-close-btn').addEventListener('click', handleCloseAttempt);
    document.getElementById('edit-done-top-btn').addEventListener('click', () => {
        if (isToolActive()) {
            // "Done" from a tool → return to starter page
            enterStarterPage();
        } else {
            // "Save" on starter page → close modal (edits are already applied)
            closeEditModal();
        }
    });

    // Discard dialog buttons
    document.getElementById('edit-discard-keep').addEventListener('click', () => {
        const discardDialog = document.getElementById('edit-discard-dialog');
        if (discardDialog) discardDialog.hidden = true;
    });
    document.getElementById('edit-discard-confirm').addEventListener('click', () => {
        // Revert to original image
        if (originalImageSrc) {
            editModalImage.src = originalImageSrc;
            responseImageImg.src = originalImageSrc;
        }
        // Clear checkerboard
        const canvasContainer = editModalImage.closest('.edit-modal__canvas');
        if (canvasContainer) canvasContainer.classList.remove('show-checkerboard');
        closeEditModal();
    });
    // Close button and backdrop click dismiss dialog (keep editing)
    document.getElementById('edit-discard-close').addEventListener('click', () => {
        const discardDialog = document.getElementById('edit-discard-dialog');
        if (discardDialog) discardDialog.hidden = true;
    });
    document.getElementById('edit-discard-backdrop').addEventListener('click', () => {
        const discardDialog = document.getElementById('edit-discard-dialog');
        if (discardDialog) discardDialog.hidden = true;
    });


    // "Got it" dismisses the overlay permanently
    document.getElementById('edit-overlay-gotit').addEventListener('click', dismissEducation);

    // Cancel button — clears strokes/selection and returns to starter page
    editCancelBtn.addEventListener('click', () => {
        // Exit erase mode if active
        if (eraseMode) {
            exitEraseMode();
            return;
        }
        // Clear Select tool strokes
        allStrokes = [];

        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        // Clear Text tool marquee
        clearSelection();

        // Remove stroke actions from undo stack
        editUndoStack = editUndoStack.filter(a => a.type !== 'stroke');
        editRedoStack = editRedoStack.filter(a => a.type !== 'stroke');

        // Fade transition to starter page
        fadeTransition(() => enterStarterPage());
    });

    // Done button — return to edit starter page from any subtool
    document.getElementById('edit-subtool-done-btn')?.addEventListener('click', () => {
        if (eraseMode) {
            exitEraseMode();
            return;
        }
        fadeTransition(() => enterStarterPage());
    });

    // Smooth fade transition helper
    function fadeTransition(callback) {
        const toolsSection = editModal.querySelector('.edit-modal__tools');
        if (!toolsSection) { callback(); return; }
        toolsSection.classList.add('fading');
        setTimeout(() => {
            callback();
            // Small delay to let DOM update, then fade back in
            requestAnimationFrame(() => {
                toolsSection.classList.remove('fading');
            });
        }, 200);
    }

    // Sync floating text when user types in input
    document.getElementById('edit-input-text').addEventListener('input', (e) => {
        updateFloatingTextContent(e.target.value);
    });

    // Send button in the edit input bar — call Gemini API to regenerate the image
    document.getElementById('edit-send-btn').addEventListener('click', async () => {
        const editInput = document.getElementById('edit-input-text');
        const editText = editInput?.value?.trim();
        if (!editText) return; // Don't submit empty edits

        const editSendBtn = document.getElementById('edit-send-btn');

        pushEditAction({ type: 'edit', text: editText });

        // Disable input and send while processing
        editInput.disabled = true;
        editInput.value = '';
        editInput.placeholder = 'Generating...';
        editSendBtn.disabled = true;

        // Show shimmer loading on the edit image
        setVortexFromEdit();
        editModalImage.closest('.edit-modal__canvas').classList.add('edit-loading');

        // Hide text marquee, floating text, and doodle visuals during loading
        removeFloatingText();
        stopMarchingAnts();
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

        // Remove doodle trash button during processing
        removeDoodleTrash();

        // Create abort controller and show cancel in nav
        const ac = createAbortController();
        showEditLoadingCancel(() => enterStarterPage());

        try {
            // Get the current image as base64
            const imageBase64 = await imgSrcToBase64(editModalImage);

            // Build prompt based on active tool
            let editPrompt;
            const activeToolEl = editModal.querySelector('.edit-modal__tool.active');
            const activeToolId = activeToolEl?.dataset.tool;

            if (activeToolId === 'text' && detectedOriginalText) {
                // Text replacement (or move) mode
                if (floatingTextPos) {
                    const x1Pct = Math.round((floatingTextPos.x / drawCanvas.width) * 100);
                    const y1Pct = Math.round((floatingTextPos.y / drawCanvas.height) * 100);
                    const x2Pct = Math.round(((floatingTextPos.x + floatingTextPos.w) / drawCanvas.width) * 100);
                    const y2Pct = Math.round(((floatingTextPos.y + floatingTextPos.h) / drawCanvas.height) * 100);
                    editPrompt = `In this image, change the text "${detectedOriginalText}" to "${editText}" and place it at approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). Keep everything else exactly the same — same style, same font, same colors, same layout. Only change the text content and position.`;
                } else {
                    editPrompt = `In this image, change the text "${detectedOriginalText}" to "${editText}". Keep everything else exactly the same — same style, same font, same colors, same layout. Only change the text content.`;
                }
            } else if (activeToolId === 'text' && (floatingTextPos || marqueeSelection)) {
                // Add new text mode — user selected an area and typed new text
                const pos = floatingTextPos || marqueeSelection;
                const x1Pct = Math.round((pos.x / drawCanvas.width) * 100);
                const y1Pct = Math.round((pos.y / drawCanvas.height) * 100);
                const x2Pct = Math.round(((pos.x + pos.w) / drawCanvas.width) * 100);
                const y2Pct = Math.round(((pos.y + pos.h) / drawCanvas.height) * 100);
                editPrompt = `In this image, add the text "${editText}" in the region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). The text should blend naturally with the image style. Keep everything else exactly the same.`;
            } else {
                // Generic edit mode (Select tool)
                editPrompt = `Edit this image: ${editText}`;
            }

            // Call Gemini API to edit the image
            const newDataUrl = await editWithGemini(imageBase64, editPrompt, ac.signal);

            await seamlessCrossfade(newDataUrl);

            showToast('Edit applied');
        } catch (err) {
            if (err.name === 'AbortError') return; // User cancelled
            console.error('Edit API error:', err);
            showToast('Edit failed: ' + err.message);
        } finally {
            hideEditLoadingCancel();

            // Clear doodle strokes and drawing canvas
            allStrokes = [];
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            removeDoodleTrash();

            // Clear selection (the edit has been applied or failed)
            clearSelection();

            // Remove loading shimmer
            editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');

            // Re-enable all tool buttons
            updateToolButtonStates();

            // Return to starter page
            enterStarterPage();
        }
    });

    editUndoBtn.addEventListener('click', () => {
        if (editUndoStack.length > 0) {
            const action = editUndoStack.pop();
            editRedoStack.push(action);
            if (action.type === 'stroke') {
                if (action.data?.type === 'marquee') {
                    // Text tool marquee — clear it
                    clearSelection();
                } else {
                    // Select tool freehand — pop last stroke
                    allStrokes.pop();
                    redrawStrokes();
                    removeDoodleTrash();
                    // Re-check if any remaining stroke is closed
                    const stillHasClosed = allStrokes.some(s => Array.isArray(s) && isClosedStroke(s));
                    if (stillHasClosed) showDoodleTrash();
                    if (allStrokes.length === 0) {
                        const editInput = document.getElementById('edit-input-text');
                        const editSendBtn = document.getElementById('edit-send-btn');
                        if (editInput) { editInput.disabled = true; editInput.placeholder = 'Draw on image to select area'; editInput.value = ''; }
                        if (editSendBtn) editSendBtn.disabled = true;
                    }
                }
            } else if (action.type === 'effect' && action.previousSrc) {
                // Revert to previous image for effect undo
                editModalImage.src = action.previousSrc;
                responseImageImg.src = action.previousSrc;
                showToast('Undo ' + (action.name || 'effect'));
            }
            updateUndoRedoState();
            updateToolButtonStates();
            // If no more edits, disable Done (keep it visible but greyed out)
            const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
            if (subtoolDoneBtn && !subtoolDoneBtn.hidden) {
                if (editUndoStack.length === 0) {
                    subtoolDoneBtn.classList.add('disabled');
                } else {
                    subtoolDoneBtn.classList.remove('disabled');
                }
            }
            if (action.type !== 'effect') showToast('Undo');
        }
    });
    editRedoBtn.addEventListener('click', () => {
        if (editRedoStack.length > 0) {
            const action = editRedoStack.pop();
            editUndoStack.push(action);
            if (action.type === 'stroke') {
                if (action.data?.type === 'marquee') {
                    // Text tool marquee — restore it
                    marqueeSelection = { ...action.data.bounds };
                    allStrokes = [action.data];
                    startMarchingAnts();
                    const editInput = document.getElementById('edit-input-text');
                    const editSendBtn = document.getElementById('edit-send-btn');
                    if (editInput) { editInput.disabled = false; editInput.placeholder = 'Edit the text'; }
                    if (editSendBtn) editSendBtn.disabled = false;
                } else if (Array.isArray(action.data)) {
                    // Select tool freehand — restore stroke
                    allStrokes.push(action.data);
                    redrawStrokes();
                    const editInput = document.getElementById('edit-input-text');
                    const editSendBtn = document.getElementById('edit-send-btn');
                    if (editInput) { editInput.disabled = false; editInput.placeholder = 'Describe your edit'; }
                    if (editSendBtn) editSendBtn.disabled = false;
                }
            } else if (action.type === 'effect' && action.newSrc) {
                // Re-apply the effect image
                editModalImage.src = action.newSrc;
                responseImageImg.src = action.newSrc;
                // Show Done (enabled), hide Save
                const subtoolDoneBtn = document.getElementById('edit-subtool-done-btn');
                if (subtoolDoneBtn) {
                    subtoolDoneBtn.hidden = false;
                    subtoolDoneBtn.style.display = '';
                    subtoolDoneBtn.classList.remove('disabled');
                }
                if (editDoneTopBtn) editDoneTopBtn.style.display = 'none';
                showToast('Redo ' + (action.name || 'effect'));
            }
            updateUndoRedoState();
            updateToolButtonStates();
            if (action.type !== 'effect') showToast('Redo');
        }
    });

    // Tool selection toggle + sub-tools
    const allSubtools = editModal.querySelectorAll('.edit-modal__subtools');

    function showSubtoolsFor(toolId) {
        allSubtools.forEach(row => {
            row.hidden = row.dataset.parent !== toolId;
        });
    }

    function hideAllSubtools() {
        allSubtools.forEach(row => row.hidden = true);
    }

    const editInputBar = editModal.querySelector('.edit-modal__input');
    const editGestureBar = editModal.querySelector('.edit-modal__gesture-bar');

    // Helper: show/hide input bar and sync gesture bar background
    function setEditInputVisible(visible) {
        if (editInputBar) editInputBar.hidden = !visible;
        if (editGestureBar) editGestureBar.classList.toggle('input-visible', visible);
    }

    editTools.forEach(tool => {
        tool.addEventListener('click', () => {
            editTools.forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            const toolId = tool.dataset.tool;
            const toolName = toolId.charAt(0).toUpperCase() + toolId.slice(1);

            // Hide X and Edit Image when any tool is active
            editCloseBtn.hidden = true;
            if (editAppbarCenter) editAppbarCenter.hidden = true;

            // Show Cancel in nav bar so user can go back
            if (editCancelBtn) {
                editCancelBtn.hidden = false;
                editCancelBtn.style.display = '';
                editCancelBtn.textContent = 'Cancel';
            }

            // Show undo/redo when a tool is active
            const appbarActions = editModal.querySelector('.edit-modal__appbar-actions');
            if (appbarActions) appbarActions.hidden = false;

            // Enable drawing for Select, marquee for Text, disable for Resize/Effects
            if (toolId === 'select') {
                drawCanvas.style.pointerEvents = 'auto';
                drawCanvas.style.cursor = 'crosshair';
                clearSelection(); // Clear any Text marquee
            } else if (toolId === 'text') {
                drawCanvas.style.pointerEvents = 'auto';
                drawCanvas.style.cursor = 'crosshair';
                // Clear any Select doodle strokes
                allStrokes = [];

                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                // Auto-scan: detect all text in the image and show ghost boxes
                autoScanTextRegions();
            } else {
                drawCanvas.style.pointerEvents = 'none';
                drawCanvas.style.cursor = '';
            }

            // Reset text tool mode
            activeTextToolMode = toolId === 'text';
            if (toolId !== 'text') {
                detectedOriginalText = null;
                removeFloatingText();
            }

            if (toolId === 'select') {
                hideAllSubtools();
                setEditInputVisible(true);
                // Show education overlay on first Select tool use
                if (!isEducationDismissed()) {
                    editImageOverlay.classList.remove('hidden');
                }
                // Disable input until user doodles
                const editInput = document.getElementById('edit-input-text');
                const editSendBtn = document.getElementById('edit-send-btn');
                if (editInput) {
                    editInput.disabled = true;
                    editInput.placeholder = 'Draw on image to select area';
                    editInput.value = '';
                }
                if (editSendBtn) editSendBtn.disabled = true;
            } else if (toolId === 'text') {
                hideAllSubtools();
                setEditInputVisible(true);
                // Disable input until auto-scan completes or user draws marquee
                const editInput = document.getElementById('edit-input-text');
                const editSendBtn = document.getElementById('edit-send-btn');
                if (editInput) {
                    editInput.disabled = true;
                    editInput.value = '';
                    editInput.placeholder = 'Scanning for text…';
                }
                if (editSendBtn) editSendBtn.disabled = true;
            } else {
                showSubtoolsFor(toolId);
                // Hide input bar for resize/effects (sub-tools replace it)
                setEditInputVisible(toolId !== 'resize' && toolId !== 'effects');
                // Classify image for portrait eligibility when Effects tab opens
                if (toolId === 'effects') {
                    classifyImageForPortrait();
                }
            }

            // Disable other tools when Resize/Effects is active
            updateToolButtonStates();

            // Update Done pill / Save visibility
            updateUndoRedoState();

            showToast(toolName);
        });
    });

    // Sub-tool clicks
    editModal.querySelectorAll('.edit-modal__subtool').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subtoolId = btn.dataset.subtool;
            const parentToolEl = btn.closest('.edit-modal__subtools');
            const parentToolId = parentToolEl?.dataset.parent;

            // Handle Resize sub-tools — crop & resize to exact aspect ratio
            if (parentToolId === 'resize') {
                // Determine target aspect ratio
                let targetW, targetH, label;
                if (subtoolId === 'portrait') {
                    targetW = 9; targetH = 16; label = 'Portrait (9:16)';
                } else if (subtoolId === 'landscape') {
                    targetW = 16; targetH = 9; label = 'Landscape (16:9)';
                } else {
                    // Original = 1:1 square
                    targetW = 1; targetH = 1; label = 'Square (1:1)';
                }
                const targetRatio = targetW / targetH;

                setVortexFromEdit();
                editModalImage.closest('.edit-modal__canvas').classList.add('edit-loading');
                showToast(`Resizing to ${label}...`);

                // Create abort controller and show cancel in nav
                const ac = createAbortController();
                showEditLoadingCancel(() => enterStarterPage());

                try {
                    // Step 1: Detect any text in the current image before cropping
                    let detectedTexts = [];
                    try {
                        const currentBase64 = await imgSrcToBase64(editModalImage);
                        const apiKey = getApiKey();
                        if (apiKey) {
                            const ocrBody = {
                                contents: [{
                                    parts: [
                                        { text: 'List ALL text visible in this image. Return a JSON array of strings, one per distinct text element. If no text is found, return []. Return ONLY the JSON array, no other text.' },
                                        { inline_data: { mime_type: 'image/png', data: currentBase64 } }
                                    ]
                                }],
                                generationConfig: { responseMimeType: 'application/json' }
                            };
                            const ocrResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(ocrBody),
                                signal: ac.signal,
                            });
                            if (ocrResp.ok) {
                                const ocrData = await ocrResp.json();
                                const ocrText = ocrData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
                                detectedTexts = JSON.parse(ocrText);
                            }
                        }
                    } catch (ocrErr) {
                        if (ocrErr.name === 'AbortError') throw ocrErr;
                        console.warn('Text detection before resize skipped:', ocrErr);
                    }

                    // Step 2: Crop to exact aspect ratio
                    const srcImg = new Image();
                    srcImg.crossOrigin = 'anonymous';
                    await new Promise((resolve, reject) => {
                        srcImg.onload = resolve;
                        srcImg.onerror = reject;
                        srcImg.src = editModalImage.src;
                    });

                    const srcW = srcImg.naturalWidth;
                    const srcH = srcImg.naturalHeight;
                    const srcRatio = srcW / srcH;

                    // Calculate center crop region
                    let cropX, cropY, cropW, cropH;
                    if (srcRatio > targetRatio) {
                        cropH = srcH;
                        cropW = Math.round(srcH * targetRatio);
                        cropX = Math.round((srcW - cropW) / 2);
                        cropY = 0;
                    } else {
                        cropW = srcW;
                        cropH = Math.round(srcW / targetRatio);
                        cropX = 0;
                        cropY = Math.round((srcH - cropH) / 2);
                    }

                    // Calculate how much narrower the crop is (for text scaling)
                    const widthScale = Math.round((cropW / srcW) * 100);

                    // Draw cropped region onto a canvas
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = cropW;
                    cropCanvas.height = cropH;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(srcImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

                    const croppedDataUrl = cropCanvas.toDataURL('image/png');
                    const croppedBase64 = croppedDataUrl.split(',')[1];

                    // Step 3: Send cropped image to Gemini for inpainting refinement
                    showToast('Refining composition...');

                    let textInstructions = '';
                    if (detectedTexts.length > 0) {
                        const textList = detectedTexts.map(t => `"${t}"`).join(', ');
                        textInstructions =
                            `CRITICAL TEXT HANDLING: The original image contained these text elements: ${textList}. ` +
                            `The image width is now ${widthScale}% of the original. ` +
                            `You MUST include ALL of these text elements in the output image. ` +
                            `Scale each text element's font size down so it fits comfortably within the new narrower width — do not let any text extend beyond the image edges or get cut off. ` +
                            `Keep text horizontally centered or in its original relative position, but shrink it proportionally to fit. ` +
                            `Maintain the exact same font style, color, weight, and visual treatment for each text element. ` +
                            `Every single character of every text element must be fully visible and legible. `;
                    }

                    const inpaintPrompt = `This image was just cropped to a ${targetW}:${targetH} aspect ratio. ` +
                        `The cropping may have cut off parts of the subject (head, face, body, limbs) or text, or created awkward framing. ` +
                        `Regenerate this image to look natural and well-composed at this exact ${targetW}:${targetH} aspect ratio. ` +
                        `If any part of the subject was cropped out, restore it naturally. ` +
                        textInstructions +
                        `Ensure the subject is fully visible, well-framed, and centered. ` +
                        `Preserve the subject's identity, appearance, and the original style, colors, and mood exactly. ` +
                        `The output MUST maintain the exact same ${targetW}:${targetH} aspect ratio. Do not add borders or letterboxing.`;
                    const refinedDataUrl = await editWithGemini(croppedBase64, inpaintPrompt, ac.signal);

                    editModalImage.src = refinedDataUrl;
                    responseImageImg.src = refinedDataUrl;
                    pushEditAction({ type: 'resize', ratio: `${targetW}:${targetH}` });
                    showToast(`Resized to ${label}`);
                } catch (err) {
                    if (err.name === 'AbortError') return; // User cancelled
                    console.error('Resize error:', err);
                    showToast('Resize failed: ' + err.message);
                } finally {
                    hideEditLoadingCancel();
                    editModalImage.closest('.edit-modal__canvas').classList.remove('edit-loading');
                    requestAnimationFrame(sizeDrawCanvas);
                    enterStarterPage();
                }
                return;
            }

            // Handle Effects sub-tools with Gemini API
            if (parentToolId === 'effects') {
                // Erase subtool — enter brush drawing mode
                if (subtoolId === 'erase') { enterEraseMode(); return; }
                if (subtoolId === 'removebg') { await handleImageRemoveBg(); return; }
                if (subtoolId === 'lighting') { openLightingPanel(); return; }
                if (subtoolId === 'portrait') { openPortraitPanel(); return; }
            }


            // Default for other sub-tools
            pushEditAction({ type: 'subtool', name: subtoolId });
            showToast(btn.querySelector('.edit-modal__subtool-label').textContent.replace(/\n/g, ' '));
        });
    });

    // Done pill button closes the modal (returns to response)
    if (editPillDoneBtn) {
        editPillDoneBtn.addEventListener('click', closeEditModal);
    }

    document.getElementById('btn-download-response')?.addEventListener('click', () => {
        const img = responseImageImg;
        if (!img.src || img.src === window.location.href) {
            showToast('No image to download');
            return;
        }
        const link = document.createElement('a');
        link.href = img.src;
        const styleName = selectedStyle || 'restyled';
        link.download = `${styleName}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Image downloaded');
    });

    document.getElementById('response-avatar-btn')?.addEventListener('click', () => {
        showToast('Profile');
    });

    // ==========================================================
    //  WEB IMAGE EDITOR — Platform Dropdown & Full Web Editor
    // ==========================================================

    // ---------- Platform Dropdown ----------
    const imageDropdownArrow = document.getElementById('image-dropdown-arrow');
    const imagePlatformDropdown = document.getElementById('image-platform-dropdown');
    const platformMobileBtn = document.getElementById('platform-mobile');
    const platformWebBtn = document.getElementById('platform-web');

    // Toggle dropdown on arrow click
    if (imageDropdownArrow) {
        imageDropdownArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const isOpen = !imagePlatformDropdown.hidden;
            imagePlatformDropdown.hidden = isOpen;
            imageDropdownArrow.classList.toggle('open', !isOpen);
        });
    }

    // Also toggle dropdown if clicking the Image Editing tab text
    navTabImage.addEventListener('click', (e) => {
        // If dropdown is open, don't switch — let the dropdown handle it
        if (!imagePlatformDropdown.hidden) {
            imagePlatformDropdown.hidden = true;
            imageDropdownArrow.classList.remove('open');
        }
    });

    function selectPlatform(platform) {
        // Update dropdown UI
        document.querySelectorAll('.nav-tab-dropdown__item').forEach(item => {
            item.classList.toggle('nav-tab-dropdown__item--active', item.dataset.platform === platform);
        });
        imagePlatformDropdown.hidden = true;
        imageDropdownArrow.classList.remove('open');

        // Update tab label
        const tabLabel = document.getElementById('image-tab-label');
        if (tabLabel) {
            tabLabel.textContent = platform === 'web' ? 'Web Image Editing' : 'Mobile Image Editing';
        }

        // Notify design system iframe of platform change
        const dsFrame = document.getElementById('design-system-frame');
        if (dsFrame && dsFrame.contentWindow) {
            dsFrame.contentWindow.postMessage({ type: 'setPlatform', platform: platform }, '*');
        }

        // Switch shells
        switchPrototype('image');
    }

    if (platformMobileBtn) {
        platformMobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectPlatform('mobile');
        });
    }

    if (platformWebBtn) {
        platformWebBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectPlatform('web');
        });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (imagePlatformDropdown && !imagePlatformDropdown.hidden) {
            const wrapper = document.getElementById('nav-tab-image-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                imagePlatformDropdown.hidden = true;
                imageDropdownArrow.classList.remove('open');
            }
        }
    });

    // ---------- Web Image Editor Logic ----------
    const webShell = document.getElementById('web-image-shell');
    if (webShell) {
        const webTemplateSurface = document.getElementById('web-img-template-surface');
        const webEditSurface = document.getElementById('web-img-edit-surface');
        const webCards = webShell.querySelectorAll('.web-img__card');
        const webPrompt = document.getElementById('web-img-prompt');
        const webPlaceholder = document.getElementById('web-img-placeholder');
        const webMicBtn = document.getElementById('web-img-mic');
        const webSendBtn = document.getElementById('web-img-send');
        const webAttachChip = document.getElementById('web-img-attach-chip');
        const webAttachThumb = document.getElementById('web-img-attach-thumb');
        const webAttachLabel = document.getElementById('web-img-attach-label');
        const webAttachClose = document.getElementById('web-img-attach-close');
        const webAddPhotoBtn = document.getElementById('web-img-add-photo');
        const webSelfieInput = document.getElementById('web-img-selfie-input');
        const webSelfieChip = document.getElementById('web-img-selfie-chip');
        const webSelfieThumb = document.getElementById('web-img-selfie-thumb');
        const webSelfieClose = document.getElementById('web-img-selfie-close');

        // Edit surface elements
        const webCanvasImg = document.getElementById('web-img-canvas-img');
        const webDrawCanvas = document.getElementById('web-img-draw-canvas');
        const webLoading = document.getElementById('web-img-loading');
        const webLoadingText = webLoading ? webLoading.querySelector('.web-img__loading-text') : null;
        const webEditCloseBtn = document.getElementById('web-img-edit-close');
        const webDoneBtn = document.getElementById('web-img-done');
        const webUndoBtn = document.getElementById('web-img-undo');
        const webRedoBtn = document.getElementById('web-img-redo');
        const webToolBtns = webShell.querySelectorAll('.web-img__tool-btn');
        const webSubtoolBar = document.getElementById('web-img-subtool-bar');
        const webEditInput = document.getElementById('web-img-edit-input');
        const webEditPrompt = document.getElementById('web-img-edit-prompt');
        const webCanvasWrapper = document.getElementById('web-img-canvas-wrapper');

        // State
        let webSelectedStyle = null;
        let webSelfieFile = null;
        let webActiveTool = null;
        let webUndoStack = [];
        let webRedoStack = [];
        let webOriginalSrc = null;
        let webAbortController = null;

        // --- Template Card Selection ---
        webCards.forEach(card => {
            card.addEventListener('click', () => {
                const style = card.dataset.style;

                if (webSelectedStyle === style) {
                    // Deselect
                    card.classList.remove('selected');
                    webSelectedStyle = null;
                    webAttachChip.hidden = true;
                    webAddPhotoBtn.classList.add('hidden');
                    // Restart placeholder with generic phrases
                    startWebPlaceholderRotation(null);
                    updateWebSendState();
                    return;
                }

                // Deselect previous
                webCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                webSelectedStyle = style;

                // Show attachment chip
                const img = card.querySelector('.web-img__card-img');
                const label = card.querySelector('.web-img__card-label');
                webAttachThumb.src = img.src;
                webAttachLabel.textContent = label.textContent;
                webAttachChip.hidden = false;

                // Show add-photo button
                if (!webSelfieChip || webSelfieChip.hidden) {
                    webAddPhotoBtn.classList.remove('hidden');
                }

                // Start placeholder rotation with style-specific phrases
                startWebPlaceholderRotation(style);

                updateWebSendState();
            });
        });

        // Remove template attachment
        webAttachClose.addEventListener('click', (e) => {
            e.stopPropagation();
            webAttachChip.hidden = true;
            webCards.forEach(c => c.classList.remove('selected'));
            webSelectedStyle = null;
            if (!webSelfieFile) webAddPhotoBtn.classList.add('hidden');
            // Restart placeholder with generic phrases
            startWebPlaceholderRotation(null);
            updateWebSendState();
        });

        // --- Selfie / Add Photo ---
        webAddPhotoBtn.addEventListener('click', () => {
            webSelfieInput.click();
        });

        webSelfieInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            webSelfieFile = file;
            const url = URL.createObjectURL(file);
            webSelfieThumb.src = url;
            webSelfieChip.hidden = false;
            webAddPhotoBtn.classList.add('hidden');
            updateWebSendState();
        });

        webSelfieClose.addEventListener('click', (e) => {
            e.stopPropagation();
            clearWebSelfie();
        });

        function clearWebSelfie() {
            webSelfieFile = null;
            webSelfieChip.hidden = true;
            webSelfieInput.value = '';
            if (webSelfieThumb.src.startsWith('blob:')) {
                URL.revokeObjectURL(webSelfieThumb.src);
            }
            webSelfieThumb.src = '';
            if (webSelectedStyle) {
                webAddPhotoBtn.classList.remove('hidden');
            }
            updateWebSendState();
        }

        // --- Prompt Input ---
        webPrompt.addEventListener('input', () => {
            webPrompt.style.height = 'auto';
            webPrompt.style.height = Math.min(webPrompt.scrollHeight, 120) + 'px';
            webPlaceholder.classList.toggle('hidden', webPrompt.value.length > 0);
            updateWebSendState();
        });

        webPrompt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (webSendBtn && !webSendBtn.disabled) webSendBtn.click();
            }
        });

        function updateWebSendState() {
            const hasText = webPrompt.value.trim().length > 0;
            const hasContent = hasText || webSelectedStyle || webSelfieFile;
            webMicBtn.style.display = hasContent ? 'none' : 'flex';
            webSendBtn.style.display = hasContent ? 'flex' : 'none';
            webSendBtn.disabled = !hasContent;
        }

        // --- Response Surface Elements ---
        const webResponseSurface = document.getElementById('web-img-response-surface');
        const webResponseContent = document.getElementById('web-img-response-content');
        const webResponseThumbStyle = document.getElementById('web-img-response-thumb-style');
        const webResponseThumbStyleImg = document.getElementById('web-img-response-thumb-style-img');
        const webResponseThumbStyleLabel = document.getElementById('web-img-response-thumb-style-label');
        const webResponseThumbSelfie = document.getElementById('web-img-response-thumb-selfie');
        const webResponseThumbSelfieImg = document.getElementById('web-img-response-thumb-selfie-img');
        const webResponseText = document.getElementById('web-img-response-text');
        const webResponseAnswerText = document.getElementById('web-img-response-answer-text');
        const webResponseImageImg = document.getElementById('web-img-response-image-img');
        const webResponseLoading = document.getElementById('web-img-response-loading');
        const webResponseImage = document.getElementById('web-img-response-image');
        const webResponsePromptInput = document.getElementById('web-img-response-prompt-input');
        const webResponsePlaceholder = document.getElementById('web-img-response-placeholder');
        const webResponseMic = document.getElementById('web-img-response-mic');
        const webResponseSend = document.getElementById('web-img-response-send');
        const webBtnEditImg = document.getElementById('web-img-btn-edit-img');
        const webBtnDownloadImg = document.getElementById('web-img-btn-share-img');
        const webBtnDownloadResponse = document.getElementById('web-img-btn-more');
        const webBtnRefresh = document.getElementById('web-img-btn-refresh');
        const webBtnAddTemplate = document.getElementById('web-img-btn-add');
        const webImageFxChip = document.getElementById('web-img-imagefx');
        const webEraseCanvas = document.getElementById('web-img-erase-canvas');
        const webLassoSvg = document.getElementById('web-img-lasso-svg');

        // Track current generated image
        let webGeneratedSrc = null;
        let webIsDrawing = false;
        let webLastX = 0;
        let webLastY = 0;
        let webEraseMode = false;
        let webPendingResize = null;
        let webAllStrokes = [];
        let webCurrentStroke = [];
        let webDismissBtn = null;

        // Select tool image attachment state
        let webSelectAttachFile = null;
        let webSelectAttachDataUrl = null;

        // --- Surface Navigation Helpers ---
        function showWebSurface(surface) {
            // Hide all surfaces
            webTemplateSurface.hidden = true;
            if (webResponseSurface) webResponseSurface.hidden = true;
            webEditSurface.hidden = true;

            // Show requested surface
            if (surface === 'template') {
                webTemplateSurface.hidden = false;
            } else if (surface === 'response') {
                if (webResponseSurface) webResponseSurface.hidden = false;
            } else if (surface === 'edit') {
                // Remove closing/particle classes and re-trigger entrance animation
                webEditSurface.classList.remove('closing');
                webEditSurface.classList.remove('particle-entrance');
                webEditSurface.hidden = false;
            }
        }

        // --- Disable/enable response surface controls during generation ---
        function setWebResponseInteractive(enabled) {
            // Image overlay buttons (edit, share, download)
            const editBar = webShell.querySelector('.web-img__response-image-edit-bar');
            if (editBar) {
                editBar.style.pointerEvents = enabled ? '' : 'none';
                editBar.style.opacity = enabled ? '' : '0';
                editBar.style.transition = 'opacity 0.25s ease';
            }

            // Footer action buttons (thumbs, refresh, share, copy, more)
            const actionBtns = webShell.querySelectorAll('.web-img__response-action-btn');
            actionBtns.forEach(btn => {
                btn.disabled = !enabled;
                btn.style.opacity = enabled ? '' : '0.3';
                btn.style.pointerEvents = enabled ? '' : 'none';
            });

            // Response input bar
            if (webResponsePromptInput) {
                webResponsePromptInput.disabled = !enabled;
                webResponsePromptInput.style.opacity = enabled ? '' : '0.4';
            }
            if (webResponseSend) {
                webResponseSend.disabled = !enabled;
                webResponseSend.style.opacity = enabled ? '' : '0.3';
            }

            // Doodle dismiss button (if it exists)
            if (webDismissBtn) {
                webDismissBtn.style.display = enabled ? '' : 'none';
            }
        }

        // --- Disable/enable edit surface controls during API edits ---
        function setWebEditInteractive(enabled) {
            // Tool buttons (Select, Text, Resize, Effects)
            webToolBtns.forEach(btn => {
                btn.style.pointerEvents = enabled ? '' : 'none';
                btn.style.opacity = enabled ? '' : '0.35';
            });

            // Edit prompt input
            if (webEditPrompt) {
                webEditPrompt.disabled = !enabled;
                webEditPrompt.style.opacity = enabled ? '' : '0.4';
            }

            // Edit send button
            const editSendBtn = webShell.querySelector('#web-img-edit-send');
            if (editSendBtn) {
                editSendBtn.style.pointerEvents = enabled ? '' : 'none';
                editSendBtn.style.opacity = enabled ? '' : '0.3';
            }

            // Undo / Redo / Done
            if (webUndoBtn) webUndoBtn.style.pointerEvents = enabled ? '' : 'none';
            if (webRedoBtn) webRedoBtn.style.pointerEvents = enabled ? '' : 'none';
            if (webDoneBtn) {
                webDoneBtn.disabled = !enabled;
            }

            // Draw canvas (block further drawing)
            if (webDrawCanvas) {
                webDrawCanvas.style.pointerEvents = enabled ? 'auto' : 'none';
            }

            // Doodle dismiss
            if (webDismissBtn) {
                webDismissBtn.style.display = enabled ? '' : 'none';
            }

            // Attachment add button
            const addBtn = document.getElementById('web-img-edit-add-btn');
            if (addBtn) {
                addBtn.style.pointerEvents = enabled ? '' : 'none';
                addBtn.style.opacity = enabled ? '' : '0.3';
            }
        }

        // Animated close for the edit modal
        function closeWebEditModal() {
            return new Promise(resolve => {
                webEditSurface.classList.add('closing');
                setTimeout(() => {
                    webEditSurface.hidden = true;
                    webEditSurface.classList.remove('closing');
                    resolve();
                }, 300);
            });
        }

        // --- Send / Generate ---
        webSendBtn.addEventListener('click', () => {
            const prompt = webPrompt.value.trim();
            webGenerateImage(webSelectedStyle, prompt, webSelfieFile);
        });

        async function webGenerateImage(style, userPrompt, selfieFile) {
            // Populate response surface with user prompt info
            if (webResponseSurface) {
                // Show style thumbnail
                if (style) {
                    const card = webShell.querySelector(`.web-img__card[data-style="${style}"]`);
                    if (card) {
                        const img = card.querySelector('.web-img__card-img');
                        const label = card.querySelector('.web-img__card-label');
                        webResponseThumbStyleImg.src = img.src;
                        webResponseThumbStyleLabel.textContent = label.textContent;
                        webResponseThumbStyle.hidden = false;
                    }
                } else {
                    webResponseThumbStyle.hidden = true;
                }

                // Show selfie thumbnail
                if (selfieFile) {
                    webResponseThumbSelfieImg.src = URL.createObjectURL(selfieFile);
                    webResponseThumbSelfie.hidden = false;
                } else {
                    webResponseThumbSelfie.hidden = true;
                }

                // Set prompt text
                const displayPrompt = userPrompt || (style ? `Generate a ${style} image` : 'Generate an image');
                webResponseText.textContent = displayPrompt;

                // Show loading state
                webResponseLoading.hidden = false;
                webResponseImageImg.src = '';
                webResponseAnswerText.textContent = selfieFile ? 'Restyling your image…' : 'Generating your image…';

                // Switch to response surface
                showWebSurface('response');

                // Disable all controls while generating
                setWebResponseInteractive(false);
            }

            try {
                let dataUrl;
                if (selfieFile) {
                    dataUrl = await restyleWithGemini(selfieFile, style, userPrompt);
                } else {
                    dataUrl = await generateWithGemini(style, userPrompt);
                }

                webGeneratedSrc = dataUrl;

                // Update response surface
                if (webResponseSurface) {
                    webResponseImageImg.src = dataUrl;
                    webResponseLoading.hidden = true;
                    webResponseAnswerText.textContent = style ? `Sure, here is your ${webResponseThumbStyleLabel.textContent} image.` : 'Sure, here is your image.';
                }

                // Also pre-load into edit canvas
                webCanvasImg.src = dataUrl;
                webOriginalSrc = dataUrl;

            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error('[WebImg] Generation error:', err);
                showToast('Generation failed: ' + err.message);

                // Fall back to a template image if available
                const fallbackSrc = style && styleImages[style] ? styleImages[style] : '../images/salon.png';
                webGeneratedSrc = fallbackSrc;

                if (webResponseSurface) {
                    webResponseImageImg.src = fallbackSrc;
                    webResponseLoading.hidden = true;
                    webResponseAnswerText.textContent = 'Here is an example image';
                }

                webCanvasImg.src = fallbackSrc;
                webOriginalSrc = fallbackSrc;
            } finally {
                // Always re-enable controls, even after abort/error
                setWebResponseInteractive(true);
            }

            // Reset input bar
            webPrompt.value = '';
            webPlaceholder.classList.remove('hidden');
            updateWebSendState();
        }

        // --- Response Surface: navigation via sidebar New Chat button ---
        // (The Figma design uses the sidebar new-chat icon, not a back arrow)
        const sidebarNewChatBtns = webShell.querySelectorAll('.web-img__sidebar-btn[aria-label="New chat"]');
        sidebarNewChatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                showWebSurface('template');

                // Reset template selection
                webCards.forEach(c => c.classList.remove('selected'));
                webSelectedStyle = null;
                webAttachChip.hidden = true;
                clearWebSelfie();
                webAddPhotoBtn.classList.add('hidden');
                webGeneratedSrc = null;
            });
        });

        // --- Luminous Particle Transition System ---
        const transitionCanvas = document.getElementById('web-img-transition-canvas');
        const transitionCtx = transitionCanvas ? transitionCanvas.getContext('2d') : null;
        let transitionAnimId = null;

        /**
         * Plays a luminous particle dissolution transition.
         * Samples colors from the source image, breaks it into glowing particles
         * that drift outward and fade, revealing the edit surface underneath.
         */
        function playLuminousTransition(sourceImgEl, onComplete) {
            if (!transitionCanvas || !transitionCtx) { onComplete(); return; }

            // Respect reduced motion preference
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                onComplete();
                return;
            }

            // Get the source image's position relative to the webShell main area
            const mainEl = webShell.querySelector('.web-img__main');
            const mainRect = mainEl.getBoundingClientRect();
            const imgRect = sourceImgEl.getBoundingClientRect();

            // Size canvas to fill the main content area
            const dpr = window.devicePixelRatio || 1;
            transitionCanvas.width = mainRect.width * dpr;
            transitionCanvas.height = mainRect.height * dpr;
            transitionCanvas.style.width = mainRect.width + 'px';
            transitionCanvas.style.height = mainRect.height + 'px';
            transitionCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Calculate image position relative to the canvas
            const imgX = imgRect.left - mainRect.left;
            const imgY = imgRect.top - mainRect.top;
            const imgW = imgRect.width;
            const imgH = imgRect.height;

            // Sample colors from the image
            const sampleCanvas = document.createElement('canvas');
            const sampleCtx = sampleCanvas.getContext('2d');
            const sampleSize = 32; // Grid resolution for sampling
            sampleCanvas.width = sampleSize;
            sampleCanvas.height = sampleSize;

            // Draw the source image to the sample canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = sourceImgEl.src;

            // Use existing image data if already loaded
            try {
                sampleCtx.drawImage(sourceImgEl, 0, 0, sampleSize, sampleSize);
            } catch (e) {
                // CORS or other issue — use fallback palette
            }

            const imageData = sampleCtx.getImageData(0, 0, sampleSize, sampleSize);
            const pixels = imageData.data;

            // Create particle grid from sampled colors
            const particles = [];
            const cols = sampleSize;
            const rows = sampleSize;
            const cellW = imgW / cols;
            const cellH = imgH / rows;

            // Center of the image (particles will drift outward from here)
            const centerX = imgX + imgW / 2;
            const centerY = imgY + imgH / 2;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const idx = (row * cols + col) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    const a = pixels[idx + 3] / 255;

                    if (a < 0.1) continue; // Skip transparent pixels

                    // Boost brightness for luminous effect
                    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                    const boost = 1.0 + luminance * 0.4;
                    const lr = Math.min(255, r * boost);
                    const lg = Math.min(255, g * boost);
                    const lb = Math.min(255, b * boost);

                    // Starting position at the pixel's grid location
                    const x = imgX + col * cellW + cellW / 2;
                    const y = imgY + row * cellH + cellH / 2;

                    // Direction away from center with some randomness
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const speed = 1.2 + Math.random() * 2.5;
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;

                    // Stagger — outer particles start dissolving first
                    const maxDist = Math.sqrt((imgW / 2) ** 2 + (imgH / 2) ** 2);
                    const normalizedDist = dist / maxDist;

                    particles.push({
                        x, y,
                        originX: x,
                        originY: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: Math.max(cellW, cellH) * (0.8 + Math.random() * 0.6),
                        r: lr, g: lg, b: lb,
                        alpha: a,
                        life: 1.0,
                        decay: 0.012 + Math.random() * 0.012,
                        delay: normalizedDist * 0.15 + Math.random() * 0.12,
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.08,
                        shimmer: Math.random() * Math.PI * 2,
                        shimmerSpeed: 2 + Math.random() * 3,
                    });
                }
            }

            // Add extra luminous sparkle particles (smaller, brighter, more random)
            const sparkleCount = Math.floor(particles.length * 0.15);
            for (let i = 0; i < sparkleCount; i++) {
                const baseParticle = particles[Math.floor(Math.random() * particles.length)];
                if (!baseParticle) continue;

                const offsetX = (Math.random() - 0.5) * cellW * 2;
                const offsetY = (Math.random() - 0.5) * cellH * 2;
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;

                particles.push({
                    x: baseParticle.originX + offsetX,
                    y: baseParticle.originY + offsetY,
                    originX: baseParticle.originX + offsetX,
                    originY: baseParticle.originY + offsetY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    r: Math.min(255, baseParticle.r + 60),
                    g: Math.min(255, baseParticle.g + 60),
                    b: Math.min(255, baseParticle.b + 60),
                    alpha: 0.6 + Math.random() * 0.4,
                    life: 1.0,
                    decay: 0.018 + Math.random() * 0.02,
                    delay: baseParticle.delay + Math.random() * 0.08,
                    rotation: 0,
                    rotSpeed: 0,
                    shimmer: Math.random() * Math.PI * 2,
                    shimmerSpeed: 4 + Math.random() * 6,
                    isSpark: true,
                });
            }

            // Show canvas
            transitionCanvas.classList.add('transitioning');

            // First frame: draw the image as a solid block (snapshot)
            try {
                const borderRadius = 16;
                transitionCtx.save();
                transitionCtx.beginPath();
                transitionCtx.roundRect(imgX, imgY, imgW, imgH, borderRadius);
                transitionCtx.clip();
                transitionCtx.drawImage(sourceImgEl, imgX, imgY, imgW, imgH);
                transitionCtx.restore();
            } catch (e) {
                // Fallback — skip snapshot
            }

            let startTime = null;
            let allDead = false;
            const DURATION = 1200; // ms total

            function animateParticles(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = (timestamp - startTime) / 1000; // seconds

                transitionCtx.clearRect(0, 0, transitionCanvas.width / dpr, transitionCanvas.height / dpr);

                allDead = true;

                for (const p of particles) {
                    if (p.life <= 0) continue;

                    // Delay before this particle starts dissolving
                    if (elapsed < p.delay) {
                        // Still solid — draw at original position
                        allDead = false;
                        if (!p.isSpark) {
                            drawLuminousParticle(p, p.originX, p.originY, p.alpha, p.size);
                        }
                        continue;
                    }

                    allDead = false;
                    const t = elapsed - p.delay;

                    // Update position
                    p.x += p.vx;
                    p.y += p.vy;

                    // Gentle gravity/drift
                    p.vy += 0.02;
                    p.vx *= 0.995;
                    p.vy *= 0.995;

                    // Rotation
                    p.rotation += p.rotSpeed;

                    // Decay life
                    p.life -= p.decay;
                    if (p.life <= 0) { p.life = 0; continue; }

                    // Shimmer (pulsing brightness)
                    const shimmerVal = 0.7 + 0.3 * Math.sin(p.shimmer + elapsed * p.shimmerSpeed);
                    const currentAlpha = p.life * p.alpha * shimmerVal;
                    const currentSize = p.size * (0.6 + p.life * 0.4);

                    drawLuminousParticle(p, p.x, p.y, currentAlpha, currentSize);
                }

                if (!allDead && elapsed < DURATION / 1000) {
                    transitionAnimId = requestAnimationFrame(animateParticles);
                } else {
                    // Cleanup
                    transitionCtx.clearRect(0, 0, transitionCanvas.width / dpr, transitionCanvas.height / dpr);
                    transitionCanvas.classList.remove('transitioning');
                    transitionAnimId = null;
                    onComplete();
                }
            }

            function drawLuminousParticle(p, x, y, alpha, size) {
                if (alpha <= 0.01) return;

                transitionCtx.save();
                transitionCtx.translate(x, y);
                transitionCtx.rotate(p.rotation);
                transitionCtx.globalCompositeOperation = 'screen';

                if (p.isSpark) {
                    // Sparkle — bright point with glow
                    const glow = transitionCtx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
                    glow.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`);
                    glow.addColorStop(0.3, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.5})`);
                    glow.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);

                    transitionCtx.fillStyle = glow;
                    transitionCtx.beginPath();
                    transitionCtx.arc(0, 0, size * 2, 0, Math.PI * 2);
                    transitionCtx.fill();
                } else {
                    // Main particle — soft luminous blob
                    const halfSize = size / 2;

                    // Outer glow (bloom)
                    const outerGlow = transitionCtx.createRadialGradient(0, 0, 0, 0, 0, halfSize * 1.8);
                    outerGlow.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.6})`);
                    outerGlow.addColorStop(0.5, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.15})`);
                    outerGlow.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);

                    transitionCtx.fillStyle = outerGlow;
                    transitionCtx.fillRect(-halfSize * 1.8, -halfSize * 1.8, size * 1.8 * 2, size * 1.8 * 2);

                    // Core (brighter center)
                    const core = transitionCtx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
                    core.addColorStop(0, `rgba(${Math.min(255, p.r + 40)}, ${Math.min(255, p.g + 40)}, ${Math.min(255, p.b + 40)}, ${alpha})`);
                    core.addColorStop(0.6, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.4})`);
                    core.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);

                    transitionCtx.fillStyle = core;
                    transitionCtx.beginPath();
                    transitionCtx.arc(0, 0, halfSize, 0, Math.PI * 2);
                    transitionCtx.fill();
                }

                transitionCtx.restore();
            }

            // Start animation
            transitionAnimId = requestAnimationFrame(animateParticles);
        }

        // --- Response Surface: Edit Button (opens edit surface) ---
        if (webBtnEditImg) {
            webBtnEditImg.addEventListener('click', () => {
                if (!webGeneratedSrc) return;
                webOriginalSrc = webGeneratedSrc;

                // Default to Select tool active
                webActiveTool = 'select';
                webUndoStack = [];
                webRedoStack = [];
                updateWebToolUI();

                // Cancel any ongoing transition
                if (transitionAnimId) {
                    cancelAnimationFrame(transitionAnimId);
                    transitionAnimId = null;
                    transitionCanvas?.classList.remove('transitioning');
                }

                // Source image for the particle effect
                const sourceImg = webResponseImageImg;

                // Hide response surface immediately (particles will cover the gap)
                if (webResponseSurface) webResponseSurface.hidden = true;

                // Start luminous particle transition
                playLuminousTransition(sourceImg, () => {
                    // Transition complete — ensure edit surface animation class is cleaned up
                    webEditSurface.classList.remove('particle-entrance');
                });

                // Show edit surface with particle-entrance animation (delayed fade-in)
                webEditSurface.classList.remove('closing');
                webEditSurface.classList.add('particle-entrance');
                webEditSurface.hidden = false;

                // Set image source and size canvas after layout
                const sizeAfterLoad = () => {
                    requestAnimationFrame(() => {
                        setTimeout(() => sizeWebDrawCanvas(), 50);
                    });
                };

                if (webCanvasImg.src === webGeneratedSrc && webCanvasImg.naturalWidth > 0) {
                    sizeAfterLoad();
                } else {
                    webCanvasImg.onload = sizeAfterLoad;
                    webCanvasImg.src = webGeneratedSrc;
                }
            });
        }

        // --- Response Surface: Download Image ---
        if (webBtnDownloadImg) {
            webBtnDownloadImg.addEventListener('click', () => {
                if (!webGeneratedSrc) return;
                const link = document.createElement('a');
                link.href = webGeneratedSrc;
                link.download = `gemini-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('Image downloaded');
            });
        }

        // --- Response Surface: Download from action bar ---
        if (webBtnDownloadResponse) {
            webBtnDownloadResponse.addEventListener('click', () => {
                if (webBtnDownloadImg) webBtnDownloadImg.click();
            });
        }

        // --- Response Surface: Action Bar Interactions ---
        ['web-img-btn-thumbup', 'web-img-btn-thumbdown', 'web-img-btn-share-img',
         'web-img-btn-share-response', 'web-img-btn-copy-response', 'web-img-btn-more'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    const labels = {
                        'web-img-btn-thumbup': 'Thanks for the feedback!',
                        'web-img-btn-thumbdown': 'Thanks for the feedback!',
                        'web-img-btn-share-img': 'Share',
                        'web-img-btn-share-response': 'Share',
                        'web-img-btn-copy-response': 'Copied',
                        'web-img-btn-more': 'More options'
                    };
                    showToast(labels[id] || 'Action');
                });
            }
        });

        // Download image button on web response surface
        const webDownloadImgBtn = document.getElementById('web-img-btn-download-img');
        if (webDownloadImgBtn) {
            webDownloadImgBtn.addEventListener('click', () => {
                const img = document.getElementById('web-img-response-image-img');
                if (!img || !img.src || img.src === window.location.href) {
                    showToast('No image to download');
                    return;
                }
                const link = document.createElement('a');
                link.href = img.src;
                link.download = `gemini-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('Image downloaded');
            });
        }

        // --- Refresh / Regenerate ---
        if (webBtnRefresh) {
            webBtnRefresh.addEventListener('click', () => {
                if (!webGeneratedSrc) return;
                // Re-generate with same style and prompt
                const lastPrompt = webResponseText ? webResponseText.textContent : '';
                webGenerateImage(webSelectedStyle, lastPrompt, webSelfieFile);
            });
        }

        // --- Add Button (template input) ---
        if (webBtnAddTemplate) {
            webBtnAddTemplate.addEventListener('click', () => {
                webSelfieInput.click();
            });
        }

        // Response surface add button — same behavior
        const webBtnAddResponse = document.getElementById('web-img-response-btn-add');
        if (webBtnAddResponse) {
            webBtnAddResponse.addEventListener('click', () => {
                webSelfieInput.click();
            });
        }

        // --- ImageFX Chip Toggle ---
        if (webImageFxChip) {
            webImageFxChip.addEventListener('click', () => {
                showToast('ImageFX mode active');
            });
        }

        // --- Response Surface: Follow-Up Prompts ---
        if (webResponsePromptInput) {
            webResponsePromptInput.addEventListener('input', () => {
                webResponsePromptInput.style.height = 'auto';
                webResponsePromptInput.style.height = Math.min(webResponsePromptInput.scrollHeight, 120) + 'px';
                const hasText = webResponsePromptInput.value.trim().length > 0;
                if (webResponsePlaceholder) webResponsePlaceholder.classList.toggle('hidden', hasText);
                if (webResponseMic) webResponseMic.style.display = hasText ? 'none' : 'flex';
                if (webResponseSend) {
                    webResponseSend.style.display = hasText ? 'flex' : 'none';
                    webResponseSend.disabled = !hasText;
                }
            });

            webResponsePromptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (webResponseSend && !webResponseSend.disabled) webResponseSend.click();
                }
            });
        }

        if (webResponseSend) {
            webResponseSend.addEventListener('click', async () => {
                const followUpText = webResponsePromptInput.value.trim();
                if (!followUpText) return;

                // Show loading & disable controls
                webResponseLoading.hidden = false;
                webResponseAnswerText.textContent = 'Editing your image…';
                setWebResponseInteractive(false);

                // Reset input
                webResponsePromptInput.value = '';
                webResponsePromptInput.style.height = '';
                if (webResponsePlaceholder) webResponsePlaceholder.classList.remove('hidden');
                if (webResponseMic) webResponseMic.style.display = 'flex';
                webResponseSend.style.display = 'none';
                webResponseSend.disabled = true;

                try {
                    const base64 = await imgSrcToBase64(webResponseImageImg);
                    const result = await editWithGemini(base64, followUpText, null);
                    webResponseImageImg.src = result;
                    webGeneratedSrc = result;
                    webCanvasImg.src = result;
                    webOriginalSrc = result;
                    webResponseAnswerText.textContent = 'Here is the updated image';
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        showToast('Edit failed: ' + err.message);
                        webResponseAnswerText.textContent = 'Sure, here is your image';
                    }
                }
                webResponseLoading.hidden = true;
                setWebResponseInteractive(true);
            });
        }

        function sizeWebDrawCanvas(retryCount) {
            if (!webCanvasImg || !webDrawCanvas) return;
            const rect = webCanvasImg.getBoundingClientRect();
            // If image hasn't rendered yet (0x0), retry after a delay
            if (rect.width < 10 || rect.height < 10) {
                const attempt = retryCount || 0;
                if (attempt < 10) {
                    setTimeout(() => sizeWebDrawCanvas(attempt + 1), 50 + attempt * 50);
                }
                return;
            }
            const newW = Math.round(rect.width);
            const newH = Math.round(rect.height);
            // Only resize if dimensions actually changed (setting width/height clears canvas)
            if (webDrawCanvas.width !== newW || webDrawCanvas.height !== newH) {
                webDrawCanvas.width = newW;
                webDrawCanvas.height = newH;
                webDrawCanvas.style.width = newW + 'px';
                webDrawCanvas.style.height = newH + 'px';
                // Redraw any existing strokes since resize clears the canvas
                if (webAllStrokes && webAllStrokes.length > 0) {
                    const ctx = webDrawCanvas.getContext('2d');
                    webAllStrokes.forEach(stroke => {
                        if (stroke.length >= 2) webDrawStroke(ctx, stroke);
                    });
                }
            }
            // Align canvas with image position within the wrapper
            const wrapperRect = webDrawCanvas.parentElement.getBoundingClientRect();
            webDrawCanvas.style.left = (rect.left - wrapperRect.left) + 'px';
            webDrawCanvas.style.top = (rect.top - wrapperRect.top) + 'px';
        }

        // --- Close Edit Surface (go back to response) ---
        webEditCloseBtn.addEventListener('click', async () => {
            await closeWebEditModal();

            // If we have a generated image, go back to response surface
            if (webGeneratedSrc && webResponseSurface) {
                webResponseImageImg.src = webCanvasImg.src;
                webGeneratedSrc = webCanvasImg.src;
                webResponseSurface.hidden = false;
            } else {
                webTemplateSurface.hidden = false;
            }

            // Reset state
            webActiveTool = null;
            webUndoStack = [];
            webRedoStack = [];
            updateWebToolUI();
        });

        // --- Tool Buttons ---
        webToolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (webActiveTool === tool) {
                    // Deselect tool
                    webActiveTool = null;
                } else {
                    webActiveTool = tool;
                }
                updateWebToolUI();
            });
        });

        function updateWebToolUI() {
            // Update tool button active states
            webToolBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === webActiveTool);
            });

            // Show/hide sub-tool panels
            const allSubtools = webShell.querySelectorAll('.web-img__subtools');
            allSubtools.forEach(panel => {
                panel.hidden = panel.dataset.parent !== webActiveTool;
            });

            // Show subtool bar if any panel is visible
            const anyVisible = Array.from(allSubtools).some(p => !p.hidden);
            if (webSubtoolBar) webSubtoolBar.hidden = !anyVisible;

            // Show edit input for Select/Text tools
            if (webEditInput) {
                const showInput = webActiveTool === 'select' || webActiveTool === 'text';
                webEditInput.hidden = !showInput;
                // Sync edit input width to match toolbar center
                if (showInput) {
                    const toolbarCenter = document.getElementById('web-img-toolbar-center');
                    const inputInner = webEditInput.querySelector('.web-img__edit-input-inner');
                    if (toolbarCenter && inputInner) {
                        const tbWidth = toolbarCenter.offsetWidth;
                        if (tbWidth > 100) {
                            inputInner.style.maxWidth = tbWidth + 'px';
                        }
                    }
                }
            }

            // Set placeholder and input state based on tool
            if (webEditPrompt) {
                if (webActiveTool === 'text') {
                    const hasSelection = !!(webFloatingTextEl || webMarqueeSelection);
                    webEditPrompt.disabled = !hasSelection;
                    if (!hasSelection) {
                        webEditPrompt.value = '';
                        webEditPrompt.placeholder = 'Tap text or draw a selection';
                    }
                } else if (webActiveTool === 'select') {
                    const hasStrokes = webAllStrokes && webAllStrokes.length > 0;
                    const hasAttachment = !!webSelectAttachDataUrl;
                    webEditPrompt.disabled = !hasStrokes && !hasAttachment;
                    if (!hasStrokes && !hasAttachment) {
                        webEditPrompt.value = '';
                        webEditPrompt.placeholder = 'Draw on the image first';
                    } else if (hasAttachment && !hasStrokes) {
                        webEditPrompt.placeholder = 'Draw where to place the image';
                    } else if (hasAttachment && hasStrokes) {
                        webEditPrompt.placeholder = 'Describe how to apply (or press send)';
                        webEditPrompt.disabled = false;
                    } else {
                        webEditPrompt.placeholder = 'Describe your edit';
                    }
                }
            }

            // Show/hide draw canvas for select/text tools (never during erase)
            const drawActive = (webActiveTool === 'select' || webActiveTool === 'text') && !webEraseMode;
            if (webDrawCanvas) {
                webDrawCanvas.style.pointerEvents = drawActive ? 'auto' : 'none';
                webDrawCanvas.style.display = drawActive ? '' : 'none';
                if (drawActive) {
                    sizeWebDrawCanvas();
                    webDrawCanvas.style.cursor = webActiveTool === 'text' ? 'crosshair' : '';
                }
            }

            // Ensure erase canvas is hidden when not in erase mode
            if (webEraseCanvas && !webEraseMode) {
                webEraseCanvas.hidden = true;
            }

            // Clear strokes and attachment when switching away from select
            if (webActiveTool !== 'select') {
                if (webAllStrokes && webAllStrokes.length > 0) {
                    webAllStrokes = [];
                    if (webDrawCanvas) {
                        const ctx = webDrawCanvas.getContext('2d');
                        ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
                    }
                    if (webDismissBtn) webDismissBtn.style.display = 'none';
                }
                // Also clear any image attachment from the Select tool
                if (typeof clearWebSelectAttachment === 'function') clearWebSelectAttachment();
            }

            // Clear text selection when switching away from text
            if (webActiveTool !== 'text') {
                webClearTextSelection();
            }

            // Hide resize overlay and clear pending resize when not in resize mode
            const resizeOverlay = document.getElementById('web-img-resize-overlay');
            if (resizeOverlay && webActiveTool !== 'resize') {
                resizeOverlay.hidden = true;
                webPendingResize = null;
            }

            // Show/configure main CTA button based on state
            if (webDoneBtn) {
                const hasTextPending = webActiveTool === 'text' &&
                    (webFloatingTextEl || webMarqueeSelection) &&
                    webEditPrompt && webEditPrompt.value.trim();
                if (webPendingResize) {
                    webDoneBtn.disabled = false;
                    webDoneBtn.textContent = 'Resize';
                } else if (hasTextPending) {
                    webDoneBtn.disabled = false;
                    webDoneBtn.textContent = 'Apply';
                } else if (webUndoStack.length > 0) {
                    webDoneBtn.disabled = false;
                    webDoneBtn.textContent = 'Save';
                } else {
                    webDoneBtn.disabled = true;
                    webDoneBtn.textContent = 'Save';
                }
            }

            // Reset erase when switching away from effects
            if (webActiveTool !== 'effects' && webEraseMode) {
                webEraseMode = false;
                if (webEraseCanvas) {
                    webEraseCanvas.hidden = true;
                    const erCtx = webEraseCanvas.getContext('2d');
                    erCtx.clearRect(0, 0, webEraseCanvas.width, webEraseCanvas.height);
                }
            }

            // Update undo/redo
            if (webUndoBtn) webUndoBtn.disabled = webUndoStack.length === 0;
            if (webRedoBtn) webRedoBtn.disabled = webRedoStack.length === 0;
        }

        // --- Undo / Redo ---
        if (webUndoBtn) {
            webUndoBtn.addEventListener('click', () => {
                if (webUndoStack.length === 0) return;
                const current = webCanvasImg.src;
                webRedoStack.push(current);
                const prev = webUndoStack.pop();
                // Clear any crossfade styles
                webCanvasImg.style.transition = '';
                webCanvasImg.style.filter = '';
                webCanvasImg.style.opacity = '1';
                webCanvasImg.src = prev;
                webCanvasImg.onload = () => updateWebToolUI();
                updateWebToolUI();
            });
        }

        if (webRedoBtn) {
            webRedoBtn.addEventListener('click', () => {
                if (webRedoStack.length === 0) return;
                const current = webCanvasImg.src;
                webUndoStack.push(current);
                const next = webRedoStack.pop();
                webCanvasImg.style.transition = '';
                webCanvasImg.style.filter = '';
                webCanvasImg.style.opacity = '1';
                webCanvasImg.src = next;
                webCanvasImg.onload = () => updateWebToolUI();
                updateWebToolUI();
            });
        }

        // --- Save / Done ---
        webDoneBtn.addEventListener('click', async () => {
            // If erase mode is still active, just clean up (erase auto-fires on release)
            if (webEraseMode) {
                webEraseMode = false;
                if (webEraseCanvas) {
                    webEraseCanvas.hidden = true;
                    webErasePoints = [];
                    const eraseCtx = webEraseCanvas.getContext('2d');
                    eraseCtx.clearRect(0, 0, webEraseCanvas.width, webEraseCanvas.height);
                }
            }

            // If pending resize, crop the image using the overlay coordinates
            if (webPendingResize) {
                const ratio = webPendingResize;
                webPendingResize = null;
                const resizeOverlay = document.getElementById('web-img-resize-overlay');

                // Read crop percentages from overlay CSS custom properties
                const cropTopPct = parseFloat(resizeOverlay?.style.getPropertyValue('--crop-top')) || 0;
                const cropLeftPct = parseFloat(resizeOverlay?.style.getPropertyValue('--crop-left')) || 0;
                const cropWidthPct = parseFloat(resizeOverlay?.style.getPropertyValue('--crop-width')) || 100;
                const cropHeightPct = parseFloat(resizeOverlay?.style.getPropertyValue('--crop-height')) || 100;

                // Convert percentage to natural pixel coordinates
                const natW = webCanvasImg.naturalWidth;
                const natH = webCanvasImg.naturalHeight;
                const sx = Math.round((cropLeftPct / 100) * natW);
                const sy = Math.round((cropTopPct / 100) * natH);
                const sw = Math.round((cropWidthPct / 100) * natW);
                const sh = Math.round((cropHeightPct / 100) * natH);

                // Push current image to undo stack
                webUndoStack.push(webCanvasImg.src);
                webRedoStack = [];

                // Crop using offscreen canvas
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = sw;
                cropCanvas.height = sh;
                const cropCtx = cropCanvas.getContext('2d');
                cropCtx.drawImage(webCanvasImg, sx, sy, sw, sh, 0, 0, sw, sh);
                webCanvasImg.src = cropCanvas.toDataURL('image/png');

                if (resizeOverlay) resizeOverlay.hidden = true;
                // Reset subtool active states
                webShell.querySelectorAll('.web-img__subtool-btn').forEach(b => b.classList.remove('active'));
                showToast(`Resized to ${ratio.label}`);
                updateWebToolUI();
                return; // Stay in edit mode after resize
            }

            // If text tool has pending text, apply it
            if (webActiveTool === 'text' && webEditPrompt && webEditPrompt.value.trim()) {
                submitWebEdit();
                return;
            }

            // Clear doodle strokes
            webAllStrokes = [];
            if (webDrawCanvas) {
                const dCtx = webDrawCanvas.getContext('2d');
                dCtx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            if (webDismissBtn) webDismissBtn.style.display = 'none';

            // Hide resize overlay
            const resizeOverlay = document.getElementById('web-img-resize-overlay');
            if (resizeOverlay) resizeOverlay.hidden = true;

            // If edits were made, show edit summary screen
            if (webUndoStack.length > 0) {
                // Hide toolbar tools, subtool bar, and edit input
                const toolCenter = document.getElementById('web-img-toolbar-center');
                if (toolCenter) toolCenter.hidden = true;
                if (webSubtoolBar) webSubtoolBar.hidden = true;
                if (webEditInput) webEditInput.hidden = true;

                // Change button text in summary mode
                webDoneBtn.textContent = 'Save';

                // Show undo/redo as disabled during summary
                if (webUndoBtn) webUndoBtn.hidden = true;
                if (webRedoBtn) webRedoBtn.hidden = true;

                // Mark that we're in summary mode
                webShell.dataset.editSummary = 'true';
                return;
            }

            // No edits — just close
            await closeWebEditModal();
            if (webResponseSurface) {
                webResponseSurface.hidden = false;
            }

            // Reset edit state
            webActiveTool = null;
            webUndoStack = [];
            webRedoStack = [];
            if (webDrawCanvas) {
                const ctx = webDrawCanvas.getContext('2d');
                ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            updateWebToolUI();
        });

        // Handle Save from edit summary
        webDoneBtn.addEventListener('click', async function saveHandler() {
            if (webShell.dataset.editSummary !== 'true') return;

            // Commit: save the edited image
            webGeneratedSrc = webCanvasImg.src;
            if (webResponseImageImg) webResponseImageImg.src = webCanvasImg.src;
            showToast('Image saved');

            // Clean up summary state
            delete webShell.dataset.editSummary;
            webDoneBtn.textContent = 'Save';
            const toolCenter = document.getElementById('web-img-toolbar-center');
            if (toolCenter) toolCenter.hidden = false;
            if (webUndoBtn) webUndoBtn.hidden = false;
            if (webRedoBtn) webRedoBtn.hidden = false;

            await closeWebEditModal();
            if (webResponseSurface) {
                webResponseSurface.hidden = false;
            }

            // Reset edit state
            webActiveTool = null;
            webUndoStack = [];
            webRedoStack = [];
            webPendingResize = null;
            if (webDrawCanvas) {
                const ctx = webDrawCanvas.getContext('2d');
                ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            updateWebToolUI();
        });

        // Handle X close from edit summary — discard edits
        if (webEditCloseBtn) {
            const origCloseHandler = webEditCloseBtn.onclick;
            webEditCloseBtn.addEventListener('click', async () => {
                if (webShell.dataset.editSummary === 'true') {
                    // Discard: revert to original
                    if (webUndoStack.length > 0) {
                        webCanvasImg.src = webUndoStack[0]; // Original image
                    }
                    webGeneratedSrc = webCanvasImg.src;

                    // Clean up summary state
                    delete webShell.dataset.editSummary;
                    webDoneBtn.textContent = 'Save';
                    const toolCenter = document.getElementById('web-img-toolbar-center');
                    if (toolCenter) toolCenter.hidden = false;
                    if (webUndoBtn) webUndoBtn.hidden = false;
                    if (webRedoBtn) webRedoBtn.hidden = false;

                    showToast('Changes discarded');
                    await closeWebEditModal();
                    if (webResponseSurface) {
                        webResponseSurface.hidden = false;
                    }

                    // Reset
                    webActiveTool = null;
                    webUndoStack = [];
                    webRedoStack = [];
                    webPendingResize = null;
                    if (webDrawCanvas) {
                        const ctx = webDrawCanvas.getContext('2d');
                        ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
                    }
                    updateWebToolUI();
                }
            });
        }

        // --- Sub-tool clicks ---
        webShell.querySelectorAll('.web-img__subtool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subtool = btn.dataset.subtool;
                // Toggle active
                const wasActive = btn.classList.contains('active');
                webShell.querySelectorAll('.web-img__subtool-btn').forEach(b => b.classList.remove('active'));
                if (!wasActive) btn.classList.add('active');

                handleWebSubtool(wasActive ? null : subtool);
            });
        });

        // webAbortController already declared above

        async function handleWebSubtool(subtool) {
            if (!subtool) return;

            if (subtool === 'removebg') {
                await webApiEdit('Removing background…', async (signal) => {
                    const base64 = await imgSrcToBase64(webCanvasImg);
                    return await editWithGemini(base64, 'Remove the background from this image. Make the background fully transparent. Keep only the main subject.', signal);
                });
                webCanvasWrapper.classList.add('show-checkerboard');

            } else if (subtool === 'lighting') {
                await webApiEdit('Adjusting lighting…', async (signal) => {
                    const base64 = await imgSrcToBase64(webCanvasImg);
                    return await editWithGemini(base64, 'Improve the lighting of this image. Make it look professionally lit with balanced exposure, natural shadows, and enhanced highlights. Maintain the original composition and colors.', signal);
                });

            } else if (subtool === 'portrait_mode') {
                await webApiEdit('Applying portrait mode…', async (signal) => {
                    const base64 = await imgSrcToBase64(webCanvasImg);
                    return await editWithGemini(base64, 'Apply a professional portrait mode effect to this image. Add natural-looking bokeh background blur while keeping the main subject sharp. Add subtle halation and vignette for a cinematic look.', signal);
                });

            } else if (subtool === 'erase') {
                webEraseMode = true;
                if (webEraseCanvas) {
                    webEraseCanvas.hidden = false;
                    const rect = webCanvasImg.getBoundingClientRect();
                    webEraseCanvas.width = rect.width;
                    webEraseCanvas.height = rect.height;
                    webEraseCanvas.style.width = rect.width + 'px';
                    webEraseCanvas.style.height = rect.height + 'px';
                }
                showToast('Paint over objects to erase them');

            } else if (subtool === 'square' || subtool === 'portrait' || subtool === 'landscape') {
                // Show resize overlay with target aspect ratio (preview only — commit on Done)
                const resizeOverlay = document.getElementById('web-img-resize-overlay');
                const ratioMap = {
                    square: { w: 1, h: 1, label: '1:1 square' },
                    portrait: { w: 9, h: 16, label: '9:16 portrait (tall)' },
                    landscape: { w: 16, h: 9, label: '16:9 landscape (wide)' },
                };
                const ratio = ratioMap[subtool];

                // Store pending resize for Done button
                webPendingResize = ratio;
                updateWebToolUI();

                // Calculate and show crop frame
                if (resizeOverlay) {
                    const imgW = webCanvasImg.offsetWidth || webCanvasImg.naturalWidth;
                    const imgH = webCanvasImg.offsetHeight || webCanvasImg.naturalHeight;
                    const targetAR = ratio.w / ratio.h;
                    const currentAR = imgW / imgH;

                    let cropW, cropH;
                    if (targetAR > currentAR) {
                        cropW = 100;
                        cropH = (currentAR / targetAR) * 100;
                    } else {
                        cropH = 100;
                        cropW = (targetAR / currentAR) * 100;
                    }
                    const cropTop = (100 - cropH) / 2;
                    const cropLeft = (100 - cropW) / 2;

                    resizeOverlay.style.setProperty('--crop-top', cropTop + '%');
                    resizeOverlay.style.setProperty('--crop-left', cropLeft + '%');
                    resizeOverlay.style.setProperty('--crop-width', cropW + '%');
                    resizeOverlay.style.setProperty('--crop-height', cropH + '%');
                    resizeOverlay.hidden = false;
                }

                showToast(`${ratio.label} selected — tap Resize to apply`);
            }
        }

        // --- Draggable Resize Crop Overlay ---
        (function initResizeDrag() {
            const overlay = document.getElementById('web-img-resize-overlay');
            if (!overlay) return;
            const border = overlay.querySelector('.web-img__resize-border');
            const handles = overlay.querySelectorAll('.web-img__resize-handle');

            let dragging = null; // 'tl' | 'tr' | 'bl' | 'br' | 'move'
            let startX, startY, startCrop;

            function getCrop() {
                return {
                    top: parseFloat(overlay.style.getPropertyValue('--crop-top')) || 10,
                    left: parseFloat(overlay.style.getPropertyValue('--crop-left')) || 10,
                    width: parseFloat(overlay.style.getPropertyValue('--crop-width')) || 80,
                    height: parseFloat(overlay.style.getPropertyValue('--crop-height')) || 80,
                };
            }

            function setCrop(c) {
                overlay.style.setProperty('--crop-top', c.top + '%');
                overlay.style.setProperty('--crop-left', c.left + '%');
                overlay.style.setProperty('--crop-width', c.width + '%');
                overlay.style.setProperty('--crop-height', c.height + '%');
            }

            function getAR() {
                if (!webPendingResize) return 1;
                return webPendingResize.w / webPendingResize.h;
            }

            function onPointerDown(e, corner) {
                e.preventDefault();
                e.stopPropagation();
                dragging = corner;
                startX = e.clientX;
                startY = e.clientY;
                startCrop = getCrop();
                overlay.setPointerCapture(e.pointerId);
            }

            handles.forEach(h => {
                const cls = h.className;
                let corner = 'br';
                if (cls.includes('--tl')) corner = 'tl';
                else if (cls.includes('--tr')) corner = 'tr';
                else if (cls.includes('--bl')) corner = 'bl';
                h.addEventListener('pointerdown', e => onPointerDown(e, corner));
            });

            // Border drag = move
            border.addEventListener('pointerdown', e => onPointerDown(e, 'move'));

            overlay.addEventListener('pointermove', e => {
                if (!dragging) return;
                const rect = overlay.getBoundingClientRect();
                const dx = ((e.clientX - startX) / rect.width) * 100;
                const dy = ((e.clientY - startY) / rect.height) * 100;
                const c = { ...startCrop };
                const ar = getAR();
                const MIN_SIZE = 15; // minimum crop size in %

                if (dragging === 'move') {
                    // Move crop area, clamp to bounds
                    c.left = Math.max(0, Math.min(100 - c.width, startCrop.left + dx));
                    c.top = Math.max(0, Math.min(100 - c.height, startCrop.top + dy));
                } else {
                    // Resize from corner with locked aspect ratio
                    let newW = c.width, newH = c.height, newL = c.left, newT = c.top;

                    if (dragging === 'br') {
                        newW = Math.max(MIN_SIZE, startCrop.width + dx);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newW = Math.min(newW, 100 - c.left);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newH = Math.min(newH, 100 - c.top);
                        newW = newH * ar * (overlay.offsetHeight / overlay.offsetWidth);
                    } else if (dragging === 'tl') {
                        newW = Math.max(MIN_SIZE, startCrop.width - dx);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newL = startCrop.left + startCrop.width - newW;
                        newT = startCrop.top + startCrop.height - newH;
                        if (newL < 0) { newL = 0; newW = startCrop.left + startCrop.width; newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight); newT = startCrop.top + startCrop.height - newH; }
                        if (newT < 0) { newT = 0; newH = startCrop.top + startCrop.height; newW = newH * ar * (overlay.offsetHeight / overlay.offsetWidth); newL = startCrop.left + startCrop.width - newW; }
                    } else if (dragging === 'tr') {
                        newW = Math.max(MIN_SIZE, startCrop.width + dx);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newT = startCrop.top + startCrop.height - newH;
                        newW = Math.min(newW, 100 - c.left);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newT = startCrop.top + startCrop.height - newH;
                        if (newT < 0) { newT = 0; newH = startCrop.top + startCrop.height; newW = newH * ar * (overlay.offsetHeight / overlay.offsetWidth); }
                    } else if (dragging === 'bl') {
                        newW = Math.max(MIN_SIZE, startCrop.width - dx);
                        newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight);
                        newL = startCrop.left + startCrop.width - newW;
                        newH = Math.min(newH, 100 - c.top);
                        newW = newH * ar * (overlay.offsetHeight / overlay.offsetWidth);
                        newL = startCrop.left + startCrop.width - newW;
                        if (newL < 0) { newL = 0; newW = startCrop.left + startCrop.width; newH = newW / ar * (overlay.offsetWidth / overlay.offsetHeight); }
                    }

                    c.width = Math.max(MIN_SIZE, newW);
                    c.height = Math.max(MIN_SIZE, newH);
                    c.left = Math.max(0, newL);
                    c.top = Math.max(0, newT);
                }

                setCrop(c);
            });

            overlay.addEventListener('pointerup', () => { dragging = null; });
            overlay.addEventListener('pointercancel', () => { dragging = null; });
        })();

        // --- Particle Loader System (ported from mobile) ---
        const webParticleCanvas = document.getElementById('web-img-particle-canvas');
        const webPCtx = webParticleCanvas ? webParticleCanvas.getContext('2d') : null;
        let webParticles = [];
        let webParticleAnimId = null;
        let webParticleFade = 0;
        let webVortexCenter = null;

        function webNoise2D(x, y) {
            return (
                Math.sin(x * 1.2 + y * 0.9) * 0.5 +
                Math.sin(x * 0.7 - y * 1.3 + 2.1) * 0.3 +
                Math.sin(x * 2.1 + y * 0.4 - 1.7) * 0.2
            );
        }

        function webCreateParticle(w, h, forceEdge) {
            const depth = Math.random();
            let x, y;
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { x = Math.random() * w; y = -2; }
            else if (side === 1) { x = w + 2; y = Math.random() * h; }
            else if (side === 2) { x = Math.random() * w; y = h + 2; }
            else { x = -2; y = Math.random() * h; }
            if (!forceEdge && Math.random() < 0.5) {
                x = Math.random() * w;
                y = Math.random() * h;
            }
            return {
                x, y, depth,
                size: 0.8 + depth * 2 + Math.random() * 1.2,
                baseAlpha: 0.04 + depth * 0.09,
                noiseOffX: Math.random() * 1000,
                noiseOffY: Math.random() * 1000,
                orbitDir: Math.random() < 0.5 ? 1 : -1,
                angularBase: 0.0015 + Math.random() * 0.003,
                shimmerCycle: 3000 + Math.random() * 8000,
                shimmerPhase: Math.random() * Math.PI * 2,
                birth: performance.now() + Math.random() * 1500,
            };
        }

        function webRespawnParticle(p, w, h) {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { p.x = Math.random() * w; p.y = -2; }
            else if (side === 1) { p.x = w + 2; p.y = Math.random() * h; }
            else if (side === 2) { p.x = Math.random() * w; p.y = h + 2; }
            else { p.x = -2; p.y = Math.random() * h; }
            p.birth = performance.now();
            p.orbitDir = Math.random() < 0.5 ? 1 : -1;
        }

        function webInitParticles() {
            if (!webParticleCanvas) return;
            const w = webParticleCanvas.width || 400;
            const h = webParticleCanvas.height || 600;
            const count = Math.floor((w * h) / 85);
            webParticles = [];
            for (let i = 0; i < Math.min(count, 3600); i++) {
                webParticles.push(webCreateParticle(w, h, false));
            }
        }

        function webDrawParticles(now) {
            if (!webPCtx || !webParticleCanvas.width) return;
            const w = webParticleCanvas.width;
            const h = webParticleCanvas.height;
            const cx = webVortexCenter ? webVortexCenter.x : w / 2;
            const cy = webVortexCenter ? webVortexCenter.y : h / 2;
            const maxDist = Math.max(Math.sqrt(cx * cx + cy * cy), 1);

            webPCtx.clearRect(0, 0, w, h);

            for (const p of webParticles) {
                const age = now - p.birth;
                if (age < 0) continue;
                const birthFade = Math.min(age / 800, 1);

                const dx = p.x - cx;
                const dy = p.y - cy;
                const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
                const normDist = dist / maxDist;

                const gravity = 0.15 / (normDist + 0.05);
                const angularVel = p.angularBase * p.orbitDir / (normDist + 0.1);

                const angle = Math.atan2(dy, dx);
                p.x += Math.cos(angle + Math.PI / 2) * angularVel * dist * 0.015;
                p.y += Math.sin(angle + Math.PI / 2) * angularVel * dist * 0.015;
                p.x -= (dx / dist) * gravity * 0.6;
                p.y -= (dy / dist) * gravity * 0.6;

                const t = now * 0.00005;
                p.x += webNoise2D(p.noiseOffX + t, p.noiseOffY) * 0.15;
                p.y += webNoise2D(p.noiseOffY + t, p.noiseOffX) * 0.15;

                const centerFade = Math.min(normDist * 3, 1);
                if (dist < 6) { webRespawnParticle(p, w, h); continue; }
                if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
                    webRespawnParticle(p, w, h); continue;
                }

                const shimmerT = (now + p.shimmerPhase * 1000) / p.shimmerCycle;
                const shimmerWave = Math.pow(Math.max(0, Math.sin(shimmerT * Math.PI * 2)), 4);
                const shimmerBoost = shimmerWave * 0.12;

                const alpha = (p.baseAlpha + shimmerBoost) * birthFade * webParticleFade * centerFade;
                if (alpha < 0.005) continue;

                webPCtx.save();
                const r = p.size * 1.2;
                const grad = webPCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

                webPCtx.fillStyle = grad;
                webPCtx.beginPath();
                webPCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
                webPCtx.fill();

                if (p.depth > 0.5) {
                    webPCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
                    webPCtx.beginPath();
                    webPCtx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
                    webPCtx.fill();
                }
                webPCtx.restore();
            }
        }

        function webAnimateParticles(now) {
            webDrawParticles(now);
            webParticleAnimId = requestAnimationFrame(webAnimateParticles);
        }

        function webStartParticles(target) {
            if (!webParticleCanvas || webParticleAnimId) return;
            // Size and position particle canvas over the image
            const imgRect = webCanvasImg.getBoundingClientRect();
            const wrapperRect = webCanvasWrapper.getBoundingClientRect();
            if (imgRect.width && imgRect.height) {
                webParticleCanvas.style.left = (imgRect.left - wrapperRect.left) + 'px';
                webParticleCanvas.style.top = (imgRect.top - wrapperRect.top) + 'px';
                webParticleCanvas.width = imgRect.width;
                webParticleCanvas.height = imgRect.height;
                webParticleCanvas.style.width = imgRect.width + 'px';
                webParticleCanvas.style.height = imgRect.height + 'px';
            }
            // Set vortex center — particles will spiral toward this point
            if (target && typeof target.x === 'number' && typeof target.y === 'number') {
                // Convert from image-native coords to particle canvas (display) coords
                const displayW = webParticleCanvas.width || imgRect.width;
                const displayH = webParticleCanvas.height || imgRect.height;
                const natW = webCanvasImg.naturalWidth || displayW;
                const natH = webCanvasImg.naturalHeight || displayH;
                webVortexCenter = {
                    x: (target.x / natW) * displayW,
                    y: (target.y / natH) * displayH
                };
            } else {
                webVortexCenter = null; // defaults to canvas center
            }
            webInitParticles();
            webParticleFade = 0;
            webParticleCanvas.classList.add('active');
            const fadeIn = () => {
                webParticleFade = Math.min(webParticleFade + 0.02, 1);
                if (webParticleFade < 1 && webParticleAnimId) requestAnimationFrame(fadeIn);
            };
            requestAnimationFrame(fadeIn);
            webParticleAnimId = requestAnimationFrame(webAnimateParticles);
        }

        function webStopParticles() {
            if (!webParticleAnimId) return;
            if (webParticleCanvas) webParticleCanvas.classList.remove('active');
            const fadeOut = () => {
                webParticleFade = Math.max(webParticleFade - 0.015, 0);
                if (webParticleFade > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    cancelAnimationFrame(webParticleAnimId);
                    webParticleAnimId = null;
                    if (webPCtx && webParticleCanvas.width) {
                        webPCtx.clearRect(0, 0, webParticleCanvas.width, webParticleCanvas.height);
                    }
                    webParticles = [];
                }
            };
            requestAnimationFrame(fadeOut);
        }

        // Unified API edit helper with particle loading, cancel, undo, and crossfade
        async function webApiEdit(loadingMsg, apiFn, particleTarget) {
            webAbortController = new AbortController();

            // Disable all interactive controls during the edit
            setWebEditInteractive(false);

            // Clean up any floating text / marching ants overlays before loading
            if (typeof webRemoveFloatingText === 'function') webRemoveFloatingText();
            if (typeof webStopMarchingAnts === 'function') webStopMarchingAnts();

            // Show cancel button positioned over the image (no opaque overlay)
            const cancelBtn = webLoading.querySelector('.web-img__loading-cancel');
            if (cancelBtn) {
                cancelBtn.hidden = false;
                cancelBtn.style.position = 'absolute';
                cancelBtn.style.bottom = '16px';
                cancelBtn.style.left = '50%';
                cancelBtn.style.transform = 'translateX(-50%)';
                cancelBtn.style.zIndex = '20';
            }

            try {
                // Apply blur + start particles (matching mobile loading style)
                webCanvasImg.style.transition = 'filter 0.6s ease, opacity 0.6s ease';
                webCanvasImg.style.filter = 'blur(12px) saturate(0.7)';
                webCanvasImg.style.opacity = '0.5';
                webStartParticles(particleTarget);

                const result = await apiFn(webAbortController.signal);
                webUndoStack.push(webCanvasImg.src);
                webRedoStack = [];

                // Stop particles and reveal new image
                webStopParticles();
                webCanvasImg.src = result;
                await new Promise(r => setTimeout(r, 100));
                webCanvasImg.style.filter = 'blur(0px)';
                webCanvasImg.style.opacity = '1';
                setTimeout(() => { webCanvasImg.style.transition = ''; webCanvasImg.style.filter = ''; }, 600);

                updateWebToolUI();
            } catch (err) {
                webStopParticles();
                if (err.name === 'AbortError') {
                    showToast('Cancelled');
                } else {
                    showToast('Failed: ' + err.message);
                }
                webCanvasImg.style.filter = '';
                webCanvasImg.style.opacity = '1';
                webCanvasImg.style.transition = '';
            }
            // Clean up cancel button
            if (cancelBtn) {
                cancelBtn.hidden = true;
                cancelBtn.style.position = '';
                cancelBtn.style.bottom = '';
                cancelBtn.style.left = '';
                cancelBtn.style.transform = '';
                cancelBtn.style.zIndex = '';
            }
            webLoading.hidden = true;
            webAbortController = null;

            // Re-enable interactive controls
            setWebEditInteractive(true);
        }

        // --- Web Text Tool State ---
        let webMarqueeSelection = null;   // { x, y, w, h }
        let webMarqueeMode = 'idle';      // 'idle' | 'drawing' | 'moving' | 'resizing'
        let webMarqueeOrigin = null;
        let webMarqueeDragOffset = null;
        let webMarqueeResizeHandle = '';
        let webMarqueeResizeOrigin = null;
        let webMarchingAntsOffset = 0;
        let webMarchingAntsRAF = null;
        let webDetectedOriginalText = null;
        let webFloatingTextEl = null;
        let webFloatingTextPos = null;
        let webFloatingTextDrag = { active: false, offsetX: 0, offsetY: 0 };
        const WEB_HANDLE_SIZE = 8;
        const WEB_HANDLE_HIT = 12;

        function webGetCanvasPos(e) {
            const rect = webDrawCanvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        function webNormalizeSelection(sel) {
            let { x, y, w, h } = sel;
            if (w < 0) { x += w; w = -w; }
            if (h < 0) { y += h; h = -h; }
            return { x, y, w, h };
        }

        function webClampSelection(sel) {
            let { x, y, w, h } = sel;
            if (x < 0) { w += x; x = 0; }
            if (y < 0) { h += y; y = 0; }
            if (x + w > webDrawCanvas.width) w = webDrawCanvas.width - x;
            if (y + h > webDrawCanvas.height) h = webDrawCanvas.height - y;
            return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
        }

        function webHitTestSelection(pos) {
            if (!webMarqueeSelection) return { type: 'outside' };
            const s = webMarqueeSelection;
            const corners = [
                { x: s.x, y: s.y, handle: 'nw' }, { x: s.x + s.w, y: s.y, handle: 'ne' },
                { x: s.x, y: s.y + s.h, handle: 'sw' }, { x: s.x + s.w, y: s.y + s.h, handle: 'se' }
            ];
            for (const c of corners) {
                if (Math.abs(pos.x - c.x) < WEB_HANDLE_HIT && Math.abs(pos.y - c.y) < WEB_HANDLE_HIT) {
                    return { type: 'handle', handle: c.handle };
                }
            }
            if (pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h) {
                return { type: 'inside' };
            }
            return { type: 'outside' };
        }

        function webGetHandleCursor(handle) {
            const map = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
            return map[handle] || 'crosshair';
        }

        // --- Marquee Rendering (marching ants) ---
        function webRenderMarquee() {
            const ctx = webDrawCanvas.getContext('2d');
            ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            if (!webMarqueeSelection) return;
            const s = webMarqueeSelection;
            // Dim overlay with selection cut out
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.rect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x, s.y + s.h);
            ctx.lineTo(s.x + s.w, s.y + s.h);
            ctx.lineTo(s.x + s.w, s.y);
            ctx.closePath();
            ctx.fill('evenodd');
            ctx.restore();
            // White dashed border
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -webMarchingAntsOffset;
            ctx.strokeRect(s.x, s.y, s.w, s.h);
            ctx.restore();
            // Blue dashed border (offset)
            ctx.save();
            ctx.strokeStyle = 'rgba(168, 199, 250, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -(webMarchingAntsOffset + 5);
            ctx.strokeRect(s.x, s.y, s.w, s.h);
            ctx.restore();
            // Corner handles
            [{ x: s.x, y: s.y }, { x: s.x + s.w, y: s.y }, { x: s.x, y: s.y + s.h }, { x: s.x + s.w, y: s.y + s.h }].forEach(h => {
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 3;
                ctx.fillRect(h.x - WEB_HANDLE_SIZE / 2, h.y - WEB_HANDLE_SIZE / 2, WEB_HANDLE_SIZE, WEB_HANDLE_SIZE);
                ctx.restore();
                ctx.save();
                ctx.fillStyle = '#A8C7FA';
                ctx.fillRect(h.x - WEB_HANDLE_SIZE / 2 + 1.5, h.y - WEB_HANDLE_SIZE / 2 + 1.5, WEB_HANDLE_SIZE - 3, WEB_HANDLE_SIZE - 3);
                ctx.restore();
            });
        }

        function webStartMarchingAnts() {
            if (webMarchingAntsRAF) return;
            function animate() {
                webMarchingAntsOffset = (webMarchingAntsOffset + 0.3) % 20;
                if (webMarqueeSelection) { webRenderMarquee(); webMarchingAntsRAF = requestAnimationFrame(animate); }
                else { webMarchingAntsRAF = null; }
            }
            webMarchingAntsRAF = requestAnimationFrame(animate);
        }

        function webStopMarchingAnts() {
            if (webMarchingAntsRAF) { cancelAnimationFrame(webMarchingAntsRAF); webMarchingAntsRAF = null; }
        }

        // --- Floating Text Overlay ---
        function webRemoveFloatingText() {
            if (webFloatingTextEl && webFloatingTextEl.parentNode) {
                webFloatingTextEl.parentNode.removeChild(webFloatingTextEl);
            }
            webFloatingTextEl = null;
            webFloatingTextPos = null;
            webFloatingTextDrag = { active: false, offsetX: 0, offsetY: 0 };
            webCanvasImg.classList.remove('text-overlay-active');
        }

        function webCreateFloatingText(text, bounds) {
            webRemoveFloatingText();
            const container = webDrawCanvas.parentElement;
            webFloatingTextPos = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };

            webFloatingTextEl = document.createElement('div');
            webFloatingTextEl.className = 'web-img__floating-text';
            webFloatingTextEl.style.left = bounds.x + 'px';
            webFloatingTextEl.style.top = bounds.y + 'px';
            webFloatingTextEl.style.minWidth = Math.max(bounds.w, 60) + 'px';
            webFloatingTextEl.style.minHeight = Math.max(bounds.h, 30) + 'px';

            if (text) {
                const textNode = document.createElement('span');
                textNode.className = 'web-img__floating-text-content';
                textNode.textContent = text;
                webFloatingTextEl.appendChild(textNode);
            }

            container.appendChild(webFloatingTextEl);
            webCanvasImg.classList.add('text-overlay-active');
            webStopMarchingAnts();
            const ctx = webDrawCanvas.getContext('2d');
            ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);

            if (webDetectedOriginalText) {
                // Existing text — locked, with trash button
                webFloatingTextEl.classList.add('locked');
                webFloatingTextEl.style.cursor = 'default';

                const trashBtn = document.createElement('button');
                trashBtn.className = 'web-img__floating-text-trash';
                trashBtn.type = 'button';
                trashBtn.title = 'Remove text from image';
                trashBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
                webFloatingTextEl.appendChild(trashBtn);

                trashBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const textToRemove = webDetectedOriginalText;
                    if (!textToRemove) return;
                    trashBtn.disabled = true;
                    trashBtn.style.opacity = '0.4';
                    // Compute text center for particle direction
                    const textTarget = webFloatingTextPos ? (() => {
                        const nw = webCanvasImg.naturalWidth || webDrawCanvas.width;
                        const nh = webCanvasImg.naturalHeight || webDrawCanvas.height;
                        const sx = nw / webDrawCanvas.width;
                        const sy = nh / webDrawCanvas.height;
                        return { x: (webFloatingTextPos.x + webFloatingTextPos.w / 2) * sx, y: (webFloatingTextPos.y + webFloatingTextPos.h / 2) * sy };
                    })() : null;
                    await webApiEdit('Removing text…', async (signal) => {
                        const base64 = await imgSrcToBase64(webCanvasImg);
                        return await editWithGemini(base64, `Remove the text "${textToRemove}" from this image completely. Fill in the area where the text was with the surrounding background, making it look natural as if the text was never there. Keep everything else exactly the same.`, signal);
                    }, textTarget);
                    webClearTextSelection();
                });
            } else {
                // New text — draggable
                webFloatingTextEl.addEventListener('pointerdown', webOnFloatingTextDown);
            }
        }

        function webOnFloatingTextDown(e) {
            e.preventDefault();
            e.stopPropagation();
            webFloatingTextDrag.active = true;
            const rect = webFloatingTextEl.getBoundingClientRect();
            webFloatingTextDrag.offsetX = e.clientX - rect.left;
            webFloatingTextDrag.offsetY = e.clientY - rect.top;
            webFloatingTextEl.setPointerCapture(e.pointerId);
            webFloatingTextEl.style.cursor = 'grabbing';
            webFloatingTextEl.classList.add('dragging');

            webFloatingTextEl.addEventListener('pointermove', webOnFloatingTextMove);
            webFloatingTextEl.addEventListener('pointerup', webOnFloatingTextUp);
        }

        function webOnFloatingTextMove(e) {
            if (!webFloatingTextDrag.active || !webFloatingTextEl) return;
            const container = webDrawCanvas.parentElement;
            const containerRect = container.getBoundingClientRect();
            const newX = e.clientX - containerRect.left - webFloatingTextDrag.offsetX;
            const newY = e.clientY - containerRect.top - webFloatingTextDrag.offsetY;
            webFloatingTextEl.style.left = Math.max(0, newX) + 'px';
            webFloatingTextEl.style.top = Math.max(0, newY) + 'px';
            if (webFloatingTextPos) {
                webFloatingTextPos.x = Math.max(0, newX);
                webFloatingTextPos.y = Math.max(0, newY);
            }
        }

        function webOnFloatingTextUp() {
            webFloatingTextDrag.active = false;
            if (webFloatingTextEl) {
                webFloatingTextEl.style.cursor = 'grab';
                webFloatingTextEl.classList.remove('dragging');
                webFloatingTextEl.removeEventListener('pointermove', webOnFloatingTextMove);
                webFloatingTextEl.removeEventListener('pointerup', webOnFloatingTextUp);
            }
        }

        function webUpdateFloatingTextContent(text) {
            if (!webFloatingTextEl) return;
            let span = webFloatingTextEl.querySelector('.web-img__floating-text-content');
            if (text) {
                if (!span) {
                    span = document.createElement('span');
                    span.className = 'web-img__floating-text-content';
                    webFloatingTextEl.insertBefore(span, webFloatingTextEl.firstChild);
                }
                span.textContent = text;
            } else if (span) {
                span.remove();
            }
        }

        function webClearTextSelection() {
            webMarqueeSelection = null;
            webMarqueeMode = 'idle';
            webStopMarchingAnts();
            webRemoveFloatingText();
            webDetectedOriginalText = null;
            if (webDrawCanvas && webActiveTool === 'text') {
                // Only clear the draw canvas if we're in text mode;
                // in select mode the canvas has doodle strokes we must keep.
                const ctx = webDrawCanvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            // Only reset prompt state when the text tool is actually active,
            // to avoid stomping on the select tool's placeholder.
            if (webEditPrompt && (webActiveTool === 'text' || webActiveTool === null)) {
                webEditPrompt.disabled = true;
                webEditPrompt.value = '';
                webEditPrompt.placeholder = 'Tap text or draw a selection';
            }
        }

        // --- Text Detection (Gemini API) ---
        async function webDetectTextInRegion() {
            if (!webMarqueeSelection || webMarqueeSelection.w < 3 || webMarqueeSelection.h < 3) {
                webClearTextSelection();
                return;
            }

            // Immediately enable input so user can type while detection runs
            webStartMarchingAnts();
            if (webEditPrompt) {
                webEditPrompt.disabled = false;
                webEditPrompt.value = '';
                webEditPrompt.placeholder = 'Type text to add or replace…';
                requestAnimationFrame(() => {
                    webEditPrompt.disabled = false;
                    webEditPrompt.focus();
                });
            }

            // Run text detection in the background — pre-fill if text is found
            try {
                const imageBase64 = await imgSrcToBase64(webCanvasImg);
                const apiKey = getApiKey();
                if (!apiKey) throw new Error('No API key provided');

                const x1Pct = Math.round((webMarqueeSelection.x / webDrawCanvas.width) * 100);
                const y1Pct = Math.round((webMarqueeSelection.y / webDrawCanvas.height) * 100);
                const x2Pct = Math.round(((webMarqueeSelection.x + webMarqueeSelection.w) / webDrawCanvas.width) * 100);
                const y2Pct = Math.round(((webMarqueeSelection.y + webMarqueeSelection.h) / webDrawCanvas.height) * 100);

                const requestBody = {
                    contents: [{ parts: [
                        { text: `Look at this image. The user has selected a rectangular region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%) (left%, top% to right%, bottom%). What text is inside or overlapping that selected region? Return ONLY the exact text string found in that region, nothing else. No quotes, no explanation. If there is no text in that region, return "NO_TEXT_FOUND".` },
                        { inline_data: { mime_type: 'image/png', data: imageBase64 } }
                    ] }],
                    generationConfig: { responseModalities: ['TEXT'] }
                };

                const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig);
                let detectedText = '';
                for (const c of (data.candidates || [])) {
                    for (const p of (c.content?.parts || [])) {
                        if (p.text) { detectedText = p.text.trim(); break; }
                    }
                    if (detectedText) break;
                }

                if (!detectedText || detectedText === 'NO_TEXT_FOUND') {
                    showToast('No text found — type to add new text');
                    webDetectedOriginalText = null;
                    webCreateFloatingText('', webMarqueeSelection);
                    if (webEditPrompt) {
                        webEditPrompt.placeholder = 'Type text to add';
                        if (!webEditPrompt.value) {
                            webEditPrompt.focus();
                        }
                    }
                    return;
                }

                webDetectedOriginalText = detectedText;
                webCreateFloatingText(detectedText, webMarqueeSelection);
                if (webEditPrompt) {
                    // Only pre-fill if user hasn't started typing
                    if (!webEditPrompt.value) {
                        webEditPrompt.value = detectedText;
                    }
                    webEditPrompt.disabled = false;
                    webEditPrompt.placeholder = 'Edit the text';
                    webEditPrompt.focus();
                    webEditPrompt.select();
                }
                showToast(`Detected: "${detectedText}"`);
            } catch (err) {
                console.error('Text detection error:', err);
                showToast('Text detection failed — you can still type');
                if (webEditPrompt) {
                    webEditPrompt.disabled = false;
                    webEditPrompt.placeholder = 'Type text to add';
                }
            }
        }

        async function webDetectTextAtPoint(clickX, clickY) {
            if (webEditPrompt) {
                webEditPrompt.disabled = false;
                webEditPrompt.value = '';
                webEditPrompt.placeholder = 'Detecting text…';
            }
            try {
                const imageBase64 = await imgSrcToBase64(webCanvasImg);
                const apiKey = getApiKey();
                if (!apiKey) throw new Error('No API key provided');

                const xPct = Math.round((clickX / webDrawCanvas.width) * 100);
                const yPct = Math.round((clickY / webDrawCanvas.height) * 100);

                const requestBody = {
                    contents: [{ parts: [
                        { text: `Look at this image. The user clicked at approximately (${xPct}%, ${yPct}%) of the image. Find the text element that is at or nearest to that point. Return a JSON object with this format: {"text": "the exact text", "bounds": {"x1": left%, "y1": top%, "x2": right%, "y2": bottom%}}. The bounds should be percentages of the image dimensions. If there is no text in the image or near that point, return {"text": "NO_TEXT_FOUND", "bounds": null}. Return ONLY the JSON, nothing else.` },
                        { inline_data: { mime_type: 'image/png', data: imageBase64 } }
                    ] }],
                    generationConfig: { responseModalities: ['TEXT'] }
                };

                const data = await callStudioProxy(STUDIO_GENERATE_URL, requestBody.contents, requestBody.generationConfig);
                let resultText = '';
                for (const c of (data.candidates || [])) {
                    for (const p of (c.content?.parts || [])) {
                        if (p.text) { resultText = p.text.trim(); break; }
                    }
                    if (resultText) break;
                }

                let parsed;
                try {
                    const cleaned = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    parsed = JSON.parse(cleaned);
                } catch {
                    showToast('Could not detect text at that point');
                    if (webEditPrompt) { webEditPrompt.disabled = false; webEditPrompt.placeholder = 'Tap text or draw a selection'; }
                    return;
                }

                if (!parsed.text || parsed.text === 'NO_TEXT_FOUND' || !parsed.bounds) {
                    showToast('No text found at that point');
                    if (webEditPrompt) { webEditPrompt.disabled = false; webEditPrompt.placeholder = 'Tap on text or draw a selection'; }
                    return;
                }

                const bounds = parsed.bounds;
                const bx = (bounds.x1 / 100) * webDrawCanvas.width;
                const by = (bounds.y1 / 100) * webDrawCanvas.height;
                const bw = ((bounds.x2 - bounds.x1) / 100) * webDrawCanvas.width;
                const bh = ((bounds.y2 - bounds.y1) / 100) * webDrawCanvas.height;

                webMarqueeSelection = { x: bx, y: by, w: bw, h: bh };
                webDetectedOriginalText = parsed.text;
                webCreateFloatingText(parsed.text, webMarqueeSelection);

                if (webEditPrompt) {
                    webEditPrompt.value = parsed.text;
                    webEditPrompt.disabled = false;
                    webEditPrompt.placeholder = 'Edit the text';
                    webEditPrompt.focus();
                    webEditPrompt.select();
                }
                showToast(`Selected: "${parsed.text}"`);
            } catch (err) {
                console.error('Text point detection error:', err);
                showToast('Text detection failed: ' + err.message);
                if (webEditPrompt) { webEditPrompt.disabled = false; webEditPrompt.placeholder = 'Tap text or draw a selection'; }
            }
        }

        // --- Canvas Drawing (Select/Text doodle — mobile-quality) ---
        let webDoodleColors = ['#00E5FF', '#18FFFF', '#00B0FF'];
        let webDoodleShadow = 'rgba(0, 0, 0, 0.45)';

        function analyzeWebDoodleColor() {
            try {
                const sampleCanvas = document.createElement('canvas');
                sampleCanvas.width = 32;
                sampleCanvas.height = 32;
                const sCtx = sampleCanvas.getContext('2d');
                sCtx.drawImage(webCanvasImg, 0, 0, 32, 32);
                const data = sCtx.getImageData(0, 0, 32, 32).data;
                let totalR = 0, totalG = 0, totalB = 0;
                const px = data.length / 4;
                for (let i = 0; i < data.length; i += 4) {
                    totalR += data[i]; totalG += data[i+1]; totalB += data[i+2];
                }
                const avgR = totalR / px, avgG = totalG / px, avgB = totalB / px;
                const lum = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
                const max = Math.max(avgR, avgG, avgB), min = Math.min(avgR, avgG, avgB);
                let hue = 0;
                if (max !== min) {
                    const d = max - min;
                    if (max === avgR) hue = ((avgG - avgB) / d + (avgG < avgB ? 6 : 0)) * 60;
                    else if (max === avgG) hue = ((avgB - avgR) / d + 2) * 60;
                    else hue = ((avgR - avgG) / d + 4) * 60;
                }
                if (lum > 0.7) {
                    if (hue >= 30 && hue < 90) webDoodleColors = ['#4A00E0', '#7B2FF7', '#9B59B6'];
                    else if (hue >= 90 && hue < 200) webDoodleColors = ['#DC143C', '#FF1744', '#E91E63'];
                    else webDoodleColors = ['#00695C', '#00897B', '#009688'];
                    webDoodleShadow = 'rgba(0, 0, 0, 0.3)';
                } else if (lum < 0.35) {
                    if (hue >= 180 && hue < 300) webDoodleColors = ['#00E5FF', '#76FF03', '#00E676'];
                    else if (hue >= 30 && hue < 180) webDoodleColors = ['#FF1493', '#FF00FF', '#FF69B4'];
                    else webDoodleColors = ['#00E5FF', '#18FFFF', '#00B0FF'];
                    webDoodleShadow = 'rgba(0, 0, 0, 0.6)';
                } else {
                    if (hue >= 0 && hue < 60) webDoodleColors = ['#00BCD4', '#00E5FF', '#26C6DA'];
                    else if (hue >= 60 && hue < 180) webDoodleColors = ['#E040FB', '#FF1493', '#FF4081'];
                    else webDoodleColors = ['#FF9100', '#FFAB00', '#FFC400'];
                    webDoodleShadow = 'rgba(0, 0, 0, 0.45)';
                }
            } catch (e) { /* fallback to defaults */ }
        }

        function isWebClosedStroke(stroke) {
            if (stroke.length < 8) return false;
            const first = stroke[0], last = stroke[stroke.length - 1];
            const dist = Math.sqrt((last.x - first.x)**2 + (last.y - first.y)**2);
            let minX = first.x, maxX = first.x, minY = first.y, maxY = first.y;
            for (const p of stroke) {
                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            }
            const diag = Math.sqrt((maxX - minX)**2 + (maxY - minY)**2);
            return diag > 20 && dist < diag * 0.15;
        }

        function webDrawStroke(ctx, stroke) {
            let minX = stroke[0].x, maxX = stroke[0].x, minY = stroke[0].y, maxY = stroke[0].y;
            for (const p of stroke) {
                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            }
            const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
            grad.addColorStop(0, webDoodleColors[0]);
            grad.addColorStop(0.5, webDoodleColors[1]);
            grad.addColorStop(1, webDoodleColors[2]);

            const closed = isWebClosedStroke(stroke);

            // Fill closed shapes
            if (closed) {
                const fillGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
                fillGrad.addColorStop(0, webDoodleColors[0] + '26');
                fillGrad.addColorStop(0.5, webDoodleColors[1] + '26');
                fillGrad.addColorStop(1, webDoodleColors[2] + '26');
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
                ctx.closePath();
                ctx.fillStyle = fillGrad;
                ctx.fill();
                ctx.restore();
            }

            // Stroke outline
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = webDoodleShadow;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
            if (closed) ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        function webRedrawStrokes() {
            if (!webDrawCanvas) return;
            const ctx = webDrawCanvas.getContext('2d');
            ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            webAllStrokes.forEach(stroke => {
                if (stroke.length >= 2) webDrawStroke(ctx, stroke);
            });
            // Show/hide dismiss button
            updateWebDismissBtn();
        }

        // Dismiss button for closed shapes
        function updateWebDismissBtn() {
            if (!webDismissBtn) {
                webDismissBtn = document.createElement('button');
                webDismissBtn.className = 'web-img__doodle-dismiss';
                webDismissBtn.setAttribute('aria-label', 'Clear doodle');
                webDismissBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
                webCanvasWrapper.appendChild(webDismissBtn);
                webDismissBtn.addEventListener('click', () => {
                    webAllStrokes = [];
                    webRedrawStrokes();
                });
            }

            // Position at top-right of last closed stroke
            const lastStroke = webAllStrokes[webAllStrokes.length - 1];
            if (lastStroke && isWebClosedStroke(lastStroke)) {
                let maxX = 0, minY = Infinity;
                for (const p of lastStroke) {
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                }
                webDismissBtn.style.display = 'flex';
                webDismissBtn.style.left = (maxX + 4) + 'px';
                webDismissBtn.style.top = (minY - 14) + 'px';
            } else if (webAllStrokes.length === 0) {
                webDismissBtn.style.display = 'none';
            }
        }

        function initWebCanvasDrawing() {
            if (!webDrawCanvas) return;
            analyzeWebDoodleColor();
            webCanvasImg.addEventListener('load', analyzeWebDoodleColor);

            webDrawCanvas.addEventListener('pointerdown', (e) => {
                if (!webActiveTool || (webActiveTool !== 'select' && webActiveTool !== 'text')) return;
                if (webEraseMode) return; // Don't draw/marquee while erasing
                if (webFloatingTextEl && webFloatingTextDrag.active) return;

                if (webActiveTool === 'select') {
                    // Freehand doodle mode
                    webIsDrawing = true;
                    webCurrentStroke = [webGetCanvasPos(e)];
                    webDrawCanvas.setPointerCapture(e.pointerId);
                } else if (webActiveTool === 'text') {
                    // Marquee selection mode
                    e.preventDefault();
                    const pos = webGetCanvasPos(e);
                    webDrawCanvas.setPointerCapture(e.pointerId);

                    const hit = webHitTestSelection(pos);
                    if (hit.type === 'handle' && webMarqueeSelection) {
                        webMarqueeMode = 'resizing';
                        webMarqueeResizeHandle = hit.handle;
                        webMarqueeResizeOrigin = { ...webMarqueeSelection };
                        webMarqueeOrigin = pos;
                    } else if (hit.type === 'inside' && webMarqueeSelection) {
                        webMarqueeMode = 'moving';
                        webMarqueeDragOffset = { x: pos.x - webMarqueeSelection.x, y: pos.y - webMarqueeSelection.y };
                    } else {
                        webMarqueeMode = 'drawing';
                        webMarqueeOrigin = pos;
                        webMarqueeSelection = { x: pos.x, y: pos.y, w: 0, h: 0 };
                        webDetectedOriginalText = null;
                        webRemoveFloatingText();
                        webStopMarchingAnts();
                    }
                }
            });

            webDrawCanvas.addEventListener('pointermove', (e) => {
                if (webActiveTool === 'select') {
                    // Freehand doodle mode
                    if (!webIsDrawing) return;
                    const pos = webGetCanvasPos(e);
                    webCurrentStroke.push(pos);
                    const ctx = webDrawCanvas.getContext('2d');
                    ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
                    webAllStrokes.forEach(s => { if (s.length >= 2) webDrawStroke(ctx, s); });
                    if (webCurrentStroke.length >= 2) webDrawStroke(ctx, webCurrentStroke);
                } else if (webActiveTool === 'text') {
                    // Marquee selection mode
                    const pos = webGetCanvasPos(e);
                    if (webMarqueeMode === 'drawing' && webMarqueeOrigin) {
                        const x = webMarqueeOrigin.x, y = webMarqueeOrigin.y;
                        const w = pos.x - x, h = pos.y - y;
                        webMarqueeSelection = webClampSelection(webNormalizeSelection({ x, y, w, h }));
                        webRenderMarquee();
                    } else if (webMarqueeMode === 'moving' && webMarqueeSelection && webMarqueeDragOffset) {
                        const newX = Math.max(0, Math.min(pos.x - webMarqueeDragOffset.x, webDrawCanvas.width - webMarqueeSelection.w));
                        const newY = Math.max(0, Math.min(pos.y - webMarqueeDragOffset.y, webDrawCanvas.height - webMarqueeSelection.h));
                        webMarqueeSelection.x = newX;
                        webMarqueeSelection.y = newY;
                        webRenderMarquee();
                    } else if (webMarqueeMode === 'resizing' && webMarqueeResizeOrigin && webMarqueeSelection) {
                        const orig = webMarqueeResizeOrigin;
                        const dx = pos.x - webMarqueeOrigin.x, dy = pos.y - webMarqueeOrigin.y;
                        let newSel = { ...orig };
                        const hd = webMarqueeResizeHandle;
                        if (hd.includes('e')) newSel.w = orig.w + dx;
                        if (hd.includes('w')) { newSel.x = orig.x + dx; newSel.w = orig.w - dx; }
                        if (hd.includes('s')) newSel.h = orig.h + dy;
                        if (hd.includes('n')) { newSel.y = orig.y + dy; newSel.h = orig.h - dy; }
                        webMarqueeSelection = webClampSelection(webNormalizeSelection(newSel));
                        webRenderMarquee();
                    } else if (webMarqueeMode === 'idle') {
                        const hit = webHitTestSelection(pos);
                        if (hit.type === 'handle') webDrawCanvas.style.cursor = webGetHandleCursor(hit.handle);
                        else if (hit.type === 'inside') webDrawCanvas.style.cursor = 'move';
                        else webDrawCanvas.style.cursor = 'crosshair';
                    }
                }
            });

            webDrawCanvas.addEventListener('pointerup', (e) => {
                // Release pointer capture so input field can receive focus
                try { webDrawCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
                if (webActiveTool === 'select') {
                    // Freehand doodle mode
                    if (!webIsDrawing) return;
                    webIsDrawing = false;
                    if (webCurrentStroke.length >= 2) {
                        webAllStrokes.push(webCurrentStroke);
                    }
                    webCurrentStroke = [];
                    webRedrawStrokes();
                    // Enable input and focus after pointer release settles
                    if (webEditPrompt) {
                        webEditPrompt.disabled = false;
                        webEditPrompt.placeholder = 'Describe your edit';
                        requestAnimationFrame(() => {
                            webEditPrompt.disabled = false;
                            webEditPrompt.focus();
                        });
                    }
                    updateWebToolUI();
                } else if (webActiveTool === 'text') {
                    // Marquee selection mode — finalize
                    if (webMarqueeMode === 'drawing') {
                        webMarqueeSelection = webClampSelection(webNormalizeSelection(webMarqueeSelection));
                        if (webMarqueeSelection && webMarqueeSelection.w >= 3 && webMarqueeSelection.h >= 3) {
                            webDetectTextInRegion();
                        } else {
                            const clickPos = webGetCanvasPos(e);
                            webClearTextSelection();
                            webDetectTextAtPoint(clickPos.x, clickPos.y);
                        }
                    } else if (webMarqueeMode === 'moving' || webMarqueeMode === 'resizing') {
                        webMarqueeSelection = webClampSelection(webNormalizeSelection(webMarqueeSelection));
                        webStartMarchingAnts();
                    }
                    webMarqueeMode = 'idle';
                }
            });

            webDrawCanvas.addEventListener('pointerleave', () => {
                if (webActiveTool === 'select') {
                    if (webIsDrawing && webCurrentStroke.length >= 2) {
                        webAllStrokes.push(webCurrentStroke);
                        webCurrentStroke = [];
                        webRedrawStrokes();
                        // Enable input — same as pointerup handler
                        if (webEditPrompt) {
                            webEditPrompt.disabled = false;
                            webEditPrompt.placeholder = 'Describe your edit';
                            requestAnimationFrame(() => {
                                webEditPrompt.disabled = false;
                                webEditPrompt.focus();
                            });
                        }
                    }
                    webIsDrawing = false;
                    updateWebToolUI();
                } else if (webActiveTool === 'text') {
                    if (webMarqueeMode === 'drawing') {
                        webMarqueeSelection = webClampSelection(webNormalizeSelection(webMarqueeSelection));
                        if (webMarqueeSelection && webMarqueeSelection.w >= 3 && webMarqueeSelection.h >= 3) {
                            webDetectTextInRegion();
                        }
                    }
                    webMarqueeMode = 'idle';
                }
            });
        }
        initWebCanvasDrawing();

        // --- Erase Canvas Drawing (checkerboard + red tint, like mobile) ---
        let webErasePoints = [];
        const WEB_ERASE_RADIUS = 24;

        // Create checkerboard pattern
        function createWebCheckerboard() {
            const sz = 8;
            const c = document.createElement('canvas');
            c.width = sz * 2; c.height = sz * 2;
            const cx = c.getContext('2d');
            cx.fillStyle = '#b0b0b0';
            cx.fillRect(0, 0, sz * 2, sz * 2);
            cx.fillStyle = '#888';
            cx.fillRect(0, 0, sz, sz);
            cx.fillRect(sz, sz, sz, sz);
            return cx.createPattern(c, 'repeat');
        }

        function redrawWebErase() {
            if (!webEraseCanvas) return;
            const ctx = webEraseCanvas.getContext('2d');
            ctx.clearRect(0, 0, webEraseCanvas.width, webEraseCanvas.height);
            if (webErasePoints.length === 0) return;

            const cbPattern = createWebCheckerboard();

            webErasePoints.forEach(pt => {
                // Checkerboard circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, WEB_ERASE_RADIUS, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = cbPattern;
                ctx.fillRect(pt.x - WEB_ERASE_RADIUS, pt.y - WEB_ERASE_RADIUS, WEB_ERASE_RADIUS * 2, WEB_ERASE_RADIUS * 2);
                // Red tint overlay
                ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                ctx.fill();
                ctx.restore();
            });
        }

        function initWebEraseDrawing() {
            if (!webEraseCanvas) return;

            webEraseCanvas.addEventListener('pointerdown', (e) => {
                if (!webEraseMode) return;
                webIsDrawing = true;
                const rect = webEraseCanvas.getBoundingClientRect();
                const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                webErasePoints.push(pt);
                redrawWebErase();
            });

            webEraseCanvas.addEventListener('pointermove', (e) => {
                if (!webIsDrawing) return;
                const rect = webEraseCanvas.getBoundingClientRect();
                const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                webErasePoints.push(pt);
                redrawWebErase();
            });

            webEraseCanvas.addEventListener('pointerup', async () => {
                if (!webIsDrawing) return;
                webIsDrawing = false;
                if (webErasePoints.length === 0) return;

                // Compute center of erase strokes for particle direction
                const eraseScaleX = (webCanvasImg.naturalWidth || webEraseCanvas.width) / webEraseCanvas.width;
                const eraseScaleY = (webCanvasImg.naturalHeight || webEraseCanvas.height) / webEraseCanvas.height;
                let eraseCx = 0, eraseCy = 0;
                for (const pt of webErasePoints) { eraseCx += pt.x; eraseCy += pt.y; }
                eraseCx = (eraseCx / webErasePoints.length) * eraseScaleX;
                eraseCy = (eraseCy / webErasePoints.length) * eraseScaleY;

                // Auto-trigger erase API call on release (like mobile)
                await webApiEdit('Erasing…', async (signal) => {
                    const base64 = await imgSrcToBase64(webCanvasImg);

                    // Generate binary mask
                    const maskCanvas = document.createElement('canvas');
                    maskCanvas.width = webCanvasImg.naturalWidth || webCanvasImg.offsetWidth;
                    maskCanvas.height = webCanvasImg.naturalHeight || webCanvasImg.offsetHeight;
                    const maskCtx = maskCanvas.getContext('2d');
                    const scaleX = maskCanvas.width / webEraseCanvas.width;
                    const scaleY = maskCanvas.height / webEraseCanvas.height;
                    maskCtx.fillStyle = '#000';
                    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                    maskCtx.fillStyle = '#fff';
                    for (const pt of webErasePoints) {
                        maskCtx.beginPath();
                        maskCtx.arc(pt.x * scaleX, pt.y * scaleY, WEB_ERASE_RADIUS * Math.max(scaleX, scaleY), 0, Math.PI * 2);
                        maskCtx.fill();
                    }
                    const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
                    const editPrompt = `The second image is a binary mask (white = erase, black = keep). Remove the object(s) in the white region completely and reconstruct the background naturally.

ERASE RULES:
1. COMPLETE REMOVAL — Every pixel of the masked object must be gone. No ghostly outlines, faint traces, shadows, or color residue from the original object.
2. NATURAL RECONSTRUCTION — Fill the erased area with what would logically be behind the object: continue floor tiles, wall textures, sky gradients, foliage, or whatever the surrounding context implies. Match perspective, vanishing points, and scale.
3. SEAMLESS TEXTURE — The reconstructed area must have identical texture, grain, noise, and pattern density as the surrounding image. No blurring, smearing, or smoothing that differs from the rest of the image.
4. LIGHTING CONTINUITY — Shadows, highlights, and light gradients must flow naturally through the reconstructed area. Remove any shadows that were cast BY the erased object. Preserve shadows cast by other objects.
5. PRESERVE EVERYTHING ELSE — All pixels outside the white mask region must remain exactly unchanged.`;
                    return await eraseWithGemini(base64, maskBase64, editPrompt, signal);
                }, { x: eraseCx, y: eraseCy });

                // Clear erase state
                webErasePoints = [];
                const eraseCtx = webEraseCanvas.getContext('2d');
                eraseCtx.clearRect(0, 0, webEraseCanvas.width, webEraseCanvas.height);
            });

            webEraseCanvas.addEventListener('pointerleave', () => {
                webIsDrawing = false;
            });
        }
        initWebEraseDrawing();

        // --- Edit Input (Select / Text prompts) ---
        async function submitWebEdit() {
            if (!webEditPrompt) return;
            const editText = webEditPrompt.value.trim();
            // Allow empty text when an image is attached (auto-generate prompt)
            if (!editText && !webSelectAttachDataUrl) return;
            webEditPrompt.value = '';

            // Capture and clear attachment before async work
            const attachedImageDataUrl = webSelectAttachDataUrl;
            const hasAttachedImage = !!attachedImageDataUrl;
            clearWebSelectAttachment();

            console.log('[submitWebEdit] activeTool:', webActiveTool,
                '| hasAttachedImage:', hasAttachedImage,
                '| editText:', editText,
                '| strokeCount:', webAllStrokes?.length || 0);

            // Build structured prompt based on active tool
            let editPrompt;
            let referenceBase64 = null;
            let maskBase64 = null;
            let doodleBBox = null; // {x, y, w, h, natW, natH, scaleX, scaleY} in native image pixels

            if (webActiveTool === 'text' && webDetectedOriginalText) {
                // Text replacement mode
                if (webFloatingTextPos) {
                    const x1Pct = Math.round((webFloatingTextPos.x / webDrawCanvas.width) * 100);
                    const y1Pct = Math.round((webFloatingTextPos.y / webDrawCanvas.height) * 100);
                    const x2Pct = Math.round(((webFloatingTextPos.x + webFloatingTextPos.w) / webDrawCanvas.width) * 100);
                    const y2Pct = Math.round(((webFloatingTextPos.y + webFloatingTextPos.h) / webDrawCanvas.height) * 100);
                    editPrompt = `In this image, change the text "${webDetectedOriginalText}" to "${editText}" and place it at approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). Keep everything else exactly the same — same style, same font, same colors, same layout. Only change the text content and position.`;
                } else {
                    editPrompt = `In this image, change the text "${webDetectedOriginalText}" to "${editText}". Keep everything else exactly the same — same style, same font, same colors, same layout. Only change the text content.`;
                }
            } else if (webActiveTool === 'text' && (webFloatingTextPos || webMarqueeSelection)) {
                // Add new text mode
                const pos = webFloatingTextPos || webMarqueeSelection;
                const x1Pct = Math.round((pos.x / webDrawCanvas.width) * 100);
                const y1Pct = Math.round((pos.y / webDrawCanvas.height) * 100);
                const x2Pct = Math.round(((pos.x + pos.w) / webDrawCanvas.width) * 100);
                const y2Pct = Math.round(((pos.y + pos.h) / webDrawCanvas.height) * 100);
                editPrompt = `In this image, add the text "${editText}" in the region from approximately (${x1Pct}%, ${y1Pct}%) to (${x2Pct}%, ${y2Pct}%). The text should blend naturally with the image style. Keep everything else exactly the same.`;
            } else if (webActiveTool === 'select' && hasAttachedImage) {
                // Select tool with attached image — composite the reference image into the doodled area
                referenceBase64 = attachedImageDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
                const userHint = editText || 'Place the second image';

                // Compute bounding box + shape descriptors from doodle strokes
                let locationHint = '';
                let shapeHint = '';
                // maskBase64 declared at function scope above
                if (webAllStrokes && webAllStrokes.length > 0 && webDrawCanvas) {
                    // Get actual image dimensions for coordinate accuracy
                    const imgNatW = webCanvasImg.naturalWidth || webDrawCanvas.width;
                    const imgNatH = webCanvasImg.naturalHeight || webDrawCanvas.height;
                    const scaleX = imgNatW / webDrawCanvas.width;
                    const scaleY = imgNatH / webDrawCanvas.height;

                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    for (const stroke of webAllStrokes) {
                        for (const pt of stroke) {
                            if (pt.x < minX) minX = pt.x;
                            if (pt.y < minY) minY = pt.y;
                            if (pt.x > maxX) maxX = pt.x;
                            if (pt.y > maxY) maxY = pt.y;
                        }
                    }

                    // Store bbox in native image pixels for pre-composite
                    doodleBBox = {
                        x: minX * scaleX,
                        y: minY * scaleY,
                        w: (maxX - minX) * scaleX,
                        h: (maxY - minY) * scaleY,
                        natW: imgNatW,
                        natH: imgNatH,
                        scaleX, scaleY
                    };

                    // Convert to image-native percentage coordinates
                    const x1Pct = Math.round((minX * scaleX / imgNatW) * 100);
                    const y1Pct = Math.round((minY * scaleY / imgNatH) * 100);
                    const x2Pct = Math.round((maxX * scaleX / imgNatW) * 100);
                    const y2Pct = Math.round((maxY * scaleY / imgNatH) * 100);
                    const doodleW = maxX - minX;
                    const doodleH = maxY - minY;
                    const aspect = doodleW / (doodleH || 1);
                    let orientation = 'roughly square';
                    if (aspect > 1.4) orientation = 'wide / landscape';
                    else if (aspect < 0.7) orientation = 'tall / portrait';
                    const widthPct = x2Pct - x1Pct;
                    const heightPct = y2Pct - y1Pct;

                    // Center point for precise anchoring
                    const cxPct = Math.round((x1Pct + x2Pct) / 2);
                    const cyPct = Math.round((y1Pct + y2Pct) / 2);

                    locationHint = `\nPRECISE LOCATION: The drawn region spans from (${x1Pct}%, ${y1Pct}%) top-left to (${x2Pct}%, ${y2Pct}%) bottom-right of the image. The region is ${widthPct}% wide × ${heightPct}% tall. CENTER POINT: (${cxPct}%, ${cyPct}%). Place the reference subject EXACTLY within this bounding box — not above, below, or beside it. The center of the subject must align with (${cxPct}%, ${cyPct}%).`;
                    shapeHint = `\nSHAPE: The doodle shape is ${orientation} (aspect ratio ~${aspect.toFixed(1)}:1). The reference subject must be reshaped, cropped, or reposed to FIT this specific shape and orientation — do not ignore the proportions. A MASK IMAGE is also provided showing the exact drawn contour; the white area represents the precise shape the subject should fill. An ANNOTATED IMAGE is also provided showing the doodle drawn directly on the image — use it to visually confirm the exact placement region.`;

                    // Render mask at IMAGE-NATIVE resolution for coordinate accuracy
                    try {
                        const maskCanvas = document.createElement('canvas');
                        maskCanvas.width = imgNatW;
                        maskCanvas.height = imgNatH;
                        const mCtx = maskCanvas.getContext('2d');
                        // Black background
                        mCtx.fillStyle = '#000';
                        mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                        // Draw strokes scaled to image-native coords
                        mCtx.strokeStyle = '#fff';
                        mCtx.fillStyle = '#fff';
                        mCtx.lineWidth = 24 * Math.min(scaleX, scaleY);
                        mCtx.lineCap = 'round';
                        mCtx.lineJoin = 'round';
                        for (const stroke of webAllStrokes) {
                            if (stroke.length < 2) continue;
                            mCtx.beginPath();
                            mCtx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY);
                            for (let i = 1; i < stroke.length; i++) {
                                mCtx.lineTo(stroke[i].x * scaleX, stroke[i].y * scaleY);
                            }
                            mCtx.closePath();
                            mCtx.fill();
                            mCtx.stroke();
                        }
                        const maskDataUrl = maskCanvas.toDataURL('image/png');
                        maskBase64 = maskDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
                    } catch (e) {
                        console.warn('Failed to generate mask:', e);
                    }

                    console.log('[submitWebEdit] mask generated at', imgNatW, 'x', imgNatH,
                        '| bbox:', `(${x1Pct}%,${y1Pct}%) to (${x2Pct}%,${y2Pct}%)`,
                        '| center:', `(${cxPct}%,${cyPct}%)`);
                } else {
                    console.log('[submitWebEdit] NO strokes — mask not generated');
                }

                editPrompt = `${userHint}.

I have drawn/selected a specific area on the FIRST image. Replace whatever is currently inside that drawn area with the subject from the SECOND (reference) image.${locationHint}${shapeHint}

RULES:
1. PRECISE PLACEMENT — The reference subject MUST be placed exactly at the doodle location specified above. Do NOT shift, offset, or reposition it elsewhere in the image. The center of the reference subject should align with the center of the drawn region.
2. SHAPE CONFORMITY — Use the MASK IMAGE to determine the exact shape, contour, and proportions the subject must fill. The subject should be reshaped, cropped, scaled, or reposed to fit the mask silhouette. If the mask is tall and narrow, the subject must be rendered tall and narrow. If the mask is a rough circle, fit the subject into that circular region. Do NOT ignore the mask shape.
3. COMPOSITION FIT — Reshape and repose the reference subject so it fills the drawn/selected region naturally. If the doodle outlines a person, the reference subject replaces that person in the same pose and position implied by the doodle shape. The reference subject must conform to the shape, scale, and orientation of the drawn area.
4. APPEAR EXACTLY ONCE — The reference subject must appear only ONE time in the output. Do NOT duplicate, tile, repeat, or mirror it. One instance only.
5. FULL STYLE TRANSFER — This is the MOST IMPORTANT rule. Do NOT simply paste or overlay the reference subject. You must COMPLETELY RE-RENDER the reference subject in the visual language, medium, and aesthetic of the parent image. The subject must be re-drawn, re-painted, re-photographed, or re-rendered from scratch as if it were always part of the original composition. Transfer EVERY visual property: color grading, color palette, saturation, contrast curve, tonal range, white balance, color temperature, film grain/noise structure, texture, brush strokes/paper texture/pencil weight/ink density (if illustrated), pixel style, resolution, sharpness, blur/bokeh/depth-of-field, lighting direction, shadow hardness/softness, highlight rolloff, ambient occlusion, specular reflections, time-of-day lighting, weather conditions, atmospheric haze, and artistic medium. If the parent is a black-and-white photo, re-render the subject in black-and-white with matching grain and contrast. If it's an oil painting, re-paint the subject with visible brush strokes. If it's a cinematic still, match the lens, grading, and depth-of-field exactly. The subject must not look like it came from a different image.
6. DEEP BLENDING — This is NOT a cut-and-paste operation. The reference subject must be REBORN within the parent image's world. Edges must dissolve naturally into the surrounding scene — no hard boundaries, no halos, no aliased edges, no visible outlines, no color shifts at the border. Where the subject meets the background, use soft transitions, matching texture continuation, and natural falloff. If the parent image has film grain, the grain must flow continuously through the subject. If it has painterly strokes, the strokes must flow through the subject. There should be absolutely ZERO evidence that the subject was composited — it must look as if it was captured or created at the same moment, in the same medium, by the same artist/camera.
7. PRESERVE SURROUNDINGS — Keep everything outside the selected/drawn area exactly the same, pixel-for-pixel.
8. REGENERATIVE FILL & ENVIRONMENTAL INTERACTION — ALWAYS re-draw and re-paint the area around the inserted subject to create natural environmental interactions. This is mandatory, not optional:
   • Cast proper shadows from the subject onto surrounding surfaces, matching the scene's light direction and shadow softness.
   • Add reflections where surfaces are reflective (wet ground, glass, polished surfaces, water).
   • Ensure correct ground contact — feet touch the ground, objects sit on surfaces with proper weight and perspective.
   • Add ambient color spill — nearby surfaces should pick up subtle color from the subject and vice versa.
   • Add occlusion where the subject overlaps or is overlapped by other objects in the scene.
   • Blend atmospheric effects — if the scene has haze, fog, dust, rain, or bokeh, the subject must be equally affected.
   • Extend textures and patterns from the background through and behind the subject naturally.
   • Re-paint the immediate boundary zone (8-15% around the subject) to smoothly merge the subject into the scene.
   • The subject should appear to physically exist in the scene — affected by its physics, lighting, and atmosphere.
9. ANTI-CUTOUT VERIFICATION — Before finalizing, verify: Does ANY part of the image look like a separate element was placed on top? If yes, re-render that area until the answer is no. The final image must pass as a single, originally-composed photograph/artwork/render with no compositing artifacts whatsoever.`;

            } else {
                // Generic edit mode (Select tool without attachment)
                editPrompt = editText;
            }

            // Clean up text UI before loading
            webRemoveFloatingText();
            webStopMarchingAnts();

            const loadingMsg = hasAttachedImage ? 'Placing image…' : 'Editing…';

            // For attachment edits with strokes, generate a PRE-COMPOSITE image:
            // paste the reference image into the base at the doodle bounding box
            // This removes placement ambiguity — model only needs to refine/blend
            let preCompositeBase64 = null;
            if (hasAttachedImage && doodleBBox && attachedImageDataUrl) {
                try {
                    const compCanvas = document.createElement('canvas');
                    compCanvas.width = doodleBBox.natW;
                    compCanvas.height = doodleBBox.natH;
                    const cCtx = compCanvas.getContext('2d');
                    // Draw the base image
                    cCtx.drawImage(webCanvasImg, 0, 0, doodleBBox.natW, doodleBBox.natH);
                    // Load and paste the reference image at the doodle bounding box
                    const refImg = new Image();
                    refImg.crossOrigin = 'anonymous';
                    await new Promise((resolve, reject) => {
                        refImg.onload = resolve;
                        refImg.onerror = reject;
                        refImg.src = attachedImageDataUrl;
                    });
                    // Draw reference image scaled to fit the doodle bounding box
                    // Use a slight feathered edge via globalAlpha ramp (optional)
                    cCtx.drawImage(refImg, doodleBBox.x, doodleBBox.y, doodleBBox.w, doodleBBox.h);

                    const compDataUrl = compCanvas.toDataURL('image/png');
                    preCompositeBase64 = compDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
                    console.log('[submitWebEdit] pre-composite generated at', doodleBBox.natW, 'x', doodleBBox.natH);
                } catch (e) {
                    console.warn('Failed to generate pre-composite:', e);
                }
            }

            // Clear doodle from canvas immediately — mask and composite have already been captured
            webAllStrokes = [];
            if (webDrawCanvas) {
                const ctx = webDrawCanvas.getContext('2d');
                ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            if (webDismissBtn) webDismissBtn.style.display = 'none';

            // Compute particle target — particles spiral toward the area being edited
            let particleTarget = null;
            const natW = webCanvasImg.naturalWidth || (webDrawCanvas ? webDrawCanvas.width : 0);
            const natH = webCanvasImg.naturalHeight || (webDrawCanvas ? webDrawCanvas.height : 0);
            if (doodleBBox) {
                // Doodle center (already in native coords)
                particleTarget = { x: doodleBBox.x + doodleBBox.w / 2, y: doodleBBox.y + doodleBBox.h / 2 };
            } else if (webFloatingTextPos && webDrawCanvas && natW) {
                // Text edit — convert from draw canvas to native coords
                const sx = natW / webDrawCanvas.width;
                const sy = natH / webDrawCanvas.height;
                particleTarget = {
                    x: (webFloatingTextPos.x + webFloatingTextPos.w / 2) * sx,
                    y: (webFloatingTextPos.y + webFloatingTextPos.h / 2) * sy
                };
            } else if (webMarqueeSelection && webDrawCanvas && natW) {
                // Marquee selection center
                const sx = natW / webDrawCanvas.width;
                const sy = natH / webDrawCanvas.height;
                particleTarget = {
                    x: (webMarqueeSelection.x + webMarqueeSelection.w / 2) * sx,
                    y: (webMarqueeSelection.y + webMarqueeSelection.h / 2) * sy
                };
            } else if (webAllStrokes && webAllStrokes.length > 0 && webDrawCanvas && natW) {
                // Generic strokes center
                const sx = natW / webDrawCanvas.width;
                const sy = natH / webDrawCanvas.height;
                let sumX = 0, sumY = 0, count = 0;
                for (const stroke of webAllStrokes) {
                    for (const pt of stroke) { sumX += pt.x; sumY += pt.y; count++; }
                }
                if (count > 0) {
                    particleTarget = { x: (sumX / count) * sx, y: (sumY / count) * sy };
                }
            }

            await webApiEdit(loadingMsg, async (signal) => {
                const base64 = await imgSrcToBase64(webCanvasImg);
                return await editWithGemini(base64, editPrompt, signal, referenceBase64, maskBase64, preCompositeBase64);
            }, particleTarget);

            // Clear draw canvas and strokes after edit
            webAllStrokes = [];
            webMarqueeSelection = null;
            webDetectedOriginalText = null;
            if (webDrawCanvas) {
                const ctx = webDrawCanvas.getContext('2d');
                ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
            }
            if (webDismissBtn) webDismissBtn.style.display = 'none';
            webClearTextSelection();
        }

        if (webEditPrompt) {
            webEditPrompt.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitWebEdit();
                }
            });
            // Live update floating text as user types
            webEditPrompt.addEventListener('input', () => {
                if (webActiveTool === 'text') {
                    webUpdateFloatingTextContent(webEditPrompt.value);
                }
                updateWebToolUI();
            });
        }

        const webEditSendBtn = document.getElementById('web-img-edit-send');
        if (webEditSendBtn) {
            webEditSendBtn.addEventListener('click', () => {
                submitWebEdit();
            });
        }

        // --- Select Tool: Image Attachment (+) ---
        const webEditAddBtn = document.getElementById('web-img-edit-add-btn');
        const webEditAttachInput = document.getElementById('web-img-edit-attach-input');
        const webEditAttachRow = document.getElementById('web-img-edit-attach-row');
        const webEditAttachThumb = document.getElementById('web-img-edit-attach-thumb');
        const webEditAttachClose = document.getElementById('web-img-edit-attach-close');

        function clearWebSelectAttachment() {
            webSelectAttachFile = null;
            webSelectAttachDataUrl = null;
            if (webEditAttachRow) webEditAttachRow.hidden = true;
            if (webEditAttachThumb) webEditAttachThumb.src = '';
            if (webEditAttachInput) webEditAttachInput.value = '';
            if (webEditAddBtn) webEditAddBtn.classList.remove('has-attachment');
        }

        if (webEditAddBtn) {
            webEditAddBtn.addEventListener('click', () => {
                if (webEditAttachInput) webEditAttachInput.click();
            });
        }

        if (webEditAttachInput) {
            webEditAttachInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                webSelectAttachFile = file;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    webSelectAttachDataUrl = ev.target.result;
                    // Show chip in input bar
                    if (webEditAttachThumb) webEditAttachThumb.src = webSelectAttachDataUrl;
                    if (webEditAttachRow) webEditAttachRow.hidden = false;
                    if (webEditAddBtn) webEditAddBtn.classList.add('has-attachment');
                    // Update placeholder to guide user
                    if (webEditPrompt && webActiveTool === 'select') {
                        const hasStrokes = webAllStrokes && webAllStrokes.length > 0;
                        webEditPrompt.placeholder = hasStrokes
                            ? 'Describe how to apply (or press send)'
                            : 'Draw where to place the image';
                        webEditPrompt.disabled = false;
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        if (webEditAttachClose) {
            webEditAttachClose.addEventListener('click', () => {
                clearWebSelectAttachment();
                if (webEditPrompt && webActiveTool === 'select') {
                    const hasStrokes = webAllStrokes && webAllStrokes.length > 0;
                    webEditPrompt.placeholder = hasStrokes ? 'Describe your edit' : 'Draw on the image first';
                }
            });
        }


        // --- Education Overlay (first visit) ---
        const webEducation = document.getElementById('web-img-education');
        const webEducationGotit = document.getElementById('web-img-education-gotit');
        const WEB_EDU_KEY = 'webEditEducationSeen';

        function showWebEducation() {
            if (localStorage.getItem(WEB_EDU_KEY)) return;
            if (webEducation) webEducation.hidden = false;
        }

        if (webEducationGotit) {
            webEducationGotit.addEventListener('click', () => {
                localStorage.setItem(WEB_EDU_KEY, '1');
                if (webEducation) webEducation.hidden = true;
            });
        }

        // --- Discard Confirmation Dialog ---
        const webDiscardDialog = document.getElementById('web-img-discard-dialog');
        const webDiscardKeep = document.getElementById('web-img-discard-keep');
        const webDiscardConfirm = document.getElementById('web-img-discard-confirm');

        function hasWebUnsavedEdits() {
            return webUndoStack.length > 0 || webAllStrokes.length > 0;
        }

        // Override close button to check for unsaved edits
        const webCloseBtn = document.getElementById('web-img-edit-close');
        if (webCloseBtn) {
            // Remove existing listener by cloning
            const newCloseBtn = webCloseBtn.cloneNode(true);
            webCloseBtn.parentNode.replaceChild(newCloseBtn, webCloseBtn);

            newCloseBtn.addEventListener('click', async () => {
                if (hasWebUnsavedEdits() && webDiscardDialog) {
                    webDiscardDialog.hidden = false;
                } else {
                    await closeWebEditModal();
                    if (webResponseSurface) webResponseSurface.hidden = false;
                }
            });
        }

        if (webDiscardKeep) {
            webDiscardKeep.addEventListener('click', () => {
                if (webDiscardDialog) webDiscardDialog.hidden = true;
            });
        }

        // Close X button also dismisses
        const webDiscardCloseX = document.getElementById('web-img-discard-keep-x');
        if (webDiscardCloseX) {
            webDiscardCloseX.addEventListener('click', () => {
                if (webDiscardDialog) webDiscardDialog.hidden = true;
            });
        }

        // Backdrop click also dismisses
        const webDiscardBackdrop = document.getElementById('web-img-discard-backdrop');
        if (webDiscardBackdrop) {
            webDiscardBackdrop.addEventListener('click', () => {
                if (webDiscardDialog) webDiscardDialog.hidden = true;
            });
        }

        if (webDiscardConfirm) {
            webDiscardConfirm.addEventListener('click', async () => {
                if (webDiscardDialog) webDiscardDialog.hidden = true;
                // Reset to original
                if (webOriginalSrc) webCanvasImg.src = webOriginalSrc;
                webUndoStack = [];
                webRedoStack = [];
                webAllStrokes = [];
                if (webDrawCanvas) {
                    const ctx = webDrawCanvas.getContext('2d');
                    ctx.clearRect(0, 0, webDrawCanvas.width, webDrawCanvas.height);
                }
                await closeWebEditModal();
                if (webResponseSurface) webResponseSurface.hidden = false;
            });
        }

        // Show education on edit surface open
        const origEditBtnHandler = document.getElementById('web-img-btn-edit-img');
        if (origEditBtnHandler) {
            origEditBtnHandler.addEventListener('click', () => {
                setTimeout(showWebEducation, 400); // after modal animation
            });
        }

        // --- Rotating Placeholder Text (drum-style, matching mobile) ---
        const webPlaceholderEl = document.getElementById('web-img-placeholder');
        const webPlaceholderPrefix = document.getElementById('web-img-placeholder-prefix');
        const webPlaceholderDrum = document.getElementById('web-img-placeholder-drum');
        const webPlaceholderTrack = document.getElementById('web-img-placeholder-track');
        const WEB_PLACEHOLDER_DEFAULT = 'Describe your image';

        // Use the exact same style-specific placeholder phrases as mobile
        const webStylePlaceholders = {
            'salon': [
                'give me a fresh new hairstyle',
                'transform my hair into a precision bob',
                'reimagine my look with salon-quality hair',
                'style my hair like a luxury editorial',
                'give me a modern architectural cut',
            ],
            'monochrome': [
                'make it a dramatic black & white portrait',
                'turn it into a moody film noir scene',
                'give it high-contrast monochrome shadows',
                'reimagine it as a vintage B&W photo',
                'strip the color for a stark silhouette',
            ],
            'color-blocking': [
                'turn it into bold flat color shapes',
                'reimagine it as pop-art blocks',
                'give it vivid geometric color panels',
                'make it a bright color-blocked poster',
                'transform it into abstract flat art',
            ],
            'surreal': [
                'place yourself in a surrealist painting',
                'make it float among melting clocks',
                'add impossible architecture around it',
                'blend it into a dreamlike landscape',
                'warp reality with surreal distortions',
            ],
            'cyborg': [
                'transform into an android version',
                'add translucent skin panels with neon circuitry',
                'make it a Kraftwerk-inspired cyborg',
                'give it liquid metal reflections',
                'reimagine with industrial haze and red neon',
            ],
            'gothic-clay': [
                'sculpt it into a dark clay figurine',
                'add gothic gargoyles around it',
                'turn it into an ornate baroque relief',
                'give it a moody stone cathedral vibe',
                'reimagine it as a weathered clay bust',
            ],
            'risograph': [
                'print it in layered halftone inks',
                'give it a grainy retro poster look',
                'add misregistered color overlays',
                'turn it into a vintage risograph zine',
                'layer it with semi-transparent ink washes',
            ],
            'steampunk': [
                'surround it with brass gears and pipes',
                'transform it into a clockwork invention',
                'add Victorian copper goggles and steam',
                'reimagine it inside a steam-powered lab',
                'give it an industrial bronze makeover',
            ],
            'explosive': [
                'make it burst with neon paint splatters',
                'add a shockwave of vibrant color',
                'surround it with explosive energy trails',
                'shatter it into flying color fragments',
                'give it a high-energy paint detonation',
            ],
            'oil-painting': [
                'paint it with rich impasto brushstrokes',
                'give it a Vanity Fair editorial mood',
                'add dramatic Rembrandt lighting',
                'reimagine it as a cinematic portrait',
                'make it look epic',
            ],
            'runway': [
                'dress it in Saint Laurent tailoring',
                'place it in a Turrell light field',
                'give it a luxury editorial mood',
                'add atmospheric color transitions',
                'reimagine it as a high-fashion portrait',
            ],
            'old-cartoon': [
                'turn me into a 1930s cartoon character',
                'give it a rubber hose animation style',
                'make it look like an old Fleischer cartoon',
                'transform it into a vintage black & white toon',
                'add pie-cut eyes and bouncy limbs',
            ],
        };

        // Generic fallback phrases (when no style is selected)
        const WEB_GENERIC_PLACEHOLDERS = [
            'give me a funny expression',
            'make it look dramatic',
            'add a dreamy vibe',
            'transform me into this style',
            'make it look epic',
        ];

        const WEB_ITEM_HEIGHT = 22; // px, matches line-height
        let webPlaceholderIndex = 0;
        let webPlaceholderInterval = null;

        function startWebPlaceholderRotation(style) {
            stopWebPlaceholderRotation();
            if (!webPlaceholderTrack || !webPlaceholderDrum || !webPlaceholderPrefix) return;

            // Get phrases — style-specific if a card is selected, generic otherwise
            const phrases = style
                ? (webStylePlaceholders[style] || WEB_GENERIC_PLACEHOLDERS)
                : WEB_GENERIC_PLACEHOLDERS;

            webPlaceholderIndex = 0;

            // Switch prefix to "Restyle: " when a style is selected (matching mobile)
            webPlaceholderPrefix.textContent = style ? 'Restyle: ' : 'Create: ';
            webPlaceholderDrum.style.display = '';

            // Build vertical stack of phrase items + clone of first for seamless loop
            webPlaceholderTrack.innerHTML = '';
            const allPhrases = [...phrases, phrases[0]];
            allPhrases.forEach((phrase, i) => {
                const item = document.createElement('span');
                item.className = 'web-img__placeholder-item';
                item.textContent = `\u201C${phrase}\u201D`;
                if (i === 0) item.classList.add('web-img__placeholder-item--active');
                webPlaceholderTrack.appendChild(item);
            });

            // Reset track position
            webPlaceholderTrack.style.transition = 'none';
            webPlaceholderTrack.style.transform = 'translateY(0)';

            // Rotate every 2.8 seconds (same timing as mobile)
            webPlaceholderInterval = setInterval(() => {
                const items = webPlaceholderTrack.querySelectorAll('.web-img__placeholder-item');
                const prevIndex = webPlaceholderIndex;
                webPlaceholderIndex++;

                // Deactivate previous item (scale down + fade)
                items[prevIndex].classList.remove('web-img__placeholder-item--active');

                // Activate next item (scale up + fade in)
                items[webPlaceholderIndex].classList.add('web-img__placeholder-item--active');

                // Slide the entire track up by one line height
                webPlaceholderTrack.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                webPlaceholderTrack.style.transform = `translateY(-${webPlaceholderIndex * WEB_ITEM_HEIGHT}px)`;

                // If we just scrolled to the clone (last item), seamlessly reset
                if (webPlaceholderIndex >= phrases.length) {
                    setTimeout(() => {
                        webPlaceholderTrack.style.transition = 'none';
                        webPlaceholderTrack.style.transform = 'translateY(0)';
                        webPlaceholderIndex = 0;
                        items.forEach((el, i) => {
                            el.classList.toggle('web-img__placeholder-item--active', i === 0);
                        });
                    }, 550);
                }
            }, 2800);
        }

        function stopWebPlaceholderRotation() {
            if (webPlaceholderInterval) {
                clearInterval(webPlaceholderInterval);
                webPlaceholderInterval = null;
            }
        }

        function resetWebPlaceholder() {
            stopWebPlaceholderRotation();
            if (webPlaceholderPrefix) webPlaceholderPrefix.textContent = WEB_PLACEHOLDER_DEFAULT;
            if (webPlaceholderDrum) webPlaceholderDrum.style.display = 'none';
            if (webPlaceholderTrack) {
                webPlaceholderTrack.innerHTML = '';
                webPlaceholderTrack.style.transform = 'translateY(0)';
            }
        }

        // Start rotation on template surface (generic until a card is selected)
        startWebPlaceholderRotation(webSelectedStyle);

        // Stop when user types, restart when cleared
        if (webPrompt) {
            webPrompt.addEventListener('input', () => {
                const hasText = webPrompt.value.trim().length > 0;
                if (webPlaceholderEl) webPlaceholderEl.classList.toggle('hidden', hasText);
                if (hasText) {
                    stopWebPlaceholderRotation();
                } else {
                    startWebPlaceholderRotation(webSelectedStyle);
                }
            });
        }
    }

    // ── Global Escape key handler ──
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        // Discard dialogs take priority
        const videoDiscard = document.getElementById('video-discard-dialog');
        if (videoDiscard && !videoDiscard.hidden) {
            const keepBtn = document.getElementById('video-discard-keep');
            if (keepBtn) keepBtn.click();
            return;
        }
        const musicDiscard = document.getElementById('music-discard-dialog');
        if (musicDiscard && !musicDiscard.hidden) { musicDiscard.hidden = true; return; }
        const editDiscard = document.getElementById('edit-discard-dialog');
        if (editDiscard && !editDiscard.hidden) { editDiscard.hidden = true; return; }
        const webDiscard = document.getElementById('web-img-discard-dialog');
        if (webDiscard && !webDiscard.hidden) { webDiscard.hidden = true; return; }

        // Web edit surface
        const webEditSurf = document.getElementById('web-img-edit-surface');
        if (webEditSurf && !webEditSurf.hidden) {
            const closeBtn = document.getElementById('web-img-edit-close');
            if (closeBtn) closeBtn.click();
            return;
        }

        // Platform dropdown
        const platformDd = document.getElementById('image-platform-dropdown');
        if (platformDd && !platformDd.hidden) {
            platformDd.hidden = true;
            const arrow = document.getElementById('image-dropdown-arrow');
            if (arrow) arrow.classList.remove('open');
            return;
        }

        // Music edit screen
        if (typeof musicEditScreen !== 'undefined' && musicEditScreen && !musicEditScreen.hidden) {
            if (typeof musicEditDirty !== 'undefined' && musicEditDirty) {
                const dlg = document.getElementById('music-discard-dialog');
                if (dlg) dlg.hidden = false;
            } else if (typeof hideMusicEditScreen === 'function') {
                hideMusicEditScreen();
            }
            return;
        }

        // Music response screen
        if (typeof musicResponseScreen !== 'undefined' && musicResponseScreen && !musicResponseScreen.hidden) {
            if (typeof hideMusicResponseScreen === 'function') hideMusicResponseScreen();
            return;
        }

        // Video edit screen
        if (typeof videoEditScreen !== 'undefined' && videoEditScreen && !videoEditScreen.hidden) {
            if (typeof handleVideoCloseAttempt === 'function') handleVideoCloseAttempt();
            return;
        }
    });

    // ── Wire up web-img-loading-cancel button ──
    document.getElementById('web-img-loading-cancel')?.addEventListener('click', () => {
        if (typeof webAbortController !== 'undefined' && webAbortController) webAbortController.abort();
    });
});


/* ═══════════════════════════════════════════════════════════════
   SIMULATED MOBILE KEYBOARD
   Injects an iOS-style QWERTY keyboard into each app-shell.
   Shows on textarea focus, hides on blur / outside tap.
   Types actual characters into the focused textarea.
═══════════════════════════════════════════════════════════════ */
(function initSimKeyboards() {

    const KEYBOARD_HTML = `
    <div class="sim-keyboard" data-sim-kb>
        <div class="sim-keyboard__suggest">
            <button class="sim-suggest" data-word="The">The</button>
            <button class="sim-suggest sim-suggest--center" data-word="I">I</button>
            <button class="sim-suggest" data-word="A">A</button>
        </div>
        <div class="sim-keyboard__row">
            <button class="sim-key" data-char="q">q</button>
            <button class="sim-key" data-char="w">w</button>
            <button class="sim-key" data-char="e">e</button>
            <button class="sim-key" data-char="r">r</button>
            <button class="sim-key" data-char="t">t</button>
            <button class="sim-key" data-char="y">y</button>
            <button class="sim-key" data-char="u">u</button>
            <button class="sim-key" data-char="i">i</button>
            <button class="sim-key" data-char="o">o</button>
            <button class="sim-key" data-char="p">p</button>
        </div>
        <div class="sim-keyboard__row sim-keyboard__row--offset">
            <button class="sim-key" data-char="a">a</button>
            <button class="sim-key" data-char="s">s</button>
            <button class="sim-key" data-char="d">d</button>
            <button class="sim-key" data-char="f">f</button>
            <button class="sim-key" data-char="g">g</button>
            <button class="sim-key" data-char="h">h</button>
            <button class="sim-key" data-char="j">j</button>
            <button class="sim-key" data-char="k">k</button>
            <button class="sim-key" data-char="l">l</button>
        </div>
        <div class="sim-keyboard__row">
            <button class="sim-key sim-key--dark sim-key--shift" data-action="shift">⇧</button>
            <button class="sim-key" data-char="z">z</button>
            <button class="sim-key" data-char="x">x</button>
            <button class="sim-key" data-char="c">c</button>
            <button class="sim-key" data-char="v">v</button>
            <button class="sim-key" data-char="b">b</button>
            <button class="sim-key" data-char="n">n</button>
            <button class="sim-key" data-char="m">m</button>
            <button class="sim-key sim-key--dark sim-key--backspace" data-action="backspace">⌫</button>
        </div>
        <div class="sim-keyboard__row sim-keyboard__row--bottom">
            <button class="sim-key sim-key--dark sim-key--num-toggle" data-action="num">123</button>
            <button class="sim-key sim-key--space" data-action="space">space</button>
            <button class="sim-key sim-key--return" data-action="return">return</button>
        </div>
        <div class="sim-keyboard__gesture">
            <div class="sim-keyboard__gesture-handle"></div>
        </div>
    </div>`;

    const DARK_KEYBOARD_HTML = KEYBOARD_HTML.replace('class="sim-keyboard"', 'class="sim-keyboard sim-keyboard--dark"');

    // Selector for all shell-like containers that can host a keyboard
    const SHELL_SELECTOR = '.app-shell, .edit-modal, #music-edit-screen';

    // Inject LIGHT keyboard into each main app-shell
    // Use :scope > to only check DIRECT child keyboards, not ones inside nested edit-modals
    const shells = document.querySelectorAll('.app-shell');
    shells.forEach(shell => {
        if (!shell) return;
        // Check only direct children for existing keyboard
        const existingKb = Array.from(shell.children).find(ch => ch.hasAttribute('data-sim-kb'));
        if (existingKb) return;
        shell.insertAdjacentHTML('beforeend', KEYBOARD_HTML);
    });

    // Inject DARK keyboard into edit modals
    const editModals = document.querySelectorAll('.edit-modal, #music-edit-screen');
    editModals.forEach(modal => {
        if (!modal) return;
        const existingKb = Array.from(modal.children).find(ch => ch.hasAttribute('data-sim-kb'));
        if (existingKb) return;
        modal.insertAdjacentHTML('beforeend', DARK_KEYBOARD_HTML);
    });

    let activeTextarea = null;
    let isShifted = false;
    let nextCharUpper = false; // auto-capitalize after period + space

    function showKeyboard(inputEl) {
        // Find the nearest container that hosts a keyboard
        // Prefer edit-modal first (more specific), then fall back to app-shell
        const shell = inputEl.closest('.edit-modal, #music-edit-screen')
            || inputEl.closest(SHELL_SELECTOR);
        if (!shell) return;
        // IMPORTANT: use :scope > to only find DIRECT child keyboards.
        // Otherwise querySelector would find the dark keyboard inside a nested
        // edit-modal (which is display:none) instead of the shell's own keyboard.
        const kb = shell.querySelector(':scope > [data-sim-kb]');
        if (!kb) return;

        activeTextarea = inputEl;

        // Remove closing state if re-opening during close animation
        shell.classList.remove('keyboard-closing');

        // Toggle classes — keyboard goes from display:none to display:flex
        // Gesture bar hides via .keyboard-open CSS
        shell.classList.add('keyboard-open');
        kb.classList.add('visible');

        // Measure keyboard height and set CSS var for input translateY
        requestAnimationFrame(() => {
            const kbHeight = kb.offsetHeight;
            shell.style.setProperty('--kb-height', kbHeight + 'px');
        });
    }

    function hideKeyboard(shell) {
        function resetShell(s) {
            // Video shell gets animated closing
            if (s.classList.contains('app-shell--video') && s.classList.contains('keyboard-open')) {
                s.classList.remove('keyboard-open');
                s.classList.add('keyboard-closing');
                // Blur the textarea immediately
                const ta = s.querySelector('.video-floating-input__textarea');
                if (ta) ta.blur();
                // Wait for animation to complete, then clean up
                setTimeout(() => {
                    s.classList.remove('keyboard-closing');
                    const kb = s.querySelector(':scope > [data-sim-kb]');
                    if (kb) kb.classList.remove('visible');
                }, 600);
            } else {
                s.classList.remove('keyboard-open');
                const kb = s.querySelector(':scope > [data-sim-kb]');
                if (kb) kb.classList.remove('visible');
            }
        }

        if (!shell) {
            document.querySelectorAll('.keyboard-open').forEach(resetShell);
        } else {
            resetShell(shell);
        }
        activeTextarea = null;
        isShifted = false;
    }

    // Expose globally so any code can dismiss the keyboard
    window.dismissKeyboard = function () { hideKeyboard(); };

    function typeChar(char) {
        if (!activeTextarea) return;
        const ta = activeTextarea;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const actualChar = (isShifted || nextCharUpper) ? char.toUpperCase() : char;

        ta.value = val.substring(0, start) + actualChar + val.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 1;

        // Auto-capitalize after sentence end
        nextCharUpper = /[.!?]\s$/.test(ta.value);

        // Turn off shift after one character
        if (isShifted) {
            isShifted = false;
            updateShiftVisual();
        }

        // Trigger input event so the app's own listeners pick up the change
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function doBackspace() {
        if (!activeTextarea) return;
        const ta = activeTextarea;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end && start > 0) {
            ta.value = ta.value.substring(0, start - 1) + ta.value.substring(end);
            ta.selectionStart = ta.selectionEnd = start - 1;
        } else if (start !== end) {
            ta.value = ta.value.substring(0, start) + ta.value.substring(end);
            ta.selectionStart = ta.selectionEnd = start;
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function updateShiftVisual() {
        document.querySelectorAll('[data-action="shift"]').forEach(btn => {
            btn.style.background = isShifted ? '#fff' : '';
            btn.style.color = isShifted ? '#0b57d0' : '';
        });
    }

    // Handle all keyboard taps (delegated)
    document.addEventListener('pointerdown', e => {
        const key = e.target.closest('.sim-key');
        const suggest = e.target.closest('.sim-suggest');

        if (key) {
            e.preventDefault(); // prevent textarea blur
            e.stopPropagation();

            const char = key.dataset.char;
            const action = key.dataset.action;

            if (char) {
                // Pop-up effect
                key.classList.add('popped');
                setTimeout(() => key.classList.remove('popped'), 120);
                typeChar(char);
            } else if (action === 'space') {
                typeChar(' ');
            } else if (action === 'backspace') {
                doBackspace();
            } else if (action === 'shift') {
                isShifted = !isShifted;
                updateShiftVisual();
            } else if (action === 'return') {
                // Submit the form / trigger send
                if (activeTextarea) {
                    const shell = activeTextarea.closest('.edit-modal, #music-edit-screen')
                        || activeTextarea.closest(SHELL_SELECTOR);
                    hideKeyboard(shell);
                    // Find and click the send button
                    const sendBtn = shell
                        ? (shell.querySelector('.edit-modal__send-btn')
                            || shell.querySelector('.input-bar__send-btn:not([disabled])'))
                        : null;
                    if (sendBtn) {
                        setTimeout(() => sendBtn.click(), 100);
                    } else if (activeTextarea) {
                        activeTextarea.blur();
                    }
                }
            } else if (action === 'num') {
                // Toggle number row — could extend in future
            }
        } else if (suggest) {
            e.preventDefault();
            e.stopPropagation();
            const word = suggest.dataset.word;
            if (word && activeTextarea) {
                const ta = activeTextarea;
                const val = ta.value;
                const start = ta.selectionStart;
                const prefix = val.length > 0 && !val.endsWith(' ') ? ' ' : '';
                ta.value = val.substring(0, start) + prefix + word + ' ' + val.substring(start);
                ta.selectionStart = ta.selectionEnd = start + prefix.length + word.length + 1;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }, true); // capture phase to beat blur

    // Show keyboard on ANY text input focus (main shells + edit modals)
    document.addEventListener('focusin', e => {
        if (e.target.matches('.input-bar__textarea, textarea.input-bar__textarea, .edit-modal__input-text, .video-floating-input__textarea')) {
            showKeyboard(e.target);
        }
    });

    // Click anywhere on floating input content to focus the textarea
    document.addEventListener('click', e => {
        const floatingContent = e.target.closest('.video-floating-input__content');
        if (floatingContent && !e.target.closest('.video-floating-input__textarea')) {
            const ta = floatingContent.querySelector('.video-floating-input__textarea');
            if (ta) ta.focus();
        }
    });

    // Hide keyboard when clicking outside textarea/keyboard/input bar/cards
    document.addEventListener('pointerdown', e => {
        if (!activeTextarea) return;
        const inKeyboard = e.target.closest('[data-sim-kb]');
        const inTextarea = e.target.closest('.input-bar__textarea, .edit-modal__input-text');
        const inInputBar = e.target.closest('.input-bar, .edit-modal__input, .video-floating-input');
        const inVideoCard = e.target.closest('.video-card');
        if (!inKeyboard && !inTextarea && !inInputBar && !inVideoCard) {
            const shell = activeTextarea.closest('.edit-modal, #music-edit-screen')
                || activeTextarea.closest(SHELL_SELECTOR);
            hideKeyboard(shell);
        }
    });

    // ── GLOBAL RULE: dismiss keyboard on prompt submission ──
    // Catches all send buttons across response, edit, music, and video surfaces.
    document.addEventListener('click', e => {
        const sendBtn = e.target.closest(
            '[id$="-send-btn"], [id$="-btn-send"], [class*="send-btn"], .input-bar__send-btn, .edit-modal__send-btn'
        );
        if (sendBtn && activeTextarea) {
            hideKeyboard();
        }
    });

})();
