import type { Meta, StoryObj } from '@storybook/react';
import { Video } from './Video';

const meta: Meta<typeof Video> = {
  title: 'Components/Video',
  component: Video,
  tags: ['autodocs'],
  argTypes: {
    aspectRatio: {
      control: { type: 'select' },
      options: ['16/9', '4/3', '1/1', '9/16', '21/9'],
    },
    preload: {
      control: { type: 'select' },
      options: ['none', 'metadata', 'auto'],
    },
  },
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    controls: true,
    aspectRatio: '16/9',
    fluid: true,
    muted: false,
    loop: false,
    autoPlay: false,
    preload: 'metadata',
  },
};

export default meta;
type Story = StoryObj<typeof Video>;

export const Default: Story = {};

export const WithoutControls: Story = {
  args: {
    controls: false,
    autoPlay: true,
    muted: true,
    loop: true,
  },
};

export const FourByThree: Story = {
  name: '4:3 Aspect Ratio',
  args: {
    aspectRatio: '4/3',
  },
};

export const Square: Story = {
  name: '1:1 Aspect Ratio',
  args: {
    aspectRatio: '1/1',
  },
};

export const Ultrawide: Story = {
  name: '21:9 Aspect Ratio',
  args: {
    aspectRatio: '21/9',
  },
};

export const MultipleSources: Story = {
  args: {
    src: [
      {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'video/mp4',
      },
      {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.webm',
        type: 'video/webm',
      },
    ],
  },
};

export const WithCaptions: Story = {
  args: {
    tracks: [
      {
        src: 'https://example.com/captions-en.vtt',
        kind: 'captions',
        srcLang: 'en',
        label: 'English',
        default: true,
      },
    ],
  },
};

export const FixedSize: Story = {
  args: {
    fluid: false,
    width: 480,
    height: 270,
  },
};

export const Looping: Story = {
  args: {
    loop: true,
    autoPlay: true,
    muted: true,
    controls: false,
  },
};
