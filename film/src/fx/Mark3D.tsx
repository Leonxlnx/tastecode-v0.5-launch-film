import React, { useLayoutEffect, useRef } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { MARK, MARK_VIEW } from '../brand/markPaths';

export type Mark3DPose = {
  yaw: number; // radians
  pitch: number;
  roll?: number;
  scale: number; // world units across the mark; the camera frames 10 units of height
  x?: number;
  y?: number;
  explode?: number; // 0 assembled, 1 pieces far apart along their own vectors
  /** Per-piece override in mark units (10 = the mark's height): offset, uniform scale, yaw. s 0 hides it. */
  parts?: Partial<Record<'roof' | 'left' | 'right' | 'dot', { x?: number; y?: number; z?: number; s?: number; yaw?: number; pitch?: number }>>;
  dispersion?: number;
  light?: number; // rotates the light rig, in turns
  exposure?: number;
  /** One pale band of spectral light inside the glass. `at`: the band's centre across the mark, in mark units. */
  spectrum?: { amount: number; at: number };
};

/**
 * The spectral pass: the band is drawn on the mark's own front surfaces, using the depth the silhouette
 * pass left, screened over the colour pass with alpha untouched. So it never leaves the object, face
 * normals break it at every crease and bevel, and each piece refracts it a little differently. R, G and
 * B are one gaussian at offsets that fan out along the band: colour only where it is bright and splits, and
 * only on its cool side (mint to steel), the warm side resolves to white.
 */
const BAND_VERT = 'varying vec3 vN; varying vec2 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalMatrix*normal; vP = mv.xy; gl_Position = projectionMatrix*mv; }';
const BAND_FRAG = `
uniform float uAmount, uAt, uUnits, uPart; uniform vec2 uCentre;
varying vec3 vN; varying vec2 vP;
float g(float x){ return exp(-x*x*4.5); }
void main(){
  vec3 n = normalize(vN);
  vec2 p = (vP - uCentre)*uUnits;
  const vec2 axis = vec2(.8,-.6);
  float u = (dot(p,axis) - uAt)/4.6 + dot(n.xy,axis)*.3 + uPart;
  float s = clamp(dot(p,vec2(.6,.8))/12. + .5, 0., 1.);
  float d = mix(.08,.3,smoothstep(.1,.95,1. - s));
  vec3 c = vec3(g(u - d), g(u), g(u + d*1.5));
  float lum = dot(c,vec3(.3,.5,.2));
  c = mix(vec3(lum), c, .9*smoothstep(.22,.62,lum)); // the falloff stays neutral: a dim split would read as brown
  c = mix(c, vec3(lum), .85*clamp((max(c.r,c.g) - c.b)*2.4, 0., 1.)); // the warm end goes to white light: no amber, tan or olive
  float face = smoothstep(.15,.8,n.z);
  c *= uAmount*mix(.95,.72,face);
  float dither = fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))) - .5;
  gl_FragColor = vec4(c + dither/255., 1.);
}`;
const BAND_PART: Record<string, number> = { roof: 0.0, left: 0.09, right: -0.07, dot: -0.12 };

/**
 * The film's studio: long softboxes on black. Reflections read as light, and the glass refracts
 * these same strips, so all its colour comes from dispersion rather than from a tinted material.
 */
const studioScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const box = (w: number, h: number, x: number, y: number, z: number, i: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  box(2.4, 22, -10, 1, 5, 16);
  box(1.2, 22, 10, -1, 4, 12);
  box(22, 1.4, 0, 10, 2, 14);
  box(14, 0.7, 0, -9, 5, 7);
  box(4, 4, 3, 3, 12, 1.6);
  // behind the object: a soft pool of light the glass is filled with, and strips it refracts
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 48, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 d; void main(){ float a = dot(normalize(d), normalize(vec3(.12,.1,-1.))); float g = smoothstep(.93,1.,a); gl_FragColor = vec4(vec3(.02 + .46*g*g),1.); }',
    }),
  );
  scene.add(dome);
  box(0.8, 20, 1.15, 0, -12, 7);
  box(0.3, 20, -1.3, 0, -12, 5);
  box(1.8, 20, -3.2, 0, -12, 2.5);
  box(20, 0.3, 0, 1.1, -12, 4);
  return scene;
};

const NAMES = ['roof', 'left', 'right', 'dot'] as const;
const CENTER = { x: MARK_VIEW.w / 2, y: 75 };
// Where each piece flies when exploded (unit vectors in icon space, y up).
const DIR: Record<(typeof NAMES)[number], [number, number, number]> = { roof: [0, 1, 0.5], left: [-1, -0.1, -0.3], right: [1, -0.1, 0.4], dot: [0, -1, 0] };

const piece = (name: (typeof NAMES)[number]) => {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK[name]}"/></svg>`);
  const shapes = SVGLoader.createShapes(data.paths[0]);
  // Flip the outline to y-up before extruding: a mirrored scale afterwards would turn the normals inward.
  const flipped = shapes.map((s) => new THREE.Shape(s.getPoints(64).map((p) => new THREE.Vector2(p.x - CENTER.x, CENTER.y - p.y)).reverse()));
  const raw = new THREE.ExtrudeGeometry(flipped, { depth: 11, bevelEnabled: true, bevelThickness: 3.4, bevelSize: 2.2, bevelOffset: -2, bevelSegments: 10, curveSegments: 12 });
  raw.translate(0, 0, -5.5);
  raw.deleteAttribute('uv');
  raw.deleteAttribute('normal');
  const merged = mergeVertices(raw, 1e-3);
  const geo = toCreasedNormals(merged, 0.62);
  const S = 10 / MARK_VIEW.h;
  geo.scale(S, S, S);
  return geo;
};

/**
 * The real mark as a physically lit glass or metal object, drawn with three.js as a pure function of
 * the pose. The canvas is transparent outside the silhouette, so it composites over any stage.
 */
export const Mark3D: React.FC<{ pose: Mark3DPose; width?: number; height?: number; material?: 'glass' | 'metal' }> = ({ pose, width, height, material = 'glass' }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const w = width ?? W;
  const h = height ?? H;
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<{ r: THREE.WebGLRenderer; s: THREE.Scene; cam: THREE.PerspectiveCamera; root: THREE.Group; parts: Record<string, THREE.Mesh>; mat: THREE.MeshPhysicalMaterial; sil: THREE.MeshBasicMaterial; band: Record<string, THREE.ShaderMaterial>; bandU: Record<string, THREE.IUniform> } | null>(null);

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!st.current) {
      const handle = delayRender('Mark3D setup');
      const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
      r.setPixelRatio(1);
      r.setSize(w, h, false);
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.outputColorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Scene();
      const rig = studioScene();
      const pm = new THREE.PMREMGenerator(r);
      s.environment = pm.fromScene(rig, 0.01).texture;
      pm.dispose();
      const cube = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      new THREE.CubeCamera(0.1, 100, cube).update(r, rig);
      s.background = cube.texture;
      const cam = new THREE.PerspectiveCamera(24, w / h, 0.1, 200);
      cam.position.set(0, 0, 26);
      const root = new THREE.Group();
      s.add(root);
      const mat = new THREE.MeshPhysicalMaterial(
        material === 'glass'
          ? { color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 3.2, ior: 1.5, dispersion: 8, attenuationColor: new THREE.Color(0xe9eeeb), attenuationDistance: 6, envMapIntensity: 1.1, specularIntensity: 1 }
          : { color: 0xe4e6e0, metalness: 1, roughness: 0.1, envMapIntensity: 1.4 },
      );
      const parts: Record<string, THREE.Mesh> = {};
      for (const n of NAMES) {
        parts[n] = new THREE.Mesh(piece(n), mat);
        root.add(parts[n]);
      }
      const sil = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bandU: Record<string, THREE.IUniform> = { uAmount: { value: 0 }, uAt: { value: 0 }, uUnits: { value: 1 }, uCentre: { value: new THREE.Vector2() } };
      const band: Record<string, THREE.ShaderMaterial> = {};
      for (const n of NAMES) {
        band[n] = new THREE.ShaderMaterial({
          vertexShader: BAND_VERT,
          fragmentShader: BAND_FRAG,
          uniforms: { ...bandU, uPart: { value: BAND_PART[n] } },
          transparent: true,
          depthWrite: false,
          depthFunc: THREE.LessEqualDepth,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -2,
          blending: THREE.CustomBlending,
          blendEquation: THREE.AddEquation,
          blendSrc: THREE.OneMinusDstColorFactor,
          blendDst: THREE.OneFactor,
          blendSrcAlpha: THREE.ZeroFactor,
          blendDstAlpha: THREE.OneFactor,
        });
      }
      st.current = { r, s, cam, root, parts, mat, sil, band, bandU };
      continueRender(handle);
    }
    const { r, s, cam, root, parts, mat, sil, band, bandU } = st.current;
    r.toneMappingExposure = pose.exposure ?? 1;
    root.scale.setScalar(pose.scale / 10);
    root.position.set(pose.x ?? 0, pose.y ?? 0, 0);
    root.rotation.set(pose.pitch, pose.yaw, pose.roll ?? 0);
    const ex = pose.explode ?? 0;
    for (const n of NAMES) {
      const d = DIR[n];
      const o = pose.parts?.[n];
      parts[n].position.set(d[0] * ex * 14 + (o?.x ?? 0), d[1] * ex * 14 + (o?.y ?? 0), d[2] * ex * 14 + (o?.z ?? 0));
      parts[n].rotation.set(d[1] * ex * 1.4 + (o?.pitch ?? 0), d[0] * ex * 1.8 + (o?.yaw ?? 0), d[2] * ex * 0.8);
      const sc = o?.s ?? 1;
      parts[n].visible = sc > 0.001;
      parts[n].scale.setScalar(Math.max(0.001, sc));
    }
    if (material === 'glass') mat.dispersion = pose.dispersion ?? 8;
    const turn = (pose.light ?? 0) * Math.PI * 2;
    s.environmentRotation.set(0, turn, 0);
    s.backgroundRotation.set(0, turn, 0);
    // Colour pass with the rig as background (the glass needs it to refract), then write alpha from
    // the silhouette alone, so the rig itself is never seen directly.
    r.autoClear = true;
    r.render(s, cam);
    const gl = r.getContext();
    const bg = s.background;
    const env = s.environment;
    s.background = null;
    s.environment = null;
    s.overrideMaterial = sil;
    r.autoClear = false;
    gl.colorMask(false, false, false, true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    r.state.buffers.color.setLocked(true);
    r.state.buffers.color.setMask(false);
    gl.colorMask(false, false, false, true);
    r.render(s, cam);
    r.state.buffers.color.setLocked(false);
    r.state.buffers.color.setMask(true);
    gl.colorMask(true, true, true, true);
    s.overrideMaterial = null;
    if (material === 'glass' && (pose.spectrum?.amount ?? 0) > 0.002) {
      bandU.uAmount.value = pose.spectrum!.amount;
      bandU.uAt.value = pose.spectrum!.at;
      bandU.uUnits.value = 10 / pose.scale;
      (bandU.uCentre.value as THREE.Vector2).set(pose.x ?? 0, pose.y ?? 0);
      for (const n of NAMES) parts[n].material = band[n];
      r.render(s, cam);
      for (const n of NAMES) parts[n].material = mat;
    }
    s.background = bg;
    s.environment = env;
    gl.finish();
  }, [frame, pose, w, h, material]);

  return <canvas ref={ref} width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} />;
};
