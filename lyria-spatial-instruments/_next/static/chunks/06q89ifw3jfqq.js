(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,14745,e=>{"use strict";var a=e.i(43399),s=e.i(77507),i=e.i(38122),t=e.i(29429),l=e.i(14898);function n({imageUrl:e,onClose:i,onSave:t}){let[l,o]=(0,s.useState)("effects"),[r,d]=(0,s.useState)(null),[c,m]=(0,s.useState)({x:50,y:30}),[p,h]=(0,s.useState)({intensity:60,warmth:50,ambient:40,exposure:50,shadows:50,highlights:50,contrast:50}),g=(0,s.useRef)(!1),[u,x]=(0,s.useState)([]),[b,_]=(0,s.useState)(!1);(0,s.useRef)(null);let[f,y]=(0,s.useState)(!1),j=(0,s.useRef)(null),v=(e,a)=>{h(s=>({...s,[e]:a}))},N=.7+p.exposure/100*.8,w=.8+p.contrast/100*.6,k=.8+p.warmth/100*.6,C=.85+p.ambient/100*.3,F="lighting"===r?`brightness(${N*C}) contrast(${w}) saturate(${k})`:"",S=p.intensity/100*.6,$=Math.round(255*(p.warmth/100)),z=Math.round(200*(1-p.warmth/100)),I=Math.round(100*(1-p.warmth/100)),A=p.shadows/100*.3,B="lighting"===r?`radial-gradient(circle at ${c.x}% ${c.y}%, rgba(${$},${z},${I},${S}) 0%, rgba(0,0,0,${A}) 100%)`:"";return(0,a.jsxs)("div",{className:"edit-modal",id:"edit-modal",children:[(0,a.jsx)("style",{children:`
                /* Variables for Edit Modal */
                :root {
                    --edit-modal-bg: #000;
                    --inverse-on-surface: #fff;
                    --radius-full: 9999px;
                    --transition-base: 0.2s ease;
                    --radius-lg: 16px;
                    --surface-dark: #121212;
                    --edit-canvas-bg: #121212;
                }

                .edit-modal {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
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

                .edit-modal__status-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 40px;
                    padding: 8px 16px 0;
                    flex-shrink: 0;
                    background: #000;
                }

                .edit-modal__status-bar .status-bar__time {
                    color: var(--inverse-on-surface);
                    font-size: 14px;
                    font-weight: 500;
                }

                .edit-modal__status-bar .status-bar__icons {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .edit-modal__appbar {
                    display: flex;
                    align-items: center;
                    padding: 0 4px;
                    height: 64px;
                    flex-shrink: 0;
                    background: #000;
                    position: relative;
                }

                .edit-modal__icon-btn {
                    width: 48px;
                    height: 48px;
                    border: none;
                    background: none;
                    color: var(--inverse-on-surface);
                    border-radius: var(--radius-full);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background var(--transition-base);
                    flex-shrink: 0;
                }

                .edit-modal__icon-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                .edit-modal__appbar-center {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    font-family: 'Google Sans Text', 'Google Sans', sans-serif;
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--inverse-on-surface);
                    pointer-events: none;
                }

                .edit-modal__done-text {
                    background: none;
                    border: none;
                    color: var(--inverse-on-surface);
                    font-family: 'Google Sans', sans-serif;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    margin-left: auto;
                    margin-right: 16px;
                    padding: 12px 4px;
                }

                .edit-modal__canvas {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                    background: var(--edit-canvas-bg);
                    touch-action: none;
                }

                .edit-modal__image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    transition: filter 0.1s linear;
                }

                .lighting-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }

                .lighting-source {
                    position: absolute;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #000;
                    transform: translate(-50%, -50%);
                    cursor: move;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    z-index: 10;
                }

                .edit-modal__tools {
                    background: #000;
                    padding: 24px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .edit-modal__tools-row {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                }

                .edit-modal__tool {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    width: 64px;
                }

                .edit-modal__tool-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #2D2C31;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .edit-modal__tool.active .edit-modal__tool-icon {
                    background: #C2E7FF;
                    color: #001D35;
                }

                .edit-modal__tool-label {
                    color: #9AA0A6;
                    font-size: 0.75rem;
                    text-align: center;
                }

                .edit-modal__tool.active .edit-modal__tool-label {
                    color: #fff;
                }

                .edit-modal__subtools {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                }

                .edit-modal__subtool {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .edit-modal__subtool-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #2D2C31;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .edit-modal__subtool-label {
                    color: #9AA0A6;
                    font-size: 0.75rem;
                    text-align: center;
                }

                /* Lighting Adjust Panel */
                .lighting-adjust-panel {
                    background: #1C1B1F;
                    border-radius: 24px 24px 0 0;
                    padding: 20px;
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
                    z-index: 20;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .lighting-slider-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .lighting-slider-label {
                    color: #9AA0A6;
                    font-size: 0.85rem;
                    width: 80px;
                }

                .lighting-slider {
                    flex: 1;
                    accent-color: #C2E7FF;
                }

                .lighting-slider-val {
                    color: #fff;
                    font-size: 0.85rem;
                    width: 30px;
                    text-align: right;
                }
            `}),(0,a.jsxs)("div",{className:"edit-modal__status-bar",children:[(0,a.jsx)("div",{className:"status-bar__time",children:"9:30"}),(0,a.jsx)("div",{className:"status-bar__icons"})]}),(0,a.jsxs)("div",{className:"edit-modal__appbar",children:[(0,a.jsx)("button",{className:"edit-modal__icon-btn",onClick:i,children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})}),(0,a.jsx)("span",{className:"edit-modal__appbar-center",children:r?r.charAt(0).toUpperCase()+r.slice(1):"Edit"}),r?(0,a.jsx)("button",{className:"edit-modal__done-text",onClick:()=>d(null),children:"Apply"}):(0,a.jsx)("button",{className:"edit-modal__done-text",onClick:()=>t(e),children:"Save"})]}),(0,a.jsxs)("div",{className:"edit-modal__canvas",onPointerDown:e=>{if("lighting"===r)return;let a=e.currentTarget.getBoundingClientRect(),s=e.clientX-a.left,i=e.clientY-a.top;if("effects"===l&&"effects"===l){y(!0);let e=j.current;if(e){let a=e.getContext("2d");a&&(a.beginPath(),a.moveTo(s,i),a.lineWidth=5,a.strokeStyle="#0B57D0",a.lineCap="round",a.stroke())}}},onPointerMove:e=>{if(g.current&&"lighting"===r){let a=e.currentTarget.getBoundingClientRect();m({x:Math.max(0,Math.min(100,(e.clientX-a.left)/a.width*100)),y:Math.max(0,Math.min(100,(e.clientY-a.top)/a.height*100))})}else(e=>{if(!f)return;let a=e.currentTarget.getBoundingClientRect(),s=e.clientX-a.left,i=e.clientY-a.top,t=j.current,l=t?.getContext("2d");l&&(l.lineTo(s,i),l.stroke())})(e)},onPointerUp:()=>{g.current=!1,y(!1)},children:[(0,a.jsx)("img",{className:"edit-modal__image",src:e,alt:"Edit",style:{filter:F}}),"lighting"===r&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("div",{className:"lighting-overlay",style:{background:B}}),(0,a.jsx)("div",{className:"lighting-source",style:{left:`${c.x}%`,top:`${c.y}%`},onPointerDown:()=>{g.current=!0}})]}),(0,a.jsx)("canvas",{ref:j,className:"edit-modal__draw-canvas",style:{position:"absolute",inset:0,pointerEvents:"none"}})]}),!r&&(0,a.jsxs)("div",{className:"edit-modal__tools",children:[(0,a.jsx)("div",{className:"edit-modal__subtools",children:"effects"===l&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("button",{className:"edit-modal__subtool",children:[(0,a.jsx)("div",{className:"edit-modal__subtool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"background_replace"})}),(0,a.jsxs)("span",{className:"edit-modal__subtool-label",children:["Remove",(0,a.jsx)("br",{}),"background"]})]}),(0,a.jsxs)("button",{className:"edit-modal__subtool",onClick:()=>d("lighting"),children:[(0,a.jsx)("div",{className:"edit-modal__subtool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"wb_sunny"})}),(0,a.jsx)("span",{className:"edit-modal__subtool-label",children:"Lighting"})]}),(0,a.jsxs)("button",{className:"edit-modal__subtool",children:[(0,a.jsx)("div",{className:"edit-modal__subtool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"portrait"})}),(0,a.jsx)("span",{className:"edit-modal__subtool-label",children:"Portrait"})]}),(0,a.jsxs)("button",{className:"edit-modal__subtool",children:[(0,a.jsx)("div",{className:"edit-modal__subtool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"ink_eraser"})}),(0,a.jsx)("span",{className:"edit-modal__subtool-label",children:"Erase"})]})]})}),(0,a.jsxs)("div",{className:"edit-modal__tools-row",children:[(0,a.jsxs)("button",{className:`edit-modal__tool ${"select"===l?"active":""}`,onClick:()=>o("select"),children:[(0,a.jsx)("div",{className:"edit-modal__tool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"gesture"})}),(0,a.jsx)("span",{className:"edit-modal__tool-label",children:"Select"})]}),(0,a.jsxs)("button",{className:`edit-modal__tool ${"text"===l?"active":""}`,onClick:()=>o("text"),children:[(0,a.jsx)("div",{className:"edit-modal__tool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"text_fields"})}),(0,a.jsx)("span",{className:"edit-modal__tool-label",children:"Text"})]}),(0,a.jsxs)("button",{className:`edit-modal__tool ${"resize"===l?"active":""}`,onClick:()=>o("resize"),children:[(0,a.jsx)("div",{className:"edit-modal__tool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"crop"})}),(0,a.jsx)("span",{className:"edit-modal__tool-label",children:"Resize"})]}),(0,a.jsxs)("button",{className:`edit-modal__tool ${"effects"===l?"active":""}`,onClick:()=>o("effects"),children:[(0,a.jsx)("div",{className:"edit-modal__tool-icon",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"tune"})}),(0,a.jsx)("span",{className:"edit-modal__tool-label",children:"Effects"})]})]})]}),"lighting"===r&&(0,a.jsxs)("div",{className:"lighting-adjust-panel",children:[(0,a.jsxs)("div",{className:"lighting-slider-row",children:[(0,a.jsx)("span",{className:"lighting-slider-label",children:"Intensity"}),(0,a.jsx)("input",{type:"range",className:"lighting-slider",min:"0",max:"100",value:p.intensity,onChange:e=>v("intensity",parseInt(e.target.value))}),(0,a.jsx)("span",{className:"lighting-slider-val",children:p.intensity})]}),(0,a.jsxs)("div",{className:"lighting-slider-row",children:[(0,a.jsx)("span",{className:"lighting-slider-label",children:"Warmth"}),(0,a.jsx)("input",{type:"range",className:"lighting-slider",min:"0",max:"100",value:p.warmth,onChange:e=>v("warmth",parseInt(e.target.value))}),(0,a.jsx)("span",{className:"lighting-slider-val",children:p.warmth})]}),(0,a.jsxs)("div",{className:"lighting-slider-row",children:[(0,a.jsx)("span",{className:"lighting-slider-label",children:"Exposure"}),(0,a.jsx)("input",{type:"range",className:"lighting-slider",min:"0",max:"100",value:p.exposure,onChange:e=>v("exposure",parseInt(e.target.value))}),(0,a.jsx)("span",{className:"lighting-slider-val",children:p.exposure})]}),(0,a.jsxs)("div",{className:"lighting-slider-row",children:[(0,a.jsx)("span",{className:"lighting-slider-label",children:"Contrast"}),(0,a.jsx)("input",{type:"range",className:"lighting-slider",min:"0",max:"100",value:p.contrast,onChange:e=>v("contrast",parseInt(e.target.value))}),(0,a.jsx)("span",{className:"lighting-slider-val",children:p.contrast})]})]})]})}let o=[{id:"salon",name:"Salon",img:"/images/salon.png"},{id:"monochrome",name:"Monochrome",img:"/images/monochrome.png"},{id:"color-blocking",name:"Color blocking",img:"/images/color-blocking.png"},{id:"cyborg",name:"Cyborg",img:"/images/cyborg.png"},{id:"surreal",name:"Surreal",img:"/images/surreal.png"},{id:"gothic-clay",name:"Gothic clay",img:"/images/gothic-clay.png"}],r=[{id:"90s-rap",name:"90s rap",img:"/images/90s-rap.png"},{id:"latin-pop",name:"Latin pop",img:"/images/latin-pop.png"},{id:"folk-ballad",name:"Folk ballad",img:"/images/folk-ballad.png"},{id:"8-bit",name:"8-bit",img:"/images/8-bit.png"}];e.s(["default",0,function(){let[e,d]=(0,s.useState)("image"),[c,m]=(0,s.useState)("grid"),[p,h]=(0,s.useState)(null),[g,u]=(0,s.useState)(""),[x,b]=(0,s.useState)(!1),[_,f]=(0,s.useState)(null),[y,j]=(0,s.useState)(null),[v,N]=(0,s.useState)(!1),[w,k]=(0,s.useState)(!1),[C,F]=(0,s.useState)(!1),[S,$]=(0,s.useState)(null),[z,I]=(0,s.useState)(0),[A,B]=(0,s.useState)("effects"),E=["describe your image","restyle a photo","create something new","add a creative touch","generate an image"],M=p?({salon:["give me a fresh new hairstyle","transform my hair into a precision bob","reimagine my look with salon-quality hair","style my hair like a luxury editorial","give me a modern architectural cut"],monochrome:["make it a dramatic black & white portrait","turn it into a moody film noir scene","give it high-contrast monochrome shadows","reimagine it as a vintage B&W photo","strip the color for a stark silhouette"],"color-blocking":["turn it into bold flat color shapes","reimagine it as pop-art blocks","give it vivid geometric color panels","make it a bright color-blocked poster","transform it into abstract flat art"],surreal:["place yourself in a surrealist painting","make it float among melting clocks","add impossible architecture around it","blend it into a dreamlike landscape","warp reality with surreal distortions"],cyborg:["transform into an android version","add translucent skin panels with neon circuitry","make it a Kraftwerk-inspired cyborg","give it liquid metal reflections","reimagine with industrial haze and red neon"],"gothic-clay":["sculpt it into a dark clay figurine","add gothic gargoyles around it","turn it into an ornate baroque relief","give it a moody stone cathedral vibe","reimagine it as a weathered clay bust"],risograph:["print it in layered halftone inks","give it a grainy retro poster look","add misregistered color overlays","turn it into a vintage risograph zine","layer it with semi-transparent ink washes"],steampunk:["surround it with brass gears and pipes","transform it into a clockwork invention","add Victorian copper goggles and steam","reimagine it inside a steam-powered lab","give it an industrial bronze makeover"],explosive:["make it burst with neon paint splatters","add a shockwave of vibrant color","surround it with explosive energy trails","shatter it into flying color fragments","give it a high-energy paint detonation"],"oil-painting":["paint it with rich impasto brushstrokes","give it a Vanity Fair editorial mood","add dramatic Rembrandt lighting","transform it into a painterly masterpiece","give it an Annie Leibovitz cinematic feel"],runway:["dress me in haute couture runway fashion","place me in a luxury Turrell light installation","give it a Saint Laurent formal aesthetic","surround me with chromatic light fields","style me for a monumental fashion editorial"],"old-cartoon":["turn me into a 1930s rubber hose character","give it a classic black-and-white animation feel","add pie-cut eyes and bouncy cartoon features","reimagine as a vintage Disney-era short","make it grainy like an old film reel"]})[p]??E:E;(0,s.useEffect)(()=>{I(0)},[p]),(0,s.useEffect)(()=>{let e=setInterval(()=>{I(e=>(e+1)%M.length)},2800);return()=>clearInterval(e)},[p,M.length]);let R=async()=>{if(g||p){j({style:p,prompt:g,uploadedImage:S}),b(!0),m("response");try{let e,a;if(S){let s=S.match(/^data:([^;]+);base64,(.+)$/);s&&(a=s[1],e=s[2])}let s=await fetch("/api/studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({style:p,userPrompt:g,imageBase64:e,mimeType:a??"image/jpeg"})}),i=await s.json();i.imageUrl?f(i.imageUrl):i.imageBase64&&f(`data:image/png;base64,${i.imageBase64}`),u(""),$(null),h(null)}catch(e){console.error("Generation failed:",e)}finally{b(!1)}}},T="image"===e?o:r;return(0,a.jsxs)("div",{className:"prototype-container",id:"prototype-container",children:[(0,a.jsxs)("div",{className:"prototype-nav",id:"prototype-nav",children:[(0,a.jsxs)(i.default,{href:"/",className:"prototype-nav__back",id:"btn-back-projects",title:"Back to projects",children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"arrow_back"}),"Projects"]}),(0,a.jsx)("span",{className:"prototype-nav__title",children:"Gemini Editing Studio"}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"image"===e?" prototype-nav__tab--active":""}`,onClick:()=>d("image"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"image"}),"Image Editing"]}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"music"===e?" prototype-nav__tab--active":""}`,onClick:()=>d("music"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"music_note"}),"Music Editing"]}),(0,a.jsxs)("button",{className:`prototype-nav__tab${"video"===e?" prototype-nav__tab--active":""}`,onClick:()=>d("video"),children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"videocam"}),"Video Editing"]})]}),(0,a.jsxs)("div",{className:"app-shell",id:"app-shell",children:[(0,a.jsxs)("header",{className:"status-bar",id:"status-bar",children:[(0,a.jsx)("div",{className:"status-bar__time",children:"9:30"}),(0,a.jsxs)("div",{className:"status-bar__icons",children:[(0,a.jsxs)("svg",{className:"status-bar__cellular",width:"17",height:"13",viewBox:"0 0 17 13",fill:"none",children:[(0,a.jsx)("rect",{x:"0",y:"6",width:"3",height:"7",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"5",y:"4",width:"3",height:"9",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"10",y:"2",width:"3",height:"11",rx:"1.5",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"15",y:"0",width:"3",height:"13",rx:"1.5",fill:"#1F1F1F"})]}),(0,a.jsxs)("svg",{className:"status-bar__wifi",width:"19",height:"13",viewBox:"0 0 19 13",fill:"none",children:[(0,a.jsx)("path",{d:"M9.5 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",fill:"#1F1F1F"}),(0,a.jsx)("path",{d:"M5.5 8.5c1.1-1.1 2.5-1.7 4-1.7s2.9.6 4 1.7",stroke:"#1F1F1F",strokeWidth:"1.5",strokeLinecap:"round",fill:"none"}),(0,a.jsx)("path",{d:"M2.5 5.5c1.9-1.9 4.3-2.9 7-2.9s5.1 1 7 2.9",stroke:"#1F1F1F",strokeWidth:"1.5",strokeLinecap:"round",fill:"none"})]}),(0,a.jsxs)("svg",{className:"status-bar__battery",width:"27",height:"13",viewBox:"0 0 27 13",fill:"#1F1F1F",children:[(0,a.jsx)("rect",{x:"0",y:"0",width:"24",height:"13",rx:"3",fill:"#1F1F1F"}),(0,a.jsx)("rect",{x:"25",y:"3.5",width:"2",height:"6",rx:"1",fill:"#1F1F1F",opacity:"0.4"})]})]})]}),(0,a.jsxs)("nav",{className:"app-bar",id:"app-bar",children:[(0,a.jsx)("button",{className:"app-bar__icon-btn","aria-label":"Chat history",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"menu"})}),(0,a.jsx)("div",{className:"app-bar__title",children:(0,a.jsx)("span",{className:"app-bar__logo-text",children:"response"===c&&p?`${p.charAt(0).toUpperCase()+p.slice(1)} image`:"Gemini"})}),(0,a.jsx)("button",{className:"app-bar__avatar","aria-label":"User profile",children:(0,a.jsx)("div",{className:"avatar-circle",children:(0,a.jsx)("img",{src:"/images/eric_profile_photo.jpeg",alt:"Profile",className:"avatar-circle__img",onError:e=>{e.target.style.display="none"}})})})]}),(0,a.jsxs)("div",{className:"content",children:["grid"===c&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("section",{className:"content__heading",children:(0,a.jsx)("h1",{className:"content__title",id:"page-title",children:"Pick a style for your image"})}),(0,a.jsx)("div",{className:"cards-grid",children:T.map((e,s)=>s%2==0&&(0,a.jsx)("div",{className:"cards-grid__row",children:[T[s],T[s+1]].filter(Boolean).map(e=>(0,a.jsxs)("button",{className:`style-card${p===e.id?" style-card--selected":""}`,onClick:()=>h(p===e.id?null:e.id),children:[(0,a.jsx)("img",{className:"style-card__img",src:e.img,alt:e.name,loading:"lazy"}),(0,a.jsx)("div",{className:"style-card__overlay"}),(0,a.jsx)("div",{className:"style-card__label-bar",children:(0,a.jsx)("span",{className:"style-card__label",children:e.name})})]},e.id))},e.id))})]}),"response"===c&&(0,a.jsx)("div",{className:"response-screen",id:"response-screen",children:(0,a.jsxs)("div",{className:"response-content",id:"response-content",children:[(0,a.jsxs)("div",{className:"response-prompt",id:"response-prompt",children:[(0,a.jsxs)("div",{className:"response-prompt__attachments",id:"response-attachments",children:[y?.style&&(0,a.jsxs)("div",{className:"response-thumb",id:"response-thumb-style",children:[(0,a.jsx)("img",{className:"response-thumb__img",src:`/images/${y.style}.png`,alt:o.find(e=>e.id===y.style)?.name??y.style}),(0,a.jsx)("span",{className:"response-thumb__label",children:o.find(e=>e.id===y.style)?.name??y.style})]}),y?.uploadedImage&&(0,a.jsx)("div",{className:"response-thumb",id:"response-thumb-selfie",children:(0,a.jsx)("img",{className:"response-thumb__img",src:y.uploadedImage,alt:"Your photo"})})]}),y?.prompt&&(0,a.jsx)("div",{className:"response-prompt__bubble",id:"response-prompt-bubble",children:(0,a.jsx)("span",{className:"response-prompt__text",id:"response-prompt-text",children:y.prompt})})]}),(0,a.jsxs)("div",{className:"response-answer",children:[(0,a.jsxs)("div",{className:"response-answer__header",children:[(0,a.jsxs)("svg",{className:"response-answer__sparkle",width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[(0,a.jsx)("path",{d:"M19.6162 9.835C17.9212 9.105 16.4388 8.105 15.1663 6.8338C13.895 5.5625 12.8938 4.0788 12.165 2.3838C11.885 1.7338 11.66 1.0663 11.4875 0.3813C11.4313 0.1575 11.2313 0 11 0C10.7688 0 10.5687 0.1575 10.5125 0.3813C10.34 1.0663 10.115 1.7325 9.835 2.3838C9.105 4.0788 8.105 5.5625 6.8337 6.8338C5.5625 8.1038 4.07875 9.105 2.38375 9.835C1.73375 10.115 1.06625 10.34 0.38125 10.5125C0.1575 10.5688 0 10.7688 0 11C0 11.2313 0.1575 11.4313 0.38125 11.4875C1.06625 11.66 1.7325 11.885 2.38375 12.165C4.07875 12.895 5.5612 13.895 6.8337 15.1663C8.105 16.4375 9.1063 17.9213 9.835 19.6163C10.115 20.2663 10.34 20.9338 10.5125 21.6188C10.5687 21.8425 10.77 22 11 22C11.2313 22 11.4313 21.8425 11.4875 21.6188C11.66 20.9338 11.885 20.2675 12.165 19.6163C12.895 17.9213 13.895 16.4388 15.1663 15.1663C16.4375 13.895 17.9212 12.8938 19.6162 9.835Z",fill:"url(#sg)"}),(0,a.jsx)("defs",{children:(0,a.jsxs)("linearGradient",{id:"sg",x1:"7.05",y1:"14.34",x2:"16.62",y2:"6.25",gradientUnits:"userSpaceOnUse",children:[(0,a.jsx)("stop",{stopColor:"#346BF1"}),(0,a.jsx)("stop",{offset:"0.4",stopColor:"#3186FF"}),(0,a.jsx)("stop",{offset:"0.8",stopColor:"#4FA0FF"})]})})]}),(0,a.jsx)("div",{className:"response-answer__spacer"}),(0,a.jsx)("button",{className:"response-answer__menu","aria-label":"More options",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"more_vert"})})]}),(0,a.jsx)("p",{className:"response-answer__text",children:x?"Generating your image…":"Could not restyle — showing template preview"}),(0,a.jsx)("div",{className:`response-image${x?" loading":""}`,id:"response-image",children:!x&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("img",{className:"response-image__img",src:_||`/images/${y?.style||"salon"}.png`,alt:"Generated image"}),(0,a.jsxs)("div",{className:"response-image__controls",children:[(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Share image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"share"})}),(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Edit image",onClick:()=>m("edit"),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"edit"})}),(0,a.jsx)("button",{className:"response-image__ctrl-btn","aria-label":"Download image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"download"})})]})]})}),(0,a.jsxs)("div",{className:"response-actions",id:"response-actions",children:[(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Good response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"thumb_up"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Bad response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"thumb_down"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Share response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"share"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Copy response",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"content_copy"})}),(0,a.jsx)("button",{className:"response-actions__btn","aria-label":"Download image",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"download"})})]})]})]})}),"edit"===c&&(0,a.jsx)(n,{imageUrl:_||`/images/${p||"salon"}.png`,onClose:()=>m("response"),onSave:e=>{console.log("Saved",e),m("response")}})]}),"video"===e&&"grid"===c&&(0,a.jsxs)("div",{className:`video-floating-input ${v?"keyboard-open":""}`,children:[(0,a.jsx)("div",{className:"video-floating-input__scrim"}),(0,a.jsxs)("div",{className:"video-floating-input__container",children:[(0,a.jsx)("div",{className:"video-floating-input__bg"}),(0,a.jsx)("div",{className:"video-floating-input__content",children:(0,a.jsxs)("div",{className:`video-floating-input__input-row${g?" has-text":""}`,children:[(0,a.jsxs)("div",{className:"video-floating-input__field",children:[(0,a.jsx)("textarea",{className:"video-floating-input__textarea",rows:1,placeholder:"Describe your video...",value:g,onChange:e=>{u(e.target.value),e.target.style.height="auto",e.target.style.height=e.target.scrollHeight+"px"},onKeyDown:e=>"Enter"===e.key&&!e.shiftKey&&R(),onFocus:()=>N(!0),onBlur:()=>N(!1),style:{opacity:g||v?1:0}}),(0,a.jsx)("div",{className:"video-floating-input__placeholder",children:"Describe your video..."})]}),(0,a.jsxs)("div",{className:"video-floating-input__morph-container",children:[(0,a.jsx)("button",{id:"lum-float-record",className:"video-floating-input__action-btn",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"mic"})}),(0,a.jsxs)("button",{className:"video-floating-input__send-btn",onClick:R,disabled:x||!g&&!p,children:[(0,a.jsx)("div",{className:"video-floating-input__send-circle"}),(0,a.jsx)("span",{className:"material-symbols-outlined video-floating-input__send-icon",children:"send"})]})]})]})})]})]}),"video"!==e&&"edit"!==c&&(0,a.jsxs)("div",{className:"input-card",style:{background:"#fff",borderRadius:"32px 32px 0 0",padding:"24px",display:"flex",flexDirection:"column",gap:"16px",boxShadow:"0 -4px 20px rgba(0,0,0,0.1)",position:"absolute",bottom:0,left:0,right:0,zIndex:100},children:[(0,a.jsxs)("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"nowrap",overflowX:"auto"},children:[p&&(0,a.jsxs)("div",{className:"attachment-chip",id:"attachment-chip",children:[(0,a.jsx)("img",{className:"attachment-chip__thumb",src:`/images/${p}.png`,alt:o.find(e=>e.id===p)?.name??p}),(0,a.jsx)("span",{className:"attachment-chip__label",children:o.find(e=>e.id===p)?.name??p}),(0,a.jsx)("button",{className:"attachment-chip__close","aria-label":"Remove template",onClick:()=>h(null),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})})]}),S&&(0,a.jsxs)("div",{className:"attachment-chip selfie-chip",id:"selfie-chip",children:[(0,a.jsx)("img",{className:"attachment-chip__thumb",src:S,alt:"Your photo"}),(0,a.jsx)("button",{className:"attachment-chip__close","aria-label":"Remove photo",onClick:()=>$(null),children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"close"})})]}),!S&&"response"!==c&&(0,a.jsxs)("label",{className:"add-selfie-btn","aria-label":"Add image",children:[(0,a.jsx)("span",{className:"material-symbols-outlined",children:"add_a_photo"}),(0,a.jsx)("span",{className:"add-selfie-btn__label",children:"Add image"}),(0,a.jsx)("input",{type:"file",accept:"image/*",style:{display:"none"},onChange:e=>{let a=e.target.files?.[0];if(a){let e=new FileReader;e.onloadend=()=>{$(e.result)},e.readAsDataURL(a)}}})]})]}),(0,a.jsxs)("div",{style:{position:"relative",width:"100%",height:"48px"},children:[(0,a.jsx)("textarea",{className:"styled-textarea",value:g,onChange:e=>u(e.target.value),style:{border:"none",background:"transparent",width:"100%",height:"100%",outline:"none",fontSize:"1.1rem",color:"#202124",resize:"none",fontFamily:"var(--font-outfit), sans-serif",position:"absolute",top:0,left:0,zIndex:2}}),!g&&(0,a.jsxs)("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",display:"flex",alignItems:"center",gap:"4px",color:"#5f6368",fontSize:"1.1rem",zIndex:1,overflow:"hidden"},children:[!p&&(0,a.jsx)("span",{style:{whiteSpace:"nowrap"},children:"Describe your image"}),p&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("span",{style:{whiteSpace:"nowrap",flexShrink:0},children:"Restyle: "}),(0,a.jsx)("div",{style:{position:"relative",height:"24px",flex:1,overflow:"hidden",minWidth:0},children:(0,a.jsx)(l.AnimatePresence,{mode:"wait",children:(0,a.jsxs)(t.motion.span,{initial:{y:24,opacity:0},animate:{y:0,opacity:1},exit:{y:-24,opacity:0},transition:{duration:.5,ease:[.4,0,.2,1]},style:{position:"absolute",top:0,left:0,whiteSpace:"nowrap"},children:["“",M[z],"”"]},`${p}-${z}`)})})]})]})]}),(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[(0,a.jsx)("button",{style:{background:"none",border:"none",color:"#5f6368",display:"flex",alignItems:"center"},children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"add"})}),(0,a.jsxs)("div",{style:{background:"#D2E3FC",borderRadius:"16px",padding:"4px 12px",display:"flex",alignItems:"center",gap:"4px"},children:[(0,a.jsx)("span",{style:{fontSize:"1rem"},children:"🍌"}),(0,a.jsx)("button",{style:{background:"none",border:"none",color:"#1a73e8",display:"flex",alignItems:"center",padding:0},children:(0,a.jsx)("span",{className:"material-symbols-outlined",style:{fontSize:"1.2rem"},children:"close"})})]})]}),(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[!g&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("button",{className:"input-bar__thinking-pill","aria-label":"Thinking mode",children:"Thinking"}),(0,a.jsx)("button",{className:"input-bar__action-btn input-bar__action-btn--mic","aria-label":"Voice input",children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"mic"})})]}),g&&(0,a.jsx)(t.motion.button,{className:"input-bar__send-btn","aria-label":"Send prompt",onClick:R,disabled:x,initial:{scale:0,opacity:0},animate:{scale:1,opacity:1},exit:{scale:0,opacity:0},transition:{type:"spring",stiffness:400,damping:22},children:(0,a.jsx)("span",{className:"material-symbols-outlined",children:"send"})})]})]})]})]})]})}],14745)}]);