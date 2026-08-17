(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,913515,e=>{"use strict";var a=e.i(843476),t=e.i(271645),i=e.i(522016),s=e.i(846932),o=e.i(88653);let n=[{label:"Crimson",hex:"#E53E3E",fg:"#fff"},{label:"Amber",hex:"#F6AD55",fg:"#1a1a1a"},{label:"Lime",hex:"#68D391",fg:"#1a1a1a"},{label:"Sky",hex:"#63B3ED",fg:"#1a1a1a"},{label:"Violet",hex:"#B794F4",fg:"#1a1a1a"},{label:"Rose",hex:"#FBB6CE",fg:"#1a1a1a"},{label:"Teal",hex:"#4FD1C5",fg:"#1a1a1a"},{label:"Indigo",hex:"#667EEA",fg:"#fff"},{label:"Sand",hex:"#D4A574",fg:"#1a1a1a"},{label:"Slate",hex:"#718096",fg:"#fff"},{label:"Onyx",hex:"#2D3748",fg:"#fff"},{label:"Pearl",hex:"#F7FAFC",fg:"#1a1a1a"}];function r({imageUrl:e,onClose:i,onSave:l}){let[c,d]=(0,t.useState)("effects"),[p,m]=(0,t.useState)("color"),[h,g]=(0,t.useState)({x:50,y:30}),[b,x]=(0,t.useState)({intensity:60,warmth:50,ambient:40,exposure:50,shadows:50,highlights:50,contrast:50}),u=(0,t.useRef)(!1),[f,y]=(0,t.useState)(!1),v=(0,t.useRef)(null),[_,j]=(0,t.useState)(null),[N,w]=(0,t.useState)("#E53E3E"),[k,C]=(0,t.useState)("idle"),[S,F]=(0,t.useState)(null),[E,$]=(0,t.useState)(null),B=(0,t.useRef)(null),z=S??e,A=.7+b.exposure/100*.8,P=.8+b.contrast/100*.6,R=.8+b.warmth/100*.6,D=.85+b.ambient/100*.3,I="lighting"===p?`brightness(${A*D}) contrast(${P}) saturate(${R})`:"",T=b.intensity/100*.6,G=Math.round(255*(b.warmth/100)),M=Math.round(200*(1-b.warmth/100)),U=Math.round(100*(1-b.warmth/100)),L=b.shadows/100*.3,O="lighting"===p?`radial-gradient(circle at ${h.x}% ${h.y}%, rgba(${G},${M},${U},${T}) 0%, rgba(0,0,0,${L}) 100%)`:"",Y=(0,t.useCallback)(async(e,a,t)=>{C("processing"),$(null);try{let i=B.current;if(!i)throw Error("Image not mounted");if(0===i.naturalWidth||0===i.naturalHeight)throw Error("Image not yet loaded — try again in a moment");let s=document.createElement("canvas");s.width=i.naturalWidth,s.height=i.naturalHeight,s.getContext("2d").drawImage(i,0,0);let o={imageBase64:s.toDataURL("image/jpeg",.92),targetHex:e};void 0!==a&&void 0!==t&&(o.clickX=a,o.clickY=t);let n=await fetch("/api/recolor-object",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!n.ok){let e=await n.json().catch(()=>({error:"Unknown error"}));throw Error(e.error??"API error")}let{resultBase64:r}=await n.json();F(r),C("done")}catch(e){console.error("[EditSurface] recolor failed:",e),C("error")}},[]);return(0,a.jsxs)("div",{className:"edit-modal",id:"edit-modal",children:[(0,a.jsx)("style",{children:`
                :root {
                    --edit-modal-bg: #0A0A0B;
                    --surface-raised: #1A1A1E;
                    --surface-border: rgba(255,255,255,0.08);
                    --accent: #A78BFA;
                    --accent-glow: rgba(167,139,250,0.3);
                    --text-primary: #F8F8FC;
                    --text-muted: #6B6B80;
                    --radius-full: 9999px;
                    --radius-lg: 20px;
                    --radius-md: 12px;
                    --transition-base: 0.2s cubic-bezier(0.4,0,0.2,1);
                }

                .edit-modal {
                    position: absolute;
                    inset: 0;
                    z-index: 9999;
                    background: var(--edit-modal-bg);
                    display: flex;
                    flex-direction: column;
                    animation: editModalSlideUp 0.35s cubic-bezier(0.2, 0, 0, 1);
                    border-radius: 24px;
                    overflow: hidden;
                }

                @keyframes editModalSlideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* ── App Bar ── */
                .edit-appbar {
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                    height: 60px;
                    flex-shrink: 0;
                    background: var(--edit-modal-bg);
                    border-bottom: 1px solid var(--surface-border);
                    position: relative;
                }

                .edit-icon-btn {
                    width: 44px;
                    height: 44px;
                    border: none;
                    background: none;
                    color: var(--text-primary);
                    border-radius: var(--radius-full);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background var(--transition-base);
                    flex-shrink: 0;
                }
                .edit-icon-btn:hover { background: rgba(255,255,255,0.06); }

                .edit-appbar__center {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    font-family: 'Google Sans', sans-serif;
                    font-size: 15px;
                    font-weight: 500;
                    color: var(--text-primary);
                    letter-spacing: 0.01em;
                }

                .edit-done-btn {
                    margin-left: auto;
                    margin-right: 8px;
                    background: var(--accent);
                    border: none;
                    color: #fff;
                    font-family: 'Google Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 8px 20px;
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    transition: opacity var(--transition-base), box-shadow var(--transition-base);
                }
                .edit-done-btn:hover {
                    opacity: 0.9;
                    box-shadow: 0 0 20px var(--accent-glow);
                }

                /* ── Canvas ── */
                .edit-canvas {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                    background: #0D0D10;
                    touch-action: none;
                }

                .edit-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    transition: filter 0.1s linear;
                    border-radius: 8px;
                }

                .lighting-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }

                .lighting-source {
                    position: absolute;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid rgba(0,0,0,0.4);
                    transform: translate(-50%, -50%);
                    cursor: move;
                    box-shadow: 0 0 16px rgba(255,255,200,0.8);
                    z-index: 10;
                }

                /* ── Sovereign Motion: Click Target Beacon ─────────────────
                 * Motion Type: Tonal — communicates liveness, spatial attention
                 * Easing: cubic-bezier(0.16,1,0.3,1) — decelerate/arrive with weight
                 * Hierarchy: glow corona first (bg), then rings (content), then core (fg)
                 * GPU-composited only: transform, opacity, filter
                 * ────────────────────────────────────────────────────────── */

                .click-beacon {
                    position: absolute;
                    width: 0;
                    height: 0;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 15;
                }

                /* Ambient glow corona — soft radial light bleed */
                .click-beacon__corona {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    background: radial-gradient(
                        circle,
                        rgba(167, 139, 250, 0.45) 0%,
                        rgba(167, 139, 250, 0.15) 45%,
                        transparent 70%
                    );
                    filter: blur(8px);
                    animation: coronaBreath 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @keyframes coronaBreath {
                    0%, 100% { opacity: 0.6; filter: blur(8px); transform: translate(-50%,-50%) scale(1); }
                    50%       { opacity: 1.0; filter: blur(12px); transform: translate(-50%,-50%) scale(1.18); }
                }

                /* Core dot — alive, breathing center anchor */
                .click-beacon__core {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #fff;
                    transform: translate(-50%, -50%);
                    box-shadow:
                        0 0 0 2px rgba(167,139,250,0.8),
                        0 0 12px rgba(167,139,250,0.9),
                        0 0 28px rgba(167,139,250,0.4);
                    animation: coreBreath 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @keyframes coreBreath {
                    0%, 100% { transform: translate(-50%,-50%) scale(1);    opacity: 0.9; }
                    50%       { transform: translate(-50%,-50%) scale(1.25); opacity: 1.0; }
                }

                /* Shockwave rings — three staggered expansion waves */
                .click-beacon__ring {
                    position: absolute;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(167, 139, 250, 0.9);
                    transform: translate(-50%, -50%) scale(0);
                    transform-origin: center center;
                    box-shadow: 0 0 8px rgba(167,139,250,0.4), inset 0 0 4px rgba(167,139,250,0.15);
                    animation: shockwave 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
                }

                .click-beacon__ring--1 { animation-delay: 0ms; }
                .click-beacon__ring--2 { animation-delay: 380ms; }
                .click-beacon__ring--3 { animation-delay: 760ms; border-color: rgba(167,139,250,0.4); }

                @keyframes shockwave {
                    0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 1;   }
                    70%  { transform: translate(-50%,-50%) scale(2.6); opacity: 0.15; }
                    100% { transform: translate(-50%,-50%) scale(3.0); opacity: 0;   }
                }

                /* Reduced motion: collapse to simple opacity pulse */
                @media (prefers-reduced-motion: reduce) {
                    .click-beacon__corona { animation: none; opacity: 0.5; }
                    .click-beacon__core   { animation: none; opacity: 1; }
                    .click-beacon__ring   { animation: none; opacity: 0; }
                }

                /* Processing overlay */
                .processing-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: rgba(10,10,11,0.75);
                    backdrop-filter: blur(4px);
                    z-index: 20;
                }

                .processing-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(167,139,250,0.2);
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .processing-label {
                    font-family: 'Google Sans', sans-serif;
                    font-size: 13px;
                    color: var(--text-primary);
                    opacity: 0.8;
                }

                /* ── Bottom Toolbar ── */
                .edit-toolbar {
                    background: var(--edit-modal-bg);
                    border-top: 1px solid var(--surface-border);
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                /* Tool tabs row */
                .edit-tool-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    padding: 12px 16px 8px;
                }

                .edit-tool-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px 12px;
                    border-radius: var(--radius-md);
                    transition: background var(--transition-base);
                    min-width: 64px;
                }

                .edit-tool-tab:hover { background: rgba(255,255,255,0.04); }

                .edit-tool-tab__icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 11px;
                    background: var(--surface-raised);
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all var(--transition-base);
                    position: relative;
                }

                .edit-tool-tab.active .edit-tool-tab__icon {
                    background: var(--accent);
                    color: #fff;
                    box-shadow: 0 4px 16px var(--accent-glow);
                }

                /* Recolor tab has a special gradient indicator */
                .edit-tool-tab--recolor .edit-tool-tab__icon {
                    background: linear-gradient(135deg, #E53E3E 0%, #B794F4 50%, #63B3ED 100%);
                }
                .edit-tool-tab--recolor.active .edit-tool-tab__icon {
                    box-shadow: 0 4px 20px rgba(167,139,250,0.5);
                }

                .edit-tool-tab__label {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    font-family: 'Google Sans', sans-serif;
                    text-align: center;
                    letter-spacing: 0.02em;
                }

                .edit-tool-tab.active .edit-tool-tab__label {
                    color: var(--text-primary);
                }

                /* ── Color Toolbar Panel ── */
                .color-panel {
                    background: linear-gradient(180deg, var(--surface-raised) 0%, var(--edit-modal-bg) 100%);
                    border-top: 1px solid var(--surface-border);
                    padding: 16px 20px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    animation: slideUp 0.28s cubic-bezier(0.2,0,0,1);
                }

                @keyframes slideUp {
                    from { transform: translateY(16px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .color-panel__header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .color-panel__title {
                    font-family: 'Google Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-muted);
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                .color-panel__status {
                    font-family: 'Google Sans', sans-serif;
                    font-size: 12px;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .color-panel__status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--text-muted);
                    transition: background 0.2s;
                }

                .color-panel__status-dot--processing { background: #F6AD55; animation: blink 0.8s ease-in-out infinite; }
                .color-panel__status-dot--done { background: #68D391; }
                .color-panel__status-dot--error { background: #E53E3E; }

                @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

                /* Swatches */
                .color-swatches {
                    display: flex;
                    gap: 8px;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    padding-bottom: 2px;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .color-swatches::-webkit-scrollbar { display: none; }

                .color-swatch {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    flex-shrink: 0;
                    position: relative;
                    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
                }

                .color-swatch:hover { transform: scale(1.15); }
                .color-swatch:active { transform: scale(0.95); }

                .color-swatch.selected {
                    transform: scale(1.2);
                    box-shadow: 0 0 0 3px var(--edit-modal-bg), 0 0 0 5px currentColor;
                }

                .color-swatch.selected::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2.5px solid rgba(255,255,255,0.6);
                }

                /* Custom hex input */
                .color-custom-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .color-custom-preview {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid var(--surface-border);
                    flex-shrink: 0;
                    transition: background 0.15s;
                }

                .color-custom-input {
                    flex: 1;
                    background: var(--surface-raised);
                    border: 1px solid var(--surface-border);
                    border-radius: 10px;
                    padding: 8px 14px;
                    color: var(--text-primary);
                    font-family: 'Google Sans Mono', 'Roboto Mono', monospace;
                    font-size: 14px;
                    outline: none;
                    transition: border-color var(--transition-base);
                }

                .color-custom-input:focus {
                    border-color: var(--accent);
                }

                .color-apply-btn {
                    background: var(--accent);
                    border: none;
                    color: #fff;
                    font-family: 'Google Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 8px 18px;
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: opacity 0.15s, box-shadow 0.15s;
                }

                .color-apply-btn:hover {
                    opacity: 0.9;
                    box-shadow: 0 0 16px var(--accent-glow);
                }

                .color-apply-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                /* ── Lighting Panel ── */
                .lighting-panel {
                    background: var(--surface-raised);
                    border-top: 1px solid var(--surface-border);
                    padding: 16px 20px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    animation: slideUp 0.28s cubic-bezier(0.2,0,0,1);
                }

                .lighting-slider-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .lighting-slider-label {
                    color: var(--text-muted);
                    font-family: 'Google Sans', sans-serif;
                    font-size: 0.8rem;
                    width: 72px;
                }

                .lighting-slider {
                    flex: 1;
                    accent-color: var(--accent);
                    height: 4px;
                }

                .lighting-slider-val {
                    color: var(--text-primary);
                    font-family: 'Google Sans Mono', monospace;
                    font-size: 0.8rem;
                    width: 28px;
                    text-align: right;
                }

                /* ── Effects Subtools ── */
                .effects-subtools {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    padding: 12px 16px 16px;
                }

                .effect-subtool {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .effect-subtool__icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: var(--surface-raised);
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--surface-border);
                    transition: all var(--transition-base);
                }

                .effect-subtool__icon:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.15);
                }

                .effect-subtool__label {
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    text-align: center;
                    font-family: 'Google Sans', sans-serif;
                }
            `}),(0,a.jsxs)("div",{className:"edit-appbar",children:[(0,a.jsx)("button",{className:"edit-icon-btn",onClick:i,"aria-label":"Close editor",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})}),(0,a.jsx)("span",{className:"edit-appbar__center",children:"color"===p?"Object Recolor":"lighting"===p?"Lighting":"Edit"}),p?(0,a.jsx)("button",{className:"edit-done-btn",onClick:()=>{m(null),d("effects")},children:"Apply"}):(0,a.jsx)("button",{className:"edit-done-btn",onClick:()=>l(z),children:"Save"})]}),(0,a.jsxs)("div",{className:"edit-canvas",onPointerDown:e=>{if("lighting"===p||"recolor"===c)return;let a=e.currentTarget.getBoundingClientRect(),t=e.clientX-a.left,i=e.clientY-a.top;y(!0);let s=v.current;if(s){let e=s.getContext("2d");e&&(e.beginPath(),e.moveTo(t,i),e.lineWidth=5,e.strokeStyle="#0B57D0",e.lineCap="round",e.stroke())}},onPointerMove:e=>{if(u.current&&"lighting"===p){let a=e.currentTarget.getBoundingClientRect();g({x:Math.max(0,Math.min(100,(e.clientX-a.left)/a.width*100)),y:Math.max(0,Math.min(100,(e.clientY-a.top)/a.height*100))});return}if(!f)return;let a=e.currentTarget.getBoundingClientRect(),t=e.clientX-a.left,i=e.clientY-a.top,s=v.current,o=s?.getContext("2d");o&&(o.lineTo(t,i),o.stroke())},onPointerUp:()=>{u.current=!1,y(!1)},onClick:e=>{if("recolor"!==c||!_)return;let a=e.currentTarget.getBoundingClientRect(),t=(e.clientX-a.left)/a.width,i=(e.clientY-a.top)/a.height;$({x:t,y:i}),Y(_.hex,t,i)},style:{cursor:"recolor"===c&&_?"crosshair":"default"},children:[(0,a.jsx)("img",{ref:B,className:"edit-image",src:z,alt:"Editing",style:{filter:I},crossOrigin:"anonymous"}),"lighting"===p&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("div",{className:"lighting-overlay",style:{background:O}}),(0,a.jsx)("div",{className:"lighting-source",style:{left:`${h.x}%`,top:`${h.y}%`},onPointerDown:()=>{u.current=!0}})]}),(0,a.jsx)(o.AnimatePresence,{children:E&&(0,a.jsxs)(s.motion.div,{className:"click-beacon",style:{left:`${100*E.x}%`,top:`${100*E.y}%`},initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.32,ease:[.16,1,.3,1]},children:[(0,a.jsx)("div",{className:"click-beacon__corona"}),(0,a.jsx)("div",{className:"click-beacon__ring click-beacon__ring--1"}),(0,a.jsx)("div",{className:"click-beacon__ring click-beacon__ring--2"}),(0,a.jsx)("div",{className:"click-beacon__ring click-beacon__ring--3"}),(0,a.jsx)("div",{className:"click-beacon__core"})]},`beacon-${E.x.toFixed(3)}-${E.y.toFixed(3)}`)}),(0,a.jsx)(o.AnimatePresence,{children:"processing"===k&&(0,a.jsxs)(s.motion.div,{className:"processing-overlay",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:[(0,a.jsx)("div",{className:"processing-spinner"}),(0,a.jsx)("span",{className:"processing-label",children:"Isolating & recoloring object…"})]})}),(0,a.jsx)("canvas",{ref:v,style:{position:"absolute",inset:0,pointerEvents:"none"}})]}),(0,a.jsxs)("div",{className:"edit-toolbar",children:[(0,a.jsxs)("div",{className:"edit-tool-tabs",children:[(0,a.jsxs)("button",{className:`edit-tool-tab edit-tool-tab--recolor ${"recolor"===c?"active":""}`,onClick:()=>{d("recolor"),m("color"),C("idle")},children:[(0,a.jsx)("div",{className:"edit-tool-tab__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",style:{color:"#fff"},children:"palette"})}),(0,a.jsx)("span",{className:"edit-tool-tab__label",children:"Recolor"})]}),(0,a.jsxs)("button",{className:`edit-tool-tab ${"effects"===c&&"color"!==p?"active":""}`,onClick:()=>{d("effects"),m(null)},children:[(0,a.jsx)("div",{className:"edit-tool-tab__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"tune"})}),(0,a.jsx)("span",{className:"edit-tool-tab__label",children:"Effects"})]}),(0,a.jsxs)("button",{className:`edit-tool-tab ${"select"===c?"active":""}`,onClick:()=>d("select"),children:[(0,a.jsx)("div",{className:"edit-tool-tab__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"gesture"})}),(0,a.jsx)("span",{className:"edit-tool-tab__label",children:"Select"})]}),(0,a.jsxs)("button",{className:`edit-tool-tab ${"resize"===c?"active":""}`,onClick:()=>d("resize"),children:[(0,a.jsx)("div",{className:"edit-tool-tab__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"crop"})}),(0,a.jsx)("span",{className:"edit-tool-tab__label",children:"Crop"})]})]}),(0,a.jsx)(o.AnimatePresence,{children:("recolor"===c||"color"===p)&&(0,a.jsxs)(s.motion.div,{className:"color-panel",initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.25,ease:[.2,0,0,1]},children:[(0,a.jsxs)("div",{className:"color-panel__header",children:[(0,a.jsx)("span",{className:"color-panel__title",children:"Object Color"}),(0,a.jsxs)("span",{className:"color-panel__status",children:[(0,a.jsx)("span",{className:`color-panel__status-dot color-panel__status-dot--${k}`}),"idle"===k&&"Pick a color","processing"===k&&"Processing…","done"===k&&"Applied","error"===k&&"Error — retry"]})]}),(0,a.jsx)("div",{className:"color-swatches",children:n.map(e=>(0,a.jsx)("button",{className:`color-swatch ${_?.hex===e.hex?"selected":""}`,style:{background:e.hex,color:e.fg,boxShadow:_?.hex===e.hex?`0 0 0 3px var(--edit-modal-bg), 0 0 0 5px ${e.hex}`:"none"},onClick:()=>{j(e),w(e.hex),Y(e.hex)},title:e.label,"aria-label":`Apply ${e.label} color`},e.hex))}),(0,a.jsxs)("div",{className:"color-custom-row",children:[(0,a.jsx)("div",{className:"color-custom-preview",style:{background:N}}),(0,a.jsx)("input",{className:"color-custom-input",type:"text",value:N,onChange:e=>{var a;w(a=e.target.value),j(null),/^#[0-9A-Fa-f]{6}$/.test(a)&&Y(a)},placeholder:"#RRGGBB",maxLength:7,spellCheck:!1}),(0,a.jsx)("button",{className:"color-apply-btn",onClick:()=>{/^#[0-9A-Fa-f]{6}$/.test(N)&&Y(N)},disabled:"processing"===k,children:"Apply"})]})]})}),(0,a.jsx)(o.AnimatePresence,{children:"effects"===c&&"color"!==p&&(0,a.jsxs)(s.motion.div,{className:"effects-subtools",initial:{opacity:0,y:8},animate:{opacity:1,y:0},exit:{opacity:0,y:8},transition:{duration:.2},children:[(0,a.jsxs)("button",{className:"effect-subtool","aria-label":"Remove background",children:[(0,a.jsx)("div",{className:"effect-subtool__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"background_replace"})}),(0,a.jsx)("span",{className:"effect-subtool__label",children:"Remove BG"})]}),(0,a.jsxs)("button",{className:"effect-subtool",onClick:()=>m("lighting"),"aria-label":"Lighting",children:[(0,a.jsx)("div",{className:"effect-subtool__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"wb_sunny"})}),(0,a.jsx)("span",{className:"effect-subtool__label",children:"Lighting"})]}),(0,a.jsxs)("button",{className:"effect-subtool","aria-label":"Portrait",children:[(0,a.jsx)("div",{className:"effect-subtool__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"portrait"})}),(0,a.jsx)("span",{className:"effect-subtool__label",children:"Portrait"})]}),(0,a.jsxs)("button",{className:"effect-subtool","aria-label":"Erase",children:[(0,a.jsx)("div",{className:"effect-subtool__icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"ink_eraser"})}),(0,a.jsx)("span",{className:"effect-subtool__label",children:"Erase"})]})]})}),(0,a.jsx)(o.AnimatePresence,{children:"lighting"===p&&"recolor"!==c&&(0,a.jsx)(s.motion.div,{className:"lighting-panel",initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.25,ease:[.2,0,0,1]},children:[["Intensity","intensity"],["Warmth","warmth"],["Exposure","exposure"],["Contrast","contrast"]].map(([e,t])=>(0,a.jsxs)("div",{className:"lighting-slider-row",children:[(0,a.jsx)("span",{className:"lighting-slider-label",children:e}),(0,a.jsx)("input",{type:"range",className:"lighting-slider",min:"0",max:"100",value:b[t],onChange:e=>{var a;return a=parseInt(e.target.value),void x(e=>({...e,[t]:a}))}}),(0,a.jsx)("span",{className:"lighting-slider-val",children:b[t]})]},t))})})]})]})}let l=[{id:"salon",name:"Salon",img:"/images/salon.png"},{id:"monochrome",name:"Monochrome",img:"/images/monochrome.png"},{id:"color-blocking",name:"Color blocking",img:"/images/color-blocking.png"},{id:"cyborg",name:"Cyborg",img:"/images/cyborg.png"},{id:"surreal",name:"Surreal",img:"/images/surreal.png"},{id:"gothic-clay",name:"Gothic clay",img:"/images/gothic-clay.png"}],c=[{id:"90s-rap",name:"90s rap",img:"/images/90s-rap.png"},{id:"latin-pop",name:"Latin pop",img:"/images/latin-pop.png"},{id:"folk-ballad",name:"Folk ballad",img:"/images/folk-ballad.png"},{id:"8-bit",name:"8-bit",img:"/images/8-bit.png"}];e.s(["default",0,function(){let[e,n]=(0,t.useState)("image"),[d,p]=(0,t.useState)("grid"),[m,h]=(0,t.useState)(null),[g,b]=(0,t.useState)(""),[x,u]=(0,t.useState)(!1),[f,y]=(0,t.useState)(null),[v,_]=(0,t.useState)(null),[j,N]=(0,t.useState)(!1),[w,k]=(0,t.useState)(!1),[C,S]=(0,t.useState)(!1),[F,E]=(0,t.useState)(null),[$,B]=(0,t.useState)(0),[z,A]=(0,t.useState)("effects"),P=["describe your image","restyle a photo","create something new","add a creative touch","generate an image"],R=m?({salon:["give me a fresh new hairstyle","transform my hair into a precision bob","reimagine my look with salon-quality hair","style my hair like a luxury editorial","give me a modern architectural cut"],monochrome:["make it a dramatic black & white portrait","turn it into a moody film noir scene","give it high-contrast monochrome shadows","reimagine it as a vintage B&W photo","strip the color for a stark silhouette"],"color-blocking":["turn it into bold flat color shapes","reimagine it as pop-art blocks","give it vivid geometric color panels","make it a bright color-blocked poster","transform it into abstract flat art"],surreal:["place yourself in a surrealist painting","make it float among melting clocks","add impossible architecture around it","blend it into a dreamlike landscape","warp reality with surreal distortions"],cyborg:["transform into an android version","add translucent skin panels with neon circuitry","make it a Kraftwerk-inspired cyborg","give it liquid metal reflections","reimagine with industrial haze and red neon"],"gothic-clay":["sculpt it into a dark clay figurine","add gothic gargoyles around it","turn it into an ornate baroque relief","give it a moody stone cathedral vibe","reimagine it as a weathered clay bust"],risograph:["print it in layered halftone inks","give it a grainy retro poster look","add misregistered color overlays","turn it into a vintage risograph zine","layer it with semi-transparent ink washes"],steampunk:["surround it with brass gears and pipes","transform it into a clockwork invention","add Victorian copper goggles and steam","reimagine it inside a steam-powered lab","give it an industrial bronze makeover"],explosive:["make it burst with neon paint splatters","add a shockwave of vibrant color","surround it with explosive energy trails","shatter it into flying color fragments","give it a high-energy paint detonation"],"oil-painting":["paint it with rich impasto brushstrokes","give it a Vanity Fair editorial mood","add dramatic Rembrandt lighting","transform it into a painterly masterpiece","give it an Annie Leibovitz cinematic feel"],runway:["dress me in haute couture runway fashion","place me in a luxury Turrell light installation","give it a Saint Laurent formal aesthetic","surround me with chromatic light fields","style me for a monumental fashion editorial"],"old-cartoon":["turn me into a 1930s rubber hose character","give it a classic black-and-white animation feel","add pie-cut eyes and bouncy cartoon features","reimagine as a vintage Disney-era short","make it grainy like an old film reel"]})[m]??P:P;(0,t.useEffect)(()=>{B(0)},[m]),(0,t.useEffect)(()=>{let e=setInterval(()=>{B(e=>(e+1)%R.length)},2800);return()=>clearInterval(e)},[m,R.length]);let D=async()=>{if(g||m){_({style:m,prompt:g,uploadedImage:F}),u(!0),p("response");try{let e,a;if(F){let t=F.match(/^data:([^;]+);base64,(.+)$/);t&&(a=t[1],e=t[2])}let t=await fetch("/api/studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({style:m,userPrompt:g,imageBase64:e,mimeType:a??"image/jpeg"})}),i=await t.json();i.imageUrl?y(i.imageUrl):i.imageBase64&&y(`data:image/png;base64,${i.imageBase64}`),b(""),E(null),h(null)}catch(e){console.error("Generation failed:",e)}finally{u(!1)}}},I="image"===e?l:c;return(0,a.jsxs)("div",{className:"prototype-container",id:"prototype-container",children:[(0,a.jsxs)("div",{className:"prototype-nav",id:"prototype-nav",children:[(0,a.jsxs)(i.default,{href:"/",className:"prototype-nav__back",id:"btn-back-projects",title:"Back to projects",children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"arrow_back"}),"Projects"]}),(0,a.jsx)("span",{className:"prototype-nav__title",children:"Gemini Editing Studio"}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"image"===e?" prototype-nav__tab--active":""}`,onClick:()=>n("image"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"image"}),"Image Editing"]}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"music"===e?" prototype-nav__tab--active":""}`,onClick:()=>n("music"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"music_note"}),"Music Editing"]}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"video"===e?" prototype-nav__tab--active":""}`,onClick:()=>n("video"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"videocam"}),"Video Editing"]})]}),(0,a.jsxs)("div",{className:"app-shell",id:"app-shell",children:[(0,a.jsxs)("header",{className:"status-bar",id:"status-bar",children:[(0,a.jsx)("div",{className:"status-bar__time",children:"9:30"}),(0,a.jsxs)("div",{className:"status-bar__icons",children:[(0,a.jsxs)("svg",{className:"status-bar__cellular",width:"17",height:"13",viewBox:"0 0 17 13",fill:"none",children:[(0,a.jsx)("rect",{x:"0",y:"6",width:"3",height:"7",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"5",y:"4",width:"3",height:"9",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"10",y:"2",width:"3",height:"11",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"15",y:"0",width:"3",height:"13",rx:"1.5",fill:"#1F1F1F"})]}),(0,a.jsxs)("svg",{className:"status-bar__wifi",width:"19",height:"13",viewBox:"0 0 19 13",fill:"none",children:[(0,a.jsx)("path",{d:"M9.5 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",fill:"#1F1F1F"}),(0,a.jsx)("path",{d:"M5.5 8.5c1.1-1.1 2.5-1.7 4-1.7s2.9.6 4 1.7",stroke:"#1F1F1F",strokeWidth:"1.5",strokeLinecap:"round",fill:"none"}),(0,a.jsx)("path",{d:"M2.5 5.5c1.9-1.9 4.3-2.9 7-2.9s5.1 1 7 2.9",stroke:"#1F1F1F",strokeWidth:"1.5",strokeLinecap:"round",fill:"none"})]}),(0,a.jsxs)("svg",{className:"status-bar__battery",width:"27",height:"13",viewBox:"0 0 27 13",fill:"#1F1F1F",children:[(0,a.jsx)("rect",{x:"0",y:"0",width:"24",height:"13",rx:"3",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"25",y:"3.5",width:"2",height:"6",rx:"1",fill:"#1F1F1F",opacity:"0.4"})]})]})]}),(0,a.jsxs)("nav",{className:"app-bar",id:"app-bar",children:[(0,a.jsx)("button",{className:"app-bar__icon-btn","aria-label":"Chat history",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"menu"})}),(0,a.jsx)("div",{className:"app-bar__title",children:(0,a.jsx)("span",{className:"app-bar__logo-text",children:"response"===d&&m?`${m.charAt(0).toUpperCase()+m.slice(1)} image`:"Gemini"})}),(0,a.jsx)("button",{className:"app-bar__avatar","aria-label":"User profile",children:(0,a.jsx)("div",{className:"avatar-circle",children:(0,a.jsx)("img",{src:"/images/eric_profile_photo.jpeg",alt:"Profile",className:"avatar-circle__img",onError:e=>{e.target.style.display="none"}})})})]}),(0,a.jsxs)("div",{className:"content",children:["grid"===d&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("section",{className:"content__heading",children:(0,a.jsx)("h1",{className:"content__title",id:"page-title",children:"Pick a style for your image"})}),(0,a.jsx)("div",{className:"cards-grid",children:I.map((e,t)=>t%2==0&&(0,a.jsx)("div",{className:"cards-grid__row",children:[I[t],I[t+1]].filter(Boolean).map(e=>(0,a.jsxs)("button",{className:`style-card${m===e.id?" style-card--selected":""}`,onClick:()=>h(m===e.id?null:e.id),children:[(0,a.jsx)("img",{className:"style-card__img",src:e.img,alt:e.name,loading:"lazy"}),(0,a.jsx)("div",{className:"style-card__overlay"}),(0,a.jsx)("div",{className:"style-card__label-bar",children:(0,a.jsx)("span",{className:"style-card__label",children:e.name})})]},e.id))},e.id))})]}),"response"===d&&(0,a.jsx)("div",{className:"response-screen",id:"response-screen",children:(0,a.jsxs)("div",{className:"response-content",id:"response-content",children:[(0,a.jsxs)("div",{className:"response-prompt",id:"response-prompt",children:[(0,a.jsxs)("div",{className:"response-prompt__attachments",id:"response-attachments",children:[v?.style&&(0,a.jsxs)("div",{className:"response-thumb",id:"response-thumb-style",children:[(0,a.jsx)("img",{className:"response-thumb__img",src:`/images/${v.style}.png`,alt:l.find(e=>e.id===v.style)?.name??v.style}),(0,a.jsx)("span",{className:"response-thumb__label",children:l.find(e=>e.id===v.style)?.name??v.style})]}),v?.uploadedImage&&(0,a.jsx)("div",{className:"response-thumb",id:"response-thumb-selfie",children:(0,a.jsx)("img",{className:"response-thumb__img",src:v.uploadedImage,alt:"Your photo"})})]}),v?.prompt&&(0,a.jsx)("div",{className:"response-prompt__bubble",id:"response-prompt-bubble",children:(0,a.jsx)("span",{className:"response-prompt__text",id:"response-prompt-text",children:v.prompt})})]}),(0,a.jsxs)("div",{className:"response-answer",children:[(0,a.jsxs)("div",{className:"response-answer__header",children:[(0,a.jsxs)("svg",{className:"response-answer__sparkle",width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[(0,a.jsx)("path",{d:"M19.6162 9.835C17.9212 9.105 16.4388 8.105 15.1663 6.8338C13.895 5.5625 12.8938 4.0788 12.165 2.3838C11.885 1.7338 11.66 1.0663 11.4875 0.3813C11.4313 0.1575 11.2313 0 11 0C10.7688 0 10.5687 0.1575 10.5125 0.3813C10.34 1.0663 10.115 1.7325 9.835 2.3838C9.105 4.0788 8.105 5.5625 6.8337 6.8338C5.5625 8.1038 4.07875 9.105 2.38375 9.835C1.73375 10.115 1.06625 10.34 0.38125 10.5125C0.1575 10.5688 0 10.7688 0 11C0 11.2313 0.1575 11.4313 0.38125 11.4875C1.06625 11.66 1.7325 11.885 2.38375 12.165C4.07875 12.895 5.5612 13.895 6.8337 15.1663C8.105 16.4375 9.1063 17.9213 9.835 19.6163C10.115 20.2663 10.34 20.9338 10.5125 21.6188C10.5687 21.8425 10.77 22 11 22C11.2313 22 11.4313 21.8425 11.4875 21.6188C11.66 20.9338 11.885 20.2675 12.165 19.6163C12.895 17.9213 13.895 16.4388 15.1663 15.1663C16.4375 13.895 17.9212 12.8938 19.6162 9.835Z",fill:"url(#sg)"}),(0,a.jsx)("defs",{children:(0,a.jsxs)("linearGradient",{id:"sg",x1:"7.05",y1:"14.34",x2:"16.62",y2:"6.25",gradientUnits:"userSpaceOnUse",children:[(0,a.jsx)("stop",{stopColor:"#346BF1"}),(0,a.jsx)("stop",{offset:"0.4",stopColor:"#3186FF"}),(0,a.jsx)("stop",{offset:"0.8",stopColor:"#4FA0FF"})]})})]}),(0,a.jsx)("div",{className:"response-answer__spacer"}),(0,a.jsx)("button",{className:"response-answer__menu","aria-label":"More options",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"more_vert"})})]}),(0,a.jsx)("p",{className:"response-answer__text",children:x?"Generating your image…":"Could not restyle — showing template preview"}),(0,a.jsx)("div",{className:`response-image${x?" loading":""}`,id:"response-image",children:!x&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("img",{className:"response-image__img",src:f||`/images/${v?.style||"salon"}.png`,alt:"Generated image"}),(0,a.jsxs)("div",{className:"response-image__controls",children:[(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Share image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"share"})}),(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Edit image",onClick:()=>p("edit"),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"edit"})}),(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Download image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"download"})})]})]})}),(0,a.jsxs)("div",{className:"response-actions",id:"response-actions",children:[(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Good response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"thumb_up"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Bad response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"thumb_down"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Share response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"share"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Copy response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"content_copy"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Download image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"download"})})]})]})]})}),"edit"===d&&(0,a.jsx)(r,{imageUrl:f||`/images/${m||"salon"}.png`,onClose:()=>p("response"),onSave:e=>{console.log("Saved",e),p("response")}})]}),"video"===e&&"grid"===d&&(0,a.jsxs)("div",{className:`video-floating-input ${j?"keyboard-open":""}`,children:[(0,a.jsx)("div",{className:"video-floating-input__scrim"}),(0,a.jsxs)("div",{className:"video-floating-input__container",children:[(0,a.jsx)("div",{className:"video-floating-input__bg"}),(0,a.jsx)("div",{className:"video-floating-input__content",children:(0,a.jsxs)("div",{className:`video-floating-input__input-row${g?" has-text":""}`,children:[(0,a.jsxs)("div",{className:"video-floating-input__field",children:[(0,a.jsx)("textarea",{className:"video-floating-input__textarea",rows:1,placeholder:"Describe your video...",value:g,onChange:e=>{b(e.target.value),e.target.style.height="auto",e.target.style.height=e.target.scrollHeight+"px"},onKeyDown:e=>"Enter"===e.key&&!e.shiftKey&&D(),onFocus:()=>N(!0),onBlur:()=>N(!1),style:{opacity:g||j?1:0}}),(0,a.jsx)("div",{className:"video-floating-input__placeholder",children:"Describe your video..."})]}),(0,a.jsxs)("div",{className:"video-floating-input__morph-container",children:[(0,a.jsx)("button",{id:"lum-float-record",className:"video-floating-input__action-btn",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"mic"})}),(0,a.jsxs)("button",{className:"video-floating-input__send-btn",onClick:D,disabled:x||!g&&!m,children:[(0,a.jsx)("div",{className:"video-floating-input__send-circle"}),(0,a.jsx)("span",{className:"material-symbols-outlined video-floating-input__send-icon",children:"send"})]})]})]})})]})]}),"video"!==e&&"edit"!==d&&(0,a.jsxs)("div",{className:"input-card",style:{background:"#fff",borderRadius:"32px 32px 0 0",padding:"24px",display:"flex",flexDirection:"column",gap:"16px",boxShadow:"0 -4px 20px rgba(0,0,0,0.1)",position:"absolute",bottom:0,left:0,right:0,zIndex:100},children:[(0,a.jsxs)("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"nowrap",overflowX:"auto"},children:[m&&(0,a.jsxs)("div",{className:"attachment-chip",id:"attachment-chip",children:[(0,a.jsx)("img",{className:"attachment-chip__thumb",src:`/images/${m}.png`,alt:l.find(e=>e.id===m)?.name??m}),(0,a.jsx)("span",{className:"attachment-chip__label",children:l.find(e=>e.id===m)?.name??m}),(0,a.jsx)("button",{className:"attachment-chip__close","aria-label":"Remove template",onClick:()=>h(null),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})})]}),F&&(0,a.jsxs)("div",{className:"attachment-chip selfie-chip",id:"selfie-chip",children:[(0,a.jsx)("img",{className:"attachment-chip__thumb",src:F,alt:"Your photo"}),(0,a.jsx)("button",{className:"attachment-chip__close","aria-label":"Remove photo",onClick:()=>E(null),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})})]}),!F&&"response"!==d&&(0,a.jsxs)("label",{className:"add-selfie-btn","aria-label":"Add image",children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"add_a_photo"}),(0,a.jsx)("span",{className:"add-selfie-btn__label",children:"Add image"}),(0,a.jsx)("input",{type:"file",accept:"image/*",style:{display:"none"},onChange:e=>{let a=e.target.files?.[0];if(a){let e=new FileReader;e.onloadend=()=>{E(e.result)},e.readAsDataURL(a)}}})]})]}),(0,a.jsxs)("div",{style:{position:"relative",width:"100%",height:"48px"},children:[(0,a.jsx)("textarea",{className:"styled-textarea",value:g,onChange:e=>b(e.target.value),style:{border:"none",background:"transparent",width:"100%",height:"100%",outline:"none",fontSize:"1.1rem",color:"#202124",resize:"none",fontFamily:"var(--font-outfit), sans-serif",position:"absolute",top:0,left:0,zIndex:2}}),!g&&(0,a.jsxs)("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",display:"flex",alignItems:"center",gap:"4px",color:"#5f6368",fontSize:"1.1rem",zIndex:1,overflow:"hidden"},children:[!m&&(0,a.jsx)("span",{style:{whiteSpace:"nowrap"},children:"Describe your image"}),m&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{style:{whiteSpace:"nowrap",flexShrink:0},children:"Restyle: "}),(0,a.jsx)("div",{style:{position:"relative",height:"24px",flex:1,overflow:"hidden",minWidth:0},children:(0,a.jsx)(o.AnimatePresence,{mode:"wait",children:(0,a.jsxs)(s.motion.span,{initial:{y:24,opacity:0},animate:{y:0,opacity:1},exit:{y:-24,opacity:0},transition:{duration:.5,ease:[.4,0,.2,1]},style:{position:"absolute",top:0,left:0,whiteSpace:"nowrap"},children:["“",R[$],"”"]},`${m}-${$}`)})})]})]})]}),(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[(0,a.jsx)("button",{style:{background:"none",border:"none",color:"#5f6368",display:"flex",alignItems:"center"},children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"add"})}),(0,a.jsxs)("div",{style:{background:"#D2E3FC",borderRadius:"16px",padding:"4px 12px",display:"flex",alignItems:"center",gap:"4px"},children:[(0,a.jsx)("span",{style:{fontSize:"1rem"},children:"🍌"}),(0,a.jsx)("button",{style:{background:"none",border:"none",color:"#1a73e8",display:"flex",alignItems:"center",padding:0},children:(0,a.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"1.2rem"},children:"close"})})]})]}),(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[!g&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("button",{className:"input-bar__thinking-pill","aria-label":"Thinking mode",children:"Thinking"}),(0,a.jsx)("button",{className:"input-bar__action-btn input-bar__action-btn--mic","aria-label":"Voice input",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"mic"})})]}),g&&(0,a.jsx)(s.motion.button,{className:"input-bar__send-btn","aria-label":"Send prompt",onClick:D,disabled:x,initial:{scale:0,opacity:0},animate:{scale:1,opacity:1},exit:{scale:0,opacity:0},transition:{type:"spring",stiffness:400,damping:22},children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"send"})})]})]})]})]})]})}],913515)}]);