import React, { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  CheckCheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  AlertCircleIcon } from
'lucide-react';
import { Message } from '../types';
import { ProductSection } from './ProductSection';

interface MessageBubbleProps {
  message: Message;
  interestedIds: Set<number>;
  onFollowUp: (prompt: string) => void;
  onInterest: (productId: number, name: string, resultCode?: string) => void;
  onResend: (messageId: string) => void;
}

type Feedback = 'copied' | 'opened' | null;

const numberPattern = /(?<![\w.])(?:\+?\d[\d\s().-]{1,}\d|\d{3,})(?![\w.])/g;

function Ticks({ status }: {status?: Message['status'];}) {
  if (!status) return null;
  if (status === 'read') {
    return <CheckCheckIcon className="h-4 w-4 text-wa-tick" aria-label="Read" />;
  }
  if (status === 'delivered') {
    return <CheckCheckIcon className="h-4 w-4 text-wa-textSecondary" aria-label="Delivered" />;
  }
  return <CheckIcon className="h-4 w-4 text-wa-textSecondary" aria-label="Sent" />;
}

export function MessageBubble({ message, interestedIds, onFollowUp, onInterest, onResend }: MessageBubbleProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.sender === 'user';
  const isFailed = isUser && message.status === 'failed';

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setIsActive(false);
        setIsMenuOpen(false);
        setSelectedNumber(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const showFeedback = (nextFeedback: Feedback) => {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 1800);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showFeedback('copied');
  };

  const isPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  const openWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
    showFeedback('opened');
    setSelectedNumber(null);
  };

  const renderText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const matcher = new RegExp(numberPattern);
    let match = matcher.exec(text);

    while (match) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      const number = match[0];
      parts.push(
        <button
          key={`${number}-${match.index}`}
          type="button"
          onClick={() => {
            setSelectedNumber(number);
            void copyText(number);
          }}
          className="rounded px-0.5 font-medium text-wa-teal underline decoration-wa-teal/40 underline-offset-2 hover:bg-wa-green/15 focus:outline-none focus:ring-2 focus:ring-wa-green"
          title="Copy number">
          
          {number}
        </button>
      );
      lastIndex = match.index + number.length;
      match = matcher.exec(text);
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const canOpenWhatsApp = selectedNumber ? isPhoneNumber(selectedNumber) : false;
  const copyableText = message.text ?? message.imageCaption ?? message.attachment?.name ?? '';
  const actionMenu =
  <div className="relative mt-1 shrink-0">
      <button
      type="button"
      onClick={() => setIsMenuOpen((current) => !current)}
      aria-label="Message options"
      aria-expanded={isMenuOpen}
      className="rounded-full border border-wa-border bg-wa-panel p-1.5 text-wa-textSecondary shadow-sm hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
      
        <MoreHorizontalIcon className="h-4 w-4" />
      </button>
      {isMenuOpen &&
    <div className={`absolute top-8 z-30 w-28 overflow-hidden rounded-lg border border-wa-border bg-wa-panel py-1 shadow-panel ${isUser ? 'left-0' : 'right-0'}`}>
          <button
        type="button"
        onClick={() => {
          void copyText(copyableText);
          setIsMenuOpen(false);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-wa-textPrimary hover:bg-wa-panelAlt focus:bg-wa-panelAlt focus:outline-none">
        
            <CopyIcon className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
    }
    </div>;


  return (
    <div
      ref={messageRef}
      className={`group flex items-start message-enter gap-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {isUser && isActive && actionMenu}
      <div
        onClick={() => setIsActive(true)}
        className={`relative max-w-[85%] cursor-pointer rounded-lg p-1.5 shadow-bubble sm:max-w-[65%] ${
        isUser
          ? isFailed
            ? 'rounded-tr-none border border-red-300 bg-[#fef2f2]'
            : 'rounded-tr-none bg-wa-sent'
          : 'rounded-tl-none bg-wa-received'
        }`}>
        
        <span
          aria-hidden="true"
          className={`absolute top-0 h-3 w-3 ${
          isUser ?
          '-right-1.5 bg-wa-sent [clip-path:polygon(0_0,0_100%,100%_0)]' :
          '-left-1.5 bg-wa-received [clip-path:polygon(100%_0,0_0,100%_100%)]'}`
          } />
        

        {message.imageUrl ?
        <figure className="overflow-hidden rounded-md">
            <img
            src={message.imageUrl}
            alt={message.imageCaption ?? 'Shared image'}
            className="max-h-80 w-full rounded-md object-contain bg-gray-50"
            loading="lazy" />
            {message.imageCaption &&
          <figcaption className="px-1.5 pt-1.5 text-sm text-wa-textPrimary">
                {renderText(message.imageCaption)}
              </figcaption>
          }
          </figure> : message.imageCaption ?
        <div className="mx-1.5 my-1 flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 py-2 text-sm text-wa-textSecondary">
            📷 {message.imageCaption}
          </div> : null
        }

        {message.attachment &&
        <a
          href={message.attachment.url}
          download={message.attachment.name}
          className="mx-1 mb-1 flex min-w-[220px] items-center gap-3 rounded-md bg-black/[0.04] px-3 py-2.5 text-left hover:bg-black/[0.07] focus:outline-none focus:ring-2 focus:ring-wa-green">
          
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wa-header/10 text-wa-header">
              <FileTextIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-wa-textPrimary">
                {message.attachment.name}
              </span>
              <span className="block pt-0.5 text-xs text-wa-textSecondary">
                {formatFileSize(message.attachment.size)}
              </span>
            </span>
          </a>
        }

        {message.text &&
        <p className="whitespace-pre-wrap px-1.5 pt-0.5 text-sm leading-relaxed text-wa-textPrimary">
            {renderText(message.text)}
          </p>
        }

        {isFailed && (
          <div className="mt-3 rounded-lg border border-red-200 bg-[#fff1f2] px-3 py-2 text-sm text-[#991b1b]">
            <div className="flex items-center gap-2 font-semibold text-[#b91c1c]">
              <AlertCircleIcon className="h-4 w-4" />
              Failed to send
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onResend(message.id)}
                className="rounded-full bg-[#dc2626] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#fca5a5]">
                Retry
              </button>
            </div>
          </div>
        )}

        {message.products && message.products.length > 0 &&
        <ProductSection
            sections={message.products}
            resultCode={message.resultCode}
            followUp={message.followUp}
            interestedIds={interestedIds}
            onFollowUp={onFollowUp}
            onInterest={onInterest} />
        }

        <div className="flex items-center justify-end gap-1 px-1.5 pt-0.5">
          <span className="text-[11px] text-wa-textSecondary">{message.timestamp}</span>
          {isUser && <Ticks status={message.status} />}
        </div>

        {selectedNumber &&
        <div className="absolute bottom-full left-0 z-20 mb-2 flex min-w-max items-center gap-2 rounded-lg bg-wa-textPrimary px-3 py-2 text-xs text-white shadow-panel">
            <span>{feedback === 'copied' ? 'Number copied' : feedback === 'opened' ? 'Opening WhatsApp' : selectedNumber}</span>
            {canOpenWhatsApp &&
          <button
            type="button"
            onClick={() => openWhatsApp(selectedNumber)}
            className="flex items-center gap-1 rounded bg-white/15 px-2 py-1 font-medium hover:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white">
            
                WhatsApp
                <ExternalLinkIcon className="h-3 w-3" />
              </button>
          }
          </div>
        }
        {feedback && !selectedNumber &&
        <div role="status" className="absolute bottom-full right-0 z-20 mb-2 rounded-lg bg-wa-textPrimary px-3 py-2 text-xs text-white shadow-panel">
            {feedback === 'copied' ? 'Copied to clipboard' : 'Opening WhatsApp'}
          </div>
        }
      </div>
      {!isUser && isActive && actionMenu}
    </div>);

}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
