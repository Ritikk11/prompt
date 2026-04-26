'use client';
import { useState, useEffect } from 'react';
import { useData } from '@/components/context/DataContext';
import { aiTools } from '@/lib/data/seedData';
import type { Post, Section, ImagePrompt } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import {
  Plus, Trash2, Edit3, Eye, EyeOff, ChevronUp, ChevronDown,
  Save, X, FileText, LayoutGrid, Star, StarOff, Upload,
  Settings, Check, Search, RotateCcw, GripVertical, Image as ImageIcon,
  Zap, Layers, Info
} from 'lucide-react';

import Image from 'next/image';
import { getToolInfo } from '@/lib/constants';

type AdminTab = 'posts' | 'sections' | 'settings';

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
}

export default function Admin() {
  const {
    posts, sections, settings, addPost, updatePost, deletePost,
    addSection, updateSection, deleteSection, updateSettings, resetData, loading
  } = useData();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert('Login failed');
    }
  };

  const [tab, setTab] = useState<AdminTab>('posts');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postSearch, setPostSearch] = useState('');

  // Post form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<ImagePrompt[]>([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT' }]);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);


  // Section form
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState<Section['type']>('custom');
  const [newSectionTool, setNewSectionTool] = useState('');
  const [newSectionLimit, setNewSectionLimit] = useState(8);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [editSectionLimit, setEditSectionLimit] = useState(8);
  const [pickingPostsForSection, setPickingPostsForSection] = useState<string | null>(null);
  const [postPickerSearch, setPostPickerSearch] = useState('');

  // Settings form
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [heroEnabled, setHeroEnabled] = useState(settings.heroEnabled);
  const [heroAutoPlay, setHeroAutoPlay] = useState(settings.heroAutoPlay);

  // Get custom sections for assignment
  const customSections = sections.filter(s => s.type === 'custom');

  const resetForm = () => {
    setTitle(''); setSlug(''); setDescription(''); setSeoTitle(''); setSeoDescription(''); setTagsStr('');
    setFeatured(false); setImages([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT' }]);
    setEditingPost(null); setShowPostForm(false); setAssignedSections([]);
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug || '');
    setDescription(post.description);
    setSeoTitle(post.seoTitle || '');
    setSeoDescription(post.seoDescription || '');
    setTagsStr(post.tags.join(', '));
    setFeatured(post.featured);
    setImages(post.images.length > 0 ? post.images : [{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT' }]);
    // Find which custom sections contain this post
    const inSections = sections
      .filter(s => s.type === 'custom' && s.postIds?.includes(post.id))
      .map(s => s.id);
    setAssignedSections(inSections);
    setShowPostForm(true);
  };

  const addImageField = () => {
    setImages(prev => [...prev, { id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT' }]);
  };

  const updateImage = (idx: number, field: keyof ImagePrompt, value: string) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, [field]: value } : img));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateImage(idx, 'url', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleSectionAssignment = (sectionId: string) => {
    setAssignedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSavePost = () => {
    if (!title || !description || !slug || images.length === 0 || images.some(i => !i.url || !i.prompt)) {
      alert('Please fill in all required fields (title, slug, description, image URLs and prompts)');
      return;
    }

    // Check for duplicate slugs
    const slugInUse = posts.some(p => p.slug === slug && p.id !== (editingPost?.id || ''));
    if (slugInUse) {
      alert('This slug is already in use. Please choose a different one.');
      return;
    }

    const postId = editingPost?.id || generateId();
    const post: Post = {
      id: postId,
      slug,
      title,
      description,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      images: images.filter(i => i.url && i.prompt),
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      featured,
      views: editingPost?.views || 0,
      likes: editingPost?.likes || 0,
      likedByUser: editingPost?.likedByUser,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
    };

    if (editingPost) {
      updatePost(post);
    } else {
      addPost(post);
    }

    // Update custom sections — add/remove post from sections
    customSections.forEach(section => {
      const wasAssigned = section.postIds?.includes(postId) || false;
      const isAssigned = assignedSections.includes(section.id);
      if (wasAssigned && !isAssigned) {
        // Remove from section
        updateSection({ ...section, postIds: (section.postIds || []).filter(id => id !== postId) });
      } else if (!wasAssigned && isAssigned) {
        // Add to section
        updateSection({ ...section, postIds: [...(section.postIds || []), postId] });
      }
    });

    resetForm();
  };

  const handleAddSection = () => {
    if (!newSectionName) return;
    addSection({
      id: generateId(),
      name: newSectionName,
      type: newSectionType,
      aiTool: newSectionType === 'ai-tool' ? newSectionTool : undefined,
      postIds: newSectionType === 'custom' ? [] : undefined,
      order: sections.length,
      visible: true,
      limit: newSectionLimit,
    });
    setNewSectionName('');
    setNewSectionLimit(8);
    setNewSectionTool('');
  };

  const moveSection = (section: Section, dir: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === section.id);
    if (dir === 'up' && idx > 0) {
      const prev = sorted[idx - 1];
      updateSection({ ...section, order: prev.order });
      updateSection({ ...prev, order: section.order });
    } else if (dir === 'down' && idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      updateSection({ ...section, order: next.order });
      updateSection({ ...next, order: section.order });
    }
  };

  const startEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditSectionName(section.name);
    setEditSectionLimit(section.limit);
  };

  const saveEditSection = (section: Section) => {
    updateSection({ ...section, name: editSectionName, limit: editSectionLimit });
    setEditingSectionId(null);
  };

  const toggleSectionVisibility = (section: Section) => {
    updateSection({ ...section, visible: !section.visible });
  };

  const togglePostInSection = (sectionId: string, postId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const currentIds = section.postIds || [];
    const newIds = currentIds.includes(postId)
      ? currentIds.filter(id => id !== postId)
      : [...currentIds, postId];
    updateSection({ ...section, postIds: newIds });
  };

  const handleSaveSettings = () => {
    updateSettings({
      siteTitle,
      siteDescription,
      heroEnabled,
      heroAutoPlay,
      aiTools: settings.aiTools || ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
    });
    alert('Settings saved!');
  };

  // AI Tools Management
  const [newAiTool, setNewAiTool] = useState('');
  const [editingAiTool, setEditingAiTool] = useState<string | null>(null);
  const [editAiToolValue, setEditAiToolValue] = useState('');
  const [editAiToolLogo, setEditAiToolLogo] = useState('');
  const [editAiToolColor, setEditAiToolColor] = useState('');

  const addAiTool = () => {
    const toolList = settings.aiTools || [];
    if (!newAiTool.trim()) return;
    if (toolList.includes(newAiTool.trim())) {
      alert('AI Tool already exists');
      return;
    }
    updateSettings({ ...settings, aiTools: [...toolList, newAiTool.trim()] });
    setNewAiTool('');
  };

  const removeAiTool = (tool: string) => {
    const inUse = posts.some(p => p.images.some(img => img.aiTool === tool));
    if (inUse) {
      alert(`Cannot delete "${tool}" — it's used by existing posts. Remove or reassign those images first.`);
      return;
    }
    updateSettings({ ...settings, aiTools: (settings.aiTools || []).filter(t => t !== tool) });
  };

  const startEditAiTool = (tool: string) => {
    setEditingAiTool(tool);
    setEditAiToolValue(tool);
    const existing = settings.toolDetails?.[tool] || getToolInfo(tool);
    setEditAiToolLogo(existing.logo || '');
    setEditAiToolColor(existing.color || 'bg-surface-500');
  };

  const saveEditAiTool = (oldTool: string) => {
    if (!editAiToolValue.trim()) return;
    const newToolName = editAiToolValue.trim();
    const newTools = (settings.aiTools || []).map(t => (t === oldTool ? newToolName : t));
    
    // Manage custom details
    const newToolDetails = { ...settings.toolDetails };
    if (oldTool !== newToolName && newToolDetails[oldTool]) {
      delete newToolDetails[oldTool];
    }
    newToolDetails[newToolName] = { logo: editAiToolLogo, color: editAiToolColor };

    // Update posts using this tool
    posts.forEach(p => {
      let changed = false;
      const updatedImages = p.images.map(img => {
        if (img.aiTool === oldTool) {
          changed = true;
          return { ...img, aiTool: newToolName };
        }
        return img;
      });
      if (changed) {
        updatePost({ ...p, images: updatedImages });
      }
    });

    updateSettings({ ...settings, aiTools: newTools, toolDetails: newToolDetails });
    setEditingAiTool(null);
  };

  // Custom Sections Management
  const createCustomSection = () => {
    const newSection: Section = {
      id: `s_custom_${Date.now()}`,
      name: 'New Custom Section',
      type: 'custom',
      order: sections.length,
      visible: true,
      limit: 8,
      postIds: []
    };
    updateSection(newSection);
  };

  const handleResetData = () => {
    if (confirm('This will reset ALL data to defaults (posts, sections, settings). Are you sure?')) {
      resetData();
      window.location.reload();
    }
  };

  const filteredPosts = postSearch
    ? posts.filter(p =>
        p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(postSearch.toLowerCase()))
      )
    : posts;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'posts', label: 'Posts', icon: <FileText className="w-4 h-4" />, count: posts.length },
    { key: 'sections', label: 'Sections', icon: <LayoutGrid className="w-4 h-4" />, count: sections.length },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  if (authLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-surface-400">Loading admin...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-6">
          <Settings className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          Sign in securely to manage posts, sections, and global settings.
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">Full control over your site content & settings</p>
        </div>
        <button
          onClick={handleResetData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset All
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{posts.length}</p>
          <p className="text-xs text-surface-500 mt-1">Total Posts</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{posts.filter(p => p.featured).length}</p>
          <p className="text-xs text-surface-500 mt-1">Featured (Hero)</p>
        </div>
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{sections.filter(s => s.visible).length}</p>
          <p className="text-xs text-surface-500 mt-1">Active Sections</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{posts.reduce((acc, p) => acc + p.images.length, 0)}</p>
          <p className="text-xs text-surface-500 mt-1">Total Prompts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {t.icon} {t.label} {t.count !== undefined && `(${t.count})`}
          </button>
        ))}
      </div>

      {/* ===== POSTS TAB ===== */}
      {tab === 'posts' && (
        <div>
          {!showPostForm ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <button
                  onClick={() => setShowPostForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
                >
                  <Plus className="w-4 h-4" /> Create New Post
                </button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    placeholder="Search posts..."
                  />
                </div>
              </div>

              {/* Posts list */}
              <div className="grid gap-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:shadow-md transition-shadow">
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800">
                      {post.images[0]?.url && (
                        <Image src={post.images[0].url} alt="" fill unoptimized className="object-cover" sizes="80px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{post.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                        <span>{post.images.length} images</span>
                        <span>{post.views.toLocaleString()} views</span>
                        {post.featured && <span className="text-yellow-500 font-semibold">⭐ Featured</span>}
                        {sections.filter(s => s.type === 'custom' && s.postIds?.includes(post.id)).length > 0 && (
                          <span className="text-primary-500 font-semibold">
                            📂 {sections.filter(s => s.type === 'custom' && s.postIds?.includes(post.id)).length} sections
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updatePost({ ...post, featured: !post.featured })}
                        className={`p-2 rounded-lg transition-colors ${post.featured ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                        title={post.featured ? 'Remove from hero' : 'Add to hero'}
                      >
                        {post.featured ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4 text-surface-400" />}
                      </button>
                      <button
                        onClick={() => startEdit(post)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-primary-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this post?')) deletePost(post.id); }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <p className="text-center text-surface-400 py-10">No posts found</p>
                )}
              </div>
            </>
          ) : (
            /* Post Form */
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Title *</label>
                    <input
                      value={title}
                      onChange={e => {
                        setTitle(e.target.value);
                        if (!editingPost) setSlug(slugify(e.target.value));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="Enter post title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">URL Slug *</label>
                    <input
                      value={slug}
                      onChange={e => setSlug(slugify(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="beautiful-modern-landscape"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Description *</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-none"
                    placeholder="Describe this prompt collection..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Custom Search Title (SEO)</label>
                    <input
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="Title for Google search..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Custom Search Description (SEO)</label>
                    <input
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="Short snippet for search results..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
                    <input
                      value={tagsStr}
                      onChange={e => setTagsStr(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="fantasy, landscape, magical"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-surface-50 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200 dark:border-surface-700">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={e => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      id="featured-checkbox"
                    />
                    <label htmlFor="featured-checkbox" className="text-sm font-medium cursor-pointer">Featured Post (Hero Slider)</label>
                  </div>
                </div>

                {/* Featured checkbox */}
                <div className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={e => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <div>
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500" /> Feature in Hero Slideshow
                      </span>
                      <p className="text-xs text-surface-400 mt-0.5">Featured posts appear in the hero carousel on the homepage</p>
                    </div>
                  </label>
                </div>

                {/* Section Assignment */}
                {customSections.length > 0 && (
                  <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary-500" />
                      Add to Custom Sections
                    </h4>
                    <p className="text-xs text-surface-400 mb-3">Select which custom sections this post should appear in</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customSections.map(section => (
                        <label
                          key={section.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                            assignedSections.includes(section.id)
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                              : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assignedSections.includes(section.id)}
                            onChange={() => toggleSectionAssignment(section.id)}
                            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium truncate">{section.name}</span>
                          {!section.visible && (
                            <span className="text-[10px] text-surface-400 ml-auto">(hidden)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Images & Prompts *
                    </label>
                    <button
                      onClick={addImageField}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Image
                    </button>
                  </div>

                  <div className="space-y-4">
                    {images.map((img, idx) => (
                      <div key={img.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" /> Image #{idx + 1}
                          </span>
                          {images.length > 1 && (
                            <button onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-surface-400 mb-1">Image URL or Upload</label>
                            <div className="flex gap-2">
                              <input
                                value={img.url}
                                onChange={e => updateImage(idx, 'url', e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                                placeholder="https://..."
                              />
                              <label className="p-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-500 transition-colors">
                                <Upload className="w-3.5 h-3.5 text-surface-400" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(idx, file);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-surface-400 mb-1">AI Tool</label>
                            <select
                              value={img.aiTool}
                              onChange={e => updateImage(idx, 'aiTool', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                            >
                              {aiTools.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-surface-400 mb-1">Prompt *</label>
                          <textarea
                            value={img.prompt}
                            onChange={e => updateImage(idx, 'prompt', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs resize-none"
                            placeholder="Enter the AI prompt..."
                          />
                        </div>

                        {img.url && (
                          <div className="relative mt-3 h-32 rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-700 flex items-center justify-center p-2">
                            <Image src={img.url} alt="" fill unoptimized className="object-contain p-2" sizes="(max-width: 768px) 100vw, 33vw" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSavePost}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
                  >
                    <Save className="w-4 h-4" /> {editingPost ? 'Update Post' : 'Create Post'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SECTIONS TAB ===== */}
      {tab === 'sections' && (
        <div className="max-w-3xl">
          {/* Add new section */}
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 mb-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-500" /> Add New Section
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                placeholder="Section name (e.g., 🔥 Hot Prompts)..."
              />
              <select
                value={newSectionType}
                onChange={e => setNewSectionType(e.target.value as Section['type'])}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
              >
                <option value="custom">Custom (pick posts manually)</option>
                <option value="ai-tool">AI Tool (auto-filter by tool)</option>
                <option value="popular">Popular (auto-sort by views)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {newSectionType === 'ai-tool' && (
                <select
                  value={newSectionTool}
                  onChange={e => setNewSectionTool(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                >
                  <option value="">Select AI tool...</option>
                  {aiTools.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-400 whitespace-nowrap">Post limit:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newSectionLimit}
                  onChange={e => setNewSectionLimit(parseInt(e.target.value) || 8)}
                  className="w-20 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleAddSection}
              disabled={!newSectionName || (newSectionType === 'ai-tool' && !newSectionTool)}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Section
            </button>
          </div>

          {/* Sections list */}
          <div className="space-y-3">
            {[...sections].sort((a, b) => a.order - b.order).map((section, idx) => {
              const isAutoSection = section.type === 'latest' || section.type === 'popular';
              return (
                <div
                  key={section.id}
                  className={`rounded-xl border bg-white dark:bg-surface-900 overflow-hidden transition-all ${
                    !section.visible ? 'border-surface-200 dark:border-surface-800 opacity-60' : 'border-surface-200 dark:border-surface-800'
                  }`}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveSection(section, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center justify-center">
                        <GripVertical className="w-3.5 h-3.5 text-surface-300" />
                      </div>
                      <button
                        onClick={() => moveSection(section, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Section info */}
                    <div className="flex-1 min-w-0">
                      {editingSectionId === section.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editSectionName}
                            onChange={e => setEditSectionName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                          />
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={editSectionLimit}
                            onChange={e => setEditSectionLimit(parseInt(e.target.value) || 8)}
                            className="w-16 px-2 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm text-center"
                            title="Post limit"
                          />
                          <button onClick={() => saveEditSection(section)} className="p-1.5 rounded-lg bg-primary-500 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingSectionId(null)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium text-sm truncate flex items-center gap-2">
                            {section.name}
                            {isAutoSection && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                <Zap className="w-2.5 h-2.5" /> Auto
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-400">
                            <span className="capitalize px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{section.type}</span>
                            {section.aiTool && <span>· {section.aiTool}</span>}
                            <span>· Limit: {section.limit}</span>
                            {section.type === 'custom' && section.postIds && (
                              <span>· {section.postIds.length} posts selected</span>
                            )}
                            {!section.visible && <span className="text-red-400 font-medium">· Hidden</span>}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    {editingSectionId !== section.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        {section.type === 'custom' && (
                          <button
                            onClick={() => { setPickingPostsForSection(pickingPostsForSection === section.id ? null : section.id); setPostPickerSearch(''); }}
                            className={`p-2 rounded-lg transition-colors ${pickingPostsForSection === section.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-500' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400'}`}
                            title="Select posts for this section"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => startEditSection(section)}
                          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          title="Edit section"
                        >
                          <Edit3 className="w-4 h-4 text-primary-500" />
                        </button>
                        <button
                          onClick={() => toggleSectionVisibility(section)}
                          className={`p-2 rounded-lg transition-colors ${
                            section.visible ? 'hover:bg-surface-100 dark:hover:bg-surface-800' : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={section.visible ? 'Hide section' : 'Show section'}
                        >
                          {section.visible
                            ? <Eye className="w-4 h-4 text-green-500" />
                            : <EyeOff className="w-4 h-4 text-surface-400" />
                          }
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this section?')) deleteSection(section.id); }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auto section info */}
                  {isAutoSection && (
                    <div className="px-4 pb-3">
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">
                          {section.type === 'latest'
                            ? 'Auto-populated with the newest posts. Shows all posts sorted by date with a "Load More" button.'
                            : 'Auto-populated with the most viewed posts.'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post picker for custom sections */}
                  {pickingPostsForSection === section.id && section.type === 'custom' && (
                    <div className="border-t border-surface-200 dark:border-surface-800 p-4 bg-surface-50 dark:bg-surface-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                          Select posts for &quot;{section.name}&quot;
                        </h5>
                        <span className="text-xs text-surface-400">
                          {section.postIds?.length || 0} selected
                        </span>
                      </div>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                        <input
                          value={postPickerSearch}
                          onChange={e => setPostPickerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                          placeholder="Search posts to add..."
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5">
                        {posts
                          .filter(p => !postPickerSearch || p.title.toLowerCase().includes(postPickerSearch.toLowerCase()))
                          .map(p => {
                            const isSelected = section.postIds?.includes(p.id) || false;
                            return (
                              <label
                                key={p.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                    : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePostInSection(section.id, p.id)}
                                  className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                                />
                                <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-200 dark:bg-surface-700">
                                  {p.images[0]?.url && <Image src={p.images[0].url} alt="" fill unoptimized className="object-cover" sizes="40px" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{p.title}</p>
                                  <p className="text-[10px] text-surface-400">{p.images.length} images</p>
                                </div>
                                {p.featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sections.length === 0 && (
              <div className="text-center py-10 text-surface-400">
                <LayoutGrid className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No sections yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {tab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          {/* Site Settings */}
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary-500" /> Site Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Site Title</label>
                <input
                  value={siteTitle}
                  onChange={e => setSiteTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                  placeholder="PromptVault"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Site Description</label>
                <textarea
                  value={siteDescription}
                  onChange={e => setSiteDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroEnabled}
                    onChange={e => setHeroEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Show hero slideshow</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroAutoPlay}
                    onChange={e => setHeroAutoPlay(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Hero auto-play</span>
                </label>
              </div>
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>

          {/* AI Tools Management */}
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-500" /> AI Tools ({(settings.aiTools || []).length})
            </h3>

            {/* Add AI Tool */}
            <div className="flex gap-2 mb-4">
              <input
                value={newAiTool}
                onChange={e => setNewAiTool(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAiTool()}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                placeholder="New tool name (e.g. Midjourney v6)..."
              />
              <button
                onClick={addAiTool}
                disabled={!newAiTool.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* AI Tools list */}
            <div className="grid grid-cols-1 gap-3">
              {(settings.aiTools || []).map(tool => {
                const imgCount = posts.reduce((acc, p) => acc + p.images.filter(img => img.aiTool === tool).length, 0);
                const info = getToolInfo(tool, settings.toolDetails);
                return (
                  <div key={tool} className="flex flex-col gap-2 p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    {editingAiTool === tool ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                           <input
                             value={editAiToolValue}
                             onChange={e => setEditAiToolValue(e.target.value)}
                             className="flex-1 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs font-semibold"
                             autoFocus
                             placeholder="Tool Name"
                           />
                           <input
                             value={editAiToolColor}
                             onChange={e => setEditAiToolColor(e.target.value)}
                             className="w-24 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                             placeholder="bg-color-500"
                           />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            value={editAiToolLogo}
                            onChange={e => setEditAiToolLogo(e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                            placeholder="Logo Image URL"
                          />
                          <button onClick={() => saveEditAiTool(tool)} className="p-1.5 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingAiTool(null)} className="p-1.5 rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors text-surface-600 dark:text-surface-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className={`relative w-8 h-8 shrink-0 flex items-center justify-center rounded-md border border-white/20 shadow-sm ${info.color}`}>
                          {info.logo && (
                            <Image src={info.logo} alt="" fill className="object-contain p-1.5" unoptimized />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tool}</p>
                          <p className="text-[10px] text-surface-400">{imgCount} post uses</p>
                        </div>
                        <button
                          onClick={() => startEditAiTool(tool)}
                          className="p-1.5 rounded hover:bg-surface-200 dark:hover:bg-surface-700 shrink-0"
                          title="Edit Tool Details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary-500" />
                        </button>
                        <button
                          onClick={() => removeAiTool(tool)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                          title="Delete Tool"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold text-sm mb-2 text-red-600 dark:text-red-400">⚠️ Danger Zone</h3>
            <p className="text-xs text-red-500/70 mb-4">This will permanently reset all data to defaults.</p>
            <button
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
