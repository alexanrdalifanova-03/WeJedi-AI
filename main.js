// main.js

let scene, camera, renderer, material, clock;

function init() {
  const container = document.getElementById("bg-container");
  if (!container) return;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  clock = new THREE.Clock();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // прозорий фон
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100vw";
  renderer.domElement.style.height = "100vh";
  renderer.domElement.style.zIndex = "0";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.pointerEvents = "none";
  container.appendChild(renderer.domElement);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr)
    },
    uMouse: { value: new THREE.Vector2(1, 1) }
  };

  material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;

      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * 0.25;
      }

      float sdfSphere(vec2 p, vec2 c, float r) {
        return length(p - c) - r;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;
        vec2 p = uv;

        float t = uTime * 0.35;

        vec2 c1 = vec2(-1.0,  0.9);
        vec2 c2 = vec2( 1.0, -0.9);

        vec2 c3 = vec2(
          sin(t * 1.1) * 0.6,
          cos(t * 1.3) * 0.5
        );
        vec2 c4 = vec2(
          sin(t * 1.7 + 1.0) * 0.8,
          cos(t * 0.9 + 2.0) * 0.7
        );

        vec2 m = uMouse * 2.0 - 1.0;
        m.y = -m.y;
        m.x *= uResolution.x / uResolution.y;

        float d = 10.0;
        d = smin(d, sdfSphere(p, c1, 0.45), 0.7);
        d = smin(d, sdfSphere(p, c2, 0.4), 0.7);
        d = smin(d, sdfSphere(p, c3, 0.35), 0.6);
        d = smin(d, sdfSphere(p, c4, 0.3), 0.6);
        d = smin(d, sdfSphere(p, m, 0.1), 0.6);

        float edge = 0.003;
        float blobMask = smoothstep(edge, -edge, d);

        float glow = exp(-abs(d) * 11.0) * 0.6;

        // дуже темний зелений фон
        vec3 bg = vec3(0.01, 0.04, 0.02);

        // твої основні кольори
        // #ADFD6F → rgb(173, 253, 111) → /255
        vec3 col1 = vec3(0.6784, 0.9922, 0.4353);
        // #04D28D → rgb(4, 210, 141) → /255
        vec3 col2 = vec3(0.0157, 0.8235, 0.5529);

        float mixV = clamp((p.y + 1.0) * 0.5, 0.0, 1.0);
        vec3 blobColor = mix(col1, col2, mixV);

        // зменшуємо яскравість крапель
        blobColor *= 0.4; // 0.6 = 60% яскравості, можеш гратися 0.3–0.8

        vec3 color = bg;
        color = mix(color, blobColor, blobMask);

        // сяйво теж у цих відтінках
        vec3 glowColor = mix(col1, col2, 0.3);
        color += glow * glowColor;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  window.addEventListener("resize", onResize, false);
  window.addEventListener("pointermove", onPointerMove, false);

  animate();
}

function onResize() {
  if (!renderer || !material) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  material.uniforms.uResolution.value.set(w * dpr, h * dpr);
}

function onPointerMove(e) {
  if (!material) return;
  material.uniforms.uMouse.value.set(
    e.clientX / window.innerWidth,
    e.clientY / window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);
  if (!material || !clock) return;
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

init();
