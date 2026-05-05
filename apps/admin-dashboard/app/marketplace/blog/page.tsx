import { getBlogPosts } from '../../actions';
import BlogListingClient from './BlogListingClient';

export default async function BlogListingPage() {
  const posts = await getBlogPosts(true);
  return <BlogListingClient initialPosts={posts} />;
}
