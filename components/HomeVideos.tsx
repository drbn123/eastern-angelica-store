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
    <section className="home-videos">
      <div className="home-videos-hd">
        <span className="home-videos-label">Videos</span>
        <Link href="/videos" className="home-videos-all">→ All videos</Link>
      </div>
      <div className="home-videos-grid">
        {videos.map((v) => (
          <Link key={v.videoId} href="/videos" className="home-video-item">
            <div className="home-video-thumb">
              <Image
                src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                alt={v.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              <div className="home-video-play">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="home-video-meta">
              <span className="home-video-title">{v.title}</span>
              <span className="home-video-date">{formatDate(v.published)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
