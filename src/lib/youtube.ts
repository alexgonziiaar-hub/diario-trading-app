/** Carga mínima de la API de YouTube para reproducir el fragmento exacto del directo. */

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTPlayerOptions {
  videoId: string;
  width?: string;
  height?: string;
  playerVars?: Record<string, number | string>;
  events?: { onStateChange?: (e: { data: number }) => void };
}

export interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let pending: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(timeoutMs = 10000): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise<YTNamespace>((resolve, reject) => {
    const fail = (err: Error) => {
      window.clearTimeout(timer);
      pending = null;
      reject(err);
    };
    const timer = window.setTimeout(() => fail(new Error('YouTube no respondió a tiempo')), timeoutMs);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (window.YT) resolve(window.YT);
      else fail(new Error('API de YouTube no disponible'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      script.remove();
      fail(new Error('No se pudo cargar YouTube'));
    };
    document.head.appendChild(script);
  });
  return pending;
}
