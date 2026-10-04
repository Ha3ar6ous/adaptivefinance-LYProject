import { createMoneyChoreography } from "./moneyChoreography";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  Shape,
  ExtrudeGeometry,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  HemisphereLight,
  DirectionalLight,
  SRGBColorSpace,
} from "three";

// Hand-built ₹ geometry: no fonts, textures, model downloads, shadows, or postprocessing.
export function createRupeeScene(host, { mode = "hero" } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 20);
  const storytelling = mode === "journey";
  camera.position.z = storytelling ? 8.8 : 5.8;
  const coin = new Group();
  scene.add(coin);
  const face = new MeshStandardMaterial({
    color: "#31573b",
    metalness: 0.45,
    roughness: 0.4,
  });
  const edge = new MeshStandardMaterial({
    color: "#a9be7e",
    metalness: 0.65,
    roughness: 0.3,
  });
  const glyphMaterial = new MeshStandardMaterial({
    color: "#d6e5af",
    metalness: 0.4,
    roughness: 0.28,
  });
  const disc = new Mesh(new CylinderGeometry(1.22, 1.22, 0.24, 64), face);
  disc.rotation.x = Math.PI / 2;
  coin.add(disc);
  const rim = new Mesh(new TorusGeometry(1.2, 0.028, 8, 64), edge);
  rim.position.z = 0.13;
  coin.add(rim);
  const innerRim = new Mesh(new TorusGeometry(1.04, 0.008, 6, 64), edge);
  innerRim.position.z = 0.125;
  coin.add(innerRim);
  const rectangle = (x, y, w, h) => {
    const shape = new Shape();
    shape.moveTo(x, y);
    shape.lineTo(x + w, y);
    shape.lineTo(x + w, y + h);
    shape.lineTo(x, y + h);
    shape.closePath();
    return shape;
  };
  const curve = new Shape();
  curve.moveTo(-0.4, 0.66);
  curve.lineTo(-0.02, 0.66);
  curve.bezierCurveTo(0.56, 0.66, 0.62, -0.09, -0.05, -0.09);
  curve.lineTo(-0.11, -0.09);
  curve.lineTo(0.57, -0.76);
  curve.lineTo(0.39, -0.9);
  curve.lineTo(-0.49, -0.02);
  curve.lineTo(-0.49, 0.09);
  curve.lineTo(-0.06, 0.09);
  curve.bezierCurveTo(0.32, 0.09, 0.3, 0.48, -0.02, 0.48);
  curve.lineTo(-0.4, 0.48);
  curve.closePath();
  const glyph = new Mesh(
    new ExtrudeGeometry(
      [
        rectangle(-0.53, 0.63, 1.15, 0.14),
        rectangle(-0.53, 0.34, 1.15, 0.13),
        curve,
      ],
      {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 12,
        steps: 1,
      },
    ),
    glyphMaterial,
  );
  glyph.position.set(0, 0.06, 0.14);
  coin.add(glyph);
  scene.add(new HemisphereLight("#fff7db", "#284634", 1.2));
  const key = new DirectionalLight("#fff6d9", 2);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new DirectionalLight("#b5d3bb", 0.85);
  fill.position.set(3, -1, 2);
  scene.add(fill);
  const animateMoney = storytelling
    ? createMoneyChoreography(scene, coin, { face, edge, glyph: glyphMaterial })
    : null;
  renderer.domElement.className = "af-rupee-canvas";
  host.appendChild(renderer.domElement);
  let frame = 0,
    last = 0,
    visible = false,
    destroyed = false,
    contextLost = false;
  let progress = Number(host.dataset.scrollProgress || 0);
  const resize = () => {
    const width = Math.max(1, host.clientWidth),
      height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const render = (time) => {
    if (destroyed || contextLost || !visible || document.hidden) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(render);
    // Cap decorative rendering at 30 fps, independent of monitor refresh rate.
    if (time - last < 33) return;
    last = time;
    coin.rotation.set(
      0.13 + Math.sin(time * 0.0005) * 0.025,
      -0.42 + progress * 1.05 + Math.sin(time * 0.00035) * 0.04,
      -0.13 + progress * 0.22,
    );
    coin.position.y = Math.sin(time * 0.0007) * 0.045 - progress * 0.16;
    animateMoney?.(time, progress);
    renderer.render(scene, camera);
    host.classList.add("af-rupee-rendered");
  };
  const wake = () => {
    if (visible && !document.hidden && !frame && !destroyed && !contextLost)
      frame = requestAnimationFrame(render);
    if ((!visible || document.hidden) && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  observer.observe(host);
  const onProgress = (event) => {
    progress = event.detail;
  };
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    host.classList.remove("af-rupee-rendered");
  };
  const onContextRestored = () => {
    contextLost = false;
    wake();
  };
  host.addEventListener("af:rupee-progress", onProgress);
  document.addEventListener("visibilitychange", wake);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  renderer.domElement.addEventListener(
    "webglcontextrestored",
    onContextRestored,
  );
  function dispose() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    host.removeEventListener("af:rupee-progress", onProgress);
    document.removeEventListener("visibilitychange", wake);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    renderer.domElement.removeEventListener(
      "webglcontextrestored",
      onContextRestored,
    );
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
      if (object.isInstancedMesh) object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    host.classList.remove("af-rupee-rendered");
  }
  return dispose;
}
