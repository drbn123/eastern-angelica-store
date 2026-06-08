import VideoGrid from "@/components/VideoGrid";

const CHANNEL_ID = "UCUMBjZdeg-7RnXatIRU2AGw";

interface Video {
  videoId: string;
  title: string;
  published: string;
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
    videos = parseRSS(xml);
  } catch {
    // show empty grid if fetch fails
  }

  return (
    <main className="videos-page">
      <div className="videos-hd">
        <h1>
          <i>Videos —</i> <b>WABIYO channel.</b>
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
