import { readPosts, createPost } from "@/lib/posts";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  return Response.json(readPosts());
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { text, images } = await request.json();
  if (!text?.trim() && !images?.length) {
    return Response.json({ error: "Post cannot be empty" }, { status: 400 });
  }
  const post = createPost(text?.trim() ?? "", images ?? []);
  return Response.json(post, { status: 201 });
}
