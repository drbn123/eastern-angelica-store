"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { Release } from "@/lib/types";

const FORMATS = ["CD", "LP", '12"', '7"', "CS", "TEE", "VEST", "LS", "BOOK", "BUNDLE", "OTHER"];
const EMPTY: Omit<Release, "id"> = {
  title: "", artist: "", format: "CD", edition: "", year: new Date().getFullYear().toString(),
  cat: "", price: { gbp: 0, pln: 0 }, variants: [{ k: "Standard", gbp: 0, pln: 0 }], tag: "",
  cover: "", back: "", placeholder: false, descEn: "", descPl: "",
};

function VariantEditor({
  variants, onChange,
}: {
  variants: { k: string; gbp: number; pln: number }[];
  onChange: (v: { k: string; gbp: number; pln: number }[]) => void;
}) {
  return (
    <div className="ap-variants">
      {variants.map((v, i) => (
        <div key={i} className="ap-variant-row">
          <input
            className="admin-input ap-variant-name"
            placeholder="Name"
            value={v.k}
            onChange={(e) => {
              const next = [...variants];
              next[i] = { ...next[i], k: e.target.value };
              onChange(next);
            }}
          />
          <input
            className="admin-input ap-variant-price"
            type="number"
            placeholder="£ GBP"
            value={v.gbp}
            onChange={(e) => {
              const next = [...variants];
              next[i] = { ...next[i], gbp: +e.target.value };
              onChange(next);
            }}
          />
          <input
            className="admin-input ap-variant-price"
            type="number"
            placeholder="zł PLN"
            value={v.pln}
            onChange={(e) => {
              const next = [...variants];
              next[i] = { ...next[i], pln: +e.target.value };
              onChange(next);
            }}
          />
          <button className="admin-btn-ghost ap-remove" onClick={() => onChange(variants.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="admin-btn-ghost ap-add-variant" onClick={() => onChange([...variants, { k: "", gbp: 0, pln: 0 }])}>
        + Add variant
      </button>
    </div>
  );
}

function ProductForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Omit<Release, "id">;
  onSave: (data: Omit<Release, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function uploadCover(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload?folder=products", { method: "POST", body: fd });
    if (res.ok) set("cover", (await res.json()).url);
    setUploading(false);
  }

  return (
    <div className="ap-form">
      <div className="ap-form-grid">
        <label className="ap-label">Title
          <input className="admin-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="ap-label">Artist
          <input className="admin-input" value={form.artist} onChange={(e) => set("artist", e.target.value)} />
        </label>
        <label className="ap-label">Format
          <select className="admin-input" value={form.format} onChange={(e) => set("format", e.target.value)}>
            {FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="ap-label">Cat. №
          <input className="admin-input" value={form.cat} onChange={(e) => set("cat", e.target.value)} />
        </label>
        <label className="ap-label">Edition
          <input className="admin-input" value={form.edition} onChange={(e) => set("edition", e.target.value)} />
        </label>
        <label className="ap-label">Year
          <input className="admin-input" value={form.year} onChange={(e) => set("year", e.target.value)} />
        </label>
        <label className="ap-label">Base price £ GBP
          <input className="admin-input" type="number" value={form.price.gbp}
            onChange={(e) => set("price", { ...form.price, gbp: +e.target.value })} />
        </label>
        <label className="ap-label">Base price zł PLN
          <input className="admin-input" type="number" value={form.price.pln}
            onChange={(e) => set("price", { ...form.price, pln: +e.target.value })} />
        </label>
        <label className="ap-label">Tag
          <input className="admin-input" placeholder="cd / merch / book …" value={form.tag} onChange={(e) => set("tag", e.target.value)} />
        </label>
      </div>

      <label className="ap-label">Description (EN)
        <textarea className="admin-input ap-desc" rows={3} value={form.descEn} onChange={(e) => set("descEn", e.target.value)} placeholder="English description…" />
      </label>
      <label className="ap-label">Description (PL)
        <textarea className="admin-input ap-desc" rows={3} value={form.descPl} onChange={(e) => set("descPl", e.target.value)} placeholder="Opis po polsku…" />
      </label>

      <div className="ap-label">Variants (£ GBP · zł PLN)
        <VariantEditor variants={form.variants} onChange={(v) => set("variants", v)} />
      </div>

      <div className="ap-cover-row">
        <div className="ap-label">Cover image
          <div className="ap-cover-preview" onClick={() => coverRef.current?.click()}>
            {form.cover
              ? <Image src={form.cover} alt="cover" fill style={{ objectFit: "cover" }} />
              : <span>{uploading ? "Uploading…" : "Click to upload"}</span>}
          </div>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
        </div>
        <label className="ap-label ap-placeholder-label">
          <input type="checkbox" checked={!!form.placeholder} onChange={(e) => set("placeholder", e.target.checked)} />
          &nbsp;Placeholder (no real photo yet)
        </label>
      </div>

      <div className="ap-form-foot">
        <button className="admin-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="admin-btn-primary" onClick={() => onSave(form)} disabled={saving || !form.title.trim()}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminProducts({ initialProducts }: { initialProducts: Release[] }) {
  const [products, setProducts] = useState<Release[]>(initialProducts);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(data: Omit<Release, "id">) {
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const product = await res.json();
      setProducts((prev) => [...prev, product]);
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleUpdate(id: string, data: Omit<Release, "id">) {
    setSaving(true);
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const product = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? product : p)));
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="ap-wrap">
      <div className="ap-header">
        <span className="admin-topbar-title">Products ({products.length})</span>
        {!adding && (
          <button className="admin-btn-primary" onClick={() => { setAdding(true); setEditingId(null); }}>
            + Add product
          </button>
        )}
      </div>

      {adding && (
        <div className="ap-new-form">
          <div className="ap-form-title">New product</div>
          <ProductForm
            initial={{ ...EMPTY }}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        </div>
      )}

      <div className="ap-product-list">
        {products.map((p) => (
          <div key={p.id} className="ap-product-card">
            {editingId === p.id ? (
              <>
                <div className="ap-form-title">Editing — {p.title}</div>
                <ProductForm
                  initial={{ title: p.title, artist: p.artist, format: p.format, edition: p.edition,
                    year: p.year, cat: p.cat, price: p.price, variants: p.variants, tag: p.tag,
                    cover: p.cover ?? "", back: p.back ?? "", placeholder: !!p.placeholder, descEn: p.descEn ?? "", descPl: p.descPl ?? "" }}
                  onSave={(data) => handleUpdate(p.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </>
            ) : (
              <div className="ap-product-row">
                <div className="ap-product-thumb">
                  {p.cover
                    ? <Image src={p.cover} alt={p.title} fill style={{ objectFit: "cover" }} />
                    : <span className="ap-no-cover">—</span>}
                </div>
                <div className="ap-product-info">
                  <span className="ap-product-title">{p.title}</span>
                  <span className="ap-product-meta">
                    {p.format} · {p.cat} · £{p.price.gbp}{p.price.pln > 0 ? ` / ${p.price.pln} zł` : ""}
                  </span>
                  {p.placeholder && <span className="placeholder-tag">placeholder</span>}
                </div>
                <div className="ap-product-actions">
                  <button className="admin-btn-ghost" onClick={() => { setEditingId(p.id); setAdding(false); }}>Edit</button>
                  <button className="admin-btn-ghost ap-delete" onClick={() => handleDelete(p.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
