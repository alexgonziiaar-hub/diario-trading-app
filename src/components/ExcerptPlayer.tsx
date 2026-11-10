import { useEffect, useRef, useState } from 'react';
import type { Question } from '../data/types';
import { formatHMS, formatMS, toSeconds } from '../lib/format';
import { loadYouTubeApi, type YTPlayer } from '../lib/youtube';
import { PauseIcon, PlayIcon } from './Icon';

const SPEEDS = [1, 1.5, 2];

/** Dibujo de velas que hace de pantalla cuando no hay vídeo real */
function ChartArt() {
  const candles: [number, number, number, number, boolean][] = [
    [112, 146, 120, 20, true], [104, 134, 110, 18, true], [106, 128, 112, 10, false], [90, 118, 96, 18, true],
    [78, 104, 84, 16, true], [62, 92, 70, 18, true], [40, 78, 64, 10, true], [42, 76, 62, 10, false],
    [60, 84, 66, 14, false], [72, 104, 78, 20, false], [90, 114, 94, 16, false], [100, 130, 104, 20, false],
    [108, 126, 112, 8, true], [112, 142, 116, 20, false]
  ];
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="player__art">
      <line x1="0" y1="42" x2="320" y2="42" className="player__level" strokeDasharray="4 4" />
      {candles.map(([wTop, wBot, bTop, bH, up], i) => {
        const x = 14 + i * 21;
        const c = up ? '#2E5A45' : '#5A2E33';
        return (
          <g key={i}>
            <line x1={x + 5.5} y1={wTop} x2={x + 5.5} y2={wBot} stroke={c} strokeWidth="1.2" />
            <rect x={x} y={bTop} width="11" height={bH} fill={c} />
          </g>
        );
      })}
    </svg>
  );
}

export function ExcerptPlayer({ question, youtubeId }: { question: Question; youtubeId?: string }) {
  const start = toSeconds(question.start);
  const len = question.len;
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [ytError, setYtError] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const useYT = !!youtubeId && !ytError;

  useEffect(() => {
    setPos(0);
    setPlaying(false);
  }, [question.id]);

  // Reloj del reproductor de demostración
  useEffect(() => {
    if (useYT || !playing) return;
    const id = window.setInterval(() => setPos((p) => Math.min(len, p + 0.25 * speed)), 250);
    return () => window.clearInterval(id);
  }, [useYT, playing, speed, len]);

  useEffect(() => {
    if (!useYT && playing && pos >= len) setPlaying(false);
  }, [useYT, playing, pos, len]);

  // Vídeo real de YouTube, limitado al fragmento
  useEffect(() => {
    if (!youtubeId || !hostRef.current) return;
    let cancelled = false;
    let poll = 0;
    const mount = document.createElement('div');
    hostRef.current.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        yt.current = new YT.Player(mount, {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: { start, end: start + len, playsinline: 1, rel: 0, modestbranding: 1, controls: 0 },
          events: { onStateChange: (e) => setPlaying(e.data === YT.PlayerState.PLAYING) }
        });
        poll = window.setInterval(() => {
          const p = yt.current;
          if (p && typeof p.getCurrentTime === 'function') setPos(Math.max(0, Math.min(len, p.getCurrentTime() - start)));
        }, 250);
      })
      .catch(() => {
        if (!cancelled) setYtError(true);
      });
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      try {
        yt.current?.destroy();
      } catch {
        /* el reproductor ya no existe */
      }
      yt.current = null;
      mount.remove();
    };
  }, [youtubeId, question.id, start, len]);

  const toggle = () => {
    if (useYT) {
      const p = yt.current;
      if (!p) return;
      if (playing) p.pauseVideo();
      else {
        if (pos >= len - 0.3) p.seekTo(start, true);
        p.playVideo();
      }
      return;
    }
    if (playing) setPlaying(false);
    else {
      if (pos >= len) setPos(0);
      setPlaying(true);
    }
  };

  const seek = (t: number) => {
    const v = Math.max(0, Math.min(len, t));
    setPos(v);
    if (useYT) yt.current?.seekTo(start + v, true);
  };

  const cycleSpeed = () => {
    const ns = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(ns);
    if (useYT) yt.current?.setPlaybackRate(ns);
  };

  const active = playing || pos > 0;
  let cur = 0;
  question.segments.forEach((s, i) => {
    if (s.t <= pos) cur = i;
  });
  const speedLabel = String(speed).replace('.', ',') + 'x';
  const playLabel = playing ? 'Pausar el fragmento' : 'Reproducir el fragmento del directo';

  return (
    <div className="player">
      <div className="player__screen">
        {useYT ? (
          <div ref={hostRef} className="player__yt" />
        ) : (
          <button type="button" className="player__sim" onClick={toggle} aria-label={playLabel}>
            <ChartArt />
            {active && <span className="player__mask" style={{ left: `${(pos / len) * 100}%` }} />}
            {!playing && (
              <span className="player__big">
                <PlayIcon size={22} />
              </span>
            )}
          </button>
        )}
        <span className="player__ts mono">{formatHMS(start + (active ? pos : 0))}</span>
        {active && (
          <span className="player__cc">
            <span>{question.segments[cur].text}</span>
          </span>
        )}
      </div>

      <div className="player__controls">
        <button type="button" className="player__play" onClick={toggle} aria-label={playLabel}>
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <span className="player__time mono">
          {formatMS(pos)} / {formatMS(len)}
        </span>
        <input
          type="range"
          className="player__range"
          min={0}
          max={len}
          step={0.25}
          value={pos}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Posición del fragmento"
        />
        <button type="button" className="player__speed mono" onClick={cycleSpeed} aria-label={`Velocidad de reproducción: ${speedLabel}`}>
          {speedLabel}
        </button>
      </div>
      {!youtubeId && <p className="player__note">Vídeo de demostración. Con el enlace de YouTube del directo se reproduce el fragmento real.</p>}
      {ytError && <p className="player__note">No se pudo cargar el vídeo. Revisa tu conexión; la transcripción sigue disponible.</p>}

      <div className="transcript">
        <span className="transcript__hint">Toca una frase para ir a ese momento</span>
        {question.segments.map((s, i) => (
          <button
            key={i}
            type="button"
            className="transcript__line"
            data-state={!active ? 'idle' : i === cur ? 'current' : i < cur ? 'past' : 'future'}
            onClick={() => seek(s.t)}
          >
            <span className="transcript__ts mono">{formatHMS(start + s.t).slice(1)}</span>
            <span>{s.key ? <mark>{s.text}</mark> : s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
