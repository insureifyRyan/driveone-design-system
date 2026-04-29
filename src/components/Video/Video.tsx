import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import styles from './Video.module.css';

export interface VideoSource {
  src: string;
  type?: string;
}

export interface VideoTrack {
  src: string;
  kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  srcLang?: string;
  label?: string;
  default?: boolean;
}

export type VideoAspectRatio = '16/9' | '4/3' | '1/1' | '9/16' | '21/9';

export interface VideoHandle {
  play: () => Promise<void> | undefined;
  pause: () => void;
  seek: (time: number) => void;
  readonly currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
}

export interface VideoProps {
  /** Video source URL or array of sources for multiple formats */
  src: string | VideoSource[];
  /** Poster image shown before the video plays */
  poster?: string;
  /** Aspect ratio of the video container */
  aspectRatio?: VideoAspectRatio;
  /** Show native browser controls */
  controls?: boolean;
  /** Start playing automatically (requires muted in most browsers) */
  autoPlay?: boolean;
  /** Mute audio by default */
  muted?: boolean;
  /** Loop the video when it ends */
  loop?: boolean;
  /** Preload strategy */
  preload?: 'none' | 'metadata' | 'auto';
  /** Accessible label describing the video content */
  ariaLabel?: string;
  /** Text tracks (subtitles, captions, etc.) */
  tracks?: VideoTrack[];
  /** Fill the width of its container */
  fluid?: boolean;
  /** Custom width (overrides fluid) */
  width?: string | number;
  /** Custom height */
  height?: string | number;
  /** Additional CSS class name */
  className?: string;
  /** Called when the video starts playing */
  onPlay?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when the video is paused */
  onPause?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when the video ends */
  onEnded?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when the video metadata has loaded */
  onLoadedMetadata?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when the video data starts loading */
  onLoadStart?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when the video can be played */
  onCanPlay?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when a playback error occurs */
  onError?: React.ReactEventHandler<HTMLVideoElement>;
  /** Called when playback time updates */
  onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
}

function normalizeSources(src: string | VideoSource[]): VideoSource[] {
  if (typeof src === 'string') {
    return [{ src }];
  }
  return src;
}

function aspectRatioCSSValue(ratio: VideoAspectRatio): string {
  return ratio.replace('/', ' / ');
}

/**
 * `Video` is the primary media component of the DriveOne design system.
 * It wraps the native `<video>` element with consistent styling, accessibility
 * defaults, and support for multiple source formats and text tracks.
 *
 * @example
 * ```tsx
 * <Video src="https://example.com/clip.mp4" controls aspectRatio="16/9" />
 * ```
 */
const Video = forwardRef<VideoHandle, VideoProps>(function Video(
  {
    src,
    poster,
    aspectRatio = '16/9',
    controls = true,
    autoPlay = false,
    muted = false,
    loop = false,
    preload = 'metadata',
    ariaLabel,
    tracks,
    fluid = true,
    width,
    height,
    className,
    onPlay,
    onPause,
    onEnded,
    onLoadedMetadata,
    onLoadStart,
    onCanPlay,
    onError,
    onTimeUpdate,
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    get currentTime() {
      return videoRef.current?.currentTime ?? 0;
    },
    get duration() {
      return videoRef.current?.duration ?? 0;
    },
    get paused() {
      return videoRef.current?.paused ?? true;
    },
  }));

  const sources = normalizeSources(src);

  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatioCSSValue(aspectRatio),
    width: width ?? (fluid ? '100%' : undefined),
    height: height ?? undefined,
  };

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(' ')}
      style={containerStyle}
      data-testid="video-container"
    >
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload={preload}
        playsInline
        aria-label={ariaLabel}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onLoadedMetadata={onLoadedMetadata}
        onLoadStart={onLoadStart}
        onCanPlay={onCanPlay}
        onError={onError}
        onTimeUpdate={onTimeUpdate}
        data-testid="video-element"
      >
        {sources.map(({ src: sourceSrc, type }) => (
          <source key={sourceSrc} src={sourceSrc} type={type} />
        ))}
        {tracks?.map((track) => (
          <track
            key={`${track.kind}-${track.srcLang ?? ''}`}
            kind={track.kind}
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            default={track.default}
          />
        ))}
      </video>
    </div>
  );
});

Video.displayName = 'Video';

export { Video };
export default Video;
