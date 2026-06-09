import { randomUUID } from "crypto";

export interface Post {
  id: string;
  text: string;
  images: string[];
  createdAt: string;
}

const useKV = () => !!process.env.KV_REST_API_URL;

async function kvGet<T>(key: string): Promise<T | null> {
  const { kv } = await import("@vercel/kv");
  return kv.get<T>(key);
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(key, value);
}

function fsReadPosts(): Post[] {
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const file = path.join(process.cwd(), "data", "posts.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return []; }
}

function fsWritePosts(posts: Post[]): void {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  fs.writeFileSync(path.join(process.cwd(), "data", "posts.json"), JSON.stringify(posts, null, 2));
}

export async function readPosts(): Promise<Post[]> {
  if (useKV()) return (await kvGet<Post[]>("posts")) ?? [];
  return fsReadPosts();
}

async function writePosts(posts: Post[]): Promise<void> {
  if (useKV()) { await kvSet("posts", posts); return; }
  fsWritePosts(posts);
}

export async function createPost(text: string, images: string[]): Promise<Post> {
  const posts = await readPosts();
  const post: Post = { id: randomUUID(), text, images, createdAt: new Date().toISOString() };
  await writePosts([post, ...posts]);
  return post;
}

export async function updatePost(
  id: string,
  data: { text?: string; images?: string[] }
): Promise<Post | null> {
  const posts = await readPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx] = {
    ...posts[idx],
    text: data.text ?? posts[idx].text,
    images: data.images ?? posts[idx].images,
  };
  await writePosts(posts);
  return posts[idx];
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writePosts(next);
  return true;
}
