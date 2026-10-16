import { youtubeEmbedUrl, youtubeVideoId, youtubeWatchUrl } from './video';

describe('youtubeVideoId', () => {
  const id = 'dQw4w9WgXcQ';

  it('reads the common YouTube link forms', () => {
    for (const link of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=42s`,
      `https://m.youtube.com/watch?v=${id}`,
      `youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/live/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`,
    ]) {
      expect(youtubeVideoId(link)).toBe(id);
    }
  });

  it('rejects other sites, channels and broken ids', () => {
    for (const link of [
      '',
      'not a link',
      `https://vimeo.com/${id}`,
      `https://youtube.com.evil.com/watch?v=${id}`,
      'https://www.youtube.com/@SomeChannel',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=<script>xx',
    ]) {
      expect(youtubeVideoId(link)).toBeNull();
    }
  });

  it('builds the stored link and the privacy-mode player address', () => {
    expect(youtubeWatchUrl(id)).toBe(`https://www.youtube.com/watch?v=${id}`);
    expect(youtubeEmbedUrl(id)).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/,
    );
  });
});
