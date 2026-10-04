import {
  InstancedMesh,
  Object3D,
  Color,
  DynamicDrawUsage,
  Shape,
  ShapeGeometry,
  Mesh,
  MeshBasicMaterial,
  BufferGeometry,
  LineLoop,
  LineBasicMaterial,
  Line,
  Vector3,
} from "three";

const COUNT = 15;
const smooth = (value) => {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
};

// Shared coin meshes keep the entire formation to three instanced draw calls.
export function createMoneyChoreography(scene, coin, materials) {
  const discGeometry = coin.children[0].geometry.clone();
  discGeometry.rotateX(Math.PI / 2);
  const rimGeometry = coin.children[1].geometry.clone();
  rimGeometry.translate(0, 0, coin.children[1].position.z);
  const glyphGeometry = coin.children[3].geometry.clone();
  glyphGeometry.translate(0, 0.06, coin.children[3].position.z);
  const discs = new InstancedMesh(discGeometry, materials.face, COUNT);
  const rims = new InstancedMesh(rimGeometry, materials.edge, COUNT);
  const glyphs = new InstancedMesh(glyphGeometry, materials.glyph, COUNT);
  [discs, rims, glyphs].forEach((mesh) => {
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
  });
  const dummy = new Object3D();
  const green = new Color("#ffffff"),
    surplus = new Color("#d0df86");
  const surplusTint = new Color();
  const shieldShape = new Shape();
  shieldShape.moveTo(0, 1.3);
  shieldShape.lineTo(1.13, 0.83);
  shieldShape.bezierCurveTo(1.13, -0.25, 0.85, -0.91, 0, -1.38);
  shieldShape.bezierCurveTo(-0.85, -0.91, -1.13, -0.25, -1.13, 0.83);
  shieldShape.closePath();
  const shield = new Mesh(
    new ShapeGeometry(shieldShape),
    new MeshBasicMaterial({
      color: "#77994f",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  shield.position.z = -1.05;
  scene.add(shield);
  const contour = new LineLoop(
    new BufferGeometry().setFromPoints(
      shieldShape
        .getPoints(48)
        .map((point) => new Vector3(point.x, point.y, 0)),
    ),
    new LineBasicMaterial({ color: "#587a41", transparent: true, opacity: 0 }),
  );
  contour.position.z = -1;
  scene.add(contour);
  const growth = new Line(
    new BufferGeometry().setFromPoints([
      new Vector3(0.15, -0.85, -0.7),
      new Vector3(1.25, -0.3, -0.7),
      new Vector3(2.05, 0.55, -0.7),
      new Vector3(2.8, 1.4, -0.7),
    ]),
    new LineBasicMaterial({ color: "#718f4d", transparent: true, opacity: 0 }),
  );
  scene.add(growth);

  const layout = (stage, index) => {
    const angle = (index / COUNT) * Math.PI * 2 - Math.PI / 2;
    if (stage === 0)
      return {
        x: -2.3 + (index % 5) * 1.13,
        y: 1.45 - Math.floor(index / 5) * 1.35,
        z: -0.7 + (index % 3) * 0.13,
        scale: 0.21,
      };
    if (stage === 1)
      return {
        x: -2.8 + index * 0.4,
        y: Math.sin(index * 0.87) * 1.25,
        z: -0.5 + Math.cos(index * 0.8) * 0.3,
        scale: 0.2,
      };
    if (stage === 2) {
      const cluster = Math.floor(index / 3),
        orbit = (cluster / 5) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(orbit) * 2 + ((index % 3) - 1) * 0.28,
        y: Math.sin(orbit) * 1.6 + ((index % 3) - 1) * 0.12,
        z: -0.5 + (index % 3) * 0.16,
        scale: 0.19,
      };
    }
    if (stage === 3)
      return {
        x: Math.cos(angle) * 2.28,
        y: Math.sin(angle) * 1.63,
        z: Math.sin(angle) * 0.45,
        scale: 0.2,
      };
    if (index < 12) {
      const bufferAngle = (index / 12) * Math.PI * 2;
      return {
        x: Math.cos(bufferAngle) * 1.25 - 0.5,
        y: Math.sin(bufferAngle) * 1.35,
        z: -0.45,
        scale: 0.19,
      };
    }
    const step = index - 12;
    return {
      x: [1.25, 2.05, 2.8][step],
      y: [-0.3, 0.55, 1.4][step],
      z: 0,
      scale: 0.25 + step * 0.025,
    };
  };

  return (time, progress) => {
    const chapter = Math.min(4, Math.max(0, progress * 4.3)),
      from = Math.floor(chapter),
      to = Math.min(4, from + 1),
      blend = smooth(chapter - from);
    const safetyWeight = smooth(chapter - 2) * (1 - smooth(chapter - 3));
    const growthWeight = smooth(chapter - 3);
    const shieldScale = 0.8 + safetyWeight * 0.6;
    shield.scale.setScalar(shieldScale);
    contour.scale.setScalar(shieldScale);
    shield.material.opacity = safetyWeight * 0.055;
    contour.material.opacity = safetyWeight * 0.6;
    growth.material.opacity = growthWeight * 0.5;
    const idle = Math.sin(time * 0.00045) * 0.028;
    surplusTint.copy(green).lerp(surplus, growthWeight);
    for (let index = 0; index < COUNT; index++) {
      const a = layout(from, index),
        b = layout(to, index);
      dummy.position.set(
        a.x + (b.x - a.x) * blend,
        a.y + (b.y - a.y) * blend + Math.sin(time * 0.0007 + index) * 0.055,
        a.z + (b.z - a.z) * blend,
      );
      dummy.rotation.set(
        0.22 + Math.sin(index * 1.7) * 0.18 + idle,
        Math.sin(index * 0.9) * 0.65 +
          Math.sin(time * 0.0003 + index) * 0.07 +
          blend * 0.15,
        ((index % 3) - 1) * 0.08,
      );
      dummy.scale.setScalar(a.scale + (b.scale - a.scale) * blend);
      dummy.updateMatrix();
      discs.setMatrixAt(index, dummy.matrix);
      rims.setMatrixAt(index, dummy.matrix);
      glyphs.setMatrixAt(index, dummy.matrix);
      discs.setColorAt(index, index >= 12 ? surplusTint : green);
    }
    [discs, rims, glyphs].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
    });
    discs.instanceColor.needsUpdate = true;
    coin.scale.setScalar(0.78 - growthWeight * 0.16);
    coin.position.x = -growthWeight * 0.5;
    coin.position.y = 0.12 + Math.sin(time * 0.0007) * 0.035;
    coin.rotation.set(
      0.12 + Math.sin(chapter) * 0.09,
      -0.48 + Math.sin(chapter * 1.35) * 0.72 + idle,
      -0.08 + Math.sin(chapter) * 0.12,
    );
  };
}
