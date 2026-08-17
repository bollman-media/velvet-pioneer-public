(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,834735,e=>{"use strict";var t=e.i(843476),r=e.i(271645);let n=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_Position;
layout(location = 1) in vec2 a_Uv;

out vec2 vUv;

void main() {
    vUv = a_Uv;
    gl_Position = vec4(a_Position.xy, 0.0, 1.0);
}
`,a=`#version 300 es
precision highp float;

out vec4 FragColor;
in vec2 vUv;

uniform sampler2D u_imageTexture;
uniform vec2 u_touchPoint;
uniform float u_pinchAmount;
uniform float u_aspectRatio;

void main() {
    vec2 st = vUv;
    vec2 delta = (st - u_touchPoint) * vec2(u_aspectRatio, 1.0);
    float dist = length(delta);
    
    // Smooth exponential radial pinch distortion inwards toward touch point
    float radius = 0.45;
    float factor = smoothstep(radius, 0.0, dist);
    float pinchShape = pow(factor, 2.2);
    vec2 offset = (dist > 0.0001 ? (delta / dist) : vec2(0.0)) * (pinchShape * u_pinchAmount * 0.14);
    offset.x /= u_aspectRatio;

    vec2 pinchedUv = clamp(st - offset, 0.0, 1.0);
    vec4 texColor = texture(u_imageTexture, pinchedUv);
    
    // Slight shadow depth at the center of the pinch
    float shadowCenter = (1.0 - smoothstep(0.0, 0.28, dist)) * u_pinchAmount * 0.25;
    vec3 finalColor = texColor.rgb * (1.0 - shadowCenter);

    FragColor = vec4(finalColor, 1.0);
}
`,i=({src:e,pinchX:i,pinchY:o,isPinching:u,width:c,height:l})=>{let s=(0,r.useRef)(null),f=(0,r.useRef)(null),h=(0,r.useRef)(null),T=(0,r.useRef)(null),_=(0,r.useRef)(0),d=(0,r.useRef)(null),[R,E]=(0,r.useState)(!1);(0,r.useEffect)(()=>{let e=s.current;if(!e)return;let t=e.getContext("webgl2",{alpha:!1,antialias:!0});if(!t)return;f.current=t;let r=(e,r)=>{let n=t.createShader(e);return n?(t.shaderSource(n,r),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS))?n:(t.deleteShader(n),null):null},i=r(t.VERTEX_SHADER,n),o=r(t.FRAGMENT_SHADER,a);if(!i||!o)return;let u=t.createProgram();if(!u||(t.attachShader(u,i),t.attachShader(u,o),t.linkProgram(u),!t.getProgramParameter(u,t.LINK_STATUS)))return;h.current=u,t.useProgram(u);let c=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),l=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),_=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,_),t.bufferData(t.ARRAY_BUFFER,c,t.STATIC_DRAW);let d=t.getAttribLocation(u,"a_Position");t.enableVertexAttribArray(d),t.vertexAttribPointer(d,2,t.FLOAT,!1,0,0);let R=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,R),t.bufferData(t.ARRAY_BUFFER,l,t.STATIC_DRAW);let E=t.getAttribLocation(u,"a_Uv");return t.enableVertexAttribArray(E),t.vertexAttribPointer(E,2,t.FLOAT,!1,0,0),T.current=t.createTexture(),()=>{f.current&&(T.current&&f.current.deleteTexture(T.current),h.current&&f.current.deleteProgram(h.current))}},[]),(0,r.useEffect)(()=>{let t=f.current;if(!t||!e||!T.current)return;let r=new Image;(e.startsWith("http")||e.startsWith("//"))&&(r.crossOrigin="anonymous"),r.onload=()=>{t&&T.current&&(t.bindTexture(t.TEXTURE_2D,T.current),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!0),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,r),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),E(!0))},r.src=e},[e]),(0,r.useEffect)(()=>{let e=f.current,t=h.current;if(!e||!t||!R)return;let r=()=>{let n=+!!u;_.current+=(n-_.current)*.18,e.viewport(0,0,e.canvas.width,e.canvas.height),e.useProgram(t);let a=e.getUniformLocation(t,"u_touchPoint");a&&e.uniform2f(a,i,1-o);let s=e.getUniformLocation(t,"u_pinchAmount");s&&e.uniform1f(s,_.current);let f=e.getUniformLocation(t,"u_aspectRatio");f&&e.uniform1f(f,c/m(1,l)),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,T.current);let h=e.getUniformLocation(t,"u_imageTexture");h&&e.uniform1i(h,0),e.drawArrays(e.TRIANGLES,0,6),Math.abs(n-_.current)>.001||u?d.current=requestAnimationFrame(r):_.current=0};return r(),()=>{d.current&&cancelAnimationFrame(d.current)}},[u,i,o,R,c,l]);let m=(e,t)=>e>t?e:t;return(0,t.jsx)("div",{style:{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none"},children:(0,t.jsx)("canvas",{ref:s,width:2*c,height:2*l,style:{display:u||_.current>.01?"block":"none",width:"100%",height:"100%",objectFit:"cover"}})})};e.s(["ImagePinchShader",0,i,"default",0,i])},320646,e=>{e.n(e.i(834735))}]);