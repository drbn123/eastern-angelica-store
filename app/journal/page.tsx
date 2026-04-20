import Footer from "@/components/Footer";

export default function JournalPage() {
  return (
    <>
      <section
        style={{
          padding: "80px 40px",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontStyle: "italic",
            fontSize: "clamp(48px, 8vw, 120px)",
            lineHeight: 1,
          }}
        >
          Journal
        </h1>
        <p
          style={{
            maxWidth: "52ch",
            color: "var(--fg-dim)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Interviews, studio photos, release notes. Coming soon.
        </p>
      </section>
      <Footer />
    </>
  );
}
