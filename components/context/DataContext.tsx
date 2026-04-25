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
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteTitle: 'PromptVault',
  siteDescription: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  heroEnabled: true,
  heroAutoPlay: true,
  aiTools: ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Post);
      setPosts(data);
    }, (error) => {
      if (error.name === 'AbortError' || error.message.includes('aborted')) return;
      console.error('Firebase posts snapshot error:', error);
    });

    const unsubSections = onSnapshot(collection(db, 'sections'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Section);
      setSections(data);
    }, (error) => {
      if (error.name === 'AbortError' || error.message.includes('aborted')) return;
      console.error('Firebase sections snapshot error:', error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      } else {
        // Automatically seed mock data on an empty database
        resetData();
      }
      setLoading(false);
    }, (error) => {
      if (error.name === 'AbortError' || error.message.includes('aborted')) return;
      console.error('Firebase settings snapshot error:', error);
    });

    return () => {
      unsubPosts();
      unsubSections();
      unsubSettings();
    };
  }, [resetData]);

  const addPost = useCallback(async (post: Post) => {
    await setDoc(doc(db, 'posts', post.id), post);
  }, []);

  const updatePost = useCallback(async (post: Post) => {
    // Remove transient property before save
    const { likedByUser, ...saveable } = post;
    await setDoc(doc(db, 'posts', post.id), saveable);
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

  useEffect(() => {
    if (!loading && posts.length > 0 && posts.length < 15) {
      resetData();
    } else if (!loading && posts.length === 0 && sections.length === 0) {
      resetData();
    }
  }, [loading, posts.length, sections.length, resetData]);

  // Map localLikes onto posts efficiently
  const enrichedPosts: Post[] = posts.map(p => ({ ...p, likedByUser: localLikes.includes(p.id) }));

  const getPostById = useCallback((id: string) => enrichedPosts.find(p => p.id === id), [enrichedPosts]);

  const getFilteredPosts = useCallback((section: Section): Post[] => {
    let filtered = [...enrichedPosts];
    switch (section.type) {
      case 'ai-tool':
        filtered = filtered.filter(p => p.images.some(img => img.aiTool === section.aiTool));
        break;
      case 'latest':
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
      case 'custom':
        if (section.postIds && section.postIds.length > 0) {
          filtered = section.postIds
            .map(pid => enrichedPosts.find(p => p.id === pid))
            .filter((p): p is Post => p !== undefined);
        }
        break;
    }
    return filtered;
  }, [enrichedPosts]);

  const searchPosts = useCallback((query: string): Post[] => {
    const q = query.toLowerCase();
    return enrichedPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.images.some(img => img.aiTool.toLowerCase().includes(q))
    );
  }, [enrichedPosts]);

  return (
    <DataContext.Provider value={{
      posts: enrichedPosts, sections, settings, addPost, updatePost, deletePost,
      incrementViews, toggleLike, addSection, updateSection, deleteSection,
      updateSettings, getPostById, getFilteredPosts, searchPosts, resetData, loading
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
