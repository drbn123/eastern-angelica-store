"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/posts";
import type { Release } from "@/lib/types";
import AdminProducts from "@/components/AdminProducts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

async function uploadFiles(files: FileList): Promise<{ urls: string[]; error: string }> {
  const urls: string[] = [];
  let error = "";
  for (const file of Array.from(files)) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      urls.push((await res.json()).url);
    } else {
      const body = await res.json().catch(() => null);
      error = body?.error ?? `Image upload failed (${res.status}).`;
    }
  }
  return { urls, error };
}

function JournalTab({ posts, setPosts }: { posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>> }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const { urls, error: err } = await uploadFiles(files);
    if (err) setError(err);
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function handlePost() {
    if (!text.trim() && !images.length) return;
    setPosting(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, images }),
    });
    if (res.ok) {
      const post = await res.json();
      setPosts((prev) => [post, ...prev]);
      setText("");
      setImages([]);
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `Post failed (${res.status}).`);
    }
    setPosting(false);
  }

  async function handleUpdate(id: string, data: { text: string; images: string[] }): Promise<boolean> {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      return true;
    }
    return false;
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const canPost = (text.trim().length > 0 || images.length > 0) && !posting && !uploading;

  return (
    <>
      <div className="admin-composer">
        <div className="admin-composer-avatar">
          <Image src="/assets/ea-monument.png" alt="EA" width={36} height={36} />
        </div>
        <div className="admin-composer-body">
          <textarea
            className="admin-textarea"
            placeholder="What's happening?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          {images.length > 0 && (
            <div className="admin-image-strip">
              {images.map((url, i) => (
                <div key={i} className="admin-image-thumb">
                  <Image src={url} alt="" width={120} height={90} style={{ objectFit: "cover" }} />
                  <button className="admin-image-remove" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
          {error && <span className="admin-error">{error}</span>}
          <div className="admin-composer-foot">
            <button className="admin-btn-icon" onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach image">
              {uploading ? "↑" : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
            <span className="admin-char-count">{text.length}</span>
            <button className="admin-btn-primary" onClick={handlePost} disabled={!canPost}>
              {posting ? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-posts">
        {posts.length === 0 && <p className="admin-empty">No posts yet.</p>}
        {posts.map((p) =>
          editingId === p.id ? (
            <PostEditor key={p.id} post={p} onSave={(data) => handleUpdate(p.id, data)} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={p.id} className="admin-post">
              <div className="admin-post-head">
                <span className="admin-post-date">{formatDate(p.createdAt)}</span>
                <div className="admin-post-actions">
                  <button className="admin-btn-ghost" onClick={() => setEditingId(p.id)}>Edit</button>
                  <button className="admin-btn-ghost admin-post-delete" onClick={() => handleDelete(p.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
              {p.text && <p className="admin-post-text">{p.text}</p>}
              {p.images.length > 0 && (
                <div className="admin-post-images">
                  {p.images.map((url, i) => (
                    <div key={i} className="admin-post-img">
                      <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}

function PostEditor({
  post, onSave, onCancel,
}: {
  post: Post;
  onSave: (data: { text: string; images: string[] }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(post.text);
  const [images, setImages] = useState<string[]>(post.images);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const { urls, error: err } = await uploadFiles(files);
    if (err) setError(err);
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function save() {
    if (!text.trim() && !images.length) {
      setError("Post cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onSave({ text, images });
    if (!ok) {
      setError("Save failed.");
      setSaving(false);
    }
    // On success the parent removes this editor from the tree.
  }

  const canSave = (text.trim().length > 0 || images.length > 0) && !saving && !uploading;

  return (
    <div className="admin-post admin-post-edit">
      <textarea
        className="admin-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      {images.length > 0 && (
        <div className="admin-image-strip">
          {images.map((url, i) => (
            <div key={i} className="admin-image-thumb">
              <Image src={url} alt="" width={120} height={90} style={{ objectFit: "cover" }} />
              <button className="admin-image-remove" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      )}
      {error && <span className="admin-error">{error}</span>}
      <div className="admin-composer-foot">
        <button className="admin-btn-icon" onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach image">
          {uploading ? "↑" : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
        <span className="admin-char-count">{text.length}</span>
        <button className="admin-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="admin-btn-primary" onClick={save} disabled={!canSave}>
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ initialPosts, initialProducts }: { initialPosts: Post[]; initialProducts: Release[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"journal" | "products">("journal");
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div className="admin-tabs">
          <button className={`admin-tab${tab === "journal" ? " on" : ""}`} onClick={() => setTab("journal")}>Journal</button>
          <button className={`admin-tab${tab === "products" ? " on" : ""}`} onClick={() => setTab("products")}>Products</button>
        </div>
        <button className="admin-btn-ghost" onClick={handleLogout}>Sign out</button>
      </div>

      {tab === "journal" && <JournalTab posts={posts} setPosts={setPosts} />}
      {tab === "products" && <AdminProducts initialProducts={initialProducts} />}
    </div>
  );
}
