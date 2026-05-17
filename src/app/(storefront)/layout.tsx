import Link from 'next/link';
import CartIcon from '@/components/storefront/CartIcon';
import CartDrawer from '@/components/storefront/CartDrawer';
import FlashSaleBanner from '@/components/storefront/FlashSaleBanner';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <FlashSaleBanner />
      {/* Premium Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              KenVideo
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Khám phá</Link>
            <Link href="/categories" className="hover:text-cyan-400 transition-colors">Thể loại</Link>
            <Link href="/bundles" className="hover:text-cyan-400 transition-colors">Combos</Link>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <CartIcon />
            {session && session.user ? (
              <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || ''} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-xs">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{session.user.name || 'Cá nhân'}</span>
              </Link>
            ) : (
              <Link href="/api/auth/signin" className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-160px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/50 pt-16 pb-8 mt-20">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Ken Video Stock Platform. All rights reserved.</p>
          <p className="mt-2">Tối ưu hóa bởi Google Drive & Next.js</p>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
