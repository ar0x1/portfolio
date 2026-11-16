import * as THREE from 'three';
import { pointer } from '../lib/pointer';
import { MOTION, RENDERER, SPARKS } from './constants';
import { waveVertexShader, waveFragmentShader } from './shaders';
import { createSparks, type SparkSystem } from './sparks';

type WaveUniforms = {
  uTime: { value: number };
  uResolution: { value: THREE.Vector2 };
  uMouse: { value: THREE.Vector2 };
  uScroll: { value: number };
};

export interface BronzeSceneOptions {
  /**
   * Called once per rendered frame.
   * @param scroll   smoothed scroll progress [0..1]
   * @param velocity |delta| of the smoothing step — drives velocity-reactive motion
   * @param deltaTime seconds since the previous frame
   */
  onFrame?: (scroll: number, velocity: number, deltaTime: number) => void;
  /** Fires when the sculpture is in the scene (loaded, or the offline fallback). */
  onReady?: () => void;
}

/**
 * The WebGL stage, ported 1:1 from the original single-file build.
 * React owns the DOM around it; this class owns everything inside the canvas.
 */
/** The bronze liquid-wave backdrop is off: the stage is black plus the sparks. */
const BRONZE_BACKDROP = false;

export class BronzeScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly onFrame?: (scroll: number, velocity: number, deltaTime: number) => void;
  private readonly onReady?: () => void;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private bgMaterial: THREE.ShaderMaterial | null = null;
  private bgMesh: THREE.Mesh | null = null;
  private sparkSystem: SparkSystem | null = null;

  private readonly clock = new THREE.Clock();
  private currentScroll = 0;
  private mouseX = 0;
  private mouseY = 0;
  private frameId = 0;
  private disposed = false;

  private readonly sizes = { width: window.innerWidth, height: window.innerHeight };

  private readonly uniforms: WaveUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
  };

  constructor(canvas: HTMLCanvasElement, options: BronzeSceneOptions = {}) {
    this.canvas = canvas;
    this.onFrame = options.onFrame;
    this.onReady = options.onReady;
  }

  start(): void {
    this.setup();
    this.frameId = requestAnimationFrame(this.animate);
  }

  // ---------------------------------------------------------------- setup
  private setup(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    this.scene.fog = new THREE.FogExp2('#000000', RENDERER.fogDensity);

    this.camera = new THREE.PerspectiveCamera(
      RENDERER.fov,
      this.sizes.width / this.sizes.height,
      RENDERER.near,
      RENDERER.far,
    );
    this.camera.position.set(...RENDERER.startPosition);
    this.scene.add(this.camera);

    // LOCAL: the bronze/orange liquid-wave backdrop is permanently replaced by the
    // background layer. The background mesh is no longer
    // created, so the scene renders on its plain black clear colour and the horse
    // stands against the fibres instead of molten bronze. The shader is untouched in
    // three/shaders.ts, so the old look returns by flipping BRONZE_BACKDROP to true.
    if (BRONZE_BACKDROP) this.createBackgroundShader();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
    // Nothing casts shadows any more (the GLB is gone), so the extra shadow pass
    // is switched off — the three lights below still shade the ember field.
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDERER.exposure;

    this.addLights();
    this.sparkSystem = createSparks(this.scene);

    window.addEventListener('resize', this.onResize);
    this.onResize();

    // The GLB sculpture is gone: nothing streams in, so the stage reports ready
    // immediately (the entrance still waits for fonts + the editorial image).
    this.onReady?.();
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.1);
    this.scene.add(ambientLight);

    // Key light: super-bright white from upper-right, casts shadows
    const keyLight = new THREE.SpotLight('#ffffff', 18.0);
    keyLight.position.set(4, 6, 3);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.9;
    this.scene.add(keyLight);

    // Rim light: cool blue from behind-left, defines the silhouette
    const rimLight = new THREE.DirectionalLight('#ffffff', 10.0);
    rimLight.position.set(-5, 3, -4);
    this.scene.add(rimLight);

    // Fill light: very faint warm cream from below-front
    const fillLight = new THREE.DirectionalLight('#f2f2f2', 0.8);
    fillLight.position.set(-2, -4, 2);
    this.scene.add(fillLight);
  }

  private createBackgroundShader(): void {
    this.bgMaterial = new THREE.ShaderMaterial({
      vertexShader: waveVertexShader,
      fragmentShader: waveFragmentShader,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new THREE.PlaneGeometry(30, 30);
    this.bgMesh = new THREE.Mesh(geometry, this.bgMaterial);
    this.bgMesh.position.set(0.0, 0.0, -8.0); // local camera space, far behind
    this.bgMesh.renderOrder = -10;
    this.camera.add(this.bgMesh);             // attach so it always fills the view
  }

  // ---------------------------------------------------------------- loop
  private animate = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();

    // 1. target scroll [0..1], cross-browser
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY !== undefined
      ? window.scrollY
      : (window.pageYOffset !== undefined ? window.pageYOffset : document.documentElement.scrollTop);
    const targetScroll = maxScroll > 0 ? scrollTop / maxScroll : 0;

    this.currentScroll += (targetScroll - this.currentScroll) * MOTION.scrollLerp;
    this.mouseX += (pointer.nx - this.mouseX) * MOTION.mouseLerp;
    this.mouseY += (pointer.ny - this.mouseY) * MOTION.mouseLerp;

    // scroll velocity (0..~0.1) — shared by sparks and the velocity-reactive overlay
    const scrollVelocity = Math.abs(targetScroll - this.currentScroll);

    // 2. sparks physics, accelerated / turbulent on fast scroll
    this.updateSparks(deltaTime, scrollVelocity);

    // 3. camera orbit, still scroll-driven (the stage is empty, the embers ride it)
    this.updateCamera();

    // 4. background shader uniforms
    this.uniforms.uTime.value = this.clock.getElapsedTime();
    this.uniforms.uMouse.value.set(this.mouseX, -this.mouseY);
    this.uniforms.uScroll.value = this.currentScroll;

    this.onFrame?.(this.currentScroll, scrollVelocity, deltaTime);
    this.renderer.render(this.scene, this.camera);
  };

  private updateSparks(deltaTime: number, scrollVelocity: number): void {
    const system = this.sparkSystem;
    if (!system) return;

    const attribute = system.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = attribute.array as Float32Array;
    const time = this.clock.getElapsedTime();
    const speedMultiplier = 1.0 + scrollVelocity * 9.0;
    const turbulence = scrollVelocity * 0.8;

    for (let i = 0; i < SPARKS.count; i++) {
      const idx = i * 3;
      const data = system.data[i];
      positions[idx] += data.speedX * deltaTime * speedMultiplier;
      positions[idx + 1] += data.speedY * deltaTime * speedMultiplier;
      positions[idx + 2] += data.speedZ * deltaTime * speedMultiplier;

      const currentSway = data.swayRadius * (1.0 + turbulence * 4.0);
      positions[idx] += Math.sin(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
      positions[idx + 2] += Math.cos(time * data.swaySpeed + data.phase) * currentSway * deltaTime;

      // recycle when out of bounds
      if (positions[idx + 1] > 3.0 || Math.abs(positions[idx]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
        positions[idx + 1] = -2.5;
        positions[idx] = (Math.random() - 0.5) * 3.0;
        positions[idx + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    attribute.needsUpdate = true;
  }

  private updateCamera(): void {
    const scroll = this.currentScroll;
    // Full 360° per turn => orbitTurns full revolutions across the page (2 = 720°).
    const phi = scroll * Math.PI * 2.0 * MOTION.orbitTurns;
    // Vertical arc repeats once per turn-cycle so each revolution gets its own rise.
    const lift = Math.sin(scroll * Math.PI * MOTION.orbitYCycles);
    const y = MOTION.orbit.baseY + lift * MOTION.orbit.yArc;
    const radius = MOTION.orbit.radius - lift * MOTION.orbit.radiusDip;
    const x = radius * Math.sin(phi);
    const z = radius * Math.cos(phi);

    // shift the framing left on the first screen to clear room for the text columns
    const transitionProgress = Math.min(1.0, scroll / MOTION.framingEaseEnd);
    const easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5; // 1.0 → 0.0
    const lookAtXOffset = MOTION.lookAtXOffset * easeFactor;

    const targetLookAt = new THREE.Vector3(lookAtXOffset, MOTION.lookAtY, 0);
    const targetPos = new THREE.Vector3(x, y, z);
    this.camera.position.lerp(targetPos, MOTION.cameraLerp);
    this.camera.lookAt(targetLookAt);
  }

  // ---------------------------------------------------------------- resize / teardown
  private onResize = (): void => {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
    this.uniforms.uResolution.value.set(this.sizes.width, this.sizes.height);
    // gl_FragCoord is in device pixels — keep the wave field identical on HiDPI.
    this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.sparkSystem?.dispose();
    this.bgMesh?.geometry.dispose();
    this.bgMaterial?.dispose();
    this.renderer.dispose();
  }
}
