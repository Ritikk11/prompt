'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Post, Section, SiteSettings } from '@/lib/types';
import { seedPosts, seedSections } from '@/lib/data/seedData';
import { createClient } from '@/lib/supabase-client';
import { adminRevalidateAll } from '@/app/actions';

interface DataContextType {
  posts: Post[];
  sections: Section[];
  settings: SiteSettings;
  addPost: (post: Post) => void;
  updatePost: (post: Post) => void;
  deletePost: (id: string) => void;
  incrementViews: (id: string) => void;
  toggleLike: (id: string) => void;
  addSection: (section: Section) => void;
  updateSection: (section: Section) => void;
  deleteSection: (id: string) => void;
  updateSettings: (settings: SiteSettings) => void;
  getPostById: (id: string) => Post | undefined;
  getFilteredPosts: (section: Section) => Post[];
  searchPosts: (query: string) => Post[];
  resetData: () => void;
  deleteMockData: () => void;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteTitle: 'Ai PromptMatrix',
  siteDescription: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  siteLogo: '',
  heroTitle: 'Discover AI Prompt Masterpieces',
  heroSubtitle: 'Explore a curated collection of breathtaking AI-generated imagery and their full prompts. Learn, inspire, and create.',
  heroEnabled: true,
  heroAutoPlay: true,
  aiTools: ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
  features: {
    userProfiles: false,
    userSubmissions: false,
    userSubmissionsAutoApprove: false,
    comments: false,
    commentsRequireApproval: false,
    advancedFiltering: false,
    smartTemplates: false,
    infiniteScroll: false,
    infiniteScrollItems: 20,
    premiumPrompts: false,
    premiumPrice: 5,
    premiumPaymentUrl: '',
    skeletonLoaders: false,
    trendingAlgorithm: false,
    trendingLikesWeight: 2,
    trendingViewsWeight: 1,
  }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Local supabase client reference for components that need it outside hooks
export let globalSupabase: any = null;

export function DataProvider({ children, initialPosts, initialSections, initialSettings }: { children: ReactNode, initialPosts: Post[], initialSections: Section[], initialSettings: SiteSettings }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [localLikes, setLocalLikes] = useState<string[]>([]);
  
  const supabase = useMemo(() => {
    return createClient();
  }, []);

  useEffect(() => {
    globalSupabase = supabase;
  }, [supabase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pv-liked');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // eslint-disable-next-line
            setLocalLikes(parsed);
          }
        }
      } catch { /* */ }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pv-liked', JSON.stringify(localLikes));
    }
  }, [localLikes]);

  const resetData = useCallback(async () => {
    try {
      for (const section of seedSections) {
        await supabase.from('sections').upsert({ id: section.id, data: section });
      }
      for (const post of seedPosts) {
        await supabase.from('posts').upsert({ id: post.id, data: post });
      }
      await supabase.from('settings').upsert({ id: 'global', data: defaultSettings });
      await supabase.from('settings').upsert({ id: 'seeded', data: { completedAt: new Date().toISOString() } });
      await adminRevalidateAll();
    } catch (e) {
      console.error(e);
    }
  }, [supabase]);

  const deleteMockData = useCallback(async () => {
    for (const post of seedPosts) {
      await supabase.from('posts').delete().eq('id', post.id);
    }
    for (const section of seedSections) {
      await supabase.from('sections').delete().eq('id', section.id);
    }
    await adminRevalidateAll();
  }, [supabase]);



  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = settings.siteTitle ? `${settings.siteTitle} - AI Prompts` : 'AI Prompt Matrix - AI Prompts';
      
      if (settings.siteLogo) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.siteLogo;
      }
    }
  }, [settings.siteTitle, settings.siteLogo]);

  const addPost = useCallback(async (post: Post) => {
    const { likedByUser, ...saveable } = post;
    const cleanPost = JSON.parse(JSON.stringify(saveable));
    setPosts(prev => [...prev, post]);
    try {
      await supabase.from('posts').upsert({ id: post.id, data: cleanPost });
      await adminRevalidateAll();
    } catch (error: any) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      console.error('Supabase save error:', error);
      alert(`Failed to save post: ${error.message || 'Unknown error'}`);
    }
  }, [supabase]);

  const updatePost = useCallback(async (post: Post) => {
    // Remove transient property before save
    const { likedByUser, ...saveable } = post;
    const cleanPost = JSON.parse(JSON.stringify(saveable));
    setPosts(prev => prev.map(p => p.id === post.id ? post : p));
    try {
      await supabase.from('posts').upsert({ id: post.id, data: cleanPost });
      await adminRevalidateAll();
    } catch (error: any) {
      console.error('Supabase save error:', error);
      alert(`Failed to save post: ${error.message || 'Unknown error'}`);
    }
  }, [supabase]);

  const deletePost = useCallback(async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await supabase.from('posts').delete().eq('id', id);
    await adminRevalidateAll();
  }, [supabase]);

  const incrementViews = useCallback(async (id: string) => {
    try {
      // Find post to increment
      const post = posts.find(p => p.id === id);
      if (post) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, views: (p.views || 0) + 1 } : p));
        const updated = { ...post, views: (post.views || 0) + 1 };
        const { likedByUser, ...saveable } = updated;
        await supabase.from('posts').update({ data: saveable }).eq('id', id);
      }
    } catch {}
  }, [posts, supabase]);

  const toggleLike = useCallback(async (id: string) => {
    const liked = localLikes.includes(id);
    const post = posts.find(p => p.id === id);
    if (!post) return;

    try {
      if (liked) {
        setLocalLikes(prev => prev.filter(l => l !== id));
        setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p));
        const updated = { ...post, likes: Math.max(0, (post.likes || 0) - 1) };
        const { likedByUser, ...saveable } = updated;
        await supabase.from('posts').update({ data: saveable }).eq('id', id);
      } else {
        setLocalLikes(prev => [...prev, id]);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
        const updated = { ...post, likes: (post.likes || 0) + 1 };
        const { likedByUser, ...saveable } = updated;
        await supabase.from('posts').update({ data: saveable }).eq('id', id);
      }
    } catch {}
  }, [localLikes, posts, supabase]);

  const addSection = useCallback(async (section: Section) => {
    const cleanSection = JSON.parse(JSON.stringify(section));
    setSections(prev => [...prev, section]);
    await supabase.from('sections').upsert({ id: section.id, data: cleanSection });
    await adminRevalidateAll();
  }, [supabase]);

  const updateSection = useCallback(async (section: Section) => {
    const cleanSection = JSON.parse(JSON.stringify(section));
    setSections(prev => prev.map(s => s.id === section.id ? section : s));
    await supabase.from('sections').upsert({ id: section.id, data: cleanSection });
    await adminRevalidateAll();
  }, [supabase]);

  const deleteSection = useCallback(async (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    await supabase.from('sections').delete().eq('id', id);
    await adminRevalidateAll();
  }, [supabase]);

  const updateSettings = useCallback(async (s: SiteSettings) => {
    setSettings(s);
    await supabase.from('settings').upsert({ id: 'global', data: s });
    await adminRevalidateAll();
  }, [supabase]);

  // Map localLikes onto posts efficiently
  const enrichedPosts: Post[] = posts.map(p => ({ ...p, likedByUser: localLikes.includes(p.id) }));

  const getPostById = useCallback((id: string) => enrichedPosts.find(p => p.id === id), [enrichedPosts]);

  const getFilteredPosts = useCallback((section: Section): Post[] => {
    let filtered = [...enrichedPosts].filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
    switch (section.type) {
      case 'ai-tool':
        filtered = filtered.filter(p => p.images.some(img => img.aiTool === section.aiTool));
        break;
      case 'tag':
        filtered = filtered.filter(p => p.tags.some(t => t.toLowerCase() === section.tag?.toLowerCase()));
        break;
      case 'category':
        filtered = filtered.filter(p => p.category?.toLowerCase() === section.category?.toLowerCase());
        break;
      case 'latest':
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
      case 'trending':
        const viewsW = settings.features?.trendingViewsWeight ?? 1;
        const likesW = settings.features?.trendingLikesWeight ?? 2;
        filtered = filtered.sort((a, b) => (b.views * viewsW + b.likes * likesW) - (a.views * viewsW + a.likes * likesW));
        break;
      case 'custom':
        if (section.postIds && section.postIds.length > 0) {
          filtered = section.postIds
            .map(pid => enrichedPosts.find(p => p.id === pid))
            .filter((p): p is Post => p !== undefined && (p.status === 'published' || !p.status) && p.visibility !== 'private');
        }
        break;
    }
    return filtered;
  }, [enrichedPosts, settings.features?.trendingViewsWeight, settings.features?.trendingLikesWeight]);
  
  const searchPosts = useCallback((query: string): Post[] => {
    const q = query.toLowerCase();
    return enrichedPosts.filter(p => 
      (p.status === 'published' || !p.status) && p.visibility !== 'private' &&
      (p.title.toLowerCase().includes(q) ||
       p.description.toLowerCase().includes(q) ||
       p.tags.some(t => t.toLowerCase().includes(q)) ||
       p.images.some(img => img.aiTool.toLowerCase().includes(q)))
    );
  }, [enrichedPosts]);

  return (
    <DataContext.Provider value={{
      posts: enrichedPosts, sections, settings, addPost, updatePost, deletePost,
      incrementViews, toggleLike, addSection, updateSection, deleteSection,
      updateSettings, getPostById, getFilteredPosts, searchPosts, resetData, deleteMockData, loading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
