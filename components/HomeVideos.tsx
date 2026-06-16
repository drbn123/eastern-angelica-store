import Image from "next/image";
import Link from "next/link";

interface Video {
  videoId: string;
  title: string;
  published: string;
}

const CHANNEL_ID = "UCUMBjZdeg-7RnXatIRU2AGw";

function isByKuzko(title: string) {
  const artist = title.split(/\s[-–—]\s/)[0].trim().toLowerCase();
  return /^kuzko\b/.test(artist);
}

function parseRSS(xml: string): Video[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
  return entries
    .map((entry) => ({
      videoId: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
      title: entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? "",
      published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
    }))
    .filter((v) => v.videoId);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short" });
  } catch {
    return iso.slice(0, 7);
  }
}

export default async function HomeVideos() {
  let videos: Video[] = [];
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 3600 } }
    );
    videos = parseRSS(await res.text())
      .filter((v) => isByKuzko(v.title))
      .slice(0, 3);
  } catch {
    return null;
  }

  if (!videos.length) return null;

  return (
    <div className="v0-video-strip">
      <span className="v0-vs-label">Videos</span>
      <div className="v0-vs-thumbs">
        {videos.map((v) => (
          <Link key={v.videoId} href="/videos" className="v0-vs-item">
            <div className="v0-vs-thumb">
              <Image
                src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                alt={v.title}
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
              />
              <div className="v0-vs-play">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div className="v0-vs-info">
              <span className="v0-vs-title">{v.title}</span>
              <span className="v0-vs-date">{formatDate(v.published)}</span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/videos" className="v0-vs-all">→ All</Link>
    </div>
  );
}
