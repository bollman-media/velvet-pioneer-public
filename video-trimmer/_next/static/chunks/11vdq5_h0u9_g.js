(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,374291,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(846932);let o=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_Position;
layout(location = 1) in vec2 a_Uv;

out vec2 vUv;

void main() {
    vUv = a_Uv;
    gl_Position = vec4(a_Position.xy, 0.0, 1.0);
}
`,r=`#version 300 es
precision highp float;

out vec4 FragColor;
in vec2 vUv;

// --- Canvas & Core System Uniforms ---
uniform float u_canvasWidth;
uniform float u_canvasHeight;
uniform float u_DPI;
uniform float u_timer;
uniform float u_softTimer;

// --- Colors ---
uniform vec3 u_dodgeColor;
uniform vec3 u_particleColor;

// --- Procedural Particle Grid Uniforms ---
uniform float u_outsideDotSpacing;
uniform float u_outsideDotSize;
uniform float u_rotationAngle;
uniform float u_edgeRadius;
uniform float u_visibleWaveFrequency;
uniform vec3 u_visibleWaveDirection;
uniform float u_visibleWaveAffect;
uniform float u_dotDriverSizeAffect;
uniform float u_outsideParticlesVisibility;

// --- Turbulent Displacement Uniforms ---
uniform float u_turbulentEvolutionSpeed;
uniform float u_turbulentAmount;
uniform float u_turbulentSize;
uniform float u_turbulentParticleAmount;
uniform float u_turbulentParticleSize;
uniform float u_turbulentComplexity;

// --- Image Transition Uniforms ---
uniform vec2 u_clickCenter;
uniform float u_transitionProgress;
uniform float u_revealWobbleAmount;
uniform float u_revealWobbleScale;
uniform float u_revealWobbleSpeed;
uniform float u_bloomLineThickness;
uniform float u_bloomLineStrength;
uniform float u_particleBloomSpread;
uniform float u_glassDistortionStrength;
uniform float u_glassDistortionDistance;

float fastTrigNoise(vec2 p, float time) {
    vec2 p_scaled = p * 2.0;
    float t = time * 2.0;
    vec3 phases = vec3(
        p_scaled.x * 1.8 + t * 1.2,
        p_scaled.y * 2.0 - t * 1.0,
        (p_scaled.x + p_scaled.y) * 1.2 + t * 1.5
    );
    return dot(sin(phases), vec3(0.33333333));
}

float fbm(vec2 p, float time, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float totalAmplitude = 0.0;
    for (int i = 0; i < 4; i++) {
        if (i >= octaves) break;
        value += amplitude * fastTrigNoise(p * frequency, time * frequency);
        totalAmplitude += amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value / totalAmplitude;
}

vec2 turbulentDisplace(vec2 p, float time, float amount, float size, int octaves) {
    vec2 coord = p / max(1.0, size);
    float dx = fbm(coord, time, octaves);
    float dy = fbm(coord + vec2(17.3, 34.7), time + 5.1, octaves);
    return vec2(dx, dy) * amount;
}

float getProceduralDotsLayer(vec2 vPos, float spacing, float dotSize, int turbOctaves, float turbTime) {
    vec2 p_pixel = vPos * 0.1;
    float angleRad = radians(-u_rotationAngle);
    float cA = cos(angleRad);
    float sA = sin(angleRad);
    mat2 unrotMat = mat2(cA, sA, -sA, cA);
    mat2 rotMat   = mat2(cA, -sA, sA, cA);

    vec2 noiseDir = vec2(-1.0, 1.0);
    vec2 approxDisp = turbulentDisplace(vPos, turbTime, u_turbulentParticleAmount, u_turbulentParticleSize, turbOctaves);
    vec2 p_virtual_unrotated = unrotMat * (p_pixel - approxDisp * 0.1);
    float invSpacing = 1.0 / max(0.0001, spacing);
    int centerRow = int(round(p_virtual_unrotated.y * invSpacing));
    
    float accumAlpha = 0.0;
    float maxPossibleRadius = dotSize * 0.002;
    float aaRange = max(0.0015, 18.0 / (u_canvasHeight * max(0.5, u_DPI)));
    float basePointSize = dotSize * u_canvasHeight * 0.001 * u_DPI;
    
    float softTimer5 = u_softTimer * 5.0;
    vec2 waveDir10 = u_visibleWaveDirection.xy * 10.0;
    float maxDist = (u_turbulentParticleAmount * 1.415) + (maxPossibleRadius * 12.5) + 2.0;
    float maxDistSq = maxDist * maxDist;

    for (int r = -2; r <= 2; r++) {
        int row = centerRow + r;
        float isEven = 1.0 - step(0.5, fract(float(row) * 0.5));
        float offset_honeycomb = isEven * spacing * 0.5;
        int centerCol = int(round((p_virtual_unrotated.x - offset_honeycomb) * invSpacing));
        for (int c = -2; c <= 2; c++) {
            vec2 p_base_unrotated = vec2(float(centerCol + c) * spacing + offset_honeycomb, float(row) * spacing);
            vec2 dotCenterUndisplaced = rotMat * p_base_unrotated * 10.0;
            vec2 diffPre = vPos - dotCenterUndisplaced;
            if (dot(diffPre, diffPre) > maxDistSq) continue;
            
            vec2 dotDisp = turbulentDisplace(dotCenterUndisplaced, turbTime, u_turbulentParticleAmount, u_turbulentParticleSize, turbOctaves);
            vec2 p_displaced = (dotCenterUndisplaced + dotDisp) * 0.1;
            vec2 diff = p_pixel - p_displaced;
            float distToCenterSq = dot(diff, diff);
            
            float wavePhaseRaw = dot(p_displaced, noiseDir * 40.0) - softTimer5;
            float nnRaw = mix(0.5, 1.0, (cos(wavePhaseRaw) + 1.0) * 0.5);
            vec2 noiseCoord = p_displaced * u_visibleWaveFrequency + waveDir10;
            
            float waveOffset = smoothstep(0.0, 0.8, (fastTrigNoise(noiseCoord, u_visibleWaveDirection.z) + 1.0) * 0.5 * u_visibleWaveAffect);
            float sizeMod = (1.0 - waveOffset) * mix(1.0, nnRaw, u_dotDriverSizeAffect);
            float targetRadius = maxPossibleRadius * sizeMod;
            float minRadius = 0.08;
            float quadRadius = max(targetRadius, minRadius);
            
            float quadRadiusSq = quadRadius * quadRadius;
            if (distToCenterSq > quadRadiusSq * 1.5625) continue;
            
            float realDist = sqrt(distToCenterSq);
            float subpixelOpacity = targetRadius < minRadius ? targetRadius / minRadius : 1.0;
            float visibleMask = smoothstep(quadRadius * 1.25, quadRadius * 0.95, realDist);
            float shapeAlpha = (1.0 - smoothstep(-aaRange * 0.5, aaRange * 0.5, realDist - (u_edgeRadius * quadRadius * 2.0))) * visibleMask;
            accumAlpha = max(accumAlpha, shapeAlpha * clamp(basePointSize * sizeMod, 0.0, 1.0) * subpixelOpacity);
        }
    }
    return accumAlpha;
}

void main() {
    vec2 canvasRes = vec2(u_canvasWidth, u_canvasHeight);
    vec2 centerPixelCoords = vUv * canvasRes;
    vec2 centerPFromCenter = centerPixelCoords - (canvasRes * 0.5);

    float turbulentTime = u_timer * u_turbulentEvolutionSpeed;
    int turbOctaves = int(clamp(u_turbulentComplexity, 1.0, 4.0));

    float aspect = u_canvasWidth / max(1.0, u_canvasHeight);
    vec2 clickPt = vec2(0.5, 0.5);
    vec2 deltaClick = (vUv - clickPt) * vec2(aspect, 1.0);
    float distFromClick = length(deltaClick);

    float maxCornerDist = 0.32;
    float waveRadius = mix(-0.08, maxCornerDist, u_transitionProgress);

    float wobbleScale = max(0.1, u_revealWobbleScale);
    float lineNoise = fbm(vUv * wobbleScale, u_timer * u_revealWobbleSpeed, 3) * u_revealWobbleAmount;

    // Full 360 degree circular fill mask with FBM wobbly perimeter
    float fillMask = smoothstep(0.05, -0.05, distFromClick - (waveRadius + lineNoise));

    // Halftone particle dot matrix filled throughout the entire circle
    float outsideDots = getProceduralDotsLayer(centerPFromCenter, u_outsideDotSpacing, u_outsideDotSize, turbOctaves, turbulentTime);
    float particleGrid = clamp(outsideDots * u_outsideParticlesVisibility, 0.0, 1.0);

    // Particle bloom glow & luminous liquid glass core fill
    float innerRadialGlow = smoothstep(0.32, 0.0, distFromClick);
    vec3 particleBloomGlow = u_particleColor * (particleGrid * fillMask * u_bloomLineStrength * 0.7);
    vec3 coreGlassFill = mix(u_particleColor * 0.3, vec3(1.0, 1.0, 1.0), innerRadialGlow * 0.5) * fillMask;

    vec3 finalColor = coreGlassFill + particleBloomGlow;
    float alpha = clamp(fillMask * (0.85 + particleGrid * 0.35), 0.0, 1.0) * smoothstep(0.01, 0.15, u_transitionProgress);

    FragColor = vec4(finalColor, alpha);
}
`,l=({badgeNumber:e,isSelected:l=!1,onClick:n,width:u=40,height:s=40,sampledRgb:c})=>{let f=(0,a.useRef)(null),d=(0,a.useRef)(0),m=(0,a.useRef)(performance.now());(0,a.useEffect)(()=>{let e=f.current;if(!e)return;let t=e.getContext("webgl2",{alpha:!0,antialias:!0});if(!t)return;let a=t.createShader(t.VERTEX_SHADER);t.shaderSource(a,o),t.compileShader(a);let i=t.createShader(t.FRAGMENT_SHADER);t.shaderSource(i,r),t.compileShader(i);let n=t.createProgram();t.attachShader(n,a),t.attachShader(n,i),t.linkProgram(n),t.useProgram(n);let p=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),v=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),_=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,_),t.bufferData(t.ARRAY_BUFFER,p,t.STATIC_DRAW);let b=t.getAttribLocation(n,"a_Position");t.enableVertexAttribArray(b),t.vertexAttribPointer(b,2,t.FLOAT,!1,0,0);let g=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,g),t.bufferData(t.ARRAY_BUFFER,v,t.STATIC_DRAW);let h=t.getAttribLocation(n,"a_Uv");t.enableVertexAttribArray(h),t.vertexAttribPointer(h,2,t.FLOAT,!1,0,0);let x=(e,a)=>{let i=t.getUniformLocation(n,e);i&&t.uniform1f(i,a)},A=(e,a)=>{let i=t.getUniformLocation(n,e);i&&t.uniform3fv(i,a)};m.current=performance.now();let R=()=>{let e=(performance.now()-m.current)/1e3,a=1-Math.pow(1-Math.min(1,e/.48),3);t.viewport(0,0,t.canvas.width,t.canvas.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(n),x("u_canvasWidth",2*u),x("u_canvasHeight",2*s),x("u_DPI",2),x("u_timer",e),x("u_softTimer",e),A("u_dodgeColor",[.8,.9,1]);let i=l?[.2,.55,1]:[.95,.95,1];l&&c&&(i=[Math.max(.3,c[0]/255),Math.max(.3,c[1]/255),Math.max(.3,c[2]/255)]),A("u_particleColor",i),x("u_outsideDotSpacing",.2),x("u_outsideDotSize",3.4),x("u_rotationAngle",22.5),x("u_edgeRadius",1),x("u_visibleWaveFrequency",.072),A("u_visibleWaveDirection",[1,-1,-1]),x("u_visibleWaveAffect",1),x("u_dotDriverSizeAffect",0),x("u_outsideParticlesVisibility",7),x("u_turbulentEvolutionSpeed",.25),x("u_turbulentAmount",45),x("u_turbulentSize",260),x("u_turbulentParticleAmount",20),x("u_turbulentParticleSize",160),x("u_turbulentComplexity",3),x("u_transitionProgress",a),x("u_revealWobbleAmount",.05),x("u_revealWobbleScale",5),x("u_revealWobbleSpeed",1.5),x("u_bloomLineThickness",.35),x("u_bloomLineStrength",4.5),x("u_particleBloomSpread",2),x("u_glassDistortionStrength",.25),x("u_glassDistortionDistance",.18),t.drawArrays(t.TRIANGLES,0,6),d.current=requestAnimationFrame(R)};return R(),()=>{cancelAnimationFrame(d.current),t&&n&&t.deleteProgram(n)}},[l,u,s,c]);let p=l&&c?`rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.68)`:l?"rgba(49, 134, 255, 0.6)":"rgba(16, 16, 24, 0.82)",v=l&&c?`0 0 18px rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.6)`:l?"0 0 16px rgba(49, 134, 255, 0.9), inset 0 1px 2px rgba(255, 255, 255, 0.6)":"0 4px 14px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)";return(0,t.jsxs)(i.motion.div,{onClick:n,initial:{scale:l?1.15:1},animate:{scale:l?1.15:1},transition:{duration:.24,ease:[.16,1,.3,1]},style:{position:"relative",width:u,height:s,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none"},children:[(0,t.jsx)(i.motion.canvas,{ref:f,width:2*u,height:2*s,initial:{scale:.2,opacity:0,filter:"blur(12px)"},animate:{scale:1,opacity:1,filter:"blur(0px)"},transition:{duration:.48,ease:[.16,1,.3,1]},style:{position:"absolute",inset:-4,width:u+8,height:s+8,pointerEvents:"none",filter:l?c?`drop-shadow(0 0 14px rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.85))`:"drop-shadow(0 0 14px rgba(49, 134, 255, 0.85))":"drop-shadow(0 4px 12px rgba(0,0,0,0.4))"}}),(0,t.jsx)(i.motion.div,{initial:{opacity:0,scale:.5,y:3,filter:"blur(4px)"},animate:{opacity:1,scale:1,y:0,filter:"blur(0px)"},transition:{delay:.08,duration:.62,ease:[.16,1,.3,1]},style:{position:"relative",zIndex:2,width:24,height:24,borderRadius:"50%",backgroundColor:p,backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",border:l?"none":"1px solid rgba(255, 255, 255, 0.45)",boxShadow:v,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:"12px",fontWeight:700,fontFamily:"Inter, system-ui, -apple-system, sans-serif",letterSpacing:"-0.02em",textShadow:"0 1px 3px rgba(0, 0, 0, 0.5)"},children:e})]})};e.s(["RawMode55PinShader",0,l,"default",0,l])},676479,e=>{e.n(e.i(374291))}]);