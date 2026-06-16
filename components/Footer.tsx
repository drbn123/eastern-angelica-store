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
        <span>Made in PL / Pressed in CZ</span>
        <span>IG · BC · Discogs</span>
      </footer>
    </>
  );
}
