'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '@/components/context/DataContext';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { ImagePrompt } from '@/lib/types';
import { getImageModelForTools } from '@/lib/constants';
import { optimizeImageFile } from '@/lib/client-image-optimizer';
import { uploadImageFileToProvider } from '@/lib/client-upload';
import { showToast } from '@/components/ui/ToastContainer';

export default function SubmitPage() {
  const { settings, loading, addPost } = useData();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<ImagePrompt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, settings]);

  if (authLoading || loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!settings.features?.userProfiles || !settings.features?.userSubmissions) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-[16px] backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.08] p-8">
          <h1 className="text-2xl font-black text-surface-950 dark:text-white">Prompt submissions are currently closed</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-surface-600 dark:text-surface-300">
            The submission form is disabled by the site admin right now. You can still contact the team if you want to suggest a prompt or request access.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contact" className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white hover:bg-primary-600">Contact Us</Link>
            <Link href="/explore" className="rounded-full border border-white/80 bg-white/60 px-5 py-3 text-sm font-bold text-surface-700 shadow-sm backdrop-blur-xl transition hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200 dark:hover:text-white">Explore Prompts</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-surface-500 mb-8">Sign in to submit your prompt collection.</p>
        <button onClick={() => navigate.push('/login?redirectTo=/submit')} className="px-6 py-3 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const hasIncompleteProfile = Boolean(user && (!user.user_metadata?.full_name || !user.user_metadata?.username));

  const updateImage = (idx: number, patch: Partial<ImagePrompt>) => {
    setImages(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (file: File) => {
    try {
      const optimizedFile = await optimizeImageFile(file, 'prompt');
      const url = await uploadImageFileToProvider(
        optimizedFile,
        settings.imageProvider === 'cloudflare' ? 'cloudflare' : 'supabase',
        'prompt',
        title || undefined
      );
      
      const defaultTool = settings.aiTools[0] || 'ChatGPT';
      setImages(prev => [...prev, { id: generateId(), url, prompt: '', aiTool: defaultTool, model: getImageModelForTools([defaultTool]) }]);
    } catch (e: any) {
      showToast(e.message || "Error uploading image", 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      showToast('Please upload at least one image', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const isAutoApprove = settings.features?.userSubmissionsAutoApprove;
      const newPost: any = {
        id: generateId(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || generateId(),
        title,
        description,
        thumbnailUrl: images[0]?.url || '',
        images,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        authorId: user?.id,
        authorName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        authorUsername: user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous',
        authorAvatar: user?.user_metadata?.avatar_url || '',
        featured: false,
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString(),
        status: isAutoApprove ? 'published' : 'pending',
        visibility: 'public',
      };

      await addPost(newPost);
      showToast(isAutoApprove ? 'Prompt submitted and published!' : 'Prompt submitted for review!');
      navigate.push('/profile');
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to submit prompt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Submit a Prompt</h1>
      <p className="text-surface-500 mb-8">
        Share your AI generation with the community.
        {!settings.features?.userSubmissionsAutoApprove && ' Submissions will be reviewed by an admin.'}
      </p>

      {hasIncompleteProfile && (
        <div className="mb-8 p-5 rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-sm">
          <p className="font-extrabold mb-1">Please Complete Your Profile</p>
          <p className="mb-3 text-surface-600 dark:text-surface-300">Set your name, public @username, and profile picture before submitting to ensure your prompts are properly credited.</p>
          <Link href="/profile?setup=true" className="inline-flex font-bold underline text-primary-500 hover:text-primary-600">
            Go to Profile Setup &rarr;
          </Link>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Collection Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/80 dark:border-white/10 focus:border-primary-500 outline-none transition-colors text-sm"
              placeholder="e.g. Cyberpunk Cityscapes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/80 dark:border-white/10 focus:border-primary-500 outline-none transition-colors text-sm resize-none"
              placeholder="Describe what these prompts generate..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (Comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/80 dark:border-white/10 focus:border-primary-500 outline-none transition-colors text-sm"
              placeholder="cyberpunk, city, neon, future"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
            <span>Images & Prompts</span>
            <span className="text-xs font-normal text-surface-500">{images.length} added</span>
          </label>
          <div className="space-y-4">
            {images.map((img, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] relative group">
                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
                <div className="w-full sm:w-32 h-32 shrink-0 rounded-lg overflow-hidden relative border border-white/70 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]">
                  <Image src={img.url} alt="" fill sizes="128px" className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {settings.aiTools.map(tool => {
                      const isSelected = img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool;
                      return (
                        <label key={tool} className="flex items-center gap-1.5 cursor-pointer bg-white/40 dark:bg-white/5 border border-white/80 dark:border-white/10 px-2 py-1.5 rounded text-xs">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              let newTools = img.aiTools ? [...img.aiTools] : [img.aiTool].filter(Boolean);
                              if (e.target.checked && !newTools.includes(tool)) newTools.push(tool);
                              else newTools = newTools.filter(t => t !== tool);
                              updateImage(idx, {
                                aiTools: newTools,
                                aiTool: newTools[0] || '',
                                model: getImageModelForTools(newTools, img.model)
                              });
                            }}
                            className="w-3.5 h-3.5 rounded text-primary-500 focus:ring-primary-500"
                          />
                          {tool}
                        </label>
                      );
                    })}
                  </div>
                  <textarea
                    required
                    value={img.prompt}
                    onChange={e => updateImage(idx, { prompt: e.target.value })}
                    rows={3}
                    placeholder="Exact prompt text..."
                    className="w-full px-3 py-2 rounded-lg text-sm border-white/80 dark:border-white/10 bg-white/40 dark:bg-white/5 outline-none focus:border-primary-500 resize-none font-mono"
                  />
                </div>
              </div>
            ))}

            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <div className="w-full py-8 text-center rounded-xl border-2 border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium text-primary-600 dark:text-primary-400">Click or drag images here to upload</p>
                  <p className="text-xs text-surface-500 mt-1">Supports JPG, PNG, WEBP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || images.length === 0}
          className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Collection'}
        </button>
      </form>
    </div>
  );
}
