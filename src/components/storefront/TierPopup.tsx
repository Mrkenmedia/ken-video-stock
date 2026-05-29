'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TierPopup() {
  const [settings, setSettings] = useState<any>(null);
  const [maxTierPercent, setMaxTierPercent] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, tiersRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/tiers')
        ]);
        
        if (settingsRes.ok && tiersRes.ok) {
          const settingsData = await settingsRes.json();
          const tiersData = await tiersRes.json();
          
          if (settingsData.tierPopupEnabled === 'true') {
            setSettings(settingsData);
            
            if (tiersData && tiersData.length > 0) {
              const max = Math.max(...tiersData.map((t: any) => t.discountPercent));
              setMaxTierPercent(max);
            }
            
            // Show popup after a short delay
            setTimeout(() => setIsVisible(true), 1500);
          }
        }
      } catch (error) {
        console.error('Failed to load tier popup data:', error);
      }
    }
    
    // Check if user has already minimized it in this session
    const hasMinimized = sessionStorage.getItem('tier_popup_minimized');
    if (hasMinimized) {
      setIsMinimized(true);
    }
    
    fetchData();
  }, []);

  if (!isVisible || !settings) return null;

  const title = settings.tierPopupTitle || '🎁 Ưu đãi độc quyền hôm nay!';
  const description = (settings.tierPopupDescription || 'Mua càng nhiều, giảm càng sâu. Giảm thêm lên tới {maxTier}% khi mua số lượng lớn!').replace('{maxTier}', maxTierPercent.toString());
  const colorMode = settings.tierPopupColor || 'cyan';
  const effect = settings.tierPopupEffect || 'bounce';

  const getColorClasses = (mode: string, isMinimized: boolean) => {
    switch(mode) {
      case 'amber':
        return isMinimized ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-amber-500/20';
      case 'green':
        return isMinimized ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-500/20';
      case 'purple':
        return isMinimized ? 'bg-purple-600 text-white shadow-purple-600/30' : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-500 shadow-purple-600/20';
      case 'rose':
        return isMinimized ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-400 shadow-rose-500/20';
      case 'cyan':
      default:
        return isMinimized ? 'bg-cyan-500 text-white shadow-cyan-500/30' : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-cyan-500/20';
    }
  };

  const getEffectClass = (effectType: string, isMinimized: boolean) => {
    if (isMinimized) return '';
    switch(effectType) {
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'none':
      default: return '';
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    sessionStorage.setItem('tier_popup_minimized', 'true');
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    sessionStorage.removeItem('tier_popup_minimized');
  };

  if (isMinimized) {
    return (
      <button 
        onClick={handleMaximize}
        className={`fixed bottom-6 left-6 z-[60] px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform ${getColorClasses(colorMode, true)} ${getEffectClass(effect, false)}`}
      >
        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Ưu đãi {maxTierPercent}%</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div className="fixed inset-0 bg-black/40 z-[50] sm:hidden backdrop-blur-sm" onClick={handleMinimize}></div>
      
      {/* Popup Container */}
      <div className={`fixed bottom-0 left-0 w-full sm:w-auto sm:bottom-6 sm:left-6 z-[60] p-4 sm:p-0 transition-transform duration-300 ease-out transform translate-y-0`}>
        <div className={`relative max-w-sm w-full p-6 sm:rounded-2xl rounded-t-2xl sm:rounded-b-2xl border shadow-2xl ${getColorClasses(colorMode, false)} ${getEffectClass(effect, false)}`}>
          
          {/* Close button */}
          <button 
            onClick={handleMinimize}
            className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className="flex gap-4 items-start pr-4">
            <div className="bg-white/20 p-3 rounded-full shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              <p className="text-sm text-white/90 leading-relaxed mb-4">
                {description}
              </p>
              <Link 
                href="/" 
                onClick={handleMinimize}
                className="inline-block w-full text-center bg-white text-slate-900 font-bold py-2 px-4 rounded-xl shadow-md hover:bg-slate-100 transition-colors"
              >
                Khám phá ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
