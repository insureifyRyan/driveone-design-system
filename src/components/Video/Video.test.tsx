import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Video, type VideoHandle } from './Video';

const defaultSrc = 'https://example.com/video.mp4';

describe('Video', () => {
  it('renders the video element', () => {
    render(<Video src={defaultSrc} />);
    expect(screen.getByTestId('video-element')).toBeInTheDocument();
  });

  it('renders the container element', () => {
    render(<Video src={defaultSrc} />);
    expect(screen.getByTestId('video-container')).toBeInTheDocument();
  });

  it('renders a single string src as a <source> element', () => {
    const { container } = render(<Video src={defaultSrc} />);
    const source = container.querySelector('source');
    expect(source).toHaveAttribute('src', defaultSrc);
  });

  it('renders multiple VideoSource objects', () => {
    const sources = [
      { src: 'video.mp4', type: 'video/mp4' },
      { src: 'video.webm', type: 'video/webm' },
    ];
    const { container } = render(<Video src={sources} />);
    const sourceEls = container.querySelectorAll('source');
    expect(sourceEls).toHaveLength(2);
    expect(sourceEls[0]).toHaveAttribute('src', 'video.mp4');
    expect(sourceEls[1]).toHaveAttribute('src', 'video.webm');
  });

  it('sets the poster attribute', () => {
    render(<Video src={defaultSrc} poster="poster.jpg" />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('poster', 'poster.jpg');
  });

  it('shows controls by default', () => {
    render(<Video src={defaultSrc} />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('controls');
  });

  it('hides controls when controls=false', () => {
    render(<Video src={defaultSrc} controls={false} />);
    expect(screen.getByTestId('video-element')).not.toHaveAttribute('controls');
  });

  it('sets muted property', () => {
    render(<Video src={defaultSrc} muted />);
    // React sets `muted` as a DOM property, not an HTML attribute, in jsdom.
    expect((screen.getByTestId('video-element') as HTMLVideoElement).muted).toBe(true);
  });

  it('sets loop attribute', () => {
    render(<Video src={defaultSrc} loop />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('loop');
  });

  it('sets preload attribute', () => {
    render(<Video src={defaultSrc} preload="none" />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('preload', 'none');
  });

  it('applies aria-label', () => {
    render(<Video src={defaultSrc} ariaLabel="Tutorial video" />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('aria-label', 'Tutorial video');
  });

  it('applies a custom className to the container', () => {
    render(<Video src={defaultSrc} className="my-video" />);
    expect(screen.getByTestId('video-container')).toHaveClass('my-video');
  });

  it('applies fluid width by default', () => {
    render(<Video src={defaultSrc} />);
    expect(screen.getByTestId('video-container')).toHaveStyle({ width: '100%' });
  });

  it('applies custom width', () => {
    render(<Video src={defaultSrc} fluid={false} width={640} />);
    expect(screen.getByTestId('video-container')).toHaveStyle({ width: '640px' });
  });

  it('applies the correct aspect ratio style', () => {
    render(<Video src={defaultSrc} aspectRatio="4/3" />);
    expect(screen.getByTestId('video-container')).toHaveStyle({ aspectRatio: '4 / 3' });
  });

  it('renders text tracks', () => {
    const tracks = [
      { src: 'en.vtt', kind: 'captions' as const, srcLang: 'en', label: 'English', default: true },
    ];
    const { container } = render(<Video src={defaultSrc} tracks={tracks} />);
    const track = container.querySelector('track');
    expect(track).toHaveAttribute('kind', 'captions');
    expect(track).toHaveAttribute('srclang', 'en');
    expect(track).toHaveAttribute('label', 'English');
  });

  it('calls onPlay when play event fires', async () => {
    const onPlay = vi.fn();
    render(<Video src={defaultSrc} onPlay={onPlay} />);
    const videoEl = screen.getByTestId('video-element');
    videoEl.dispatchEvent(new Event('play', { bubbles: true }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when pause event fires', () => {
    const onPause = vi.fn();
    render(<Video src={defaultSrc} onPause={onPause} />);
    const videoEl = screen.getByTestId('video-element');
    videoEl.dispatchEvent(new Event('pause', { bubbles: true }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onEnded when ended event fires', () => {
    const onEnded = vi.fn();
    render(<Video src={defaultSrc} onEnded={onEnded} />);
    const videoEl = screen.getByTestId('video-element');
    videoEl.dispatchEvent(new Event('ended', { bubbles: true }));
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('exposes imperative handle via ref', () => {
    const ref = createRef<VideoHandle>();
    render(<Video src={defaultSrc} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.play).toBe('function');
    expect(typeof ref.current?.pause).toBe('function');
    expect(typeof ref.current?.seek).toBe('function');
    expect(typeof ref.current?.currentTime).toBe('number');
    expect(typeof ref.current?.duration).toBe('number');
    expect(typeof ref.current?.paused).toBe('boolean');
  });

  it('sets playsInline on the video element for mobile compatibility', () => {
    render(<Video src={defaultSrc} />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('playsinline');
  });
});
