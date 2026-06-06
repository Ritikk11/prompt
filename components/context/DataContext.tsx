'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Post, Section, SiteSettings } from '@/lib/types';
import { seedPosts, seedSections } from '@/lib/data/seedData';
import { createClient } from '@/lib/supabase-client';

interface DataContextType {
  posts: Post[];
  sections: Section[];
  settings: SiteSettings;
  addPost: (post: Post) => Promise<void>;
  updatePost: (post: Post) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  incrementViews: (id: string, fallbackPost?: Post) => void;
  toggleLike: (id: string, fallbackPost?: Post) => void;
  addSection: (section: Section) => Promise<void>;
  updateSection: (section: Section) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  updateSettings: (settings: SiteSettings) => Promise<void>;
  getPostById: (id: string) => Post | undefined;
  searchPosts: (query: string) => Post[];
  resetData: () => void;
  deleteMockData: () => void;
  loadAdminData: () => Promise<void>;
  setPosts: (posts: Post[]) => void;
  setSections: (sections: Section[]) => void;
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
    showCopyCollection: true,
    showHowTo: true,
    showRecommendedPosts: true,
    showTags: true,
    showDetailedInsights: true,
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

export function DataProvider({ children, initialPosts = [], initialSections = [], initialSettings }: { children: ReactNode, initialPosts?: Post[], initialSections?: Section[], initialSettings: SiteSettings }) {
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
  }, [supabase]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: postsData } = await supabase.from('posts').select('data');
      if (postsData) setPosts(postsData.map((p: any) => p.data));
      
      const { data: sectionsData } = await supabase.from('sections').select('data');
      if (sectionsData) setSections(sectionsData.map((s: any) => s.data));
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setLoading(false);
    }
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
      const { error } = await supabase.from('posts').upsert({ id: post.id, data: cleanPost });
      if (error) throw error;
    } catch (error: any) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      console.error('Supabase save error:', error);
      throw error;
    }
  }, [supabase]);

  const updatePost = useCallback(async (post: Post) => {
    // Remove transient property before save
    const { likedByUser, ...saveable } = post;
    const cleanPost = JSON.parse(JSON.stringify(saveable));
    const previousPost = posts.find(p => p.id === post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? post : p));
    try {
      const { error } = await supabase.from('posts').upsert({ id: post.id, data: cleanPost });
      if (error) throw error;
    } catch (error: any) {
      if (previousPost) setPosts(prev => prev.map(p => p.id === post.id ? previousPost : p));
      console.error('Supabase save error:', error);
      throw error;
    }
  }, [posts, supabase]);

  const deletePost = useCallback(async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await supabase.from('posts').delete().eq('id', id);
  }, [supabase]);

  const incrementViews = useCallback(async (id: string, fallbackPost?: Post) => {
    try {
      let post = posts.find(p => p.id === id);
      if (!post && fallbackPost) {
         post = fallbackPost;
         setPosts(prev => [...prev.filter(p => p.id !== id), { ...post!, views: (post!.views || 0) + 1 }]);
      } else if (post) {
         setPosts(prev => prev.map(p => p.id === id ? { ...p, views: (p.views || 0) + 1 } : p));
      } else {
         // Load from DB
         const { data: dbData } = await supabase.from('posts').select('data').eq('id', id).single();
         if (dbData) post = dbData.data;
         if (!post) return;
      }
      
      const updated = { ...post, views: (post.views || 0) + 1 };
      const { likedByUser, ...saveable } = updated as any;
      await supabase.from('posts').update({ data: saveable }).eq('id', id);
    } catch {}
  }, [posts, supabase]);

  const toggleLike = useCallback(async (id: string, fallbackPost?: Post) => {
    const liked = localLikes.includes(id);
    let post = posts.find(p => p.id === id);
    
    try {
      if (!post) {
         if (fallbackPost) {
             post = fallbackPost;
         } else {
             const { data: dbData } = await supabase.from('posts').select('data').eq('id', id).single();
             if (dbData) post = dbData.data;
         }
         if (!post) return;
      }

      if (liked) {
        setLocalLikes(prev => prev.filter(l => l !== id));
        setPosts(prev => {
            if (!prev.find(p => p.id === id)) return [...prev, { ...post!, likes: Math.max(0, (post!.likes || 0) - 1) }];
            return prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p);
        });
        const updated = { ...post, likes: Math.max(0, (post.likes || 0) - 1) };
        const { likedByUser, ...saveable } = updated as any;
        await supabase.from('posts').update({ data: saveable }).eq('id', id);
      } else {
        setLocalLikes(prev => [...prev, id]);
        setPosts(prev => {
            if (!prev.find(p => p.id === id)) return [...prev, { ...post!, likes: (post!.likes || 0) + 1 }];
            return prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p);
        });
        const updated = { ...post, likes: (post.likes || 0) + 1 };
        const { likedByUser, ...saveable } = updated as any;
        await supabase.from('posts').update({ data: saveable }).eq('id', id);
      }
    } catch {}
  }, [localLikes, posts, supabase]);

  const addSection = useCallback(async (section: Section) => {
    const cleanSection = JSON.parse(JSON.stringify(section));
    setSections(prev => [...prev, section]);
    const { error } = await supabase.from('sections').upsert({ id: section.id, data: cleanSection });
    if (error) {
      setSections(prev => prev.filter(s => s.id !== section.id));
      throw error;
    }
  }, [supabase]);

  const updateSection = useCallback(async (section: Section) => {
    const cleanSection = JSON.parse(JSON.stringify(section));
    const previousSection = sections.find(s => s.id === section.id);
    setSections(prev => prev.map(s => s.id === section.id ? section : s));
    const { error } = await supabase.from('sections').upsert({ id: section.id, data: cleanSection });
    if (error) {
      if (previousSection) setSections(prev => prev.map(s => s.id === section.id ? previousSection : s));
      throw error;
    }
  }, [sections, supabase]);

  const deleteSection = useCallback(async (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    await supabase.from('sections').delete().eq('id', id);
  }, [supabase]);

  const updateSettings = useCallback(async (s: SiteSettings) => {
    const previousSettings = settings;
    setSettings(s);
    const { error } = await supabase.from('settings').upsert({ id: 'global', data: s });
    if (error) {
      setSettings(previousSettings);
      throw error;
    }
  }, [settings, supabase]);

  // Map localLikes onto posts efficiently
  const enrichedPosts: Post[] = posts.map(p => ({ ...p, likedByUser: localLikes.includes(p.id) }));

  const getPostById = useCallback((id: string) => enrichedPosts.find(p => p.id === id), [enrichedPosts]);

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
      updateSettings, getPostById, searchPosts, resetData, deleteMockData, 
      loadAdminData, setPosts, setSections, loading
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
