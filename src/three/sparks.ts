import * as THREE from 'three';
import { SPARKS } from './constants';

export interface SparkData {
  speedX: number;
  speedY: number;
  speedZ: number;
  swaySpeed: number;
  swayRadius: number;
  phase: number;
}

export interface SparkSystem {
  points: THREE.Points;
  data: SparkData[];
  dispose: () => void;
}

/** Procedural radial-gradient sprite: white core fading to transparent. */
export function createSparkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx!.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx!.fillStyle = gradient;
  ctx!.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

/**
 * 450 additive sparks, monochrome: the `orangeRatio` split now separates the hot
 * white embers from the cooler grey ones instead of orange from icy blue — the
 * site ships black and white only.
 */
export function createSparks(scene: THREE.Scene): SparkSystem {
  const count = SPARKS.count;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const data: SparkData[] = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;

    const ember = Math.random() < SPARKS.orangeRatio;
    const tone = ember ? 0.92 + Math.random() * 0.08 : 0.5 + Math.random() * 0.18;
    colors[i * 3] = tone;
    colors[i * 3 + 1] = tone;
    colors[i * 3 + 2] = tone;

    data.push({
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: 0.15 + Math.random() * 0.3,
      speedZ: (Math.random() - 0.5) * 0.4,
      swaySpeed: 0.5 + Math.random() * 1.5,
      swayRadius: 0.05 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: SPARKS.size,
    vertexColors: true,
    transparent: true,
    opacity: SPARKS.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: createSparkTexture(),
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    points,
    data,
    dispose: () => {
      scene.remove(points);
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
  };
}
