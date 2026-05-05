import { getBlogPosts } from '../../actions';
import BlogAdminClient from './BlogAdminClient';

export default async function BlogAdminPage() {
  const posts = await getBlogPosts(false);
  return <BlogAdminClient initialPosts={posts} />;
}
