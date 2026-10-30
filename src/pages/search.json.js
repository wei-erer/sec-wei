import { getCollection } from 'astro:content';
import { byDateDesc, categoryOf, plainText, withBase } from '../lib/utils.js';

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(byDateDesc);

  const data = posts.map((post) => ({
    t: post.data.title,
    s: post.data.summary || '',
    g: post.data.tags || [],
    c: categoryOf(post.data.category).label,
    u: withBase(`/posts/${post.id}/`),
    x: plainText(post.body).slice(0, 4000),
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
