import Link from 'next/link';
import { getTags, getProducts } from '@/lib/google';

export const revalidate = 60;

// Palette màu cho các tag (xoay vòng)
const COLOR_PALETTE = [
  'from-cyan-500 to-blue-700',
  'from-purple-500 to-indigo-700',
  'from-green-500 to-emerald-700',
  'from-orange-500 to-red-700',
  'from-pink-500 to-rose-700',
  'from-yellow-500 to-amber-700',
  'from-teal-500 to-cyan-700',
  'from-violet-500 to-purple-700',
];

// Icon SVG path mặc định cho video/category
const DEFAULT_ICON = 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';

function slugifyTag(tag: string) {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default async function CategoriesPage() {
  const [tags, products] = await Promise.all([getTags(), getProducts()]);
  const activeProducts = products.filter(p => p.status === 'active');

  const categories = tags.map((tag, idx) => {
    const slug = slugifyTag(tag);
    const count = activeProducts.filter(p =>
      p.tags.some(t => t.toLowerCase() === tag.toLowerCase() ||
        slugifyTag(t) === slug)
    ).length;
    return {
      id: slug,
      originalName: tag,
      name: tag,
      count,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      icon: DEFAULT_ICON,
    };
  });

  return (
    <div className="container mx-auto px-6 py-16 min-h-[calc(100vh-160px)]">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Khám phá theo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Thể loại</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Duyệt qua hàng ngàn video chất lượng cao được phân loại chi tiết giúp bạn dễ dàng tìm kiếm footage phù hợp cho dự án của mình.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            href={`/categories/${category.id}`}
            className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 hover:border-slate-700 transition-all duration-300"
          >
            {/* Background Glow Effect */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${category.color} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {category.name}
              </h3>
              
              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className="text-slate-400 bg-slate-950 px-3 py-1 rounded-full text-sm font-medium border border-slate-800">
                  {category.count} Video
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
