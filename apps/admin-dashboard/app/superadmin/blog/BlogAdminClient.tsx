'use client';

import { useState } from 'react';
import { createBlogPost, updateBlogPost, deleteBlogPost } from '../../actions';
import { PlusCircle, Edit2, Trash2, Eye, EyeOff, X, Save, FileText, Globe, BookOpen } from 'lucide-react';

type Post = {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; coverImage: string | null; author: string;
  category: string; tags: string[]; isPublished: boolean;
  publishedAt: Date | null; createdAt: Date;
};

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function BlogAdminClient({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', coverImage: '',
    author: '', category: 'Perspectives Commerciales', tags: '', isPublished: false,
  });

  const openNew = () => {
    setEditPost(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', coverImage: '', author: '', category: 'Perspectives Commerciales', tags: '', isPublished: false });
    setModalOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditPost(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content,
      coverImage: p.coverImage || '', author: p.author, category: p.category,
      tags: p.tags.join(', '), isPublished: p.isPublished,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (v: string) => setForm(f => ({ ...f, title: v, slug: editPost ? f.slug : slugify(v) }));

  const handleSave = async () => {
    setLoading(true);
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    if (editPost) {
      const res = await updateBlogPost(editPost.id, payload);
      if (res.success) setPosts(ps => ps.map(p => p.id === editPost.id ? res.post as Post : p));
    } else {
      const res = await createBlogPost(payload);
      if (res.success) setPosts(ps => [res.post as Post, ...ps]);
    }
    setLoading(false);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    await deleteBlogPost(id);
    setPosts(ps => ps.filter(p => p.id !== id));
  };

  const togglePublish = async (p: Post) => {
    const res = await updateBlogPost(p.id, { isPublished: !p.isPublished });
    if (res.success) setPosts(ps => ps.map(pp => pp.id === p.id ? res.post as Post : pp));
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <BookOpen size={28} color="#E31E24" />
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>Perspectives Commerciales</h1>
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Gérez les articles du blog de la marketplace</p>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#E31E24', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
        >
          <PlusCircle size={18} /> Nouvel Article
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Articles', value: posts.length, icon: FileText, color: '#6366F1' },
          { label: 'Publiés', value: posts.filter(p => p.isPublished).length, icon: Globe, color: '#10B981' },
          { label: 'Brouillons', value: posts.filter(p => !p.isPublished).length, icon: Edit2, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={24} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Posts Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>Tous les articles ({posts.length})</h2>
        </div>
        {posts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontWeight: 700 }}>Aucun article pour le moment</p>
            <button onClick={openNew} style={{ background: '#E31E24', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}>Créer le premier article</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Titre', 'Auteur', 'Catégorie', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px', maxWidth: '280px' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>/blog/{p.slug}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#4B5563' }}>{p.author}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: p.isPublished ? '#D1FAE5' : '#FEF3C7', color: p.isPublished ? '#059669' : '#D97706', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                      {p.isPublished ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => togglePublish(p)} title={p.isPublished ? 'Dépublier' : 'Publier'} style={{ background: p.isPublished ? '#FEF3C7' : '#D1FAE5', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {p.isPublished ? <EyeOff size={14} color="#D97706" /> : <Eye size={14} color="#059669" />}
                      </button>
                      <button onClick={() => openEdit(p)} style={{ background: '#EEF2FF', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Edit2 size={14} color="#6366F1" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: '#FEF2F2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} color="#E31E24" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'auto' }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{editPost ? 'Modifier l\'article' : 'Nouvel Article'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} color="#6B7280" /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Titre *</label>
                  <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Titre de l'article" style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Slug *</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Auteur *</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Nom Prénom" style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Catégorie</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option>Perspectives Commerciales</option>
                    <option>Sourcing & Achats</option>
                    <option>Tendances Marché</option>
                    <option>Made in Tunisia</option>
                    <option>Innovation</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Image de couverture (URL)</label>
                  <input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Résumé</label>
                  <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="Courte description affichée dans la liste..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Contenu *</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="Contenu complet de l'article..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Tags (virgule séparés)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="sourcing, packaging, local" style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                  <input type="checkbox" id="published" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="published" style={{ fontSize: '14px', fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Publier immédiatement</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalOpen(false)} style={{ padding: '12px 24px', border: '1px solid #D1D5DB', borderRadius: '8px', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSave} disabled={loading || !form.title || !form.slug || !form.author || !form.content} style={{ padding: '12px 24px', background: '#E31E24', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                  <Save size={16} /> {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
