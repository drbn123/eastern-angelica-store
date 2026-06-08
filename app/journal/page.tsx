import { readPosts } from "@/lib/posts";
import Footer from "@/components/Footer";
import Image from "next/image";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function JournalPage() {
  const posts = readPosts();

  return (
    <>
      <main className="journal-page">
        <div className="journal-hd">
          <h1>
            <i>Journal —</i> <b>notes & studio.</b>
          </h1>
        </div>

        {posts.length === 0 ? (
          <p className="journal-empty">Nothing posted yet.</p>
        ) : (
          <div className="journal-feed">
            {posts.map((p) => (
              <article key={p.id} className="journal-post">
                <div className="journal-post-meta">
                  <Image src="/assets/ea-monument.png" alt="EA" width={28} height={28} className="journal-avatar" />
                  <div>
                    <span className="journal-author">Kuzko</span>
                    <span className="journal-date">{formatDate(p.createdAt)}</span>
                  </div>
                </div>
                {p.text && <p className="journal-post-text">{p.text}</p>}
                {p.images.length > 0 && (
                  <div className={`journal-post-images count-${Math.min(p.images.length, 4)}`}>
                    {p.images.map((url, i) => (
                      <div key={i} className="journal-post-img">
                        <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
