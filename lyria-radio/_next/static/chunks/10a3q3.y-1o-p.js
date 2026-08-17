(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,624779,t=>{"use strict";var e=t.i(843476),i=t.i(271645),a=t.i(846932);let r=`
precision highp float;
attribute vec3 position;
varying vec2 vUv;
varying vec2 vPosition;

uniform float displayWidth;
uniform float displayHeight;

void main() {
    vUv = position.xy * 0.5 + 0.5;
    float aspect = displayWidth / displayHeight;
    vPosition = position.xy * vec2(aspect, 1.0) * 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,o=`
precision highp float;
varying vec2 vUv;
varying vec2 vPosition;

uniform float timer;
uniform float displayWidth;
uniform float displayHeight;
uniform float uWidth;
uniform float uHeight;
uniform float uRadius;
uniform vec3 color1;
uniform vec3 color2;
uniform float trueOpacity;
uniform float finalSaturation;

// SDF capsule / rounded rectangle
float sdCapsule(vec2 p, float width, float height, float radius) {
    vec2 halfDims = vec2(width * 0.5, height * 0.5);
    float roundness = clamp(radius, 0.0, 1.0);
    float r = roundness * min(halfDims.x, halfDims.y);
    vec2 q = abs(p) - halfDims + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float fallOff(float dist, float softness) {
    float edge = dist / max(softness, 0.001);
    edge = clamp(edge, -1.0, 1.0);
    return 0.5 * (1.0 - tanh(edge * 4.0));
}

void main() {
    vec2 capsulePos = vPosition;
    float dist = sdCapsule(capsulePos, uWidth, uHeight, uRadius);
    
    // Smooth pulsating glass glow
    float pulse = 0.5 + 0.5 * sin(timer * 2.5);
    float glowDist = dist - pulse * 0.02;
    float mask = fallOff(glowDist, 0.15);
    
    // Core refractive blend
    vec3 gradColor = mix(color1, color2, clamp(capsulePos.y / max(uHeight, 0.01) + 0.5, 0.0, 1.0));
    
    // Fresnel rim highlight
    float rim = pow(clamp(1.0 - abs(dist * 6.0), 0.0, 1.0), 2.0);
    vec3 finalRgb = mix(gradColor, vec3(1.0, 1.0, 1.0), rim * 0.6);
    
    float alpha = mask * trueOpacity * (0.85 + 0.15 * pulse);
    
    gl_FragColor = vec4(finalRgb * alpha, alpha);
}
`,n=({width:t=54,height:n=54,badgeNumber:l=1,isSelected:s=!1,pinColor:f="#3186FF",onClick:u})=>{let c=(0,i.useRef)(null),m=(0,i.useRef)(0);return(0,i.useEffect)(()=>{let t,e,i=c.current;if(!i)return;let a=i.getContext("webgl",{alpha:!0,antialias:!0});if(!a)return;let n=(t,e,i)=>{let a=t.createShader(e);return a?(t.shaderSource(a,i),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS))?a:(t.deleteShader(a),null):null},l=n(a,a.VERTEX_SHADER,r),u=n(a,a.FRAGMENT_SHADER,o);if(!l||!u)return;let d=a.createProgram();if(!d||(a.attachShader(d,l),a.attachShader(d,u),a.linkProgram(d),!a.getProgramParameter(d,a.LINK_STATUS)))return;a.useProgram(d);let p=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,p),a.bufferData(a.ARRAY_BUFFER,new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]),a.STATIC_DRAW);let g=a.getAttribLocation(d,"position");a.enableVertexAttribArray(g),a.vertexAttribPointer(g,3,a.FLOAT,!1,0,0);let h=(e=parseInt((t=f.replace("#","")).substring(0,2)||"31",16)/255,[e,parseInt(t.substring(2,4)||"86",16)/255,parseInt(t.substring(4,6)||"FF",16)/255]),v=performance.now(),y=()=>{if(!i||!a)return;let t=(performance.now()-v)/1e3;a.viewport(0,0,i.width,i.height),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.uniform1f(a.getUniformLocation(d,"timer"),t),a.uniform1f(a.getUniformLocation(d,"displayWidth"),i.width),a.uniform1f(a.getUniformLocation(d,"displayHeight"),i.height),a.uniform1f(a.getUniformLocation(d,"uWidth"),.72),a.uniform1f(a.getUniformLocation(d,"uHeight"),.72),a.uniform1f(a.getUniformLocation(d,"uRadius"),1),a.uniform3f(a.getUniformLocation(d,"color1"),h[0],h[1],h[2]),a.uniform3f(a.getUniformLocation(d,"color2"),Math.min(1,1.3*h[0]),Math.min(1,1.3*h[1]),Math.min(1,1.3*h[2])),a.uniform1f(a.getUniformLocation(d,"trueOpacity"),s?1:.85),a.uniform1f(a.getUniformLocation(d,"finalSaturation"),1.4),a.drawArrays(a.TRIANGLES,0,6),m.current=requestAnimationFrame(y)};return m.current=requestAnimationFrame(y),()=>{cancelAnimationFrame(m.current),a&&d&&a.deleteProgram(d)}},[s,f]),(0,e.jsxs)(a.motion.div,{onClick:u,initial:{scale:s?1.12:1},animate:{scale:s?1.12:1},transition:{duration:.24,ease:[.16,1,.3,1]},style:{position:"relative",width:t,height:n,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none"},children:[(0,e.jsx)(a.motion.canvas,{ref:c,width:2*t,height:2*n,initial:{scale:.25,opacity:0,filter:"blur(10px)"},animate:{scale:1,opacity:1,filter:"blur(0px)"},transition:{duration:.48,ease:[.16,1,.3,1]},style:{position:"absolute",inset:-4,width:t+8,height:n+8,pointerEvents:"none",filter:s?"drop-shadow(0 0 12px rgba(49, 134, 255, 0.75))":"drop-shadow(0 2px 8px rgba(0,0,0,0.4))"}}),(0,e.jsx)(a.motion.div,{initial:{opacity:0,scale:.55,y:3,filter:"blur(4px)"},animate:{opacity:1,scale:1,y:0,filter:"blur(0px)"},transition:{delay:.08,duration:.62,ease:[.16,1,.3,1]},style:{position:"relative",zIndex:2,width:24,height:24,borderRadius:"50%",backgroundColor:"rgba(15, 15, 18, 0.88)",backdropFilter:"blur(12px)",border:`1.5px solid ${s?"#FFFFFF":"rgba(255, 255, 255, 0.45)"}`,boxShadow:s?"0 0 10px rgba(255, 255, 255, 0.6)":"0 2px 6px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:"12px",fontWeight:700,fontFamily:"Inter, system-ui, -apple-system, sans-serif",letterSpacing:"-0.02em"},children:l})]})};t.s(["Blob47PinShader",0,n,"default",0,n])},307846,t=>{t.n(t.i(624779))}]);