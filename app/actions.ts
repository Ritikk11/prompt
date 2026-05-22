'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function adminRevalidateAll() {
  console.log('Revalidating all pages from admin panel...');
  revalidatePath('/', 'layout'); // Revalidates the root layout, clearing everything
  return { success: true };
}

export async function adminRevalidateTag(tag: string) {
  console.log('Revalidating tag:', tag);
  revalidateTag(tag);
  return { success: true };
}
