'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Post, Section, SiteSettings } from '@/lib/types';
import { seedPosts, seedSections } from '@/lib/data/seedData';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, increment } from 'firebase/firestore';

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
  siteTitle: 'AI Prompt Matrix',
  siteDescription: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  siteLogo: '',
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

interface DataProviderProps {
  children: ReactNode;
  initialSettings?: SiteSettings;
  initialPosts?: Post[];
  initialSections?: Section[];
}

export function DataProvider({ children, initialSettings, initialPosts, initialSections }: DataProviderProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [sections, setSections] = useState<Section[]>(initialSections || []);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(!initialSettings || !initialPosts);

  const [localLikes, setLocalLikes] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pv-liked');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (stored) setLocalLikes(JSON.parse(stored));
      } catch { /* */ }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pv-liked', JSON.stringify(localLikes));
    }
  }, [localLikes]);

  const resetData = useCallback(async () => {
    const seed = async () => {
      for (const section of seedSections) {
        await setDoc(doc(db, 'sections', section.id), section);
      }
      for (const post of seedPosts) {
        await setDoc(doc(db, 'posts', post.id), post);
      }
      await setDoc(doc(db, 'settings', 'global'), defaultSettings);
      await setDoc(doc(db, 'settings', 'seeded'), { completedAt: new Date().toISOString() });
    };
    seed().catch(console.error);
  }, []);

  const deleteMockData = useCallback(async () => {
    for (const post of seedPosts) {
      await deleteDoc(doc(db, 'posts', post.id));
    }
    for (const section of seedSections) {
      await deleteDoc(doc(db, 'sections', section.id));
    }
  }, []);

  useEffect(() => {
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Post);
      setPosts(data);
    }, (error: any) => {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || String(error).includes('aborted')) return;
      console.error('Firebase posts snapshot error:', error);
    });

    const unsubSections = onSnapshot(collection(db, 'sections'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Section);
      setSections(data);
    }, (error: any) => {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || String(error).includes('aborted')) return;
      console.error('Firebase sections snapshot error:', error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    }, (error: any) => {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || String(error).includes('aborted')) return;
      console.error('Firebase settings snapshot error:', error);
    });

    return () => {
      unsubPosts();
      unsubSections();
      unsubSettings();
    };
  }, [resetData]);

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
    await setDoc(doc(db, 'posts', post.id), cleanPost);
  }, []);

  const updatePost = useCallback(async (post: Post) => {
    // Remove transient property before save
    const { likedByUser, ...saveable } = post;
    const cleanPost = JSON.parse(JSON.stringify(saveable));
    await setDoc(doc(db, 'posts', post.id), cleanPost);
  }, []);

  const deletePost = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'posts', id));
  }, []);

  const incrementViews = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { views: increment(1) });
    } catch {}
  }, []);

  const toggleLike = useCallback(async (id: string) => {
    const liked = localLikes.includes(id);
    try {
      if (liked) {
        setLocalLikes(prev => prev.filter(l => l !== id));
        await updateDoc(doc(db, 'posts', id), { likes: increment(-1) });
      } else {
        setLocalLikes(prev => [...prev, id]);
        await updateDoc(doc(db, 'posts', id), { likes: increment(1) });
      }
    } catch {}
  }, [localLikes]);

  const addSection = useCallback(async (section: Section) => {
    await setDoc(doc(db, 'sections', section.id), section);
  }, []);

  const updateSection = useCallback(async (section: Section) => {
    await setDoc(doc(db, 'sections', section.id), section);
  }, []);

  const deleteSection = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'sections', id));
  }, []);

  const updateSettings = useCallback(async (s: SiteSettings) => {
    await setDoc(doc(db, 'settings', 'global'), s);
  }, []);

  // Map localLikes onto posts efficiently
  const enrichedPosts: Post[] = posts.map(p => ({ ...p, likedByUser: localLikes.includes(p.id) }));

  const getPostById = useCallback((id: string) => enrichedPosts.find(p => p.id === id), [enrichedPosts]);

  const getFilteredPosts = useCallback((section: Section): Post[] => {
    let filtered = [...enrichedPosts].filter(p => p.status === 'published' || !p.status);
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
            .filter((p): p is Post => p !== undefined && (p.status === 'published' || !p.status));
        }
        break;
    }
    return filtered;
  }, [enrichedPosts, settings.features?.trendingViewsWeight, settings.features?.trendingLikesWeight]);
  
  const searchPosts = useCallback((query: string): Post[] => {
    const q = query.toLowerCase();
    return enrichedPosts.filter(p => 
      (p.status === 'published' || !p.status) &&
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
