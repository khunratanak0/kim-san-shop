'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
// NEW IMPORTS: query, orderBy, limit, startAfter
import { collection, getDocs, doc, getDoc, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { Search, FilterX, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';

// SKELETON COMPONENT
const SkeletonCard = () => (
  <div className="bg-white dark:bg-stone-900 rounded-3xl h-[450px] animate-pulse flex flex-col border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
    <div className="w-full aspect-square bg-stone-100 dark:bg-stone-950 mb-4"></div>
    <div className="p-6 flex-grow flex flex-col gap-3">
      <div className="flex justify-between w-full">
        <div className="w-3/5 h-6 bg-stone-100 dark:bg-stone-800 rounded-lg"></div>
        <div className="w-1/4 h-6 bg-stone-100 dark:bg-stone-800 rounded-lg"></div>
      </div>
      <div className="w-1/3 h-5 bg-stone-100 dark:bg-stone-800 rounded-lg mb-2"></div>
      <div className="w-full h-4 bg-stone-100 dark:bg-stone-800 rounded-md"></div>
      <div className="w-4/5 h-4 bg-stone-100 dark:bg-stone-800 rounded-md"></div>
      <div className="mt-auto w-full h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl"></div>
    </div>
  </div>
);

export default function Storefront() {
  const [products, setProducts] = useState<any[]>([]);
  const [lang, setLang] = useState('en'); 
  const [settings, setSettings] = useState({
    storeName: 'KIM SAN SHOP CATALOG',
    tagline: 'Curated excellence. Discover our exclusive collection.',
    taglineKh: '', // Add this line
    telegramHandle: 'your_telegram_username',
    logoUrl: '', logoSize: 48, logoOffsetY: 0,
    heroImageUrl: '', heroImageSize: 128,
    defaultLang: 'en'
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // PAGINATION STATE
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const t = (en: string, kh: string) => lang === 'kh' ? kh : en;

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en';
    setLang(newLang);
    localStorage.setItem('siteLang', newLang);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as any;
          setSettings(data);
          const storedLang = localStorage.getItem('siteLang');
          if (storedLang) setLang(storedLang);
          else if (data.defaultLang) setLang(data.defaultLang);
        }
        
        // PAGINATION: Limit to 15 items initially
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        
        if (querySnapshot.docs.length > 0) {
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }
        if (querySnapshot.docs.length < 15) {
          setHasMore(false); // No more documents to fetch
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const loadMoreProducts = async () => {
    if (!lastDoc || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'products'), 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc), 
        limit(15)
      );
      const querySnapshot = await getDocs(q);
      const newProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setProducts(prev => [...prev, ...newProducts]);
      
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      if (querySnapshot.docs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = stockFilter === 'all' || product.status === stockFilter;
      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <Header storeName={settings.storeName} logoUrl={settings.logoUrl} logoSize={settings.logoSize} logoOffsetY={settings.logoOffsetY} lang={lang} toggleLang={toggleLang} />
      
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          {settings.heroImageUrl && (
            <img src={settings.heroImageUrl} alt={`${settings.storeName} Hero`} className="mb-8 object-contain drop-shadow-sm transition-all duration-300" style={{ height: `${settings.heroImageSize}px` }} />
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-white mb-6 tracking-tight uppercase">{settings.storeName}</h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">{settings.tagline}
            {lang === 'kh' && settings.taglineKh ? settings.taglineKh : settings.tagline}
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12 flex flex-col sm:flex-row gap-4 bg-white dark:bg-stone-900 p-2 rounded-2xl md:rounded-full border border-stone-100 dark:border-stone-800 shadow-sm sticky top-24 z-40">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 absolute left-4" />
            <input 
              type="text" 
              placeholder={t('Search products...', 'ស្វែងរកផលិតផល...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-stone-800 dark:text-white placeholder-stone-400 text-sm font-medium"
            />
          </div>
          <div className="sm:border-l border-stone-100 dark:border-stone-800 pl-2">
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="w-full sm:w-auto px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl md:rounded-full text-sm font-bold text-stone-600 dark:text-stone-300 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer">
              <option value="all">{t('All Items', 'ទំនិញទាំងអស់')}</option>
              <option value="in_stock">{t('In Stock Only', 'មានក្នុងស្តុកតែប៉ុណ្ណោះ')}</option>
              <option value="check_seller">{t('Ask Seller', 'សួរអ្នកលក់')}</option>
            </select>
          </div>
        </div>

        {/* Skeleton Loading State */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
           </div>
        ) : products.length === 0 ? (
          <div className="text-center text-stone-500 py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">{t('Your catalog is empty.', 'កាតាឡុករបស់អ្នកទទេរ។')}</p>
            <p className="text-sm">{t('Log into the admin portal to add your first product.', 'ចូលទៅកាន់វិបផតថលអ្នកគ្រប់គ្រងដើម្បីបន្ថែមផលិតផលដំបូងរបស់អ្នក។')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center bg-white/50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-4">
              <FilterX className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">{t('No products found.', 'រកមិនឃើញផលិតផលទេ។')}</p>
            <p className="text-stone-500 text-sm mb-6">{t("We couldn't find anything matching", "យើងមិនអាចរកឃើញអ្វីដែលត្រូវគ្នានឹង")} "{searchQuery}".</p>
            <button onClick={() => { setSearchQuery(''); setStockFilter('all'); }} className="px-6 py-2.5 bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors text-sm">
              {t('Clear Filters', 'ជម្រះតម្រង')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} telegramHandle={settings.telegramHandle} lang={lang} />
              ))}
            </div>
            
            {/* LOAD MORE BUTTON */}
            {hasMore && searchQuery === '' && stockFilter === 'all' && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="px-8 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-white rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loadingMore ? t('Loading...', 'កំពុងផ្ទុក...') : t('Load More Products', 'ផ្ទុកផលិតផលបន្ថែម')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}