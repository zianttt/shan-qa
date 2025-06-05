// import React, { useState } from 'react';
// import { InlineMath, BlockMath } from 'react-katex';
// import { Copy, Check } from 'lucide-react';


// // Type definitions
// interface Match {
//   type: 'codeBlock' | 'inlineCode' | 'latex' | 'url' | 'bold' | 'italic' | 'strikethrough';
//   start: number;
//   end: number;
//   content: string;
//   fullMatch: string;
//   language?: string;
// }

// interface ProcessedRange {
//   start: number;
//   end: number;
//   match: Match;
// }

// interface InlinePattern {
//   regex: RegExp;
//   type: Match['type'];
// }

// interface MessageRendererProps {
//   content: string;
// }

// const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
//   const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());

//   const copyToClipboard = async (text: string, blockId: string): Promise<void> => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopiedBlocks(prev => new Set([...prev, blockId]));
//       setTimeout(() => {
//         setCopiedBlocks(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(blockId);
//           return newSet;
//         });
//       }, 2000);
//     } catch (err) {
//       console.error('Failed to copy text: ', err);
//     }
//   };

//   const renderContent = (text: string): React.ReactNode[] => {
//     const parts: React.ReactNode[] = [];
//     let blockCounter = 0;

//     // Step 1: Find all ```code blocks``` in the entire text
//     const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
//     const allMatches: Match[] = [];
//     let matchArr: RegExpExecArray | null;

//     while ((matchArr = codeBlockPattern.exec(text)) !== null) {
//       allMatches.push({
//         type: 'codeBlock',
//         start: matchArr.index,
//         end: matchArr.index + matchArr[0].length,
//         language: matchArr[1] || 'text',
//         content: matchArr[2],       // inner code
//         fullMatch: matchArr[0],
//       });
//     }
//     codeBlockPattern.lastIndex = 0;

//     // Sort by start index
//     allMatches.sort((a, b) => a.start - b.start);

//     // Filter out any overlapping code blocks
//     const processedRanges: ProcessedRange[] = [];
//     allMatches.forEach(m => {
//       const overlaps = processedRanges.some(r =>
//         (m.start >= r.start && m.start < r.end) ||
//         (m.end > r.start && m.end <= r.end) ||
//         (m.start <= r.start && m.end >= r.end)
//       );
//       if (!overlaps) {
//         processedRanges.push({ start: m.start, end: m.end, match: m });
//       }
//     });
//     processedRanges.sort((a, b) => a.start - b.start);

//     // Step 2: Walk through text, interleaving code-blocks and inline content
//     let lastIndex = 0;
//     processedRanges.forEach(({ match }) => {
//       // Anything before this code block
//       if (match.start > lastIndex) {
//         const beforeText = text.slice(lastIndex, match.start);
//         parts.push(...processInlineContent(beforeText));
//       }

//       // Render the code block itself
//       const blockId = `code-${blockCounter++}`;
//       parts.push(
//         <div key={blockId} className="my-3 rounded-lg overflow-hidden bg-gray-900">
//           <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-sm text-gray-300">
//             <span>{match.language}</span>
//             <button
//               onClick={() => copyToClipboard(match.content, blockId)}
//               className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
//             >
//               {copiedBlocks.has(blockId) ? (
//                 <>
//                   <Check size={12} />
//                   Copied
//                 </>
//               ) : (
//                 <>
//                   <Copy size={12} />
//                   Copy
//                 </>
//               )}
//             </button>
//           </div>
//           <pre className="p-4 overflow-x-auto text-sm">
//             <code className="text-green-400">{match.content}</code>
//           </pre>
//         </div>
//       );

//       lastIndex = match.end;
//     });

//     // Anything after the last code-block
//     if (lastIndex < text.length) {
//       const remaining = text.slice(lastIndex);
//       parts.push(...processInlineContent(remaining));
//     }

//     return parts;
//   };

//   const processInlineContent = (text: string): React.ReactNode[] => {
//     const parts: React.ReactNode[] = [];
//     const lines = text.split('\n');

//     lines.forEach((line, lineIndex) => {
//       // If it’s not the first line, insert a <br/>
//       if (lineIndex > 0) {
//         parts.push(<br key={`br-${lineIndex}`} />);
//       }

//       // Collect matches for inline patterns on this single line
//       const inlinePatterns: InlinePattern[] = [
//         { regex: /`([^`]+)`/g, type: 'inlineCode' },
//         { regex: /\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g, type: 'latex' },
//         { regex: /(https?:\/\/[^\s]+)/g, type: 'url' },
//         { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
//         { regex: /\*(.*?)\*/g, type: 'italic' },
//         { regex: /~~(.*?)~~/g, type: 'strikethrough' },
//       ];

//       const matches: Match[] = [];
//       inlinePatterns.forEach(({ regex, type }) => {
//         let m: RegExpExecArray | null;
//         while ((m = regex.exec(line)) !== null) {
//           let inner = '';
//           if (type === 'latex') {
//             // m[1] captures inside $$…$$, m[2] captures inside $…$
//             inner = m[1] ?? m[2] ?? '';
//           } else if (type === 'inlineCode') {
//             inner = m[1];
//           } else if (type === 'url') {
//             inner = m[0];
//           } else {
//             // bold/italic/strikethrough: m[1] is the inner text
//             inner = m[1];
//           }

//           matches.push({
//             type,
//             start: m.index,
//             end: m.index + m[0].length,
//             content: inner,
//             fullMatch: m[0],
//           });
//         }
//         regex.lastIndex = 0;
//       });

//       // Sort matches by their start index
//       matches.sort((a, b) => a.start - b.start);

//       // Filter out any overlaps among these inline matches
//       const validMatches: Match[] = [];
//       matches.forEach(m => {
//         const overlap = validMatches.some(vm =>
//           (m.start >= vm.start && m.start < vm.end) ||
//           (m.end > vm.start && m.end <= vm.end)
//         );
//         if (!overlap) {
//           validMatches.push(m);
//         }
//       });

//       // Now build up the React nodes for this single line
//       const lineParts: React.ReactNode[] = [];
//       let pos = 0;

//       validMatches.forEach((m, idx) => {
//         // 1) Text before this match
//         if (m.start > pos) {
//           lineParts.push(line.slice(pos, m.start));
//         }

//         // 2) Render the match itself, according to its type
//         switch (m.type) {
//           case 'inlineCode':
//             lineParts.push(
//               <code
//                 key={`inline-${lineIndex}-${idx}`}
//                 className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono"
//               >
//                 {m.content}
//               </code>
//             );
//             break;

//           case 'latex':
//             // If the raw delimiters were $$…$$, use BlockMath; else InlineMath
//             if (m.fullMatch.startsWith('$$') && m.fullMatch.endsWith('$$')) {
//               lineParts.push(
//                 <BlockMath
//                   key={`blockmath-${lineIndex}-${idx}`}
//                   math={m.content.trim()}
//                 />
//               );
//             } else {
//               lineParts.push(
//                 <InlineMath
//                   key={`inlinemath-${lineIndex}-${idx}`}
//                   math={m.content.trim()}
//                 />
//               );
//             }
//             break;

//           case 'url':
//             lineParts.push(
//               <a
//                 key={`url-${lineIndex}-${idx}`}
//                 href={m.content}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 hover:text-blue-800 underline"
//               >
//                 {m.content}
//               </a>
//             );
//             break;

//           case 'bold':
//             lineParts.push(
//               <strong key={`bold-${lineIndex}-${idx}`}>{m.content}</strong>
//             );
//             break;

//           case 'italic':
//             lineParts.push(
//               <em key={`italic-${lineIndex}-${idx}`}>{m.content}</em>
//             );
//             break;

//           case 'strikethrough':
//             lineParts.push(
//               <del key={`strike-${lineIndex}-${idx}`}>{m.content}</del>
//             );
//             break;
//         }

//         pos = m.end;
//       });

//       // 3) Any trailing text after the last match
//       if (pos < line.length) {
//         lineParts.push(line.slice(pos));
//       }

//       // Finally, append all of this line’s parts into the overall array
//       parts.push(...lineParts);
//     });

//     return parts;
//   };

//   return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
// };

// export default MessageRenderer;

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

interface MessageRendererProps {
    content: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  const preprocessMath = (text: string) => {
    return text.replace(/\\\[([\s\S]+?)\\\]/g, (match, expr) => {
      return `$$${expr}$$`;
    });
  };

  const processedContent = preprocessMath(content);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md prose dark:prose-invert max-w-none overflow-visible">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageRenderer;
