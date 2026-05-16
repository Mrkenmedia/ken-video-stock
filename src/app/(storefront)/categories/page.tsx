import Link from 'next/link';

export default function CategoriesPage() {
  // Demo categories. Later we can fetch these from Google Sheets dynamically.
  const categories = [
    { id: 'thien-nhien', name: 'Thiên nhiên', count: 120, color: 'from-green-500 to-emerald-700', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
    { id: 'cong-nghe', name: 'Công nghệ', count: 85, color: 'from-blue-500 to-cyan-700', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'do-thi', name: 'Đô thị & Kiến trúc', count: 64, color: 'from-orange-500 to-red-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'vfx', name: 'Hiệu ứng (VFX)', count: 230, color: 'from-purple-500 to-indigo-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'marketing', name: 'Marketing & Ads', count: 45, color: 'from-pink-500 to-rose-700', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' }
  ];

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
