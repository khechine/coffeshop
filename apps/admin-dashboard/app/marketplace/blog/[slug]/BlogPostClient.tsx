'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function BlogPostClient({ post }: { post: any }) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/marketplace/blog" style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Tous les articles
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        
        {/* Post Meta */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: '#FFF1F2', color: '#E31E24', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 800 }}>
              {post.category}
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#111827', marginBottom: '24px', lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Par {post.author}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div style={{ width: '100%', borderRadius: '24px', overflow: 'hidden', marginBottom: '48px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <img src={post.coverImage} alt={post.title} style={{ width: '100%', display: 'block' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ 
          fontSize: '18px', 
          lineHeight: 1.8, 
          color: '#374151', 
          marginBottom: '60px',
          whiteSpace: 'pre-wrap'
        }}>
          {post.content}
        </div>

        {/* Footer / Share */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '32px', marginBottom: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Partager :</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#1877F2' }}><Facebook size={18} /></button>
              <button style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#1DA1F2' }}><Twitter size={18} /></button>
              <button style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#0A66C2' }}><Linkedin size={18} /></button>
            </div>
          </div>
          <button style={{ background: '#F3F4F6', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            <Share2 size={16} /> Copier le lien
          </button>
        </div>
      </main>
    </div>
  );
}
