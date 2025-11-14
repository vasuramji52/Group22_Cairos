import type { ReactNode } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';

interface AuthPageLayoutProps {
  children: ReactNode;
  tagline?: string;
  cardBackgroundImage?: string;
}

const backgroundTexture =
  'https://images.unsplash.com/photo-1738512164098-9487d6d501e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWVyb2dseXBoaWNzJTIwZWd5cHRpYW4lMjBzeW1ib2xzfGVufDF8fHx8MTc2MTY2MDQ2Nnww&ixlib=rb-4.1.0&q=80&w=1080';

const cardTexture =
  'https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

const AuthPageLayout = ({
  children,
  tagline = 'Discover the perfect moments to connect',
  cardBackgroundImage = cardTexture
}: AuthPageLayoutProps) => {
  return (
    <div
      className="min-h-screen bg-[#1B4B5A] flex flex-col relative"
      style={{ fontFamily: "'Crimson Pro', serif" }}
    >
      {/* Hieroglyphics background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Navigation Bar */}
      <nav
        className="bg-[#1B4B5A] px-8 py-4 relative z-10"
        style={{
          borderBottom: '3px solid #D4AF37',
          backgroundImage:
            'linear-gradient(to bottom, #1B4B5A 0%, #1B4B5A 70%, rgba(0, 0, 0, 0.2) 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#1B4B5A]" />
            </div>
            <div>
              <h1 className="text-[#D4AF37] text-xl tracking-wider">CAIROS</h1>
              <p className="text-[#C5A572] text-xs">Find your moment</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-[#C5A572] hover:text-[#D4AF37] transition-colors">
              About
            </p>
            <p className="text-[#C5A572] hover:text-[#D4AF37] transition-colors">
              Features
            </p>
            <p className="text-[#C5A572] hover:text-[#D4AF37] transition-colors">
              Contact
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-6 text-[#D4AF37]">
            <Sun className="w-5 h-5" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#D4AF37]/30" />
              ))}
            </div>
            <Moon className="w-5 h-5" />
          </div>

          <div
            className="rounded-2xl p-8 shadow-2xl border-[3px] border-[#D4AF37] relative overflow-hidden"
            style={{
              backgroundImage: `url(${cardBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative z-10">{children}</div>
          </div>

          {tagline && (
            <div className="mt-6 text-center">
              <p className="text-[#C5A572] text-sm italic">{tagline}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
