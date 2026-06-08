import { randomUUID } from "crypto";

export interface Post {
  id: string;
  text: string;
  images: string[];
  createdAt: string;
}

const useKV = () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
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
  if (useKV()) {
    const redis = await getRedis();
    let val = await redis.get<Post[] | string>("posts");
    if (typeof val === "string") { try { val = JSON.parse(val); } catch { val = null; } }
    return (Array.isArray(val) ? val : []) as Post[];
  }
  return fsReadPosts();
}

async function writePosts(posts: Post[]): Promise<void> {
  if (useKV()) {
    const redis = await getRedis();
    await redis.set("posts", posts);
    return;
  }
  fsWritePosts(posts);
}

export async function createPost(text: string, images: string[]): Promise<Post> {
  const posts = await readPosts();
  const post: Post = { id: randomUUID(), text, images, createdAt: new Date().toISOString() };
  await writePosts([post, ...posts]);
  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writePosts(next);
  return true;
}
