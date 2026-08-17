(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,141720,e=>{"use strict";var r=e.i(843476),o=e.i(271645);let t=`
  attribute vec2 position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = position * 0.5 + 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y; // Flip Y
    gl_Position = vec4(position, 0.0, 1.0);
  }
`,i=`
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying vec2 v_texCoord;
  uniform float u_time;
  uniform float u_fill;
  uniform float u_over;

  void main() {
    vec2 uv = v_texCoord;
    
    // Circular clipping
    float d = length(uv - 0.5);
    if (d > 0.5) {
      discard;
    }
    
    // Wave offset for surface wobble
    float wave = sin(uv.x * 9.4 + u_time * 5.0) * (0.015 + u_over * 0.02)
               + cos(uv.x * 16.0 - u_time * 7.5) * (0.008 + u_over * 0.012);
               
    // Calculate liquid line
    float liquidLine = 1.0 - u_fill + wave;
    
    vec4 finalColor;
    if (uv.y > liquidLine) {
      // Inside liquid (Monochromatic gradient - subtle ghost version)
      float depth = (uv.y - liquidLine) / (1.0 - liquidLine + 0.001);
      
      // Gradient from soft gray top to dim charcoal base
      vec3 topColor = vec3(0.72, 0.72, 0.75); // Dimmer off-white wave crest
      vec3 baseColor = vec3(0.15, 0.15, 0.16); // Very dark, muted charcoal body
      
      vec3 liquidColor = mix(topColor, baseColor, smoothstep(0.0, 0.22, depth));
      
      // Soft wave boundary highlight
      if (uv.y < liquidLine + 0.03) {
        liquidColor = mix(vec3(0.85, 0.85, 0.88), liquidColor, (uv.y - liquidLine) / 0.03);
      }
      
      // Muted opacity (was 0.55-0.85, now 0.15-0.38)
      finalColor = vec4(liquidColor, mix(0.15, 0.38, u_fill));
    } else {
      // Empty background (extremely faint translucent dark overlay)
      finalColor = vec4(0.05, 0.05, 0.06, 0.25);
    }
    
    gl_FragColor = finalColor;
  }
`;e.s(["default",0,function({fillProgress:e,isOver:l,width:a=64,height:n=64}){let u=(0,o.useRef)(null),f=(0,o.useRef)(0),c=(0,o.useRef)(null),d=(0,o.useRef)(e),s=(0,o.useRef)(+!!l);return(0,o.useEffect)(()=>{d.current=e,s.current=+!!l},[e,l]),(0,o.useEffect)(()=>{let e=u.current;if(!e)return;let r=e.getContext("webgl")||e.getContext("experimental-webgl");if(!r)return void console.warn("WebGL not supported for LiquidTrashShader");let o=(e,o)=>{let t=r.createShader(o);return t?(r.shaderSource(t,e),r.compileShader(t),r.getShaderParameter(t,r.COMPILE_STATUS))?t:(console.error("Shader compilation error:",r.getShaderInfoLog(t)),r.deleteShader(t),null):null},l=o(t,r.VERTEX_SHADER),v=o(i,r.FRAGMENT_SHADER);if(!l||!v)return;let m=r.createProgram();if(!m)return;if(r.attachShader(m,l),r.attachShader(m,v),r.linkProgram(m),!r.getProgramParameter(m,r.LINK_STATUS))return void console.error("WebGL program link error:",r.getProgramInfoLog(m));r.useProgram(m);let g=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),h=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,h),r.bufferData(r.ARRAY_BUFFER,g,r.STATIC_DRAW);let p=r.getAttribLocation(m,"position");r.enableVertexAttribArray(p),r.vertexAttribPointer(p,2,r.FLOAT,!1,0,0);let _=r.getUniformLocation(m,"u_time"),C=r.getUniformLocation(m,"u_fill"),b=r.getUniformLocation(m,"u_over"),A=performance.now(),S=()=>{let e=performance.now(),o=(e-A)*.001;A=e,f.current+=o,r.viewport(0,0,a,n),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),r.uniform1f(_,f.current),r.uniform1f(C,d.current),r.uniform1f(b,s.current),r.drawArrays(r.TRIANGLES,0,6),c.current=requestAnimationFrame(S)};return S(),()=>{c.current&&cancelAnimationFrame(c.current),r.deleteBuffer(h),r.deleteProgram(m),r.deleteShader(l),r.deleteShader(v)}},[a,n]),(0,r.jsx)("canvas",{ref:u,width:a,height:n,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",borderRadius:"50%",pointerEvents:"none",filter:"blur(8px)",WebkitFilter:"blur(8px)"}})}])},171379,e=>{e.n(e.i(141720))}]);