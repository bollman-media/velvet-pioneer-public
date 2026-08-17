(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,615372,e=>{e.v({activeTab:"page-module___TIboa__activeTab",canvas:"page-module___TIboa__canvas",canvasContainer:"page-module___TIboa__canvasContainer",colorHex:"page-module___TIboa__colorHex",colorInputWrapper:"page-module___TIboa__colorInputWrapper",colorPicker:"page-module___TIboa__colorPicker",colorPickerRow:"page-module___TIboa__colorPickerRow",container:"page-module___TIboa__container",controlItem:"page-module___TIboa__controlItem",controlLabelRow:"page-module___TIboa__controlLabelRow",controlValue:"page-module___TIboa__controlValue",controlsList:"page-module___TIboa__controlsList",group:"page-module___TIboa__group",groupTitle:"page-module___TIboa__groupTitle",header:"page-module___TIboa__header",iconBtn:"page-module___TIboa__iconBtn",logo:"page-module___TIboa__logo",logoDot:"page-module___TIboa__logoDot",mainView:"page-module___TIboa__mainView",overlayControls:"page-module___TIboa__overlayControls",pulse:"page-module___TIboa__pulse",sidebar:"page-module___TIboa__sidebar",sidebarDesc:"page-module___TIboa__sidebarDesc",sidebarHeader:"page-module___TIboa__sidebarHeader",sidebarTitle:"page-module___TIboa__sidebarTitle",slider:"page-module___TIboa__slider",stats:"page-module___TIboa__stats",statsVal:"page-module___TIboa__statsVal",tab:"page-module___TIboa__tab",tabs:"page-module___TIboa__tabs",toggleContainer:"page-module___TIboa__toggleContainer",toggleInput:"page-module___TIboa__toggleInput",toggleRow:"page-module___TIboa__toggleRow",toggleSlider:"page-module___TIboa__toggleSlider"})},442604,e=>{"use strict";var o=e.i(843476),a=e.i(271645),t=e.i(615372);let l=`#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,i=`#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_gradientTex;
uniform float u_time;
uniform float u_scrollTime;
uniform float u_noiseTime;
uniform float u_scrollSpeed;
uniform float u_gradientZoom;
uniform float u_colorOffset;
uniform float u_seedOffset;
uniform float u_darkMode;
uniform float u_uvRotation;
uniform float u_aspectRatio;

uniform vec2  u_shapeCenter;
uniform vec2  u_shapeRadius;
uniform float u_shapeSoftness;
uniform float u_shapeOpacity;

uniform int   u_enableNoiseMask;
uniform float u_noiseMaskScale;
uniform float u_noiseMaskSpeed;
uniform int   u_noiseMaskDetail;
uniform float u_noiseMaskStrength;
uniform float u_noiseMaskAngle;

uniform float u_brightness;
uniform float u_contrast;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute3(vec3 x) { return mod289v3(((x*34.0)+1.0)*x); }

float snoise2D(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm2D(vec2 coord, int octaves) {
    float value = 0.0, amp = 0.5;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amp * snoise2D(coord);
        coord *= 2.0; amp *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = v_uv;
    vec2 delta = uv - u_shapeCenter;
    delta.x *= u_aspectRatio;
    vec2 radCorr = u_shapeRadius;
    radCorr.x *= u_aspectRatio;
    float dist = length(delta / max(radCorr, vec2(0.001)));

    float edgeWidth = fwidth(dist);
    float aaRange = max(u_shapeSoftness, edgeWidth * 1.5);
    float shapeMask = 1.0 - smoothstep(1.0 - aaRange, 1.0 + aaRange * 0.5, dist);

    if (u_enableNoiseMask == 1 && u_noiseMaskStrength > 0.0) {
        vec2 noiseUV = uv * u_noiseMaskScale;
        float rad = radians(u_noiseMaskAngle);
        vec2 noiseOffset = vec2(cos(rad), sin(rad)) * u_noiseTime * u_noiseMaskSpeed;
        float n = fbm2D(noiseUV + noiseOffset, u_noiseMaskDetail);
        n = n * 0.5 + 0.5;
        shapeMask *= mix(1.0, n, u_noiseMaskStrength);
    }

    shapeMask = (shapeMask - 0.5) * u_contrast + 0.5 + u_brightness;
    shapeMask = clamp(shapeMask, 0.0, 1.0);
    shapeMask *= u_shapeOpacity;

    if (shapeMask < 0.001) {
        outColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    vec2 sampleUV = uv;
    if (abs(u_uvRotation) > 0.01) {
        float rot = radians(u_uvRotation);
        vec2 center = vec2(0.5);
        mat2 rotMat = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
        sampleUV = rotMat * (uv - center) + center;
    }

    float row = mix(0.25, 0.75, u_darkMode);
    float u = fract(sampleUV.x / u_gradientZoom - u_scrollTime * u_scrollSpeed + u_seedOffset + u_colorOffset);
    vec3 color = texture(u_gradientTex, vec2(u, row)).rgb;

    outColor = vec4(color * shapeMask, shapeMask);
}`,r=`
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
}`,s=`
precision highp float;
varying vec2 vUv;
varying vec2 vPosition;

// Time & shape
uniform float timer;
uniform float softTimer;
uniform float displayWidth;
uniform float displayHeight;
uniform float uWidth;
uniform float uHeight;
uniform float uOffsetY;
uniform float uRadius;
uniform float uSoftnessBottom;
uniform float uSoftnessTop;
uniform float softnessAffect;
uniform float uNoiseStrength;
uniform float uNoiseScale;
uniform float falloffPower;

// Noise driver
uniform float useStaticNoise;
uniform float noiseSpeed;
uniform vec2 noiseDirection;

// Colors
uniform vec3 color1;
uniform vec3 color2;
uniform float mainColorForce0;
uniform float mainColorForce1;
uniform float colorModeRadial;
uniform vec2 radialSmoothness;
uniform float trueOpacity;
uniform float finalSaturation;

// Env map
uniform float u_angle;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_waveFreq;
uniform float u_bend;
uniform float u_contour;
uniform float u_speedTimer;
uniform float u_bumpForce;

// Fresnel
uniform float u_rimNormalMix;
uniform float u_fresnelIntensity;
uniform vec3 u_colorTopRight;
uniform float bumpTimer;

// 4-stop palette
uniform vec3 gradientFirst;
uniform vec3 gradientSecond;
uniform vec3 gradientThird;
uniform vec3 gradientFourth;
uniform float gradientFirstAlpha;
uniform float gradientSecondAlpha;
uniform float gradientThirdAlpha;
uniform float gradientFourthAlpha;
uniform float u_gradientBlur;

// Color wheel (6 stops)
uniform vec3 colorwheel0;
uniform vec3 colorwheel1;
uniform vec3 colorwheel2;
uniform vec3 colorwheel3;
uniform vec3 colorwheel4;
uniform vec3 colorwheel5;
uniform float colorwheelBlend;
uniform float colorwheelSaturation;
uniform float colorGradientWidth;
uniform float colorRotationAngle;
uniform float gradientComposite;
uniform float gradientHeight;
uniform float gradientWidth;
uniform float gradientYpos;
uniform float softnessTopGradient;
uniform float softnessBottomGradient;
uniform float gradientInfluence;

// Shadow
uniform vec3 shadowColor;
uniform float shadowOpacity;
uniform vec2 shadowOffsetPixels;
uniform float shadowBlurPixels;
uniform float behaviorMix;
uniform float ratioSize;

// Halo
uniform float haloForce;
uniform vec3 u_haloColor;
uniform float reveal;

// Dot matrix
uniform float dmVisibility;
uniform float dmDotSize;
uniform float dmGridSpacing;
uniform float dmWaveAffect;
uniform float dmWaveFreq;
uniform float dmWaveSpeed;
uniform float dmDispForce;
uniform vec3 dmDotColor;
uniform float dmDotColorMode;
uniform float dmBlendAddDot;
uniform float dmInsideVis;
uniform float dmOutsideVis;
uniform float dmParticleFalloff;

// Safe zone
uniform float u_safeZoneAlpha;
uniform float u_safeZoneWidth;
uniform float u_safeZoneHeight;
uniform vec3 u_safeZoneColor;

// Cloud refraction
uniform float cloudSpeed;
uniform float bgFactor;
uniform vec3 refDarkBlue;
uniform vec3 refMidBlue;
uniform vec3 refLightBlue;

const mat3 rgb2lms = mat3(
    0.4122214708, 0.2119034982, 0.0883024619,
    0.5363325363, 0.6806995451, 0.2817188376,
    0.0514459929, 0.1073969566, 0.6299787005
);

const mat3 lms2lab = mat3(
    0.2104542553, 1.9779984951, 0.0259040371,
    0.7936177850, -2.4285922050, 0.7827717662,
    -0.0040720468, 0.4505937099, -0.8086757660
);

const mat3 lab2lms = mat3(
    1.0, 1.0, 1.0,
    0.3963377774, -0.1055613458, -0.0894841775,
    0.2158037573, -0.0638541728, -1.2914855480
);

const mat3 lms2rgb = mat3(
    4.0767416621, -1.2684380046, -0.0041960863,
    -3.3077115913, 2.6097574011, -0.7034186147,
    0.2309699292, -0.3413193965, 1.7076147010
);

float sdCapsule(vec2 p, float width, float height, float radius) {
    vec2 halfDims = vec2(width * 0.5, height * 0.5);
    float roundness = clamp(radius, 0.0, 1.0);
    float r = roundness * min(halfDims.x, halfDims.y);
    vec2 q = abs(p) - halfDims + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float getLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289v3(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m4 = m2 * m2;
    vec4 pdotx = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));

    return 105.0 * dot(m4, pdotx);
}

float getNoise(float posX, float posY, float ttt, float disp, vec2 dir) {
    float ss = (cos(posX * 20.0 * dir.x + posY * dir.y * 20.0 + ttt * 5.0) + 1.0) * 0.5;
    return ss + disp;
}

float getLocalNoise(float posX, float posY, float ttt, float disp, float affect, vec2 dir) {
    float nn = getNoise(posX, posY, ttt, disp, dir);
    return mix(1.0, nn, affect);
}

float getStaticNNN(float posX, float posY, float ttt, float disp, float affect, float mixStaticNoise, vec2 dir) {
    float nn = mix(1.0, max(0.0, (cos(posX * 20.0 + 9.5) + 1.0) * 0.5), affect);
    float nn2 = getLocalNoise(posX, posY, ttt, disp, affect, dir);
    return mix(nn2, nn, mixStaticNoise);
}

float hash(float n) { return fract(sin(n) * 43758.5453123); }

float noise1D(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u) - 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(gray), color, saturation);
}

vec3 rgb2oklab(vec3 c) {
    c = pow(c, vec3(2.2));
    float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;
    float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;
    float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;
    l = pow(l, 1.0/3.0); m = pow(m, 1.0/3.0); s = pow(s, 1.0/3.0);
    return vec3(
        0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
        1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
        0.0259040371*l + 0.7827717662*m - 0.8086757660*s
    );
}

vec3 oklab2rgb(vec3 c) {
    float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
    float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
    float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
    l = l*l*l; m = m*m*m; s = s*s*s;
    vec3 rgb = vec3(
        4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
       -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
       -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    );
    return pow(max(rgb, 0.0), vec3(1.0/2.2));
}

vec3 linearToOklab(vec3 c) {
    vec3 lms = pow(max(rgb2lms * c, 0.0), vec3(1.0/3.0));
    return lms2lab * lms;
}

vec3 oklabToLinear(vec3 c) {
    vec3 lms = lab2lms * c;
    lms = lms * lms * lms;
    return lms2rgb * lms;
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec4 lchToOklab(vec4 lch) {
    return vec4(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z), lch.a);
}

vec4 mixLch(vec4 lab0, vec4 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0.rgb);
    vec3 lch1 = oklabToLch(lab1.rgb);
    lch0.z = mix(lch0.z, lch1.z, step(lch0.y, 0.05));
    lch1.z = mix(lch1.z, lch0.z, step(lch1.y, 0.05));
    float dh = mod(lch1.z - lch0.z + 3.14159265, 6.28318530) - 3.14159265;
    vec4 v0 = vec4(lch0.xy, lch0.z, lab0.a);
    vec4 v1 = vec4(lch1.xy, lch0.z + dh, lab1.a);
    return lchToOklab(mix(v0, v1, t));
}

vec4 toLinear(vec4 c) {
    return vec4(pow(clamp(c.rgb, 0.0, 1.0), vec3(2.2)), c.a);
}

vec4 toSrgb(vec4 c) {
    return vec4(pow(clamp(c.rgb, 0.0, 1.0), vec3(0.4545)), c.a);
}

vec3 gamut(vec3 srcColor) {
    if (all(greaterThanEqual(srcColor, vec3(0.0))) && all(lessThanEqual(srcColor, vec3(1.0)))) {
        return srcColor;
    }
    vec3 perceptualColor = linearToOklab(max(srcColor, 0.0));
    float perceivedLightness = clamp(perceptualColor.x, 0.0, 1.0);
    float saturationScale = length(perceptualColor.yz);
    float maxAllowedChroma = 1.6 * perceivedLightness * (1.0 - perceivedLightness);
    float kneeThreshold = maxAllowedChroma * 0.7;
    if (saturationScale > kneeThreshold) {
        float chromaMargin = maxAllowedChroma * 0.3;
        float tanhArg = (saturationScale - kneeThreshold) / (chromaMargin + 0.00001);
        float tanhVal = (exp(2.0*tanhArg) - 1.0) / (exp(2.0*tanhArg) + 1.0);
        saturationScale = kneeThreshold + chromaMargin * tanhVal;
        perceptualColor.yz *= (saturationScale / max(0.00001, length(perceptualColor.yz)));
    }
    return clamp(oklabToLinear(vec3(perceivedLightness, perceptualColor.yz)), 0.0, 1.0);
}

vec4 getColor(int idx) {
    if (idx == 0) return vec4(gradientFirst, gradientFirstAlpha);
    if (idx == 1) return vec4(gradientSecond, gradientSecondAlpha);
    if (idx == 2) return vec4(gradientThird, gradientThirdAlpha);
    return vec4(gradientFourth, gradientFourthAlpha);
}

vec4 paletteN(float t) {
    float scaledT = t * 3.0;
    int idx = int(clamp(floor(scaledT), 0.0, 2.0));
    float localT = clamp(scaledT - float(idx), 0.0, 1.0);
    localT = smoothstep(0.0, 1.0, localT);
    vec4 dColor = toLinear(getColor(idx));
    vec4 dColor1 = toLinear(getColor(idx + 1));
    vec3 lab0 = linearToOklab(dColor.rgb);
    vec3 lab1 = linearToOklab(dColor1.rgb);
    vec4 blended = mixLch(vec4(lab0, dColor.a), vec4(lab1, dColor1.a), localT);
    return toSrgb(vec4(oklabToLinear(blended.rgb), mix(dColor.a, dColor1.a, localT)));
}

float tanhApprox(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
}

float fallOff(float dist, float softness) {
    float edge = dist / max(softness, 0.001);
    edge = clamp(edge, -1.0, 1.0);
    float maxT = tanhApprox(falloffPower);
    return 0.5 * (1.0 - tanhApprox(edge * falloffPower) / max(maxT, 0.001));
}

float circularDist(float a, float b) {
    float d = abs(a - b);
    return min(d, 5.0 - d);
}

vec4 getColorGradient(vec2 vPos) {
    float cra = colorRotationAngle;
    float cosR = cos(cra);
    float sinR = sin(cra);
    vec2 rotPos = vec2(vPos.x * cosR - vPos.y * sinR, vPos.x * sinR + vPos.y * cosR);
    float t = fract(rotPos.x * colorGradientWidth);
    float colorIndex = t * 5.0;
    float blendW = max(colorwheelBlend * 2.0, 0.001);
    
    vec4 rawA = vec4(
        circularDist(colorIndex, 0.0),
        circularDist(colorIndex, 1.0),
        circularDist(colorIndex, 2.0),
        circularDist(colorIndex, 3.0)
    );
    vec4 weightsA = vec4(1.0) - clamp(rawA / blendW, 0.0, 1.0);
    
    vec2 rawB = vec2(
        circularDist(colorIndex, 4.0),
        circularDist(colorIndex, 5.0)
    );
    vec2 weightsB = vec2(1.0) - clamp(rawB / blendW, 0.0, 1.0);
    
    weightsA = smoothstep(vec4(0.0), vec4(1.0), weightsA);
    weightsB = smoothstep(vec2(0.0), vec2(1.0), weightsB);
    
    float totalWeight = dot(weightsA, vec4(1.0)) + dot(weightsB, vec2(1.0));
    float invTotal = 1.0 / max(totalWeight, 0.0001);
    weightsA *= invTotal;
    weightsB *= invTotal;
    
    vec3 blendedLab = rgb2oklab(colorwheel0) * weightsA.x +
                      rgb2oklab(colorwheel1) * weightsA.y +
                      rgb2oklab(colorwheel2) * weightsA.z +
                      rgb2oklab(colorwheel3) * weightsA.w +
                      rgb2oklab(colorwheel4) * weightsB.x +
                      rgb2oklab(colorwheel5) * weightsB.y;
    
    vec3 finalColor = oklab2rgb(blendedLab);
    return vec4(adjustSaturation(finalColor, colorwheelSaturation), 1.0);
}

float getDotMatrix(vec2 uv, float t) {
    float gridX = 4.0 / max(dmGridSpacing, 0.01);
    float gridY = 6.0 / max(dmGridSpacing, 0.01);
    vec2 grid = vec2(gridX, gridY);
    
    float angle = 0.7854;
    float cosA = cos(angle);
    float sinA = sin(angle);
    vec2 rotUv = mat2(cosA, sinA, -sinA, cosA) * uv;
    
    vec2 cellId = floor(rotUv * grid);
    vec2 cellUv = fract(rotUv * grid) - 0.5;
    
    float randomVal = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
    float randomSize = 0.6 + randomVal * 0.8;
    
    float swimX = sin(t * 0.8 + cellId.x * 0.3 + cellId.y * 0.7) * dmDispForce;
    float swimY = cos(t * 0.6 + cellId.y * 0.5 + cellId.x * 0.4) * dmDispForce;
    cellUv += vec2(swimX, swimY);
    
    float dist = length(cellUv);
    float dotRadius = dmDotSize * randomSize * 2.3;
    float dot_ = 1.0 - smoothstep(dotRadius * 0.5, dotRadius * 0.5 + 0.1, dist);
    
    float wave = sin(cellId.x * dmWaveFreq + cellId.y * dmWaveFreq * 0.7 + t * dmWaveSpeed) * 0.5 + 0.5;
    float visibility = smoothstep(0.2, 0.6, 0.5 + wave * dmWaveAffect * 0.5 - randomVal * 0.3);
    
    return dot_ * visibility * dmVisibility;
}

void main() {
    vec4 fragColor = vec4(0.0);
    
    vec2 capsulePos = vPosition;
    capsulePos.y -= uOffsetY - 60.0 / displayHeight;
    
    float actualSDF = sdCapsule(capsulePos, uWidth, uHeight, uRadius);
    
    vec2 eps = vec2(0.002, 0.0);
    vec2 grad2D = vec2(
        sdCapsule(capsulePos + eps.xy, uWidth, uHeight, uRadius) - sdCapsule(capsulePos - eps.xy, uWidth, uHeight, uRadius),
        sdCapsule(capsulePos + eps.yx, uWidth, uHeight, uRadius) - sdCapsule(capsulePos - eps.yx, uWidth, uHeight, uRadius)
    );
    float gradLen = length(grad2D);
    vec2 normalAxis2D = gradLen > 0.0001 ? grad2D / gradLen : vec2(0.0);
    
    float maxBevelDepth = uHeight * 0.5;
    float bevelThickness = mix(0.018, maxBevelDepth, uRadius);
    float edgeDistance = max(0.0, -actualSDF);
    float depthFactor = clamp(edgeDistance / bevelThickness, 0.0, 1.0);
    float x_rel = 1.0 - pow(depthFactor, mix(2.0, 1.0, uRadius));
    float z = sqrt(max(0.0, 1.0 - x_rel * x_rel));
    vec3 baseNormal3D = vec3(normalAxis2D * x_rel, z);
    
    float pixelDither = (fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
    float baseNoise = getStaticNNN(vPosition.x, vPosition.y, -softTimer, 0.1, softnessAffect, useStaticNoise, noiseDirection) + pixelDither * 10.0;
    
    float nA = noise1D(vPosition.x + vPosition.y + timer) + 0.5;
    float softnessTopVal = max(0.01, uSoftnessTop * nA);
    float softnessBottomVal = max(0.01, uSoftnessBottom + 0.01);
    
    float mask = 0.0;
    float verticalFactor = 0.0;
    
    float softnessTopN = softnessTopVal * baseNoise;
    float softnessBottomN = softnessBottomVal;
    
    float dist = sdCapsule(capsulePos, uWidth, uHeight, uRadius);
    float radius = uHeight * 0.5;
    float halfWidth = uWidth * 0.5;
    vec3 noisePos = vec3(vPosition * uNoiseScale, timer * 0.6);
    float combinedNoise = snoise(noisePos);
    
    float leftSide = smoothstep(0.0, -0.1, capsulePos.x + halfWidth);
    float rightSide = smoothstep(0.0, -0.1, -capsulePos.x + halfWidth);
    float topSide = smoothstep(-radius, -radius + 0.1, capsulePos.y);
    float bottomSide = smoothstep(-radius, -radius + 0.1, -capsulePos.y);
    float bleedMask = max(max(leftSide, rightSide), topSide) * (1.0 - bottomSide);
    float noisyDist = dist + combinedNoise * uNoiseStrength * bleedMask;
    
    float maxInternalDepth = min(uWidth, uHeight) * 0.5;
    float centerToEdge = 1.0 - (abs(min(dist, 0.0)) / max(maxInternalDepth, 0.001));
    float trueDistance = clamp(centerToEdge, 0.0, 1.0);
    
    float gradHDelta = max(0.0, gradientHeight - 45.0) * 0.008;
    float expandedRadius = radius + gradHDelta;
    verticalFactor = smoothstep(-expandedRadius, expandedRadius, capsulePos.y);
    float dynamicSoftness = mix(softnessBottomN, softnessTopN, verticalFactor);
    mask = fallOff(noisyDist, dynamicSoftness);
    
    float insideBlob = step(actualSDF, 0.0);
    float minFill = clamp(gradHDelta * 1.5, 0.0, 0.7);
    mask = max(mask, minFill * insideBlob);
    
    float envT = clamp((capsulePos.y / max(expandedRadius * 2.0, 0.001) + 0.5), 0.0, 1.0);
    vec4 envColor = paletteN(envT);
    float envLum = dot(envColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float minLum = 0.25;
    if (envLum < minLum) {
        envColor.rgb += (minLum - envLum) * vec3(1.0);
    }
    
    vec3 rimNormal = mix(baseNormal3D, baseNormal3D, u_rimNormalMix);
    float fresnelIntensity = pow(1.0 - dot(rimNormal, vec3(0.0, 0.0, 1.0)), 2.5) * u_fresnelIntensity;
    
    float rotAngle = bumpTimer;
    float cosR = cos(rotAngle);
    float sinR = sin(rotAngle);
    vec2 rotatedRimNormal = vec2(
        rimNormal.x * cosR - rimNormal.y * sinR,
        rimNormal.x * sinR + rimNormal.y * cosR
    );
    float highlightMix = (rotatedRimNormal.x + rotatedRimNormal.y) * 0.5 + 0.5;
    vec3 finalRimColor = mix(envColor.rgb, u_colorTopRight, highlightMix * 0.5);
    
    vec4 finalBaseColor = mix(envColor, vec4(finalRimColor, 1.0), fresnelIntensity * mask);
    fragColor = vec4(finalBaseColor.rgb, clamp(trueOpacity + bgFactor, 0.0, 1.0) * mask);
    
    if (gradientInfluence > 0.001) {
        vec4 resolvedGradient = getColorGradient(vPosition.xy);
        resolvedGradient.rgb = mix(mix(vec3(1.4), resolvedGradient.rgb, 0.3), resolvedGradient.rgb, verticalFactor);
        
        vec3 originalRgb = fragColor.rgb;
        fragColor.rgb = mix(
            fragColor.rgb + resolvedGradient.rgb * resolvedGradient.a,
            mix(fragColor.rgb, resolvedGradient.rgb, resolvedGradient.a),
            gradientComposite
        );
        fragColor.rgb = mix(originalRgb, fragColor.rgb, gradientInfluence * mask);
    }
    
    float dots = getDotMatrix(vPosition, softTimer);
    
    if (dmInsideVis > 0.001 && dots > 0.001) {
        vec3 dotCol = mix(fragColor.rgb, dmDotColor, dmDotColorMode);
        float dotMask = dots * mask;
        vec3 addBlend = fragColor.rgb + dotCol * dotMask;
        vec3 colorBlend = mix(fragColor.rgb, dmDotColor * 2.0, dotMask);
        fragColor.rgb = mix(fragColor.rgb, mix(addBlend, colorBlend, dmBlendAddDot), dmInsideVis);
    }
    
    if (dmOutsideVis > 0.001 && dots > 0.001) {
        float distToPill = max(0.0, actualSDF);
        float fadeEnd = uHeight * max(0.0001, dmParticleFalloff);
        float particleFade = 1.0 - smoothstep(0.0, fadeEnd, distToPill);
        float outsideMask = dots * (1.0 - mask) * particleFade;
        fragColor.rgb += dmDotColor * outsideMask * dmOutsideVis;
        fragColor.a = max(fragColor.a, outsideMask * dmOutsideVis);
    }
    
    if (u_safeZoneAlpha > 0.001) {
        float safeW = uWidth * u_safeZoneWidth;
        float safeH = uHeight * u_safeZoneHeight;
        float safeSDF = sdCapsule(capsulePos, safeW, safeH, uRadius);
        float safeFade = 1.0 - smoothstep(0.0, 0.05, safeSDF);
        float safePillAlpha = safeFade * mask * u_safeZoneAlpha;
        fragColor.rgb = mix(fragColor.rgb, u_safeZoneColor, safePillAlpha);
        fragColor.a = max(fragColor.a, safePillAlpha);
    }
    
    fragColor.rgb = adjustSaturation(fragColor.rgb, finalSaturation);
    
    if (shadowOpacity > 0.001) {
        float normShadowBlur = shadowBlurPixels / max(displayWidth, 1.0) * 2.0;
        vec2 normShadowOffset = shadowOffsetPixels / max(displayWidth, 1.0) * 2.0;
        vec2 shadowPos = capsulePos - normShadowOffset;
        float shadowSDF = sdCapsule(shadowPos, uWidth * ratioSize, uHeight * ratioSize, uRadius);
        float shadowAlpha = (1.0 - smoothstep(0.0, normShadowBlur, shadowSDF)) * shadowOpacity;
        
        float combinedA = fragColor.a + shadowAlpha * (1.0 - fragColor.a);
        
        vec3 c1 = fragColor.rgb * fragColor.a + shadowColor * shadowAlpha * (1.0 - fragColor.a);
        vec3 rgb1 = combinedA > 0.0 ? c1 / combinedA : vec3(0.0);
        
        vec3 c2 = fragColor.rgb + shadowColor * shadowAlpha * (1.0 - fragColor.a);
        vec3 rgb2 = combinedA > 0.0 ? c2 / combinedA : vec3(0.0);
        
        fragColor.rgb = mix(rgb1, rgb2, behaviorMix);
        fragColor.a = combinedA;
    }
    
    if (haloForce > 0.001 && reveal > 0.01) {
        float beamY = mix(-1.5, 1.5, mix(0.35, 0.6, reveal));
        float sweepWave = sin(vPosition.x * 8.0 + reveal * 4.0) * 0.08;
        float sweepLine = beamY - vPosition.y + sweepWave;
        float revealMask = smoothstep(-0.25, 0.05, sweepLine);
        float beamThickness = 0.55;
        float sharpness = 1.0 / (beamThickness + 0.001);
        float beamHalo = exp(-abs(sweepLine) * 8.0 * sharpness);
        
        fragColor.a *= reveal > 0.99 ? 1.0 : revealMask;
        fragColor.rgb += u_haloColor * beamHalo * fragColor.a * haloForce * sin(3.1416 * reveal);
    }
    
    fragColor.rgb *= fragColor.a;
    gl_FragColor = fragColor;
}`,n=`
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 vUv;
varying vec2 vPosition;

// Grid
uniform float nmShape;
uniform float nmCountX;
uniform float nmCountY;
uniform float nmSpaceX;
uniform float nmSpaceY;
uniform float nmSize;
uniform float nmRot;
uniform float nmDensity;
uniform float nmOpacity;
uniform vec3  nmColor;

// Mesh Noise
uniform float mnScale;
uniform float mnSpeed;
uniform float mnDirX;
uniform float mnDirY;
uniform float mnDisp;
uniform float mnNoiseRot;

// Scale Noise
uniform float snScale;
uniform float snSpeed;
uniform float snAmount;
uniform float snNoiseRot;
uniform float snRotSpeed;

// Ocean Waves
uniform float wScale;
uniform float wVel;
uniform float wSize;
uniform float wTurb;
uniform float wDirX;
uniform float wDirY;
uniform float wDirRot;
uniform float wDisp;

// Gravitational Distortion
uniform float gdOpacity;
uniform float gdScale;
uniform float gdAmt;
uniform float gdNScale;
uniform float gdNSpeed;
uniform float gdIor;
uniform float gdFalloff;
uniform float gdSwirl;
uniform float gdSwirlLfo;
uniform float gdRefract;
uniform float gdInvert;
uniform float gdRgb;

// Noise Overlay
uniform float noiseInt;
uniform float noiseScale;
uniform float noiseSpeed;
uniform float noiseGlow;
uniform vec3  noiseColor;

// Orb Colors
uniform vec3 colorBottom;
uniform vec3 colorMid;
uniform vec3 colorTop;
uniform vec3 colorGlow;

// Glow
uniform float glowIntensity;
uniform float pulseSpeed;
uniform float pulseAmt;
uniform float scaleAmt;
uniform float scaleSpeed;

// Energy Ring
uniform float ringOpacity;
uniform float ringScale;
uniform float ringThick;
uniform float ringBlur;
uniform float ringGlow;
uniform float ringGlowR;
uniform float ringOffY;
uniform vec3  ringColorTop;
uniform float ringTopAlpha;
uniform vec3  ringColorBot;
uniform float ringBotAlpha;

float hash2D(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash3D(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash2D(i);
    float b = hash2D(i + vec2(1.0, 0.0));
    float c = hash2D(i + vec2(0.0, 1.0));
    float d = hash2D(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash3D(i);
    float n100 = hash3D(i + vec3(1,0,0));
    float n010 = hash3D(i + vec3(0,1,0));
    float n110 = hash3D(i + vec3(1,1,0));
    float n001 = hash3D(i + vec3(0,0,1));
    float n101 = hash3D(i + vec3(1,0,1));
    float n011 = hash3D(i + vec3(0,1,1));
    float n111 = hash3D(i + vec3(1,1,1));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * valueNoise(p);
        p *= 2.0; a *= 0.5;
    }
    return v;
}
float fbm3(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * valueNoise3D(p);
        p *= 2.0; a *= 0.5;
    }
    return v;
}
mat2 rot2D(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = u_time;
    vec2 nrm = uv * 0.5 + 0.5;

    vec2 gdUV = uv;

    // ── Mesh Noise ──
    float meshT = t * mnSpeed;
    mat2 mnRotMat = rot2D(mnNoiseRot * 3.14159 / 180.0);
    vec2 noiseCoord = mnRotMat * (nrm * mnScale) + vec2(meshT * mnDirX, meshT * mnDirY);
    float dispNX = (fbm3(vec3(noiseCoord, meshT * 0.7)) - 0.5) * 2.0;
    float dispNY = (fbm3(vec3(noiseCoord + vec2(73.7, 91.1), meshT * 0.7)) - 0.5) * 2.0;
    vec2 meshDisp = vec2(dispNX, dispNY) * mnDisp * 0.01;

    // ── Ocean Wave ──
    float waveT = t * wVel;
    float wdAngle = wDirRot > 0.0 ? t * wDirRot * 6.28318 : 0.0;
    mat2 wdRotMat = rot2D(wdAngle);
    vec2 waveDir = normalize(wdRotMat * vec2(wDirX, wDirY));
    vec2 waveCross = vec2(-waveDir.y, waveDir.x);

    float wavePhase = dot(nrm, waveDir) * wSize + waveT * 4.0;
    float waveVal = sin(wavePhase);
    float crossPhase = dot(nrm, waveCross) * wSize * 1.3 + waveT * 3.0;
    float crossWave = sin(crossPhase) * 0.4;
    float turb = wTurb > 0.0 ? (valueNoise3D(vec3(nrm * wSize * 0.7, waveT * 2.0)) - 0.5) * 2.0 * wTurb : 0.0;
    float totalWave = (waveVal + crossWave + turb) * wScale * 0.008 * wDisp;
    vec2 waveOffset = totalWave * (waveCross * 0.6 + waveDir * 0.4);

    vec2 displacedUV = gdUV + meshDisp + waveOffset;

    // ── Scale Noise ──
    float scaleT = t * snSpeed;
    float snRotAngle = (snNoiseRot + snRotSpeed * t * 60.0) * 3.14159 / 180.0;
    mat2 snRotMat = rot2D(snRotAngle);
    vec2 snCoord = snRotMat * (nrm * snScale) + vec2(scaleT * 0.5, scaleT * 0.3);
    float scaleN = (valueNoise3D(vec3(snCoord, scaleT)) + 1.0) * 0.5;
    float particleScale = 1.0 - snAmount + snAmount * scaleN;

    // ── Shape Mask ──
    vec2 rectSize = vec2(0.55, 0.55 * 0.75);
    float cornerR = 0.04;
    vec2 dS = abs(uv) - rectSize + cornerR;
    float dist = length(max(dS, 0.0)) - cornerR + min(max(dS.x, dS.y), 0.0);
    float orbMask = smoothstep(0.05, -0.08, dist);
    float softGlow = exp(-max(dist, 0.0) * max(dist, 0.0) * 80.0);
    float outerGlow = exp(-max(dist, 0.0) * max(dist, 0.0) * 15.0);

    float breathe = sin(t * scaleSpeed * 6.28318) * 0.5 + 0.5;
    float glowPulse = glowIntensity * (1.0 - pulseAmt + pulseAmt * breathe);

    // ── Diamond Grid ──
    float gridAngle = nmRot * 3.14159 / 180.0;
    mat2 gridRot = rot2D(gridAngle);
    float gridFreq = nmCountX * nmDensity / nmSpaceX;
    vec2 gridUV = gridRot * displacedUV * gridFreq;
    vec2 cellPos = fract(gridUV) - 0.5;

    float gridVal;
    if (nmShape < 0.5) {
        float t2 = nmShape * 2.0;
        float sq = 1.0 - max(abs(cellPos.x), abs(cellPos.y)) * 2.0;
        float circ = 1.0 - length(cellPos) * 2.0;
        float shape = mix(sq, circ, t2);
        float sizeT = nmSize * 0.05 * particleScale;
        gridVal = smoothstep(0.0, sizeT, shape);
    } else {
        float t2 = (nmShape - 0.5) * 2.0;
        float outerR = 1.0;
        float innerR = 1.0 - t2 * 0.65;
        float cellAngle = atan(cellPos.y, cellPos.x);
        float starR = mix(outerR, innerR, abs(sin(cellAngle * 2.0)));
        float starDist = length(cellPos) / (starR * 0.5);
        float shape = 1.0 - starDist;
        float sizeT = nmSize * 0.05 * particleScale;
        gridVal = smoothstep(0.0, sizeT, shape);
    }

    float depthShade = 0.5 + 0.5 * (fbm3(vec3(nrm * mnScale, meshT * 0.7)) + 1.0) * 0.25;

    vec2 gridUV2 = gridRot * displacedUV * (gridFreq * 0.5);
    vec2 cellPos2 = fract(gridUV2) - 0.5;
    float circ2 = 1.0 - length(cellPos2) * 2.0;
    float sizeT2 = nmSize * 0.06 * particleScale;
    float grid2 = smoothstep(0.0, sizeT2, circ2) * 0.35 + 0.65;
    gridVal *= grid2 * depthShade;

    // ── Noise Overlay ──
    float noiseVal = 0.0;
    if (noiseInt > 0.0) {
        float nt = t * noiseSpeed;
        noiseVal = fbm3(vec3(uv * noiseScale * 3.0, nt));
        noiseVal = noiseVal * noiseVal * noiseInt * 0.15;
    }

    // ── Color Compositing ──
    vec3 colOffset = vec3(0.0, 0.33, 0.67) * 6.28;
    float colorT = t * 0.3;
    vec3 iridescent = 0.5 + 0.5 * cos(colorT + (displacedUV.xyx + waveOffset.xyx * 2.0) * 3.0 + colOffset);

    float yGrad = uv.y * 0.5 + 0.5;
    vec3 orbGrad = mix(colorBottom, colorTop, yGrad);
    orbGrad = mix(orbGrad, colorMid, smoothstep(0.3, 0.7, yGrad) * 0.5);

    vec3 particleColor = mix(nmColor, iridescent, 0.35);

    // ── Energy Wave ──
    vec3 ringContrib = vec3(0.0);
    float ringAlpha = 0.0;
    if (ringOpacity > 0.0) {
        float rectH = 0.55 * 0.75;
        float rectW = 0.55;
        float waveSpeed = 0.4;
        float waveCycle = fract(t * waveSpeed);
        float baseY = mix(-rectH, rectH, waveCycle);

        float maxArc = 0.25;
        float arcAmount = maxArc * (1.0 - waveCycle);
        float normalizedX = uv.x / rectW;
        float arcOffset = arcAmount * normalizedX * normalizedX;
        float waveY = baseY - arcOffset;

        float bandDist = abs(uv.y - waveY);
        float bandThick = ringThick * 0.002;
        float bandBlur = ringBlur * 0.015;
        float bandMask = smoothstep(bandBlur + bandThick, bandThick * 0.3, bandDist);

        float bandGlow = exp(-bandDist * bandDist * 60.0 / max(ringGlowR * 0.1, 0.1)) * ringGlow * 0.08;
        bandMask = max(bandMask, bandGlow);

        bandMask *= orbMask;

        float sweepFade = smoothstep(-rectH, -rectH + 0.1, uv.y) * smoothstep(rectH, rectH - 0.1, uv.y);
        bandMask *= sweepFade;

        float leadingEdge = exp(-bandDist * bandDist * 200.0) * 0.5;
        bandMask += leadingEdge * orbMask * sweepFade;

        float vGrad = smoothstep(-0.2, 0.2, uv.y);
        vec3 ringCol = mix(
            ringColorBot * ringBotAlpha,
            ringColorTop * ringTopAlpha + colorGlow * 0.5,
            vGrad
        );

        ringContrib = ringCol * bandMask * ringOpacity;
        ringAlpha = bandMask * ringOpacity * 0.6;
    }

    vec3 finalColor = vec3(0.0);
    finalColor += orbGrad * softGlow * 0.8 * glowPulse;
    finalColor += colorGlow * outerGlow * 0.15 * glowPulse;
    finalColor += particleColor * gridVal * orbMask * 0.6;
    
    vec3 noiseContrib = noiseColor * noiseVal * noiseGlow;
    finalColor += noiseContrib * orbMask * 0.15;
    finalColor += ringContrib;

    float centerDist = max(-dist, 0.0);
    finalColor += particleColor * exp(-centerDist * 0.5) * orbMask * 0.1;

    float alpha = max(max(outerGlow * 0.5, orbMask * max(gridVal * 0.6, 0.05)) * nmOpacity, ringAlpha);
    gl_FragColor = vec4(finalColor, alpha);
}`,c=[{c:"#3C90FF",p:14.76},{c:"#AD72FF",p:21.64},{c:"#F96BD6",p:27.09},{c:"#FF5A59",p:30.26},{c:"#FF5A59",p:36.84},{c:"#FF9238",p:42.9},{c:"#FFCF03",p:48.44},{c:"#FFE921",p:57.69},{c:"#88DE42",p:63.44},{c:"#60D673",p:68.75},{c:"#60D673",p:77.34},{c:"#00BDD2",p:82.11},{c:"#4FA0FF",p:87.13},{c:"#3C90FF",p:96}],f=[{c:"#336EF3",p:14.76},{c:"#9254EA",p:21.64},{c:"#F63BB3",p:27.09},{c:"#ED3733",p:30.26},{c:"#ED3733",p:36.84},{c:"#FF6B2B",p:42.9},{c:"#FEC700",p:48.44},{c:"#FFDB0F",p:57.69},{c:"#57C200",p:63.44},{c:"#00AF57",p:68.75},{c:"#00AF57",p:77.34},{c:"#009AAA",p:82.11},{c:"#3279F9",p:87.13},{c:"#336EF3",p:96}],d=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;        // Mouse coordinates in pixels
uniform float u_rippleTime;  // Elapsed time since the last click/tap
uniform float u_aspectRatio;

// Ripple Shader Parameters
const float amplitude = 0.045; 
const float frequency = 26.0;
const float decay = 5.0;
const float speed = 1.6;

void main() {
    // Normalise texture coordinates
    vec2 uv = v_uv;
    
    // Correct coordinates for aspect ratio to keep ripples circular
    vec2 st = uv;
    st.x *= u_aspectRatio;
    
    vec2 origin = u_mouse / u_resolution;
    origin.x *= u_aspectRatio;
    
    // Distance from the origin of click
    float dist = length(st - origin);
    
    // Physical arrival delay calculation
    float delay = dist / speed;
    float time = u_rippleTime - delay;
    time = max(0.0, time);
    
    // Ripple displacement math (sin wave with exponential decay)
    float rippleAmount = amplitude * sin(frequency * time) * exp(-decay * time);
    
    // Offset direction away from origin
    vec2 n = vec2(0.0);
    if (dist > 0.0) {
        n = normalize(st - origin);
    }
    
    // Apply displacement to uv coordinates
    vec2 displacedUV = uv + rippleAmount * n;
    
    // Procedural grid background texture (so the displacement is clearly visible!)
    vec3 color = vec3(0.08, 0.09, 0.12); // Dark slate bg
    
    // Beautiful grid line pattern
    vec2 grid = abs(fract(displacedUV * 16.0 - 0.5) - 0.5) / fwidth(displacedUV * 16.0);
    float line = 1.0 - min(grid.x, grid.y);
    color = mix(color, vec3(0.38, 0.68, 0.95), clamp(line, 0.0, 1.0)); // Neon cyan grid lines
    
    // Add specular highlights based on ripple gradient slope
    float lighting = rippleAmount / amplitude;
    color.rgb += 0.25 * lighting * vec3(0.6, 0.85, 1.0);
    
    // Draw a subtle soft blue dot at the source origin click coordinate
    float dotGlow = exp(-dist * 15.0);
    color = mix(color, vec3(0.9, 0.95, 1.0), dotGlow);
    
    fragColor = vec4(color, 1.0);
}`;e.s(["default",0,function(){let e,u,m,[p,g]=(0,a.useState)("northern-lights"),[v,h]=(0,a.useState)(!0),[x,_]=(0,a.useState)(0),[b,S]=(0,a.useState)(0),[w,y]=(0,a.useState)(1),C=(0,a.useRef)(null),T=(0,a.useRef)(null),R=(0,a.useRef)(null),D=(0,a.useRef)(0),N=(0,a.useRef)(0),A=(0,a.useRef)(0),k=(0,a.useRef)(0),M=(0,a.useRef)(null),F=(0,a.useRef)({x:0,y:0}),P=(0,a.useRef)(0),[I,j]=(0,a.useState)({u_scrollSpeed:.2,u_gradientZoom:6.6,u_uvRotation:-45,u_darkMode:1,u_shapeCenterX:.5,u_shapeCenterY:.5,u_shapeRadiusX:.8,u_shapeRadiusY:.8,u_shapeSoftness:.45,u_shapeOpacity:1,u_enableNoiseMask:1,u_noiseMaskScale:.66,u_noiseMaskSpeed:.21,u_noiseMaskDetail:3,u_noiseMaskStrength:.9,u_noiseMaskAngle:117.2,u_brightness:0,u_contrast:1}),[z,B]=(0,a.useState)({uWidth:.65,uHeight:.23,uOffsetY:0,uRadius:1,uSoftnessTop:.05,uSoftnessBottom:0,softnessAffect:.15,uNoiseStrength:0,uNoiseScale:10,falloffPower:5,useStaticNoise:.36,noiseSpeed:.52,color1:[.08,.21,.8],color2:[.2,.4,1],mainColorForce0:1.2,mainColorForce1:1,colorModeRadial:1,trueOpacity:1,finalSaturation:1.3,gradientInfluence:0,colorwheelSaturation:1,dmVisibility:.77,dmDotSize:.15,dmGridSpacing:.3,dmWaveAffect:1,dmWaveFreq:.417,dmWaveSpeed:1.24,dmDispForce:0,dmDotColor:[.4,.6,1],dmInsideVis:.5,dmOutsideVis:.2,u_angle:0,u_scale:1,u_bend:.05,u_contour:.1,u_rimNormalMix:.5,u_fresnelIntensity:1,u_colorTopRight:[1,.8,.9]}),[O,L]=(0,a.useState)({nmShape:.75,nmCountX:50,nmCountY:50,nmSpaceX:1.5,nmSpaceY:1.5,nmSize:6,nmRot:45,nmDensity:1.2,nmOpacity:1,nmColor:[.27,.27,.8],mnScale:4,mnSpeed:.5,mnDirX:1,mnDirY:0,mnDisp:10,mnNoiseRot:0,snScale:6.9,snSpeed:1,snAmount:1,snNoiseRot:0,snRotSpeed:0,wScale:10,wVel:.22,wSize:6.3,wTurb:0,wDirX:1,wDirY:.5,wDirRot:0,wDisp:1,gdOpacity:1,gdScale:1.33,gdAmt:19,gdNScale:6.4,gdNSpeed:.88,gdIor:3,gdFalloff:0,gdSwirl:6,gdSwirlLfo:0,gdRefract:373,gdInvert:10,gdRgb:.02,noiseInt:1,noiseScale:1.4,noiseSpeed:.71,noiseGlow:.4,noiseColor:[1,.66,.87],colorBottom:[.2,.43,.95],colorMid:[.12,.23,.6],colorTop:[.51,.53,1],colorGlow:[.36,.36,.99],glowIntensity:1,pulseSpeed:.3,pulseAmt:.93,scaleAmt:.04,scaleSpeed:.3,ringOpacity:.75,ringScale:1,ringThick:40,ringBlur:18,ringGlow:10,ringGlowR:16,ringOffY:-11,ringColorTop:[0,0,0],ringTopAlpha:1,ringColorBot:[.87,.66,.8],ringBotAlpha:1}),W=()=>{let e=C.current,o=T.current;if(!e||!o)return;let a=e.parentElement;if(!a)return;let t=window.devicePixelRatio||1,l=a.offsetWidth*w,i=a.offsetHeight*w;e.width=l*t,e.height=i*t,e.style.width=`${l}px`,e.style.height=`${i}px`,o.viewport(0,0,e.width,e.height)};(0,a.useEffect)(()=>((()=>{let e=C.current;if(!e)return;let o=e.getContext("webgl2",{alpha:!0,premultipliedAlpha:!1});if(!o)return console.error("WebGL2 not supported");T.current=o;let a="",t="";"northern-lights"===p?(a=l,t=i):"blob47"===p?(a=r,t=s):"water-ripple"===p?(a=l,t=d):(a=r,t=n);let u=(e,a)=>{let t=o.createShader(a);return t?(o.shaderSource(t,e),o.compileShader(t),o.getShaderParameter(t,o.COMPILE_STATUS))?t:(console.error("Shader compile error:",o.getShaderInfoLog(t)),o.deleteShader(t),null):null},m=u(a,o.VERTEX_SHADER),g=u(t,o.FRAGMENT_SHADER);if(!m||!g)return;let v=o.createProgram();if(!v)return;if(o.attachShader(v,m),o.attachShader(v,g),o.linkProgram(v),!o.getProgramParameter(v,o.LINK_STATUS))return console.error("Program link error:",o.getProgramInfoLog(v));o.useProgram(v),R.current=v;let h=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),x=o.createBuffer();o.bindBuffer(o.ARRAY_BUFFER,x),o.bufferData(o.ARRAY_BUFFER,h,o.STATIC_DRAW);let _=o.getAttribLocation(v,"northern-lights"===p||"water-ripple"===p?"a_position":"position");if(-1!==_&&(o.enableVertexAttribArray(_),o.vertexAttribPointer(_,2,o.FLOAT,!1,0,0)),"northern-lights"===p){let e=(e=>{let o=document.createElement("canvas");o.width=256,o.height=2;let a=o.getContext("2d");if(!a)return null;let t=a.createLinearGradient(0,.5,256,.5);c.forEach(e=>{t.addColorStop(e.p/100,e.c)}),a.fillStyle=t,a.fillRect(0,0,256,1);let l=a.createLinearGradient(0,1.5,256,1.5);f.forEach(e=>{l.addColorStop(e.p/100,e.c)}),a.fillStyle=l,a.fillRect(0,1,256,1);let i=e.createTexture();return e.bindTexture(e.TEXTURE_2D,i),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i})(o);M.current=e;let a=o.getUniformLocation(v,"u_gradientTex");e&&null!==a&&(o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,e),o.uniform1i(a,0))}o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),W()})(),()=>{D.current&&cancelAnimationFrame(D.current)}),[p,w]),(0,a.useEffect)(()=>(window.addEventListener("resize",W),()=>window.removeEventListener("resize",W)),[w]),(0,a.useEffect)(()=>{N.current=performance.now(),A.current=performance.now();let e=o=>{if(!v){A.current=o,D.current=requestAnimationFrame(e);return}let a=.001*(o-N.current+k.current),t=o-A.current;A.current=o,S(parseFloat(t.toFixed(1))),_(Math.round(1e3/(t||1)));let l=T.current,i=R.current,r=C.current;if(l&&i&&r){if(l.clearColor(0,0,0,0),l.clear(l.COLOR_BUFFER_BIT),"northern-lights"===p){if(l.uniform2f(l.getUniformLocation(i,"u_resolution"),r.width,r.height),l.uniform1f(l.getUniformLocation(i,"u_time"),a),l.uniform1f(l.getUniformLocation(i,"u_scrollTime"),a),l.uniform1f(l.getUniformLocation(i,"u_noiseTime"),.4*a),l.uniform1f(l.getUniformLocation(i,"u_aspectRatio"),r.width/r.height),M.current){l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,M.current);let e=l.getUniformLocation(i,"u_gradientTex");null!==e&&l.uniform1i(e,0)}Object.entries(I).forEach(([e,o])=>{let a=l.getUniformLocation(i,e);null!==a&&("u_enableNoiseMask"===e||"u_noiseMaskDetail"===e?l.uniform1i(a,o):"u_shapeCenterX"===e?l.uniform2f(l.getUniformLocation(i,"u_shapeCenter"),I.u_shapeCenterX,I.u_shapeCenterY):"u_shapeRadiusX"===e?l.uniform2f(l.getUniformLocation(i,"u_shapeRadius"),I.u_shapeRadiusX,I.u_shapeRadiusY):"u_shapeCenterY"!==e&&"u_shapeRadiusY"!==e&&l.uniform1f(a,o))})}else if("blob47"===p)l.uniform1f(l.getUniformLocation(i,"timer"),a),l.uniform1f(l.getUniformLocation(i,"softTimer"),a*z.noiseSpeed),l.uniform1f(l.getUniformLocation(i,"displayWidth"),r.width),l.uniform1f(l.getUniformLocation(i,"displayHeight"),r.height),Object.entries(z).forEach(([e,o])=>{let a=l.getUniformLocation(i,e);null!==a&&(Array.isArray(o)?2===o.length?l.uniform2f(a,o[0],o[1]):3===o.length&&l.uniform3f(a,o[0],o[1],o[2]):l.uniform1f(a,o))});else if("water-ripple"===p){l.uniform2f(l.getUniformLocation(i,"u_resolution"),r.width,r.height),l.uniform1f(l.getUniformLocation(i,"u_time"),a),l.uniform1f(l.getUniformLocation(i,"u_aspectRatio"),r.width/r.height),l.uniform2f(l.getUniformLocation(i,"u_mouse"),F.current.x,F.current.y);let e=performance.now()/1e3-P.current;l.uniform1f(l.getUniformLocation(i,"u_rippleTime"),e)}else l.uniform2f(l.getUniformLocation(i,"u_resolution"),r.width,r.height),l.uniform1f(l.getUniformLocation(i,"u_time"),a),Object.entries(O).forEach(([e,o])=>{let a=l.getUniformLocation(i,e);null!==a&&(Array.isArray(o)?3===o.length&&l.uniform3f(a,o[0],o[1],o[2]):l.uniform1f(a,o))});l.drawArrays(l.TRIANGLE_STRIP,0,6)}D.current=requestAnimationFrame(e)};return D.current=requestAnimationFrame(e),()=>cancelAnimationFrame(D.current)},[p,v,I,z,O]);let E=(e,a,l,i,r,s,n)=>(0,o.jsxs)("div",{className:t.default.controlItem,children:[(0,o.jsxs)("div",{className:t.default.controlLabelRow,children:[(0,o.jsx)("span",{children:e}),(0,o.jsx)("span",{className:t.default.controlValue,children:l.toFixed(2*(s>=.1))})]}),(0,o.jsx)("input",{type:"range",min:i,max:r,step:s,value:l,className:t.default.slider,onChange:e=>n(a,parseFloat(e.target.value))})]},a),G=(e,a,l,i)=>{let r,s,n,c=(r=Math.round(255*l[0]).toString(16).padStart(2,"0"),s=Math.round(255*l[1]).toString(16).padStart(2,"0"),n=Math.round(255*l[2]).toString(16).padStart(2,"0"),`#${r}${s}${n}`);return(0,o.jsxs)("div",{className:t.default.colorPickerRow,children:[(0,o.jsx)("span",{className:t.default.controlLabelRow,children:e}),(0,o.jsxs)("div",{className:t.default.colorInputWrapper,children:[(0,o.jsx)("span",{className:t.default.colorHex,children:c}),(0,o.jsx)("input",{type:"color",value:c,className:t.default.colorPicker,onChange:e=>{let o;return i(a,[parseInt((o=e.target.value.replace("#","")).substring(0,2),16)/255,parseInt(o.substring(2,4),16)/255,parseInt(o.substring(4,6),16)/255])}})]})]},a)};return(0,o.jsxs)("div",{className:t.default.container,children:[(0,o.jsxs)("div",{className:t.default.mainView,children:[(0,o.jsxs)("header",{className:t.default.header,children:[(0,o.jsxs)("div",{className:t.default.logo,children:[(0,o.jsx)("div",{className:t.default.logoDot}),(0,o.jsx)("span",{children:"Shader Visualizer Lab"})]}),(0,o.jsxs)("div",{className:t.default.tabs,children:[(0,o.jsx)("button",{className:`${t.default.tab} ${"northern-lights"===p?t.default.activeTab:""}`,onClick:()=>g("northern-lights"),children:"Northern Lights"}),(0,o.jsx)("button",{className:`${t.default.tab} ${"blob47"===p?t.default.activeTab:""}`,onClick:()=>g("blob47"),children:"Blob 47 (Refractive)"}),(0,o.jsx)("button",{className:`${t.default.tab} ${"diamond-orb"===p?t.default.activeTab:""}`,onClick:()=>g("diamond-orb"),children:"Diamond Orb (Responding)"}),(0,o.jsx)("button",{className:`${t.default.tab} ${"water-ripple"===p?t.default.activeTab:""}`,onClick:()=>g("water-ripple"),children:"Water Ripple (SwiftUI / Metal)"})]})]}),(0,o.jsxs)("div",{className:t.default.canvasContainer,children:[(0,o.jsx)("canvas",{ref:C,className:t.default.canvas,onPointerDown:e=>{if("water-ripple"!==p)return;let o=C.current;if(!o)return;let a=o.getBoundingClientRect(),t=e.clientX-a.left,l=a.height-(e.clientY-a.top),i=window.devicePixelRatio||1;F.current={x:t*i,y:l*i},P.current=performance.now()/1e3}}),(0,o.jsxs)("div",{className:t.default.overlayControls,children:[(0,o.jsx)("button",{className:t.default.iconBtn,onClick:()=>h(!v),title:v?"Pause Animation":"Play Animation",children:(0,o.jsx)("i",{className:"material-icons",children:v?"pause":"play_arrow"})}),(0,o.jsx)("button",{className:t.default.iconBtn,onClick:()=>{"northern-lights"===p?j({u_scrollSpeed:.2,u_gradientZoom:6.6,u_uvRotation:-45,u_darkMode:1,u_shapeCenterX:.5,u_shapeCenterY:.5,u_shapeRadiusX:.8,u_shapeRadiusY:.8,u_shapeSoftness:.45,u_shapeOpacity:1,u_enableNoiseMask:1,u_noiseMaskScale:.66,u_noiseMaskSpeed:.21,u_noiseMaskDetail:3,u_noiseMaskStrength:.9,u_noiseMaskAngle:117.2,u_brightness:0,u_contrast:1}):"blob47"===p?B({uWidth:.65,uHeight:.23,uOffsetY:0,uRadius:1,uSoftnessTop:.05,uSoftnessBottom:0,softnessAffect:.15,uNoiseStrength:0,uNoiseScale:10,falloffPower:5,useStaticNoise:.36,noiseSpeed:.52,color1:[.08,.21,.8],color2:[.2,.4,1],mainColorForce0:1.2,mainColorForce1:1,colorModeRadial:1,trueOpacity:1,finalSaturation:1.3,gradientInfluence:0,colorwheelSaturation:1,dmVisibility:.77,dmDotSize:.15,dmGridSpacing:.3,dmWaveAffect:1,dmWaveFreq:.417,dmWaveSpeed:1.24,dmDispForce:0,dmDotColor:[.4,.6,1],dmInsideVis:.5,dmOutsideVis:.2,u_angle:0,u_scale:1,u_bend:.05,u_contour:.1,u_rimNormalMix:.5,u_fresnelIntensity:1,u_colorTopRight:[1,.8,.9]}):L({nmShape:.75,nmCountX:50,nmCountY:50,nmSpaceX:1.5,nmSpaceY:1.5,nmSize:6,nmRot:45,nmDensity:1.2,nmOpacity:1,nmColor:[.27,.27,.8],mnScale:4,mnSpeed:.5,mnDirX:1,mnDirY:0,mnDisp:10,mnNoiseRot:0,snScale:6.9,snSpeed:1,snAmount:1,snNoiseRot:0,snRotSpeed:0,wScale:10,wVel:.22,wSize:6.3,wTurb:0,wDirX:1,wDirY:.5,wDirRot:0,wDisp:1,gdOpacity:1,gdScale:1.33,gdAmt:19,gdNScale:6.4,gdNSpeed:.88,gdIor:3,gdFalloff:0,gdSwirl:6,gdSwirlLfo:0,gdRefract:373,gdInvert:10,gdRgb:.02,noiseInt:1,noiseScale:1.4,noiseSpeed:.71,noiseGlow:.4,noiseColor:[1,.66,.87],colorBottom:[.2,.43,.95],colorMid:[.12,.23,.6],colorTop:[.51,.53,1],colorGlow:[.36,.36,.99],glowIntensity:1,pulseSpeed:.3,pulseAmt:.93,scaleAmt:.04,scaleSpeed:.3,ringOpacity:.75,ringScale:1,ringThick:40,ringBlur:18,ringGlow:10,ringGlowR:16,ringOffY:-11,ringColorTop:[0,0,0],ringTopAlpha:1,ringColorBot:[.87,.66,.8],ringBotAlpha:1})},title:"Reset Shader Parameters",children:(0,o.jsx)("i",{className:"material-icons",children:"replay"})}),(0,o.jsx)("button",{className:t.default.iconBtn,onClick:()=>y(e=>1===e?.5:.5===e?.25:1),title:"Change Resolution Scale",children:(0,o.jsx)("span",{style:{fontSize:11,fontWeight:700},children:1===w?"1x":.5===w?"0.5x":"0.25x"})})]}),(0,o.jsxs)("div",{className:t.default.stats,children:[(0,o.jsxs)("div",{children:["FPS: ",(0,o.jsx)("span",{className:t.default.statsVal,children:x})]}),(0,o.jsxs)("div",{children:["Frame Time: ",(0,o.jsxs)("span",{className:t.default.statsVal,children:[b,"ms"]})]}),(0,o.jsxs)("div",{children:["Resolution: ",(0,o.jsx)("span",{className:t.default.statsVal,children:C.current?`${C.current.width}x${C.current.height}`:"0x0"})]})]})]})]}),(0,o.jsxs)("div",{className:t.default.sidebar,children:[(0,o.jsxs)("div",{className:t.default.sidebarHeader,children:[(0,o.jsx)("div",{className:t.default.sidebarTitle,children:"northern-lights"===p?"Northern Lights Parameters":"blob47"===p?"Blob 47 Parameters":"water-ripple"===p?"Water Ripple Parameters":"Diamond Orb Parameters"}),(0,o.jsx)("div",{className:t.default.sidebarDesc,children:"northern-lights"===p?"Warped color gradients filtered with Simplex noise masks.":"blob47"===p?"A fluid, refractive liquid glass capsule capsule.":"water-ripple"===p?"Fluid concentric ripples propagating from click coordinates.":"Dynamic grid halftone mesh driven by ocean wave patterns."})]}),(0,o.jsxs)("div",{className:t.default.controlsList,children:["northern-lights"===p&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Gradient Warp"}),E("Scroll Speed","u_scrollSpeed",I.u_scrollSpeed,-1,1,.05,(e,o)=>j(a=>({...a,[e]:o}))),E("Gradient Zoom","u_gradientZoom",I.u_gradientZoom,1,20,.2,(e,o)=>j(a=>({...a,[e]:o}))),E("UV Rotation","u_uvRotation",I.u_uvRotation,-180,180,5,(e,o)=>j(a=>({...a,[e]:o}))),E("Light / Dark Blend","u_darkMode",I.u_darkMode,0,1,.02,(e,o)=>j(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"SDF Bounds"}),E("Center X","u_shapeCenterX",I.u_shapeCenterX,0,1,.01,(e,o)=>j(a=>({...a,[e]:o}))),E("Center Y","u_shapeCenterY",I.u_shapeCenterY,0,1,.01,(e,o)=>j(a=>({...a,[e]:o}))),E("Radius X","u_shapeRadiusX",I.u_shapeRadiusX,.1,2,.02,(e,o)=>j(a=>({...a,[e]:o}))),E("Radius Y","u_shapeRadiusY",I.u_shapeRadiusY,.1,2,.02,(e,o)=>j(a=>({...a,[e]:o}))),E("Softness","u_shapeSoftness",I.u_shapeSoftness,.01,1,.02,(e,o)=>j(a=>({...a,[e]:o}))),E("Opacity","u_shapeOpacity",I.u_shapeOpacity,0,1,.05,(e,o)=>j(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Noise Mask"}),(e="u_enableNoiseMask",u=1===I.u_enableNoiseMask,m=(e,o)=>j(a=>({...a,[e]:+!!o})),(0,o.jsxs)("div",{className:t.default.toggleRow,children:[(0,o.jsx)("span",{className:t.default.controlLabelRow,children:"Enable Noise Mask"}),(0,o.jsxs)("label",{className:t.default.toggleContainer,children:[(0,o.jsx)("input",{type:"checkbox",checked:u,className:t.default.toggleInput,onChange:o=>m(e,o.target.checked)}),(0,o.jsx)("span",{className:t.default.toggleSlider})]})]},e)),E("Mask Strength","u_noiseMaskStrength",I.u_noiseMaskStrength,0,1,.05,(e,o)=>j(a=>({...a,[e]:o}))),E("Mask Scale","u_noiseMaskScale",I.u_noiseMaskScale,.1,5,.05,(e,o)=>j(a=>({...a,[e]:o}))),E("Mask Speed","u_noiseMaskSpeed",I.u_noiseMaskSpeed,0,2,.05,(e,o)=>j(a=>({...a,[e]:o}))),E("Mask Angle","u_noiseMaskAngle",I.u_noiseMaskAngle,0,360,5,(e,o)=>j(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Post FX"}),E("Brightness","u_brightness",I.u_brightness,-.5,.5,.02,(e,o)=>j(a=>({...a,[e]:o}))),E("Contrast","u_contrast",I.u_contrast,.5,5,.1,(e,o)=>j(a=>({...a,[e]:o})))]})]}),"blob47"===p&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Capsule Bounds"}),E("Width","uWidth",z.uWidth,.1,1.5,.02,(e,o)=>B(a=>({...a,[e]:o}))),E("Height","uHeight",z.uHeight,.1,1.5,.02,(e,o)=>B(a=>({...a,[e]:o}))),E("Corner Radius","uRadius",z.uRadius,0,1,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Offset Y","uOffsetY",z.uOffsetY,-.5,.5,.01,(e,o)=>B(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Edge & Softness"}),E("Softness Top","uSoftnessTop",z.uSoftnessTop,0,.5,.01,(e,o)=>B(a=>({...a,[e]:o}))),E("Softness Bottom","uSoftnessBottom",z.uSoftnessBottom,0,.5,.01,(e,o)=>B(a=>({...a,[e]:o}))),E("Softness Affect","softnessAffect",z.softnessAffect,0,1,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Edge Falloff","falloffPower",z.falloffPower,1,10,.2,(e,o)=>B(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Blob Colors"}),G("Base Color 1","color1",z.color1,(e,o)=>B(a=>({...a,[e]:o}))),G("Base Color 2","color2",z.color2,(e,o)=>B(a=>({...a,[e]:o}))),E("Radial Mode","colorModeRadial",z.colorModeRadial,0,1,1,(e,o)=>B(a=>({...a,[e]:o}))),E("Glass Opacity","trueOpacity",z.trueOpacity,0,1,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Saturation","finalSaturation",z.finalSaturation,0,2,.05,(e,o)=>B(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Lighting & Fresnel"}),E("Normal Mix","u_rimNormalMix",z.u_rimNormalMix,0,1,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Fresnel Force","u_fresnelIntensity",z.u_fresnelIntensity,0,3,.1,(e,o)=>B(a=>({...a,[e]:o}))),G("Highlight Color","u_colorTopRight",z.u_colorTopRight,(e,o)=>B(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Simplex Distortion"}),E("Noise Speed","noiseSpeed",z.noiseSpeed,0,3,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Warp Force","uNoiseStrength",z.uNoiseStrength,0,.5,.01,(e,o)=>B(a=>({...a,[e]:o}))),E("Warp Scale","uNoiseScale",z.uNoiseScale,1,30,1,(e,o)=>B(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Refractive Env Map"}),E("Flow Angle","u_angle",z.u_angle,0,360,5,(e,o)=>B(a=>({...a,[e]:o}))),E("Env Scale","u_scale",z.u_scale,.1,4,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Border Bend","u_bend",z.u_bend,0,.2,.01,(e,o)=>B(a=>({...a,[e]:o}))),E("Contour Zoom","u_contour",z.u_contour,0,1,.05,(e,o)=>B(a=>({...a,[e]:o}))),E("Color Gradient Mix","gradientInfluence",z.gradientInfluence,0,1,.05,(e,o)=>B(a=>({...a,[e]:o})))]})]}),"diamond-orb"===p&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Halftone Grid"}),E("Node Shape (Star)","nmShape",O.nmShape,0,1,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Grid Count X","nmCountX",O.nmCountX,10,120,5,(e,o)=>L(a=>({...a,[e]:o}))),E("Grid Space X","nmSpaceX",O.nmSpaceX,.5,3,.1,(e,o)=>L(a=>({...a,[e]:o}))),E("Dot Size","nmSize",O.nmSize,1,20,1,(e,o)=>L(a=>({...a,[e]:o}))),E("Rotation","nmRot",O.nmRot,0,360,5,(e,o)=>L(a=>({...a,[e]:o}))),E("Grid Density","nmDensity",O.nmDensity,.2,3,.1,(e,o)=>L(a=>({...a,[e]:o}))),E("Grid Opacity","nmOpacity",O.nmOpacity,0,1,.05,(e,o)=>L(a=>({...a,[e]:o}))),G("Grid Color","nmColor",O.nmColor,(e,o)=>L(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Core Colors"}),G("Top Color","colorTop",O.colorTop,(e,o)=>L(a=>({...a,[e]:o}))),G("Mid Color","colorMid",O.colorMid,(e,o)=>L(a=>({...a,[e]:o}))),G("Bottom Color","colorBottom",O.colorBottom,(e,o)=>L(a=>({...a,[e]:o}))),G("Aura Color","colorGlow",O.colorGlow,(e,o)=>L(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Pulsing Glow"}),E("Glow Force","glowIntensity",O.glowIntensity,0,3,.1,(e,o)=>L(a=>({...a,[e]:o}))),E("Pulse Speed","pulseSpeed",O.pulseSpeed,.05,2,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Pulse Amount","pulseAmt",O.pulseAmt,0,1,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Breathe Scale","scaleAmt",O.scaleAmt,0,.25,.01,(e,o)=>L(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Ocean Wave Warp"}),E("Wave Height","wScale",O.wScale,0,40,1,(e,o)=>L(a=>({...a,[e]:o}))),E("Wave Velocity","wVel",O.wVel,0,1.5,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Wave Frequency","wSize",O.wSize,1,20,.2,(e,o)=>L(a=>({...a,[e]:o}))),E("Wave Turbulence","wTurb",O.wTurb,0,2,.1,(e,o)=>L(a=>({...a,[e]:o}))),E("Wave Direction X","wDirX",O.wDirX,-1,1,.1,(e,o)=>L(a=>({...a,[e]:o}))),E("Wave Direction Y","wDirY",O.wDirY,-1,1,.1,(e,o)=>L(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Energy Wave (Ring)"}),E("Ring Opacity","ringOpacity",O.ringOpacity,0,1,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Ring Thickness","ringThick",O.ringThick,5,100,5,(e,o)=>L(a=>({...a,[e]:o}))),E("Ring Glow","ringGlow",O.ringGlow,1,30,1,(e,o)=>L(a=>({...a,[e]:o}))),E("Ring Shift Y","ringOffY",O.ringOffY,-30,30,1,(e,o)=>L(a=>({...a,[e]:o}))),G("Ring Color Bottom","ringColorBot",O.ringColorBot,(e,o)=>L(a=>({...a,[e]:o})))]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Noise Distortions"}),E("Mesh Scale","mnScale",O.mnScale,1,15,.5,(e,o)=>L(a=>({...a,[e]:o}))),E("Mesh Speed","mnSpeed",O.mnSpeed,0,2,.05,(e,o)=>L(a=>({...a,[e]:o}))),E("Mesh Displacement","mnDisp",O.mnDisp,0,30,1,(e,o)=>L(a=>({...a,[e]:o}))),E("Scale Noise Scale","snScale",O.snScale,1,15,.5,(e,o)=>L(a=>({...a,[e]:o}))),E("Scale Noise Speed","snSpeed",O.snSpeed,0,3,.1,(e,o)=>L(a=>({...a,[e]:o})))]})]}),"water-ripple"===p&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Interactive Simulation"}),(0,o.jsx)("div",{style:{padding:"8px",fontSize:"13px",color:"#888da8",lineHeight:"1.5"},children:"Tap or click anywhere on the canvas to trigger fluid concentric ripples propagating outward."})]}),(0,o.jsxs)("div",{className:t.default.group,children:[(0,o.jsx)("div",{className:t.default.groupTitle,children:"Ripple Parameters"}),(0,o.jsxs)("div",{style:{padding:"8px",fontSize:"13px",color:"#888da8",display:"flex",flexDirection:"column",gap:"8px"},children:[(0,o.jsxs)("div",{children:["Amplitude: ",(0,o.jsx)("span",{style:{float:"right",fontWeight:"bold"},children:"0.045"})]}),(0,o.jsxs)("div",{children:["Frequency: ",(0,o.jsx)("span",{style:{float:"right",fontWeight:"bold"},children:"26.0"})]}),(0,o.jsxs)("div",{children:["Decay Rate: ",(0,o.jsx)("span",{style:{float:"right",fontWeight:"bold"},children:"5.00"})]}),(0,o.jsxs)("div",{children:["Propagation Speed: ",(0,o.jsx)("span",{style:{float:"right",fontWeight:"bold"},children:"1.60"})]})]})]})]})]})]}),(0,o.jsx)("link",{href:"https://fonts.googleapis.com/icon?family=Material+Icons",rel:"stylesheet"})]})}])}]);