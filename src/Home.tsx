import React, { useState, useEffect } from 'react';
import './css/Home.css';
import Sidebar from './components/Sidebar';

interface HomeProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
  } | null;
  onNavigateToDashboard: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAssetsContent?: () => void;
  onNavigateToAssetsInstagram?: () => void;
  onNavigateToBilling: () => void;
  onNavigateToReviews: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToPayment: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToWhatsApp?: () => void;
}

const Home: React.FC<HomeProps> = ({ userData, onNavigateToDashboard, onNavigateToAssets, onNavigateToAssetsContent, onNavigateToAssetsInstagram, onNavigateToBilling, onNavigateToReviews, onNavigateToAnalytics, onNavigateToAdmin, onNavigateToPayment, onNavigateToProfile, onNavigateToHelp, onNavigateToTerms, onNavigateToPrivacy, onNavigateToWhatsApp }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const gsap = (window as any).gsap;
    if (gsap) {
      // Intro Animations
      gsap.fromTo('.dashboard-welcome', 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
      
      gsap.fromTo('.setup-card', 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );

      // Card 1 Floating Social Icons
      gsap.to('.floater-instagram', {
        y: '+=8',
        x: '-=4',
        rotation: 12,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to('.floater-heart', {
        y: '-=10',
        x: '+=6',
        rotation: -8,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.2
      });
      gsap.to('.floater-chat', {
        y: '+=6',
        x: '+=8',
        rotation: 15,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.4
      });
      gsap.to('.floater-camera', {
        y: '-=8',
        x: '-=6',
        rotation: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.1
      });

      // Card 2 Floating Upload Icons
      gsap.to('.floater-video', {
        y: '-=10',
        x: '+=5',
        rotation: 8,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to('.floater-image', {
        y: '+=8',
        x: '-=8',
        rotation: -12,
        duration: 2.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.3
      });
      gsap.to('.floater-music', {
        y: '-=6',
        x: '+=6',
        rotation: 18,
        duration: 3.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.6
      });

      // Card 3 Floating Catalog Icons
      gsap.to('.floater-shopify', {
        y: '+=10',
        x: '+=6',
        rotation: -10,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to('.floater-price', {
        y: '-=8',
        x: '-=6',
        rotation: 12,
        duration: 2.3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.2
      });
      gsap.to('.floater-tag', {
        y: '+=6',
        x: '-=5',
        rotation: -15,
        duration: 3.0,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5
      });
    }
  }, []);

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="dashboard"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={onNavigateToAssets}
        // onNavigateToBilling={onNavigateToBilling}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToHelp={onNavigateToHelp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0" style={{ background: '#f8f9fb' }}>

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-white shrink-0">
          <button
            className="size-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <button onClick={onNavigateToHelp} className="h-9 px-3 flex items-center gap-1.5 rounded-full text-gray-600 font-semibold text-sm hover:bg-orange-50 hover:text-[#FF6B35] transition-colors border border-gray-200 bg-white shadow-sm">
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
            <span className="text-xs">Help</span>
          </button>
        </div>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero Banner */}
          <div className="dashboard-hero px-6 lg:px-12 pt-10 pb-12 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="hero-blob hero-blob-1" />
            <div className="hero-blob hero-blob-2" />
            <div className="hero-blob hero-blob-3" />

            {/* Help & Support — top right */}
            <div className="absolute top-5 right-6 lg:right-12 z-20">
              <button
                onClick={onNavigateToHelp}
                className="h-9 px-4 hidden lg:flex items-center gap-2 rounded-full text-gray-600 font-semibold text-sm hover:bg-white hover:text-[#FF6B35] transition-all border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
                <span>Help &amp; Support</span>
              </button>
            </div>

            <div className="relative z-10 max-w-2xl dashboard-welcome">
              <div className="flex items-center gap-2 mb-3">
                <span className="step-badge">3 Steps</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 font-heading tracking-tight leading-snug">
                Let's get your brand setup
              </h1>
              <p className="text-slate-500 text-sm lg:text-base leading-relaxed mt-2 max-w-lg">
                Complete these 3 steps to start automating your trust infrastructure and collecting reviews.
              </p>
            </div>

            {/* Step dots */}
            <div className="relative z-10 flex items-center gap-2 mt-6">
              <div className="step-dot step-dot-orange" />
              <div className="step-dot step-dot-blue" />
              <div className="step-dot step-dot-emerald" />
              <span className="text-xs text-slate-400 font-medium ml-2">0 / 3 complete</span>
            </div>
          </div>

          {/* Setup Task Cards */}
          <div className="px-6 lg:px-12 pb-16 -mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Card 1: Connect Social */}
              <div className="setup-card group bg-white rounded-2xl shadow-card flex flex-col justify-between setup-card-orange relative overflow-hidden">
                {/* Top accent bar */}
                <div className="card-accent-bar card-accent-orange" />

                {/* Visual mockup area */}
                <div className="mockup-area mockup-area-orange">
                  <div className="card-mockup-wrapper">
                    <div className="phone-mockup bg-white shadow-sm border border-slate-100">
                      <div className="phone-header flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center p-[1px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-[8px] text-pink-500">person</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-700">my_brand</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="material-symbols-outlined text-[10px] text-slate-400">more_horiz</span>
                      </div>
                      <div className="phone-post-img bg-gradient-to-tr from-orange-400/20 to-pink-500/20 flex flex-col items-center justify-center p-2 text-center">
                        <span className="material-symbols-outlined text-pink-500 text-lg mb-1 animate-pulse">favorite</span>
                        <span className="text-[8px] font-medium text-slate-600 leading-tight">"Amazing support &amp; product!"</span>
                        <span className="text-[7px] text-slate-400 mt-0.5">@user_review</span>
                      </div>
                      <div className="phone-post-footer flex items-center gap-2 border-t border-slate-100">
                        <span className="material-symbols-outlined text-[10px] text-red-500">favorite</span>
                        <span className="material-symbols-outlined text-[10px] text-slate-400">mode_comment</span>
                        <span className="material-symbols-outlined text-[10px] text-slate-400">send</span>
                      </div>
                    </div>
                    <div className="floater floater-instagram shadow-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white">
                      <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                    </div>
                    <div className="floater floater-heart shadow-md bg-white text-red-500">
                      <span className="material-symbols-outlined text-[12px]">favorite</span>
                    </div>
                    <div className="floater floater-chat shadow-md bg-white text-blue-500">
                      <span className="material-symbols-outlined text-[12px]">chat</span>
                    </div>
                    <div className="floater floater-camera shadow-md bg-white text-purple-600">
                      <span className="material-symbols-outlined text-[12px]">add_reaction</span>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 pt-4 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">Connect Social</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Link your Instagram account to automatically pull tagged posts and stories.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToAssetsInstagram}
                    className="card-cta-btn card-cta-orange"
                  >
                    <span>Connect Account</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Upload Content */}
              <div className="setup-card group bg-white rounded-2xl shadow-card flex flex-col justify-between setup-card-blue relative overflow-hidden">
                <div className="card-accent-bar card-accent-blue" />

                <div className="mockup-area mockup-area-blue">
                  <div className="card-mockup-wrapper">
                    <div className="upload-mockup bg-white shadow-sm border border-slate-100 p-2.5">
                      <div className="upload-box border-dashed border-2 border-slate-200 flex flex-col items-center justify-center p-2">
                        <span className="material-symbols-outlined text-blue-500 text-xl mb-1">cloud_upload</span>
                        <span className="text-[9px] font-semibold text-slate-700">Drag &amp; Drop UGC</span>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-blue-500 h-full w-3/4 rounded-full upload-progress-bar" />
                        </div>
                        <span className="text-[7px] text-slate-400 mt-1">Uploading video... 75%</span>
                      </div>
                    </div>
                    <div className="floater floater-video shadow-lg bg-gradient-to-tr from-blue-500 to-cyan-500 text-white">
                      <span className="material-symbols-outlined text-[12px]">play_arrow</span>
                    </div>
                    <div className="floater floater-image shadow-md bg-white text-cyan-500">
                      <span className="material-symbols-outlined text-[12px]">image</span>
                    </div>
                    <div className="floater floater-music shadow-md bg-white text-purple-500">
                      <span className="material-symbols-outlined text-[12px]">music_note</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-4 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-xl">upload_file</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">Upload Content</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Manually add your first piece of User Generated Content (UGC) to start your library.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToAssetsContent}
                    className="card-cta-btn card-cta-blue"
                  >
                    <span>Upload Media</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Map Products */}
              <div className="setup-card group bg-white rounded-2xl shadow-card flex flex-col justify-between setup-card-emerald relative overflow-hidden">
                <div className="card-accent-bar card-accent-emerald" />

                <div className="mockup-area mockup-area-emerald">
                  <div className="card-mockup-wrapper">
                    <div className="catalog-mockup bg-white shadow-sm border border-slate-100 p-2 flex gap-2">
                      <div className="catalog-product-card bg-white shadow-sm border border-slate-100 p-1.5 flex-1 flex flex-col justify-between">
                        <div className="product-img bg-gradient-to-tr from-emerald-500/15 to-teal-400/15 flex items-center justify-center p-1 rounded">
                          <span className="material-symbols-outlined text-emerald-500 text-base">checkroom</span>
                        </div>
                        <div className="mt-1 flex flex-col">
                          <span className="text-[8px] font-bold text-slate-700 leading-none truncate">Classic Fit Tee</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[7px] font-bold text-slate-400">$34.99</span>
                            <span className="text-[6px] bg-emerald-50 text-emerald-600 px-1 py-[1px] rounded font-bold">Synced</span>
                          </div>
                        </div>
                      </div>
                      <div className="catalog-product-card bg-white shadow-sm border border-slate-100 p-1.5 flex-1 flex flex-col justify-between">
                        <div className="product-img bg-gradient-to-tr from-teal-500/15 to-emerald-400/15 flex items-center justify-center p-1 rounded">
                          <span className="material-symbols-outlined text-teal-500 text-base">footprint</span>
                        </div>
                        <div className="mt-1 flex flex-col">
                          <span className="text-[8px] font-bold text-slate-700 leading-none truncate">Air Run 2.0</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[7px] font-bold text-slate-400">$89.00</span>
                            <span className="text-[6px] bg-emerald-50 text-emerald-600 px-1 py-[1px] rounded font-bold">Synced</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="floater floater-shopify shadow-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white">
                      <span className="material-symbols-outlined text-[12px]">local_mall</span>
                    </div>
                    <div className="floater floater-price shadow-md bg-white text-emerald-600 flex items-center justify-center">
                      <span className="text-[7px] font-extrabold leading-none">$99</span>
                    </div>
                    <div className="floater floater-tag shadow-md bg-white text-teal-600">
                      <span className="material-symbols-outlined text-[12px]">sell</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-4 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">Map Products</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Sync your Shopify catalog to tag specific products in your reviews and showcase them.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToAssets}
                    className="card-cta-btn card-cta-emerald"
                  >
                    <span>Sync Catalog</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;
