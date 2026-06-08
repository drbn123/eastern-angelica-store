import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "posts.json");

export interface Post {
  id: string;
  text: string;
  images: string[];
  createdAt: string;
}

export function readPosts(): Post[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writePosts(posts: Post[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

export function createPost(text: string, images: string[]): Post {
  const posts = readPosts();
  const post: Post = { id: randomUUID(), text, images, createdAt: new Date().toISOString() };
  writePosts([post, ...posts]);
  return post;
}

export function deletePost(id: string): boolean {
  const posts = readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  writePosts(next);
  return true;
}
