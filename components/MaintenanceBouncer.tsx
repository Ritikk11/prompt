'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase-lazy';
import { AlertTriangle } from 'lucide-react';

export default function MaintenanceBouncer({ isMaintenanceMode }: { isMaintenanceMode?: boolean }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isMaintenanceMode) {
      setIsAdmin(true);
      return;
    }

    let mounted = true;
    getSupabaseClient().then(async (supabase) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) setIsAdmin(false);
        return;
      }
      
      try {
        const res = await fetch('/api/admin', { 
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (mounted) {
          setIsAdmin(res.ok);
        }
      } catch (e) {
        if (mounted) setIsAdmin(false);
      }
    });

    return () => { mounted = false; };
  }, [isMaintenanceMode]);

  if (!isMaintenanceMode) return null;
  
  if (isAdmin === true) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-[10px] uppercase font-bold text-center py-1 tracking-widest shadow-md pointer-events-none">
        Maintenance Mode Active
      </div>
    );
  }

  // Still checking or confirmed not admin: show full screen block
  return (
    <div className="fixed inset-0 z-[10000] bg-surface-50 dark:bg-surface-950 flex flex-col items-center justify-center p-6">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-3 text-center">Site Under Maintenance</h1>
      <p className="text-surface-600 dark:text-surface-400 text-center max-w-md text-lg">
        We are currently performing scheduled maintenance or upgrades. Please check back soon!
      </p>
    </div>
  );
}
