import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export type Uniforms = Record<string, number | number[]>;

const VERT = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;

/** Shared header for every fragment shader: uv (0..1, y up), res, t (frame / 60), noise helpers, dither. */
export const HEAD = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o; uniform vec2 res; uniform float t; uniform float frame;
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vn(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
// +-1 LSB triangular dither, keyed to the whole frame: shaders work in float, so nothing bands.
vec3 dither(vec3 c){ vec2 q=gl_FragCoord.xy+floor(frame+.5)*vec2(7.,13.); float n=h21(q)+h21(q+11.3)-1.; return c+n/255.; }
vec3 srgb(vec3 c){ return mix(12.92*c,1.055*pow(max(c,vec3(1e-5)),vec3(1./2.4))-.055,step(.0031308,c)); }
`;

/**
 * A fragment shader as a pure function of the frame: compiled once, drawn synchronously for each
 * frame the renderer asks for, so it survives Freeze and the sub-frame motion-blur pass. Each mounted
 * Shader holds one GL context, so mount it only inside the Sequence of the act that uses it.
 */
export const Shader: React.FC<{
  frag: string;
  uniforms?: Uniforms;
  width?: number;
  height?: number;
  scale?: number;
  style?: React.CSSProperties;
  transparent?: boolean;
}> = ({ frag, uniforms = {}, width, height, scale = 1, style, transparent = false }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const w = width ?? W;
  const h = height ?? H;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ gl: WebGL2RenderingContext; prog: WebGLProgram; locs: Map<string, WebGLUniformLocation | null> } | null>(null);
  const key = useMemo(() => frag, [frag]);

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!state.current) {
      const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: transparent, premultipliedAlpha: true, powerPreference: 'high-performance' });
      if (!gl) throw new Error('Shader: no WebGL2');
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Shader: ${gl.getShaderInfoLog(s)}`);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`Shader: ${gl.getProgramInfoLog(prog)}`);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      state.current = { gl, prog, locs: new Map() };
    }
    const { gl, prog, locs } = state.current;
    const u = (name: string) => {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name));
      return locs.get(name) ?? null;
    };
    gl.viewport(0, 0, c.width, c.height);
    gl.useProgram(prog);
    gl.uniform2f(u('res'), c.width, c.height);
    gl.uniform1f(u('t'), frame / 60);
    gl.uniform1f(u('frame'), frame);
    for (const [k, v] of Object.entries(uniforms)) {
      if (typeof v === 'number') gl.uniform1f(u(k), v);
      else if (v.length === 2) gl.uniform2f(u(k), v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(u(k), v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(u(k), v[0], v[1], v[2], v[3]);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }, [frame, uniforms, key, transparent]);

  return <canvas ref={ref} width={Math.round(w * scale)} height={Math.round(h * scale)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, ...style }} />;
};
