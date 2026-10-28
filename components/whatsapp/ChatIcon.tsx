/** Balão de conversa em traço (não é a logo do WhatsApp): acompanha os links que abrem a conversa. */
export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinejoin="round">
      <path d="M4.2 11.6a7.8 7.8 0 1 1 3.6 6.6L3.6 19.6l1.4-3.9a7.7 7.7 0 0 1-.8-4.1Z" />
    </svg>
  );
}
