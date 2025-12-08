import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background border-t border-border py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Betta Logo"
            width={53}
            height={32}
            className="opacity-100"
          />
          <span className="text-sm text-muted-foreground font-medium">
            Get betta. Get better.
          </span>
        </div>
        <div className="text-xs text-muted-foreground text-center sm:text-right">
          © 2025 Betta. All open source. Made with love.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
