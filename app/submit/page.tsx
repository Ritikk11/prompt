'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '@/components/context/DataContext';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { ImagePrompt } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SubmitPage() {
  const { settings, loading } = useData();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<ImagePrompt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
      if (!settings.features?.userSubmissions) {
         navigate.push('/');
      }
    });
    return () => unsub();
  }, [navigate, settings]);

  if (!settings.features?.userSubmissions) return null;
  if (authLoading || loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-surface-500 mb-8">Sign in to submit your prompt collection.</p>
        <button onClick={() => {
           const provider = new GoogleAuthProvider();
           signInWithPopup(auth, provider);
        }} className="px-6 py-3 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  const handleImageUpload = async (file: File) => {
    if (!settings.imgbbApiKey) {
      alert("Image uploads are not configured by the admin yet.");
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${settings.imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImages(prev => [...prev, { id: generateId(), url: data.data.url, prompt: '', aiTool: settings.aiTools[0] }]);
      } else {
        alert("Upload failed: " + data.error.message);
      }
    } catch (e) {
      alert("Error uploading image");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(f => handleImageUpload(f));
    }
  };

  const updateImage = (idx: number, updates: Partial<ImagePrompt>) => {
    const newImages = [...images];
    newImages[idx] = { ...newImages[idx], ...updates };
    setImages(newImages);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w-]+/g, '-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Title is required");
    if (images.length === 0) return alert("Add at least one image/prompt");
    if (images.some(i => !i.prompt)) return alert("Every image must have a prompt text");
    
    setIsSubmitting(true);
    const postTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const slug = slugify(title);
    const id = generateId();

    try {
      const isAutoApprove = settings.features?.userSubmissionsAutoApprove;
      await setDoc(doc(db, 'posts', id), {
        id,
        slug,
        title,
        description,
        images,
        tags: postTags,
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        featured: false,
        authorId: user.uid,
        status: isAutoApprove ? 'published' : 'pending'
      });
      alert(isAutoApprove ? 'Prompt collection published successfully!' : 'Prompt collection submitted successfully! It is pending admin approval.');
      navigate.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to submit');
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Collection Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none transition-colors text-sm"
              placeholder="e.g. Cyberpunk Cityscapes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none transition-colors text-sm resize-none"
              placeholder="Describe what these prompts generate..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (Comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none transition-colors text-sm"
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
              <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 relative group">
                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
                <div className="w-full sm:w-32 h-32 shrink-0 rounded-lg overflow-hidden relative bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <select
                    value={img.aiTool}
                    onChange={e => updateImage(idx, { aiTool: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 outline-none focus:border-primary-500"
                  >
                    {settings.aiTools.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea
                    required
                    value={img.prompt}
                    onChange={e => updateImage(idx, { prompt: e.target.value })}
                    rows={3}
                    placeholder="Exact prompt text..."
                    className="w-full px-3 py-2 rounded-lg text-sm border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 outline-none focus:border-primary-500 resize-none font-mono"
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
