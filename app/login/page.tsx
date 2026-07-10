import { fetchSettings } from '@/lib/data';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Sign In | AI PromptMatrix',
  description: 'Sign in or sign up to access your saved prompts, comments, and public creator profile on AI PromptMatrix.',
};

export default async function LoginPage() {
  const settings = await fetchSettings();
  
  return <LoginClient settings={settings} />;
}
