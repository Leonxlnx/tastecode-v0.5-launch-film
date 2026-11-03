import React from 'react';
import { getInputProps, Img } from 'remotion';
import { SITE_STILLS, SITE_TAKES } from '../data/sites';
import { fd } from '../lib/anim';
import { FOOTAGE } from './kit';

/**
 * Leon's sites, filmed frame by frame by tools/capture/site-rec.mjs (shown as design work in the film), and his
 * X recordings. Takes live on the footage server like the app clips: footage/sites/<site>/<take>/<prefix>00000.png,
 * with long-side-1280 JPEG proxies in <take>/proxy/<prefix>00000.jpg. Ids are "<site>/<take>" (SITE_TAKES, written
 * by tools/sitemeta.mjs); the X recordings are "x/<take>" (prefix "f_", w x h their crop, dpr 1).
 */

let PROXIES: boolean | null = null;
/**
 * True when the render was started with --props='{"proxies":true}' (the half-res previews). Every site frame then
 * comes from its proxy, whatever `proxy` asks: at --scale=0.5 the film is 960 px wide and a 1280 proxy covers it.
 * Read once per tab (FilmSub's props can be large).
 */
export const siteProxies = () => {
  if (PROXIES === null) {
    try {
      PROXIES = (getInputProps() as { proxies?: unknown }).proxies === true;
    } catch {
      PROXIES = false;
    }
  }
  return PROXIES;
};

export const siteTake = (id: string) => {
  const m = SITE_TAKES[id];
  if (!m) throw new Error(`no site take "${id}"`);
  return m;
};

/** The take frame shown for a (fractional) frame: fd() so motion-blur sub-samples agree, held at both ends. */
export const siteFrame = (id: string, frame: number) => {
  const m = siteTake(id);
  return Math.max(0, Math.min(m.frames - 1, fd(frame)));
};

/** URL of one frame: the proxy when asked (or in a proxies preview) and the take has one, else the master. */
export const siteUrl = (id: string, frame: number, proxy = false) => {
  const m = siteTake(id);
  const i = `${m.prefix ?? ''}${String(siteFrame(id, frame)).padStart(5, '0')}`;
  return (proxy || siteProxies()) && m.proxy ? `${FOOTAGE}/sites/${id}/proxy/${i}.jpg` : `${FOOTAGE}/sites/${id}/${i}.${m.ext}`;
};

/** The page's scroll position (CSS px) on a take's frame: for film-side marks that ride with the page. */
export const siteScroll = (id: string, frame: number) => {
  const m = siteTake(id);
  return m.scroll ? m.scroll[siteFrame(id, frame)] : (m.y ?? 0);
};

/** full: every part of the page once (sticky off); full-scrolled: pinned scenes as scrolled; hero: the first viewport. */
export const siteStillUrl = (site: string, part: 'full' | 'full-scrolled' | 'hero' = 'full', ext: 'jpg' | 'png' = 'jpg') => {
  if (!SITE_STILLS[site]) throw new Error(`no stills for site "${site}"`);
  return `${FOOTAGE}/sites/${site}/stills/${part}.${ext}`;
};

/**
 * One frame of a site take at the site's own CSS size (default w x h from the meta), so positions inside it are the
 * page's CSS px. Scale it with a parent transform. `proxy` for tiles under about 1000 px on screen; a proxies
 * preview uses the proxy everywhere. `width`/`height` with `style.objectFit` for cards of another size.
 */
export const SiteClip: React.FC<{ id: string; frame: number; proxy?: boolean; style?: React.CSSProperties; width?: number; height?: number }> = ({ id, frame, proxy = false, style, width, height }) => {
  const m = siteTake(id);
  return <Img src={siteUrl(id, frame, proxy)} style={{ display: 'block', width: width ?? m.w, height: height ?? m.h, ...style }} />;
};
