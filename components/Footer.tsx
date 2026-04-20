import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer className="main">
        <div>
          <div className="brand">
            <Image
              src="/assets/ea-monument.png"
              alt="EA"
              width={56}
              height={56}
              className="footer-monument"
            />
            <span>Eastern</span>
            <span>Angelica</span>
            <small>EA Recordings · Est. 2024</small>
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
        <div>
          <h4>Label</h4>
          <Link href="/label">About</Link>
          <Link href="/artists">Artists</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/label">Press</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/label">Shipping</Link>
          <Link href="/label">Returns</Link>
          <Link href="/label">Contact</Link>
          <Link href="/label">FAQ</Link>
        </div>
      </footer>
      <footer className="legal">
        <span>© 2026 EA Recordings · All rights reserved</span>
        <span>Made in PL / Pressed in CZ</span>
        <span>IG · BC · Discogs</span>
      </footer>
    </>
  );
}
