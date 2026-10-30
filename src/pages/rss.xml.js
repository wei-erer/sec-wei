import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../site.config.mjs';
import { byDateDesc, withBase } from '../lib/utils.js';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(byDateDesc);

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary || '',
      link: withBase(`/posts/${post.id}/`),
      categories: post.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
