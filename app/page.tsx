'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { Search, FilterX, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';

const DEFAULT_CATEGORY = '';
const PRODUCTS_PER_PAGE = 30;

const SkeletonCard = () => (
  <div className="bg-white dark:bg-stone-900 rounded-3xl h-[430px] animate-pulse flex flex-col border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
    <div className="w-full aspect-square bg-stone-100 dark:bg-stone-950 mb-4" />
    <div className="p-5 flex-grow flex flex-col gap-3">
      <div className="flex justify-between w-full">
        <div className="w-3/5 h-6 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        <div className="w-1/4 h-6 bg-stone-100 dark:bg-stone-800 rounded-lg" />
      </div>
      <div className="w-1/3 h-5 bg-stone-100 dark:bg-stone-800 rounded-lg mb-2" />
      <div className="w-full h-4 bg-stone-100 dark:bg-stone-800 rounded-md" />
      <div className="w-4/5 h-4 bg-stone-100 dark:bg-stone-800 rounded-md" />
      <div className="mt-auto w-full h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl" />
    </div>
  </div>
);

export default function Storefront() {
  const [products, setProducts] = useState<any[]>([]);
  const [lang, setLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('siteLang') || 'en';
    }
    return 'en';
  });
  const [settings, setSettings] = useState({
    storeName: 'KIM SAN SHOP CATALOG',
    tagline: 'Curated excellence. Discover our exclusive collection.',
    taglineKh: '',
    telegramHandle: 'your_telegram_username',
    logoUrl: '',
    logoSize: 48,
    logoOffsetY: 0,
    heroImageUrl: '',
    heroImageSize: 128,
    defaultLang: 'en',
  });

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const[stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showSearchBar, setShowSearchBar] = useState(true);
  const[compactSearchBar, setCompactSearchBar] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PRODUCTS_PER_PAGE);

  const lastScrollY = useRef(0);

  const t = (en: string, kh: string) => (lang === 'kh' ? kh : en);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en';
    setLang(newLang);
    localStorage.setItem('siteLang', newLang);
  };

  const normalizeProducts = (docs: any[]) => {
    const mapped = docs.map((item) => ({
      id: item.id,
      category: item.data().category || DEFAULT_CATEGORY,
      manualOrder:
        typeof item.data().manualOrder === 'number' ? item.data().manualOrder : null,
      ...item.data(),
    }));

    return mapped.sort((a, b) => {
      const aOrder = typeof a.manualOrder === 'number' ? a.manualOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.manualOrder === 'number' ? b.manualOrder : Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  };

  useEffect(() => {
    setMounted(true);
  },[]);

  const fetchStorefrontData = useCallback(async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as any;
        setSettings((prev) => ({ ...prev, ...data }));
        if (!localStorage.getItem('siteLang') && data.defaultLang) {
          setLang(data.defaultLang);
        }
      }

      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setProducts(normalizeProducts(querySnapshot.docs));
    } catch (error) {
      console.error('Error fetching storefront data:', error);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    fetchStorefrontData();
  }, [fetchStorefrontData]);

  // Reset limit when filters change
  useEffect(() => {
    setDisplayLimit(PRODUCTS_PER_PAGE);
  },[searchQuery, categoryFilter, stockFilter]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setCompactSearchBar(currentY > 100);

          // Ignore negative scroll (bounce effect on mobile)
          if (currentY <= 0) {
            setShowSearchBar(true);
          } else if (currentY > lastScrollY.current + 15) { // Increased threshold slightly for less twitching
            setShowSearchBar(false);
          } else if (currentY < lastScrollY.current - 15) {
            setShowSearchBar(true);
          }

          lastScrollY.current = currentY > 0 ? currentY : 0;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  },[]);

  useEffect(() => {
    const handlePageShow = (event: Event) => {
      const e = event as PageTransitionEvent;
      if (e.persisted) {
        fetchStorefrontData();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  },[fetchStorefrontData]);

  const uniqueCategories = useMemo(() => {
    const cats = products
      .map((p) => p.category)
      .filter((c) => c && c.trim() !== ''); // This removes the blanks
    return Array.from(new Set(cats));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();

      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) ||
        description.includes(searchQuery.toLowerCase());

      const matchesStock = stockFilter === 'all' || product.status === stockFilter;
      const matchesCategory =
        categoryFilter === 'all' || (product.category || DEFAULT_CATEGORY) === categoryFilter;

      return matchesSearch && matchesStock && matchesCategory;
    });
  },[products, searchQuery, stockFilter, categoryFilter]);

  const displayedProducts = filteredProducts.slice(0, displayLimit);
  const hasMore = displayLimit < filteredProducts.length;

  if (loading && mounted) {
    const loadingText = lang === 'kh' ? 'កំពុងផ្ទុកហាងរបស់អ្នក...' : 'Loading your store...';
    const loadingSubtext = lang === 'kh' ? 'សូមរង់ចាំខណៈពេលដែលយើងរៀបចំផលិតផលរបស់អ្នក' : 'Please wait while we prepare your products';

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-300 rounded-3xl opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-orange-400 to-orange-300 rounded-2xl opacity-10 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-extrabold text-orange-400 animate-pulse">✨</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2 tracking-tight">{loadingText}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">{loadingSubtext}</p>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <Header
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        logoSize={settings.logoSize}
        logoOffsetY={settings.logoOffsetY}
        lang={lang}
        toggleLang={toggleLang}
      />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 flex flex-col items-center animate-fade-up">
          {settings.heroImageUrl && (
            <img
              src={settings.heroImageUrl}
              alt={`${settings.storeName} Hero`}
              className="mb-6 sm:mb-8 object-contain drop-shadow-sm transition-all duration-300 hover:scale-105"
              style={{ height: `${settings.heroImageSize}px` }}
            />
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-white mb-4 sm:mb-6 tracking-tight uppercase">
            {settings.storeName}
          </h1>

          <p className="text-base sm:text-lg text-stone-800 dark:text-stone-200 font-semibold leading-relaxed">
            {lang === 'kh' && settings.taglineKh ? settings.taglineKh : settings.tagline}
          </p>
        </div>

        <div
          className={[
            'sticky z-40 mb-8 sm:mb-10 transition-all duration-500 ease-in-out',
            // Position shifted lower on mobile to prevent hiding beneath the sticky header (min-h-20)
            'top-[88px] md:top-24',
            showSearchBar ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0 pointer-events-none'
          ].join(' ')}
        >
          <div
            className={[
              'max-w-5xl mx-auto bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/70 dark:border-stone-800 shadow-lg shadow-stone-200/30 dark:shadow-black/20',
              'rounded-2xl md:rounded-[2rem]',
              compactSearchBar ? 'p-2.5' : 'p-3',
            ].join(' ')}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 relative flex items-center group">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 group-focus-within:text-orange-400 transition-colors" />
                <input
                  type="text"
                  placeholder={t('Search products...', 'ស្វែងរកផលិតផល...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50/80 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 rounded-xl md:rounded-2xl outline-none text-stone-800 dark:text-white placeholder-stone-400 text-sm font-medium focus:ring-4 focus:ring-orange-400/10 focus:border-orange-300 transition-all"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar md:overflow-visible md:border-l md:border-stone-200 dark:md:border-stone-800 md:pl-3 shrink-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-w-[150px] px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-300 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                >
                  <option value="all">{t('All Categories', 'ប្រភេទទាំងអស់')}</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="min-w-[140px] px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-300 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                >
                  <option value="all">{t('All Items', 'ទំនិញទាំងអស់')}</option>
                  <option value="in_stock">{t('In Stock Only', 'មានក្នុងស្តុកតែប៉ុណ្ណោះ')}</option>
                  <option value="check_seller">{t('Ask Seller', 'សួរអ្នកលក់')}</option>
                  <option value="out_of_stock">{t('Out of Stock', 'អស់ពីស្តុក')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-stone-500 py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">
              {t('Your catalog is empty.', 'កាតាឡុករបស់អ្នកទទេរ៉។')}
            </p>
            <p className="text-sm text-stone-800 dark:text-stone-200 font-semibold">
              {t(
                'Log into the admin portal to add your first product.',
                'ចូលទៅកាន់វិបផតថលអ្នកគ្រប់គ្រងដើម្បីបន្ថែមផលិតផលដំបូងរបស់អ្នក។'
              )}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center bg-white/50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-4">
              <FilterX className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">
              {t('No products found.', 'រកមិនឃើញផលិតផលទេ។')}
            </p>
            <p className="text-stone-800 dark:text-stone-200 font-semibold text-sm mb-6">
              {t("We couldn't find anything matching", "យើងរកមិនឃើញអ្វីដែលត្រូវគ្នាទេ")} "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStockFilter('all');
                setCategoryFilter('all');
              }}
              className="px-6 py-2.5 bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors text-sm active:scale-95"
            >
              {t('Clear Filters', 'លុបការចម្រាញ់')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
              {displayedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${(index % PRODUCTS_PER_PAGE) * 40}ms` }}
                >
                  <ProductCard
                    product={product}
                    telegramHandle={settings.telegramHandle}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setDisplayLimit(prev => prev + PRODUCTS_PER_PAGE)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-500/50 rounded-2xl font-bold text-stone-800 dark:text-stone-200 hover:text-orange-500 transition-all duration-300 shadow-sm active:scale-95"
                >
                  <Loader2 className="w-5 h-5 animate-spin hidden" /> {/* Useful if you want to add loading states later */}
                  {t('Load More Products', 'ផ្ទុកផលិតផលបន្ថែម')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}