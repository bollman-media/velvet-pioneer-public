(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,213035,847071,e=>{"use strict";var t=e.i(931067),r=e.i(271645),a=e.i(190072);let o=r.forwardRef(({args:e,children:a,...o},s)=>{let l=r.useRef(null);return r.useImperativeHandle(s,()=>l.current),r.useLayoutEffect(()=>void 0),r.createElement("mesh",(0,t.default)({ref:l},o),r.createElement("sphereGeometry",{attach:"geometry",args:e}),a)});e.s(["Sphere",0,o],213035);var s=e.i(939014),l=e.i(55190);let n=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function i(e,t){let o=(0,s.useThree)(e=>e.gl),i=(0,l.useLoader)(a.TextureLoader,n(e)?Object.values(e):e);return(0,r.useLayoutEffect)(()=>{null==t||t(i)},[t]),(0,r.useEffect)(()=>{if("initTexture"in o){let e=[];Array.isArray(i)?e=i:i instanceof a.Texture?e=[i]:n(i)&&(e=Object.values(i)),e.forEach(e=>{e instanceof a.Texture&&o.initTexture(e)})}},[o,i]),(0,r.useMemo)(()=>{if(!n(e))return i;{let t={},r=0;for(let a in e)t[a]=i[r++];return t}},[e,i])}i.preload=e=>l.useLoader.preload(a.TextureLoader,e),i.clear=e=>l.useLoader.clear(a.TextureLoader,e),e.s(["useTexture",0,i],847071)},616978,e=>{"use strict";var t=e.i(843476),r=e.i(271645),a=e.i(575056),o=e.i(980931),s=e.i(939014),l=e.i(213035),n=e.i(130297),i=e.i(931067),u=e.i(190072);let c=r.forwardRef(function({children:e,follow:t=!0,lockX:a=!1,lockY:s=!1,lockZ:l=!1,...n},c){let f=r.useRef(null),d=r.useRef(null),m=new u.Quaternion;return(0,o.useFrame)(({camera:e})=>{if(!t||!d.current)return;let r=f.current.rotation.clone();d.current.updateMatrix(),d.current.updateWorldMatrix(!1,!1),d.current.getWorldQuaternion(m),e.getWorldQuaternion(f.current.quaternion).premultiply(m.invert()),a&&(f.current.rotation.x=r.x),s&&(f.current.rotation.y=r.y),l&&(f.current.rotation.z=r.z)}),r.useImperativeHandle(c,()=>d.current,[]),r.createElement("group",(0,i.default)({ref:d},n),r.createElement("group",{ref:f},e))}),f={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},d={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},m=r.forwardRef(({scale:e=10,frames:t=1/0,opacity:a=1,width:l=1,height:n=1,blur:c=1,near:m=0,far:p=10,resolution:v=512,smooth:_=!0,color:h="#000000",depthWrite:g=!1,renderOrder:x,...b},y)=>{let j,M,U=r.useRef(null),S=(0,s.useThree)(e=>e.scene),R=(0,s.useThree)(e=>e.gl),D=r.useRef(null);l*=Array.isArray(e)?e[0]:e||1,n*=Array.isArray(e)?e[1]:e||1;let[T,w,C,P,k,E,F]=r.useMemo(()=>{let e=new u.WebGLRenderTarget(v,v),t=new u.WebGLRenderTarget(v,v);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new u.PlaneGeometry(l,n).rotateX(Math.PI/2),a=new u.Mesh(r),o=new u.MeshDepthMaterial;o.depthTest=o.depthWrite=!1,o.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new u.Color(h)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let s=new u.ShaderMaterial(f),i=new u.ShaderMaterial(d);return i.depthTest=s.depthTest=!1,[e,r,o,a,s,i,t]},[v,l,n,e,h]),B=e=>{P.visible=!0,P.material=k,k.uniforms.tDiffuse.value=T.texture,k.uniforms.h.value=e/256,R.setRenderTarget(F),R.render(P,D.current),P.material=E,E.uniforms.tDiffuse.value=F.texture,E.uniforms.v.value=e/256,R.setRenderTarget(T),R.render(P,D.current),P.visible=!1},L=0;return(0,o.useFrame)(()=>{D.current&&(t===1/0||L<t)&&(L++,j=S.background,M=S.overrideMaterial,U.current.visible=!1,S.background=null,S.overrideMaterial=C,R.setRenderTarget(T),R.render(S,D.current),B(c),_&&B(.4*c),R.setRenderTarget(null),U.current.visible=!0,S.overrideMaterial=M,S.background=j)}),r.useImperativeHandle(y,()=>U.current,[]),r.createElement("group",(0,i.default)({"rotation-x":Math.PI/2},b,{ref:U}),r.createElement("mesh",{renderOrder:x,geometry:w,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},r.createElement("meshBasicMaterial",{transparent:!0,map:T.texture,opacity:a,depthWrite:g})),r.createElement("orthographicCamera",{ref:D,args:[-l/2,l/2,n/2,-n/2,m,p]}))});var p=e.i(847071);function v({name:e,style:r,className:a}){return(0,t.jsx)("span",{className:`material-symbols-outlined ${a||""}`,style:{fontSize:20,fontVariationSettings:"'FILL' 0, 'wght' 400",userSelect:"none",...r},children:e})}let _=[{id:"note-cobalt-wall",authorName:"Naz",text:"What do you think of this cobalt blue colored wall?",u:.35,v:.46,color:"cobalt",replies:[]},{id:"note-chair-cute",authorName:"Naz",text:"Maybe too expensive but this chair is super cute",u:.84,v:.58,replies:[]}];function h(e,t,r=49){let a=e*Math.PI*2,o=t*Math.PI,s=-r*Math.sin(o)*Math.sin(a),l=r*Math.cos(o),n=-r*Math.sin(o)*Math.cos(a);return new u.Vector3(s,l,n)}function g({imageUrl:e,position:a,scale:o,removeBackground:s=!0}){let l=(0,p.useTexture)(e),n=(0,r.useRef)(null);(0,r.useEffect)(()=>{l&&(l.colorSpace=u.SRGBColorSpace)},[l]),(0,r.useEffect)(()=>{n.current&&n.current.lookAt(0,0,0)},[a]);let i=(0,r.useMemo)(()=>({uTexture:{value:l},uRemoveBackground:{value:+!!s}}),[l,s]);return(0,t.jsxs)("mesh",{ref:n,position:a,children:[(0,t.jsx)("planeGeometry",{args:[o[0],o[1]]}),(0,t.jsx)("shaderMaterial",{uniforms:i,transparent:!0,depthWrite:!1,side:u.DoubleSide,vertexShader:`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          uniform sampler2D uTexture;
          uniform float uRemoveBackground;
          varying vec2 vUv;

          void main() {
            vec4 texColor = texture2D(uTexture, vUv);

            if (uRemoveBackground > 0.5) {
              float brightness = (texColor.r + texColor.g + texColor.b) / 3.0;
              float maxVal = max(texColor.r, max(texColor.g, texColor.b));
              float minVal = min(texColor.r, min(texColor.g, texColor.b));
              float saturation = (maxVal - minVal) / max(maxVal, 0.001);

              float brightnessThreshold = 0.82;
              float saturationThreshold = 0.16;

              float isBright = smoothstep(brightnessThreshold - 0.08, brightnessThreshold + 0.04, brightness);
              float isNeutral = 1.0 - smoothstep(saturationThreshold - 0.05, saturationThreshold + 0.05, saturation);

              float bgFactor = isBright * isNeutral;
              texColor.a *= (1.0 - bgFactor);
            }

            gl_FragColor = texColor;
          }
        `})]})}function x({note:e,containerElement:a,activeTool:s,onClick:l}){let n=(0,r.useMemo)(()=>h(e.u,e.v),[e.u,e.v]),[i,u]=(0,r.useState)(!1),f=(0,r.useRef)(null),d=(0,r.useRef)(null),m=null===s||"styles"===s||"colors"===s,p=(0,r.useRef)(0);(0,o.useFrame)((e,t)=>{if(f.current){f.current.uniforms.uTime.value=e.clock.getElapsedTime();let r=+!!m,a=m?1/.48:3.125;if(p.current!==r){p.current<r?p.current=Math.min(r,p.current+t*a):p.current=Math.max(r,p.current-t*a),f.current.uniforms.uProgress.value=p.current;let e=p.current,o=0;if(e>.001){let t=e-1;o=t*t*(2.70158*t+1.70158)+1}d.current&&(d.current.scale.setScalar(o),d.current.visible=e>.001)}}});let v=(0,r.useMemo)(()=>({uTime:{value:0},uHover:{value:0},uProgress:{value:0}}),[]);return(0,r.useEffect)(()=>{f.current&&(f.current.uniforms.uHover.value=+!!i)},[i]),(0,t.jsx)("group",{position:n,ref:d,children:(0,t.jsx)(c,{children:(0,t.jsxs)("mesh",{onPointerDown:t=>{t.stopPropagation();let r=t.camera,a=n.clone().project(r);l(e,{x:(a.x+1)/2,y:1-(a.y+1)/2})},onPointerOver:e=>{e.stopPropagation(),u(!0),document.body.style.cursor="pointer"},onPointerOut:e=>{u(!1),document.body.style.cursor="default"},children:[(0,t.jsx)("planeGeometry",{args:[7.2,7.2]}),(0,t.jsx)("shaderMaterial",{ref:f,vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform float uTime;
              uniform float uHover;
              uniform float uProgress;
              varying vec2 vUv;

              void main() {
                vec2 q = vUv - 0.5;
                float dist = length(q);
                if (dist > 0.5) discard;
                float t = uTime;

                float coreR = 0.08 + uHover * 0.02;
                float core = exp(-dist * dist / (coreR * coreR));

                float bloomR = 0.18 + uHover * 0.04;
                float bloom = exp(-dist * dist / (bloomR * bloomR)) * 0.35;

                float breathe = 0.85 + 0.15 * sin(t * 2.618);

                float pulseCycle = fract(t * 0.35);
                float pulseR = pulseCycle * 0.45;
                float pulse = smoothstep(0.012, 0.0, abs(dist - pulseR))
                            * smoothstep(0.45, 0.2, pulseR)
                            * smoothstep(0.0, 0.06, pulseR) * 0.25;

                float flash = sin(uProgress * 3.14159) * 0.5;

                float intensity = (core + bloom + pulse) * breathe;
                intensity += flash * exp(-dist * dist / (0.14 * 0.14)) * 0.6;
                vec3 col = vec3(intensity);

                float alpha = core * 0.95 + bloom * 0.7 + pulse * 0.5;
                alpha *= breathe;
                alpha = clamp(alpha, 0.0, 1.0);

                gl_FragColor = vec4(col, alpha);
              }
            `,uniforms:v,transparent:!0,depthWrite:!1})]})})})}let b=[{id:"furniture-eames-chair",label:"Eames Lounge Chair & Ottoman",icon:"chair",price:"$6,995.00",brand:"Herman Miller",desc:"Iconic mid-century modern design by Charles and Ray Eames, manufactured by Herman Miller. Features premium leather and molded walnut veneer.",u:.82,v:.66},{id:"furniture-mod-lamp",label:"Midcentury Modern Arc Floor Lamp",icon:"tungsten",price:"$349.00",brand:"Design Within Reach",desc:"Classic 1960s styled brass arc floor lamp with solid white marble base and adjustable dome shade.",u:.92,v:.46},{id:"furniture-fiddle-leaf",label:"Fiddle Leaf Fig Tree",icon:"potted_plant",price:"$129.00",brand:"Bloomscape",desc:"Stunning indoor plant with large, glossy leaves shaped like violins. Comes in a premium ceramic pot.",u:.08,v:.54},{id:"furniture-art-abstract",label:"Monochromatic Abstract Painting",icon:"image",price:"$450.00",brand:"Artfinder",desc:"Minimalist hand-painted canvas art featuring textured layers of plaster, charcoal, and warm titanium white.",u:.12,v:.46},{id:"furniture-wool-rug",label:"Hand-Woven Bouclé Wool Rug",icon:"texture",price:"$899.00",brand:"Lulu & Georgia",desc:"Ultra-cozy textured floor covering hand-woven from natural un-dyed wool. Plump loops add sensory depth.",u:.22,v:.82},{id:"furniture-wood-table",label:"Solid White Oak Side Table",icon:"table_restaurant",price:"$280.00",brand:"Burrow",desc:"Sleek cylindrical accent table with a floating shelf, crafted from solid FSC-certified North American white oak.",u:.88,v:.78}];function y({item:e,containerElement:a,activeTool:s,onClick:l}){let n=(0,r.useMemo)(()=>h(e.u,e.v),[e.u,e.v]),[i,u]=(0,r.useState)(!1),f=(0,r.useRef)(null),d=(0,r.useRef)(null),m="furniture"===s,p=(0,r.useRef)(0);(0,o.useFrame)((e,t)=>{if(f.current){f.current.uniforms.uTime.value=e.clock.getElapsedTime();let r=+!!m,a=m?1/.48:3.125;if(p.current!==r){p.current<r?p.current=Math.min(r,p.current+t*a):p.current=Math.max(r,p.current-t*a),f.current.uniforms.uProgress.value=p.current;let e=p.current,o=0;if(e>.001){let t=e-1;o=t*t*(2.70158*t+1.70158)+1}d.current&&(d.current.scale.setScalar(o),d.current.visible=e>.001)}}});let v=(0,r.useMemo)(()=>({uTime:{value:0},uHover:{value:0},uProgress:{value:0}}),[]);return(0,r.useEffect)(()=>{f.current&&(f.current.uniforms.uHover.value=+!!i)},[i]),(0,t.jsx)("group",{position:n,ref:d,children:(0,t.jsx)(c,{children:(0,t.jsxs)("mesh",{onPointerDown:t=>{t.stopPropagation();let r=t.camera,a=n.clone().project(r);l(e,{x:(a.x+1)/2,y:1-(a.y+1)/2})},onPointerOver:e=>{e.stopPropagation(),u(!0),document.body.style.cursor="pointer"},onPointerOut:e=>{u(!1),document.body.style.cursor="default"},children:[(0,t.jsx)("planeGeometry",{args:[7.2,7.2]}),(0,t.jsx)("shaderMaterial",{ref:f,vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform float uTime;
              uniform float uHover;
              uniform float uProgress;
              varying vec2 vUv;

              void main() {
                vec2 q = vUv - 0.5;
                float dist = length(q);
                if (dist > 0.5) discard;
                float t = uTime;

                float coreR = 0.08 + uHover * 0.02;
                float core = exp(-dist * dist / (coreR * coreR));

                float bloomR = 0.18 + uHover * 0.04;
                float bloom = exp(-dist * dist / (bloomR * bloomR)) * 0.35;

                float breathe = 0.85 + 0.15 * sin(t * 2.618);

                float pulseCycle = fract(t * 0.35);
                float pulseR = pulseCycle * 0.45;
                float pulse = smoothstep(0.012, 0.0, abs(dist - pulseR))
                            * smoothstep(0.45, 0.2, pulseR)
                            * smoothstep(0.0, 0.06, pulseR) * 0.25;

                float flash = sin(uProgress * 3.14159) * 0.5;

                float intensity = (core + bloom + pulse) * breathe;
                intensity += flash * exp(-dist * dist / (0.14 * 0.14)) * 0.6;
                vec3 col = vec3(intensity);

                float alpha = core * 0.95 + bloom * 0.7 + pulse * 0.5;
                alpha *= breathe;
                alpha = clamp(alpha, 0.0, 1.0);

                gl_FragColor = vec4(col, alpha);
              }
            `,uniforms:v,transparent:!0,depthWrite:!1})]})})})}function j({onDismiss:e}){let{camera:t}=(0,s.useThree)(),a=(0,r.useRef)(t.rotation.clone());return(0,o.useFrame)(()=>{let r=Math.abs(t.rotation.x-a.current.x),o=Math.abs(t.rotation.y-a.current.y),s=Math.abs(t.rotation.z-a.current.z);(r>.005||o>.005||s>.005)&&e(),a.current.copy(t.rotation)}),null}function M({imageUrl:e,color:a,onClick:o}){let s=(0,p.useTexture)(e),n=(0,r.useRef)(null);return(0,r.useEffect)(()=>{s&&(s.mapping=u.EquirectangularReflectionMapping,s.colorSpace=u.SRGBColorSpace)},[s]),(0,t.jsx)(l.Sphere,{ref:n,args:[50,60,40],scale:[-1,1,1],onPointerDown:o,children:(0,t.jsx)("meshStandardMaterial",{map:s,side:u.BackSide,color:a,roughness:.8,metalness:.1})})}e.s(["default",0,function({imageUrl:e,onClose:o}){let[s,l]=(0,r.useState)(null),[i,u]=(0,r.useState)(null),[c,f]=(0,r.useState)(null),[d,p]=(0,r.useState)(null),[U,S]=(0,r.useState)(null),[R,D]=(0,r.useState)(e),[T]=(0,r.useState)({default_default_noeames:"/presets/interior_coastal_studio.jpg",default_default_eames:"/presets/interior_coastal_studio_eames_chair.jpg",default_default_lamp:"/presets/preset_coastal_default_lamp_afternoon.jpg",default_default_tree:"/presets/preset_coastal_default_tree_afternoon.jpg",default_default_art:"/presets/preset_coastal_default_art_afternoon.jpg",default_default_lamp_tree:"/presets/preset_coastal_default_lamp_tree_afternoon.jpg",default_default_lamp_art:"/presets/preset_coastal_default_lamp_art_afternoon.jpg",default_default_tree_art:"/presets/preset_coastal_default_tree_art_afternoon.jpg",default_default_lamp_tree_art:"/presets/preset_coastal_default_lamp_tree_art_afternoon.jpg",default_default_eames_lamp:"/presets/preset_coastal_default_eames_lamp_afternoon.jpg",default_default_eames_tree:"/presets/preset_coastal_default_eames_tree_afternoon.jpg",default_default_eames_art:"/presets/preset_coastal_default_eames_art_afternoon.jpg",default_default_eames_lamp_tree:"/presets/preset_coastal_default_eames_lamp_tree_afternoon.jpg",default_default_eames_lamp_art:"/presets/preset_coastal_default_eames_lamp_art_afternoon.jpg",default_default_eames_tree_art:"/presets/preset_coastal_default_eames_tree_art_afternoon.jpg",default_default_eames_lamp_tree_art:"/presets/preset_coastal_default_eames_lamp_tree_art_afternoon.jpg",default_cobalt_noeames:"/presets/interior_coastal_studio_cobalt_blue.jpg",default_cobalt_eames:"/presets/interior_coastal_studio_cobalt_blue_eames_chair.jpg",default_sage_noeames:"/presets/interior_coastal_studio_sage_green.jpg",default_terracotta_noeames:"/presets/interior_coastal_studio_terracotta.jpg",regency_default_noeames:"/presets/preset_regency_default_noeames_afternoon.jpg",regency_default_eames:"/presets/preset_regency_default_eames_afternoon.jpg"}),[w,C]=(0,r.useState)(_),[P,k]=(0,r.useState)(_[0].id),E=(0,r.useMemo)(()=>w.find(e=>e.id===P)||null,[w,P]),F=e=>{k(e?e.id:null)},[B,L]=(0,r.useState)(null),[W,I]=(0,r.useState)({x:.5,y:.5}),[H,A]=(0,r.useState)(["furniture-eames-chair"]),[O,$]=(0,r.useState)("afternoon"),z=(0,r.useMemo)(()=>"morning"===O?"#e2efff":"evening"===O?"#666278":"#fffefa",[O]),V=(0,r.useMemo)(()=>"morning"===O?{position:[-10,8,-5],color:"#d8eaff",intensity:1.4,ambient:"#202c44",ambientIntensity:.7}:"evening"===O?{position:[12,1,-12],color:"#ffa280",intensity:.2,ambient:"#1b182d",ambientIntensity:.55}:{position:[2,12,4],color:"#fffcf2",intensity:1.6,ambient:"#353532",ambientIntensity:.8},[O]),G=(0,r.useMemo)(()=>{if(R.startsWith("data:")||R.startsWith("/api/"))return R;let e=H.includes("furniture-eames-chair"),t=H.includes("furniture-mod-lamp"),r=H.includes("furniture-fiddle-leaf"),a=H.includes("furniture-art-abstract"),o=U||"default",s=c||"default",l=[];e&&l.push("eames"),t&&l.push("lamp"),r&&l.push("tree"),a&&l.push("art");let n=l.length>0?l.join("_"):"noeames",i=`${o}_${s}_${n}`;if(T[i])return T[i];let u=`${o}_${s}_${e?"eames":"noeames"}`;return T[u]?T[u]:"cobalt"===c?e?"/presets/interior_coastal_studio_cobalt_blue_eames_chair.jpg":"/presets/interior_coastal_studio_cobalt_blue.jpg":"sage"===c?"/presets/interior_coastal_studio_sage_green.jpg":"terracotta"===c?"/presets/interior_coastal_studio_terracotta.jpg":e?"/presets/interior_coastal_studio_eames_chair.jpg":"/presets/interior_coastal_studio.jpg"},[R,U,c,H,T]);return(0,r.useEffect)(()=>{D(e),S(null),F(null),L(null)},[e]),(0,r.useEffect)(()=>{F(null),L(null),p(null)},[i]),(0,t.jsxs)("div",{ref:l,style:{position:"absolute",inset:0,width:"100%",height:"100%",backgroundColor:"#000000",zIndex:400,borderRadius:44,overflow:"hidden",transform:"translate3d(0, 0, 0)",WebkitMaskImage:"-webkit-radial-gradient(white, black)"},children:[s&&(0,t.jsx)(a.Canvas,{camera:{position:[0,0,.1],fov:75},children:(0,t.jsxs)(r.Suspense,{fallback:null,children:[(0,t.jsx)("ambientLight",{color:V.ambient,intensity:V.ambientIntensity}),(0,t.jsx)("directionalLight",{position:V.position,color:V.color,intensity:V.intensity}),H.includes("furniture-mod-lamp")&&(()=>{let e=b.find(e=>"furniture-mod-lamp"===e.id);if(!e)return null;let r=h(e.u,e.v,46),a=[r.x,r.y+.8,r.z];return(0,t.jsx)("pointLight",{position:a,color:"#ffa63d",intensity:"evening"===O?12:"morning"===O?4:2,distance:25,decay:1.8})})(),(0,t.jsx)(m,{position:[0,-1.2,0],opacity:.65,scale:15,blur:2.2,far:4}),(0,t.jsx)(M,{imageUrl:G,color:z,onClick:()=>{F(null),L(null)}}),w.map(e=>(0,t.jsx)(x,{note:e,containerElement:s,activeTool:i,onClick:(e,t)=>{F(e),L(null),I(t)}},e.id)),b.filter(e=>H.includes(e.id)).map(e=>(0,t.jsx)(y,{item:e,containerElement:s,activeTool:i,onClick:(e,t)=>{L(e),F(null),I(t)}},e.id)),b.filter(e=>{var t;let r;return!!H.includes(e.id)&&"furniture-eames-chair"!==e.id&&(t=e.id,r=G.toLowerCase(),"furniture-eames-chair"===t?!r.includes("eames"):"furniture-mod-lamp"===t?!r.includes("lamp"):"furniture-fiddle-leaf"===t?!(r.includes("tree")||r.includes("leaf")||r.includes("fig")):!("furniture-art-abstract"===t&&(r.includes("art")||r.includes("painting"))))}).map(e=>{let r=h(e.u,e.v,46);return(0,t.jsxs)("group",{children:["furniture-fiddle-leaf"===e.id&&(0,t.jsx)(g,{imageUrl:"/presets/fiddle_leaf_fig_raw.jpg",position:r,scale:[5.5,5.5],removeBackground:!0}),"furniture-mod-lamp"===e.id&&(0,t.jsx)(g,{imageUrl:"/presets/arc_floor_lamp_raw.jpg",position:r,scale:[7,7],removeBackground:!0}),"furniture-art-abstract"===e.id&&(0,t.jsx)(g,{imageUrl:"/presets/abstract_painting_raw.jpg",position:r,scale:[5,5],removeBackground:!1})]},e.id)}),(E||B)&&(0,t.jsx)(j,{onDismiss:()=>{F(null),L(null)}}),(0,t.jsx)(n.OrbitControls,{enableZoom:!1,enablePan:!1,enableDamping:!0,dampingFactor:.05,rotateSpeed:-.4})]})}),(0,t.jsx)("button",{onClick:o,style:{position:"absolute",top:68,left:24,width:44,height:44,borderRadius:22,backgroundColor:"#1F3B9B",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255, 255, 255, 0.2)",boxShadow:"0 2px 8px rgba(31, 59, 155, 0.4)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:410,color:"#ffffff",outline:"none",transform:"translateY(-2px)"},children:(0,t.jsx)(v,{name:"arrow_back",style:{fontSize:22,color:"#ffffff"}})})]})}],616978)},768798,e=>{e.n(e.i(616978))}]);