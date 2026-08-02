import React, { ChangeEvent, useRef, useState } from 'react';
import { FileIcon, PaperclipIcon, SendIcon, XIcon } from 'lucide-react';
import { Attachment } from '../types';

type ComposerMode = 'welcome' | 'conversation';

interface MessageInputProps {
  mode: ComposerMode;
  onSend: (text: string, attachment?: Attachment) => void;
}

export function MessageInput({ mode, onSend }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 || attachment !== null;

  const clearAttachment = () => {
    if (attachment) URL.revokeObjectURL(attachment.url);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clearAttachment();
    setAttachment({
      name: file.name,
      url: URL.createObjectURL(file),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      file
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed && !attachment) return;
    onSend(trimmed, attachment ?? undefined);
    setValue('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`w-full px-3 md:px-6 ${mode === 'conversation' ? 'pb-4 pt-2 md:pb-6' : ''}`}>
      <div className="mx-auto max-w-3xl rounded-[24px] border border-black/5 bg-wa-panel px-2 py-2 shadow-panel">
        {attachment &&
        <div className="mx-2 mb-2 flex items-center gap-3 rounded-xl bg-wa-panelAlt px-3 py-2">
            {attachment.mimeType.startsWith('image/') ?
          <img
            src={attachment.url}
            alt={`Preview of ${attachment.name}`}
            className="h-14 w-14 shrink-0 rounded-lg object-cover" /> :


          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-wa-header/10 text-wa-header">
                <FileIcon className="h-5 w-5" />
              </div>
          }
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-wa-textPrimary">{attachment.name}</p>
              <p className="text-xs text-wa-textSecondary">{formatFileSize(attachment.size)} · Optional caption below</p>
            </div>
            <button
            type="button"
            onClick={clearAttachment}
            aria-label="Remove selected file"
            className="rounded-full p-1.5 text-wa-textSecondary hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-wa-green">
            
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        }
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Choose one file" />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Choose a file"
            className="mb-0.5 shrink-0 rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={attachment ? 'Add a caption (optional)' : 'Ask anything'}
            aria-label={attachment ? 'Optional attachment caption' : 'Message ChatGPT'}
            className="wa-scroll max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-wa-textPrimary placeholder:text-wa-textSecondary focus:outline-none" />
          
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wa-header text-white transition-colors hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-wa-textSecondary/40">
            
            <SendIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>);

}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}