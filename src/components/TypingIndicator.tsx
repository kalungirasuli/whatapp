import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex justify-start px-2">
      <div className="relative rounded-lg rounded-tl-none bg-wa-received px-4 py-3 shadow-bubble">
        <span className="absolute -left-1.5 top-0 h-3 w-3 bg-wa-received [clip-path:polygon(100%_0,0_0,100%_100%)]" />
        <div className="flex items-center gap-1" aria-label="AI is typing">
          <span className="wa-dot h-2 w-2 rounded-full bg-wa-textSecondary" />
          <span className="wa-dot h-2 w-2 rounded-full bg-wa-textSecondary" />
          <span className="wa-dot h-2 w-2 rounded-full bg-wa-textSecondary" />
        </div>
      </div>
    </div>);

}