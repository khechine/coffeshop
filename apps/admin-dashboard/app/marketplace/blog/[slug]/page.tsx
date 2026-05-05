import { getBlogPost } from '../../../actions';
import BlogPostClient from './BlogPostClient';
import { notFound } from 'next/navigation';

export default async function BlogPostPage({ params }: { params: any }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post || !post.isPublished) {
    notFound();
  }
  
  return <BlogPostClient post={post} />;
}
