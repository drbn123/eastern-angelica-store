import type { Metadata } from "next";
import VideoGrid from "@/components/VideoGrid";

export const metadata: Metadata = {
  title: "Videos",
  description: "Music videos and visual work by KUZKO.",
};

const CHANNEL_ID = "UCUMBjZdeg-7RnXatIRU2AGw";

interface Video {
  videoId: string;
  title: string;
  published: string;
}

// The WABIYO channel hosts several artists (Kuzko, Luca Dixon, WABIYO…) and
// titles follow an "Artist - Track" format. Keep only tracks whose lead artist
// is Kuzko — this includes his "(ft. …)" tracks and excludes ones where Kuzko
// is only a guest.
function isByKuzko(title: string): boolean {
  const artist = title.split(/\s[-–—]\s/)[0].trim().toLowerCase();
  return /^kuzko\b/.test(artist);
}

function parseRSS(xml: string): Video[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
  return entries.map((entry) => ({
    videoId: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
    title: entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? "",
    published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
  })).filter((v) => v.videoId);
}

export const revalidate = 3600;

export default async function VideosPage() {
  let videos: Video[] = [];
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 3600 } }
    );
    const xml = await res.text();
    videos = parseRSS(xml).filter((v) => isByKuzko(v.title));
  } catch {
    // show empty grid if fetch fails
  }

  return (
    <main className="videos-page">
      <div className="videos-hd">
        <h1>
          <i>Videos —</i> <b>Kuzko.</b>
        </h1>
        <p className="videos-sub">
          {videos.length > 0
            ? `${videos.length} videos`
            : "Could not load videos — try refreshing."}
        </p>
      </div>
      <VideoGrid videos={videos} />
    </main>
  );
}
