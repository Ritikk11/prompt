'use client';
import Markdown from 'react-markdown';

export default function MarkdownRenderer({ children }: { children: string }) {
  return <Markdown>{children}</Markdown>;
}
