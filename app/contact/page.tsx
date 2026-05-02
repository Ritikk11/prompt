export const runtime = 'edge';

import { Mail, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 fade-in">
      <h1 className="text-4xl md:text-5xl font-black mb-8 text-surface-900 dark:text-white text-center">Contact Us</h1>
      
      <div className="max-w-xl mx-auto bg-white dark:bg-surface-900 p-8 rounded-3xl shadow-xl border border-surface-200 dark:border-surface-800">
        <p className="text-surface-600 dark:text-surface-300 text-center mb-8">
          Have a question, feedback, or need help? We'd love to hear from you.
        </p>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-surface-900 dark:text-white mb-2">Name</label>
            <input type="text" className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500" placeholder="Your name" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-surface-900 dark:text-white mb-2">Email</label>
            <input type="email" className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500" placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-surface-900 dark:text-white mb-2">Message</label>
            <textarea rows={5} className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="How can we help you?"></textarea>
          </div>

          <button type="button" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
