# DriveOne Design System

The DriveOne Design System provides accessible, composable UI components and design tokens for DriveOne Video products.

## Installation

```bash
npm install @driveone/design-system
```

> **Peer dependencies:** `react` ≥ 16.8 and `react-dom` ≥ 16.8 must be installed in your project.

---

## Components

### `<Video />`

The primary media component. Wraps the native `<video>` element with consistent styling, multiple-source support, text-track support, and an imperative ref API.

#### Basic usage

```tsx
import { Video } from '@driveone/design-system';

<Video
  src="https://example.com/clip.mp4"
  poster="https://example.com/poster.jpg"
  controls
  aspectRatio="16/9"
/>
```

#### Multiple source formats

```tsx
<Video
  src={[
    { src: 'clip.mp4', type: 'video/mp4' },
    { src: 'clip.webm', type: 'video/webm' },
  ]}
  controls
/>
```

#### With captions

```tsx
<Video
  src="clip.mp4"
  tracks={[
    { src: 'captions-en.vtt', kind: 'captions', srcLang: 'en', label: 'English', default: true },
  ]}
  controls
/>
```

#### Imperative control via ref

```tsx
import { useRef } from 'react';
import { Video, type VideoHandle } from '@driveone/design-system';

function Player() {
  const ref = useRef<VideoHandle>(null);

  return (
    <>
      <Video src="clip.mp4" ref={ref} controls={false} />
      <button onClick={() => ref.current?.play()}>Play</button>
      <button onClick={() => ref.current?.pause()}>Pause</button>
    </>
  );
}
```

#### Props

| Prop               | Type                                              | Default      | Description                                      |
| ------------------ | ------------------------------------------------- | ------------ | ------------------------------------------------ |
| `src`              | `string \| VideoSource[]`                         | **required** | Video source URL(s)                              |
| `poster`           | `string`                                          | —            | Poster image shown before playback               |
| `aspectRatio`      | `'16/9' \| '4/3' \| '1/1' \| '9/16' \| '21/9'`  | `'16/9'`     | Aspect ratio of the video container              |
| `controls`         | `boolean`                                         | `true`       | Show native browser controls                     |
| `autoPlay`         | `boolean`                                         | `false`      | Autoplay (requires `muted` in most browsers)     |
| `muted`            | `boolean`                                         | `false`      | Mute audio by default                            |
| `loop`             | `boolean`                                         | `false`      | Loop when the video ends                         |
| `preload`          | `'none' \| 'metadata' \| 'auto'`                  | `'metadata'` | Preload strategy                                 |
| `ariaLabel`        | `string`                                          | —            | Accessible label for the video element           |
| `tracks`           | `VideoTrack[]`                                    | —            | Subtitles / captions / description tracks        |
| `fluid`            | `boolean`                                         | `true`       | Stretch to fill container width                  |
| `width`            | `string \| number`                                | —            | Fixed width (overrides `fluid`)                  |
| `height`           | `string \| number`                                | —            | Fixed height                                     |
| `className`        | `string`                                          | —            | Additional CSS class on the wrapper `<div>`      |
| `onPlay`           | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when playback starts                       |
| `onPause`          | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when playback is paused                    |
| `onEnded`          | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when playback finishes                     |
| `onLoadedMetadata` | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when metadata has loaded                   |
| `onLoadStart`      | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when loading begins                        |
| `onCanPlay`        | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired when the video can be played               |
| `onError`          | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired on playback error                          |
| `onTimeUpdate`     | `ReactEventHandler<HTMLVideoElement>`             | —            | Fired as the playback position changes           |

---

## Design Tokens

Import tokens directly for use in custom components or CSS-in-JS solutions.

```ts
import { tokens } from '@driveone/design-system';

// colors
tokens.colors.brandPrimary   // '#0033A0'
tokens.colors.brandSecondary // '#00C2E0'

// spacing
tokens.spacing[4]  // '1rem'

// aspect ratios
tokens.aspectRatios['16/9']  // '16 / 9'
```

Available token groups: `colors`, `spacing`, `typography`, `borderRadius`, `shadows`, `aspectRatios`, `zIndex`, `transitions`.

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Build the library
npm run build

# Start Storybook
npm run storybook
```
