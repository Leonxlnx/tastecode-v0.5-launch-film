import { HEAD } from '../fx/Shader';

/** Fog: slow fbm banks drifting sideways, premultiplied white. `amt` density, `y` height of the bank (0 bottom..1 top). */
export const FOG = `${HEAD}
uniform float amt; uniform float y; uniform vec3 tint; uniform float scale; uniform float seed;
void main(){
  vec2 p = uv*vec2(res.x/res.y,1.)*scale + seed;
  float d = fbm(p*vec2(1.2,3.)+vec2(t*.05,0.)+fbm(p*1.3-vec2(t*.03,t*.015))*1.4);
  float band = smoothstep(y+.45,y-.1,uv.y);
  float f = clamp((d-.32)*2.1,0.,1.)*band*amt;
  o = vec4(dither(tint*f), f);
}`;

/** A slow flowing light field for type stages: two tones of one family, domain-warped drift, dithered. */
export const FIELD = `${HEAD}
uniform vec3 a; uniform vec3 b; uniform vec3 hi; uniform float speed; uniform float amp;
void main(){
  vec2 p = uv*vec2(res.x/res.y,1.)*1.2;
  float tt = t*speed;
  vec2 w = vec2(fbm(p+vec2(tt*.31,-tt*.2)), fbm(p+vec2(-tt*.17,tt*.27)+4.1));
  float f = fbm(p+w*1.6);
  float g = smoothstep(.25,.75,f);
  vec3 c = mix(a,b,g);
  c = mix(c,hi,amp*smoothstep(.56,.86,fbm(p*1.4+w*2.-vec2(tt*.2,0.))));
  o = vec4(dither(c),1.);
}`;

/** The film's colour helper for uniforms. */
export const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
