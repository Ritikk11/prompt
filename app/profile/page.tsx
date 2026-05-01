'use client';
import { useEffect, useState } from 'react';
import { useData } from '@/components/context/DataContext';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LogOut, Heart, FileText } from 'lucide-react';
import Link from 'next/link';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

export default function ProfilePage() {
  const { posts, settings, loading } = useData();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
      // Optional: If features turned off, kick out
      if (!settings.features?.userProfiles) {
         navigate.push('/');
      }
    });
    return () => unsub();
  }, [navigate, settings]);

  if (!settings.features?.userProfiles) {
    return null;
  }

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-surface-500 mb-8">Sign in with Google to view and save your favorite prompts.</p>
        <button onClick={() => navigate.push('/')} className="text-primary-500 hover:text-primary-600 font-medium">
          Return Home
        </button>
      </div>
    );
  }

  const likedPosts = posts.filter(p => p.likedByUser && (p.status === 'published' || !p.status));
  const mySubmissions = posts.filter(p => p.authorId === user.uid);

  return (
    <div className="max-w-7xl mx-auto px-1 py-6 sm:py-8 fade-in">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-surface-200 dark:bg-surface-700 rounded-full mb-4 overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user.photoURL && <img src={user.photoURL} alt="" className="w-full h-full object-cover" />}
            </div>
            <h2 className="font-bold text-lg">{user.displayName || 'Anonymous User'}</h2>
            <p className="text-xs text-surface-500 truncate w-full" title={user.email || ''}>{user.email}</p>
          </div>
          
          <hr className="my-6 border-surface-200 dark:border-surface-800" />
          
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-10">
            <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Bookmarks
            </h2>
            {likedPosts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                <Heart className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500 font-medium">No bookmarks yet</p>
                <Link href="/explore" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                  Explore trending prompts
                </Link>
              </div>
            ) : (
              <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                {likedPosts.map((post, i) => (
                  <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
                    <PostCard post={post} index={i} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {settings.features?.userSubmissions && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-500" /> My Submissions
              </h2>
              {mySubmissions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                  <p className="text-surface-500 font-medium">You haven&apos;t submitted any prompts.</p>
                  <Link href="/submit" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                    Submit a new prompt
                  </Link>
                </div>
              ) : (
                <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                  {mySubmissions.map((post, i) => (
                    <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid relative">
                       {/* Overlay indicator for pending/draft */}
                       {(post.status === 'pending' || post.status === 'draft') && (
                          <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                            {post.status}
                          </div>
                       )}
                       <PostCard post={post} index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
