import React from 'react';

/**
 * Parses inline markdown:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 * - [link](url)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match inline tokens:
  // 1: `code`
  // 2: **bold** or __bold__
  // 3: *italic* or _italic_
  // 4: [text](url)
  const tokenRegex = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      elements.push(
        <code
          key={`code-${match.index}`}
          className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-pink-600 dark:text-pink-400"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (
      (matchedStr.startsWith('**') && matchedStr.endsWith('**')) ||
      (matchedStr.startsWith('__') && matchedStr.endsWith('__'))
    ) {
      elements.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-inherit">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (
      (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
      (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
    ) {
      elements.push(
        <em key={`em-${match.index}`} className="italic">
          {matchedStr.slice(1, -1)}
        </em>
      );
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(matchedStr);
      if (linkMatch) {
        elements.push(
          <a
            key={`link-${match.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(matchedStr);
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Remainder plain text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

/**
 * Formats a multiline markdown text string into structured React JSX nodes.
 * Supports:
 * - Code blocks (```lang ... ```)
 * - Headers (#, ##, ###)
 * - Blockquotes (>)
 * - Bullet lists (*, -, •)
 * - Numbered lists (1., 2., etc.)
 * - Inline bold, italic, code, links
 * - Paragraphs
 */
export function renderMarkdown(content: string | undefined | null): React.ReactNode {
  if (!content) return null;

  // Normalize line endings
  const rawText = String(content).replace(/\r\n/g, '\n');

  // Handle multi-line code blocks first
  const parts = rawText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content space-y-2 text-inherit leading-relaxed">
      {parts.map((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code block
          const lines = part.slice(3, -3).split('\n');
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : '';
          const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={`codeblock-${partIdx}`} className="my-2 rounded-lg bg-slate-900 text-slate-100 overflow-hidden text-xs font-mono">
              {lang && (
                <div className="bg-slate-800/80 px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/50">
                  {lang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Process line by line
        const lines = part.split('\n');
        const renderedNodes: React.ReactNode[] = [];
        let currentListItems: React.ReactNode[] = [];
        let isNumberedList = false;

        const flushList = (keySuffix: string) => {
          if (currentListItems.length > 0) {
            if (isNumberedList) {
              renderedNodes.push(
                <ol key={`ol-${keySuffix}`} className="my-1.5 space-y-1 pl-1 text-inherit">
                  {currentListItems}
                </ol>
              );
            } else {
              renderedNodes.push(
                <ul key={`ul-${keySuffix}`} className="my-1.5 space-y-1 pl-1 text-inherit">
                  {currentListItems}
                </ul>
              );
            }
            currentListItems = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Empty line -> flush list and insert subtle break if needed
          if (!trimmed) {
            flushList(`empty-${partIdx}-${lineIdx}`);
            return;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            flushList(`h3-${partIdx}-${lineIdx}`);
            renderedNodes.push(
              <h4 key={`h3-${partIdx}-${lineIdx}`} className="font-bold text-sm mt-3 mb-1 text-inherit tracking-tight">
                {parseInlineMarkdown(trimmed.slice(4))}
              </h4>
            );
            return;
          }

          if (trimmed.startsWith('## ')) {
            flushList(`h2-${partIdx}-${lineIdx}`);
            renderedNodes.push(
              <h3 key={`h2-${partIdx}-${lineIdx}`} className="font-bold text-base mt-3 mb-1.5 text-inherit tracking-tight">
                {parseInlineMarkdown(trimmed.slice(3))}
              </h3>
            );
            return;
          }

          if (trimmed.startsWith('# ')) {
            flushList(`h1-${partIdx}-${lineIdx}`);
            renderedNodes.push(
              <h2 key={`h1-${partIdx}-${lineIdx}`} className="font-extrabold text-lg mt-3 mb-2 text-inherit tracking-tight">
                {parseInlineMarkdown(trimmed.slice(2))}
              </h2>
            );
            return;
          }

          // Blockquote
          if (trimmed.startsWith('> ')) {
            flushList(`quote-${partIdx}-${lineIdx}`);
            renderedNodes.push(
              <blockquote
                key={`quote-${partIdx}-${lineIdx}`}
                className="border-l-2 border-indigo-400 pl-3 py-1 my-1.5 italic text-opacity-90 bg-black/5 dark:bg-white/5 rounded-r"
              >
                {parseInlineMarkdown(trimmed.slice(2))}
              </blockquote>
            );
            return;
          }

          // Bullet list (*, -, +, •)
          const bulletMatch = /^[*\-+•]\s+(.*)$/.exec(trimmed);
          if (bulletMatch) {
            if (isNumberedList) {
              flushList(`switch-to-bullet-${partIdx}-${lineIdx}`);
              isNumberedList = false;
            }
            currentListItems.push(
              <li key={`li-${partIdx}-${lineIdx}`} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold leading-5 select-none shrink-0">•</span>
                <span className="flex-1">{parseInlineMarkdown(bulletMatch[1])}</span>
              </li>
            );
            return;
          }

          // Numbered list (1. item)
          const numberMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
          if (numberMatch) {
            if (!isNumberedList) {
              flushList(`switch-to-numbered-${partIdx}-${lineIdx}`);
              isNumberedList = true;
            }
            currentListItems.push(
              <li key={`num-li-${partIdx}-${lineIdx}`} className="flex items-start gap-2">
                <span className="font-mono text-[10px] opacity-70 mt-0.5 shrink-0 select-none">
                  {numberMatch[1]}.
                </span>
                <span className="flex-1">{parseInlineMarkdown(numberMatch[2])}</span>
              </li>
            );
            return;
          }

          // Regular paragraph / text line
          flushList(`p-flush-${partIdx}-${lineIdx}`);
          renderedNodes.push(
            <p key={`p-${partIdx}-${lineIdx}`} className="my-0.5 leading-relaxed">
              {parseInlineMarkdown(line)}
            </p>
          );
        });

        flushList(`final-${partIdx}`);

        return <React.Fragment key={`part-${partIdx}`}>{renderedNodes}</React.Fragment>;
      })}
    </div>
  );
}

export default renderMarkdown;
