'use client';
import { Children, type ReactNode, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

type CalloutType = 'tip' | 'warning' | 'info' | 'note' | 'success' | 'danger' | 'highlight' | 'quote' | 'prompt' | 'example' | 'creative' | 'model' | 'important';
type MarkdownBlock =
  | { type: 'markdown'; content: string }
  | { type: 'callout'; calloutType: CalloutType; title?: string; content: string };

const calloutTypes: CalloutType[] = ['tip', 'warning', 'info', 'note', 'success', 'danger', 'highlight', 'quote', 'prompt', 'example', 'creative', 'model', 'important'];
const calloutTypeSet = new Set<string>(calloutTypes);

const calloutStyles: Record<CalloutType, {
  className: string;
  accentClassName: string;
  titleClassName: string;
}> = {
  tip: {
    className: 'border-primary-200/70 bg-primary-50/60 text-surface-800 dark:border-primary-500/25 dark:bg-primary-500/[0.08] dark:text-primary-50',
    accentClassName: 'bg-primary-500',
    titleClassName: 'text-primary-600 dark:text-primary-300'
  },
  warning: {
    className: 'border-amber-200/70 bg-amber-50/60 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-50',
    accentClassName: 'bg-amber-500',
    titleClassName: 'text-amber-600 dark:text-amber-300'
  },
  info: {
    className: 'border-sky-200/70 bg-sky-50/60 text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.08] dark:text-sky-50',
    accentClassName: 'bg-sky-500',
    titleClassName: 'text-sky-600 dark:text-sky-300'
  },
  note: {
    className: 'border-violet-200/70 bg-violet-50/60 text-violet-950 dark:border-violet-500/25 dark:bg-violet-500/[0.08] dark:text-violet-50',
    accentClassName: 'bg-violet-500',
    titleClassName: 'text-violet-600 dark:text-violet-300'
  },
  success: {
    className: 'border-emerald-200/70 bg-emerald-50/60 text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08] dark:text-emerald-50',
    accentClassName: 'bg-emerald-500',
    titleClassName: 'text-emerald-600 dark:text-emerald-300'
  },
  danger: {
    className: 'border-rose-200/70 bg-rose-50/60 text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/[0.08] dark:text-rose-50',
    accentClassName: 'bg-rose-500',
    titleClassName: 'text-rose-600 dark:text-rose-300'
  },
  highlight: {
    className: 'border-fuchsia-200/70 bg-fuchsia-50/60 text-fuchsia-950 dark:border-fuchsia-500/25 dark:bg-fuchsia-500/[0.08] dark:text-fuchsia-50',
    accentClassName: 'bg-fuchsia-500',
    titleClassName: 'text-fuchsia-600 dark:text-fuchsia-300'
  },
  quote: {
    className: 'border-surface-200 bg-surface-50 text-surface-800 dark:border-surface-700 dark:bg-surface-800/60 dark:text-surface-50',
    accentClassName: 'bg-surface-400 dark:bg-surface-500',
    titleClassName: 'text-surface-500 dark:text-surface-400'
  },
  prompt: {
    className: 'border-indigo-200/70 bg-indigo-50/60 text-indigo-950 dark:border-indigo-500/25 dark:bg-indigo-500/[0.08] dark:text-indigo-50',
    accentClassName: 'bg-indigo-500',
    titleClassName: 'text-indigo-600 dark:text-indigo-300'
  },
  example: {
    className: 'border-teal-200/70 bg-teal-50/60 text-teal-950 dark:border-teal-500/25 dark:bg-teal-500/[0.08] dark:text-teal-50',
    accentClassName: 'bg-teal-500',
    titleClassName: 'text-teal-600 dark:text-teal-300'
  },
  creative: {
    className: 'border-pink-200/70 bg-pink-50/60 text-pink-950 dark:border-pink-500/25 dark:bg-pink-500/[0.08] dark:text-pink-50',
    accentClassName: 'bg-pink-500',
    titleClassName: 'text-pink-600 dark:text-pink-300'
  },
  model: {
    className: 'border-cyan-200/70 bg-cyan-50/60 text-cyan-950 dark:border-cyan-500/25 dark:bg-cyan-500/[0.08] dark:text-cyan-50',
    accentClassName: 'bg-cyan-500',
    titleClassName: 'text-cyan-600 dark:text-cyan-300'
  },
  important: {
    className: 'border-orange-200/70 bg-orange-50/60 text-orange-950 dark:border-orange-500/25 dark:bg-orange-500/[0.08] dark:text-orange-50',
    accentClassName: 'bg-orange-500',
    titleClassName: 'text-orange-600 dark:text-orange-300'
  }
};

const inlineStyles: Record<string, string> = {
  mark: 'rounded-md bg-yellow-200/80 px-1.5 py-0.5 font-medium text-yellow-950 dark:bg-yellow-300/20 dark:text-yellow-100',
  primary: 'rounded-md bg-primary-100 px-1.5 py-0.5 font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  blue: 'rounded-md bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  green: 'rounded-md bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'rounded-md bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  purple: 'rounded-md bg-violet-100 px-1.5 py-0.5 font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  orange: 'rounded-md bg-orange-100 px-1.5 py-0.5 font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  pink: 'rounded-md bg-pink-100 px-1.5 py-0.5 font-semibold text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  gray: 'rounded-md bg-surface-100 px-1.5 py-0.5 font-medium text-surface-700 dark:bg-surface-800 dark:text-surface-200',
  outline: 'rounded-md border border-current px-1.5 py-0.5 font-semibold',
  kbd: 'rounded-md border border-surface-300 bg-white px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-surface-700 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200'
};

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  const markdownBuffer: string[] = [];

  const flushMarkdown = () => {
    const markdown = markdownBuffer.join('\n').trim();
    if (markdown) blocks.push({ type: 'markdown', content: markdown });
    markdownBuffer.length = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.trim().match(/^:::(\w+)(?:\s+(.+))?$/);

    if (!match || !calloutTypeSet.has(match[1])) {
      markdownBuffer.push(line);
      continue;
    }

    const calloutLines: string[] = [];
    let closed = false;

    for (index += 1; index < lines.length; index += 1) {
      if (lines[index].trim() === ':::') {
        closed = true;
        break;
      }
      calloutLines.push(lines[index]);
    }

    if (!closed) {
      markdownBuffer.push(line, ...calloutLines);
      continue;
    }

    flushMarkdown();
    blocks.push({
      type: 'callout',
      calloutType: match[1] as CalloutType,
      title: match[2],
      content: calloutLines.join('\n').trim()
    });
  }

  flushMarkdown();
  return blocks;
}

function renderStyledText(value: string) {
  const parts: ReactNode[] = [];
  const pattern = /\{(mark|primary|blue|green|red|purple|orange|pink|gray|outline|kbd):([^{}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index));
    parts.push(
      <span key={`${match[1]}-${match.index}`} className={inlineStyles[match[1]]}>
        {match[2]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) parts.push(value.slice(lastIndex));
  return parts.length > 0 ? parts : value;
}

function renderInline(children: ReactNode) {
  return Children.map(children, (child) => (
    typeof child === 'string' ? renderStyledText(child) : child
  ));
}

function renderMarkdown(content: string) {
  return (
    <Markdown
      rehypePlugins={[rehypeRaw]}
      components={{
        h2: (props) => (
          <h2 className="mt-10 mb-6 border-b border-surface-100 pb-3 text-3xl font-bold tracking-tight text-surface-900 dark:border-surface-800 dark:text-white">
            <span className="mr-3 inline-block h-6 w-1.5 rounded-full bg-primary-500 align-[-3px]" />
            {renderInline(props.children)}
          </h2>
        ),
        h3: (props) => (
          <h3 className="mt-8 mb-4 flex items-center gap-2 text-xl font-semibold text-surface-900 dark:text-white">
            <span className="text-primary-500">❖</span>
            {renderInline(props.children)}
          </h3>
        ),
        h4: (props) => (
          <h4 className="mt-7 mb-3 flex items-center gap-2 text-base font-bold uppercase tracking-wide text-surface-700 dark:text-surface-200">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" />
            {renderInline(props.children)}
          </h4>
        ),
        h5: (props) => (
          <h5 className="mt-6 mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
            <span className="h-px w-8 bg-primary-500" />
            {renderInline(props.children)}
          </h5>
        ),
        p: (props) => <p>{renderInline(props.children)}</p>,
        strong: (props) => <strong className="font-extrabold text-surface-950 dark:text-white">{renderInline(props.children)}</strong>,
        em: (props) => <em className="text-surface-700 dark:text-surface-200">{renderInline(props.children)}</em>,
        a: (props) => <a className="font-semibold text-primary-600 underline decoration-primary-300 decoration-2 underline-offset-4 hover:text-primary-700 dark:text-primary-300 dark:decoration-primary-700" {...props} />,
        ul: (props) => <ul className="my-5 list-disc space-y-2 pl-6 marker:text-primary-500" {...props} />,
        ol: (props) => <ol className="my-5 list-decimal space-y-2 pl-6 marker:font-bold marker:text-primary-500" {...props} />,
        li: (props) => (
          <li className="pl-1">
            {renderInline(props.children)}
          </li>
        ),
        hr: () => <hr className="my-10 border-0 border-t border-surface-200 dark:border-surface-800" />,
        blockquote: (props) => (
          <blockquote className="my-8 rounded-r-2xl border-l-4 border-primary-500 bg-surface-50 py-4 pl-6 font-serif text-xl italic text-surface-700 dark:bg-surface-800/50 dark:text-surface-300">
            {props.children}
          </blockquote>
        ),
        code: (props) => <code className="rounded-md border border-surface-200 bg-surface-100 px-2 py-1 font-mono text-[0.9em] text-primary-600 dark:border-surface-700 dark:bg-surface-800/80 dark:text-primary-400" {...props} />,
        pre: (props) => <pre className="my-6 overflow-x-auto rounded-2xl border border-surface-800 bg-surface-900 p-6 text-surface-100 shadow-inner" {...props} />
      }}
    >
      {content}
    </Markdown>
  );
}

function Callout({ block }: { block: Extract<MarkdownBlock, { type: 'callout' }> }) {
  const style = calloutStyles[block.calloutType];
  const [copied, setCopied] = useState(false);
  const canCopy = block.calloutType === 'prompt';

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const hasHeader = Boolean(block.title) || canCopy;

  return (
    <div className={`relative my-7 overflow-hidden rounded-xl border py-4 pl-5 pr-4 sm:py-5 sm:pl-6 sm:pr-5 ${style.className}`}>
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${style.accentClassName}`} />
      {hasHeader && (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {block.title ? (
            <p className={`m-0 text-xs font-extrabold uppercase tracking-[0.16em] ${style.titleClassName}`}>
              {renderStyledText(block.title)}
            </p>
          ) : <span />}
          {canCopy && (
            <button
              type="button"
              onClick={copyContent}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${style.titleClassName}`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <div className="callout-content text-current prose-p:my-2 prose-p:leading-relaxed prose-p:text-current prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:text-current">
        <MarkdownRenderer>{block.content}</MarkdownRenderer>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <>
      {parseMarkdownBlocks(children).map((block, index) => (
        block.type === 'callout'
          ? <Callout key={`callout-${index}`} block={block} />
          : <div key={`markdown-${index}`}>{renderMarkdown(block.content)}</div>
      ))}
    </>
  );
}
