"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="footer-contact">
        <h4>Contact</h4>
        <p className="footer-contact-thanks">Got it — we'll be in touch.</p>
      </div>
    );
  }

  return (
    <div className="footer-contact">
      <h4>Contact</h4>
      <form className="footer-contact-form" onSubmit={submit}>
        <input
          className="footer-input"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={set("name")}
          required
        />
        <input
          className="footer-input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={set("email")}
          required
        />
        <textarea
          className="footer-input footer-textarea"
          placeholder="Message"
          rows={3}
          value={form.message}
          onChange={set("message")}
          required
        />
        <button className="footer-send-btn" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        {status === "error" && <p className="footer-contact-error">Something went wrong. Try again.</p>}
      </form>
    </div>
  );
}
