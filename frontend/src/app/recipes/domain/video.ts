/** YouTube video ids are exactly 11 characters: letters, digits, `-` and `_`. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'];

/**
 * The video id of a YouTube link, or `null` if it isn't one. Accepts the usual forms:
 * `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/shorts/…`, `/live/…`, `/embed/…`,
 * with or without `https://`, `www.` or `m.`.
 */
export function youtubeVideoId(input: string | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;

  const [first, second] = url.pathname.split('/').filter(Boolean);
  const id =
    host === 'youtu.be' || host.endsWith('.youtu.be')
      ? first
      : first === 'watch'
        ? url.searchParams.get('v')
        : ['shorts', 'live', 'embed', 'v'].includes(first ?? '')
          ? second
          : null;
  return id && VIDEO_ID.test(id) ? id : null;
}

/** The link stored on the recipe, always in the same form. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * The player address. Uses YouTube's privacy-enhanced domain and starts playing right away,
 * because it's only loaded after the user pressed play.
 */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}
