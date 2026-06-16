import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import ContactForm from "@/components/ContactForm";

export default function Footer() {
  return (
    <>
      <footer className="main">
        <div>
          <div className="brand">
            <Image
              src="/assets/ea-monument.png"
              alt="Cosmo"
              width={56}
              height={56}
              className="footer-monument"
            />
            <span>Kuzko</span>
            <small>Cosmo · Est. 2024</small>
          </div>
        </div>
        <div>
          <h4>Store</h4>
          <Link href="/store">Vinyl</Link>
          <Link href="/store">Tape</Link>
          <Link href="/store">CD</Link>
          <Link href="/store">Books</Link>
          <Link href="/store">Merch</Link>
        </div>
        <ContactForm />
      </footer>
      <footer className="legal">
        <Link href={"/admin" as Route} style={{ color: "inherit", textDecoration: "none" }}>© 2026 Cosmo · All rights reserved</Link>
        <div className="v0-links">
          <a href="https://open.spotify.com/artist/0XVnumO54Q7ZnwubBDRCZU" target="_blank" rel="noopener noreferrer" className="v0-link" aria-label="Spotify">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.42a.62.62 0 0 1-.86.21c-2.35-1.44-5.31-1.76-8.79-.96a.625.625 0 1 1-.28-1.22c3.81-.87 7.08-.5 9.72 1.11.3.18.39.57.21.86zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.37.23.49.71.25 1.07zm.11-2.85C14.7 8.85 9.5 8.69 6.46 9.61a.935.935 0 1 1-.54-1.79c3.49-1.06 9.23-.85 12.86 1.31a.936.936 0 0 1-.96 1.6z" />
            </svg>
          </a>
          <a href="https://music.apple.com/us/artist/kuzko/1685769626" target="_blank" rel="noopener noreferrer" className="v0-link" aria-label="Apple Music">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 1.43c.04.93-.31 1.85-.92 2.52-.64.7-1.7 1.24-2.66 1.16-.11-.9.34-1.85.91-2.45.64-.69 1.76-1.2 2.67-1.23zM19.9 8.6c-.06.04-1.73.95-1.71 2.94.02 2.4 2.1 3.2 2.12 3.21-.02.06-.33 1.15-1.1 2.27-.66.97-1.35 1.93-2.43 1.95-1.06.02-1.4-.63-2.62-.63-1.21 0-1.59.61-2.59.65-1.04.04-1.83-1.04-2.5-2.01-1.36-1.97-2.4-5.57-1-8 .69-1.21 1.93-1.98 3.28-2 1.02-.02 1.99.69 2.62.69.62 0 1.8-.85 3.03-.73.52.02 1.96.21 2.89 1.59l-.01.01z" />
            </svg>
          </a>
          <a href="https://www.youtube.com/@wabiyo" target="_blank" rel="noopener noreferrer" className="v0-link" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
            </svg>
          </a>
        </div>
        <span>IG · BC · Discogs</span>
      </footer>

    </>
  );
}
