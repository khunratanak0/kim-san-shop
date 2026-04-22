'use client';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Search, FilterX } from 'lucide-react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';

export default function Storefront() {
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    storeName: 'KIM SAN SHOP CATALOG',
    tagline: 'Curated excellence. Discover our exclusive collection.',
    telegramHandle: 'your_telegram_username',
    logoUrl: '',
    logoSize: 48,
    logoOffsetY: 0,
    heroImageUrl: '',
    heroImageSize: 128
  });
  const [loading, setLoading] = useState(true);

  // NEW: Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as any);
        }
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data()
        }));
        productsData.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // NEW: Memoized filtering logic for instant search results
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = stockFilter === 'all' || product.status === stockFilter;
      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-orange-400/30 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-orange-400 animate-spin"></div>
        </div>
        <p className="text-stone-400 font-bold animate-pulse tracking-widest uppercase text-sm">
          Loading Catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <Header storeName={settings.storeName} logoUrl={settings.logoUrl} logoSize={settings.logoSize} logoOffsetY={settings.logoOffsetY} />
      
      <main className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          {settings.heroImageUrl && (
            <img 
              src={settings.heroImageUrl} 
              alt={`${settings.storeName} Hero`} 
              className="mb-8 object-contain drop-shadow-sm transition-all duration-300"
              style={{ height: `${settings.heroImageSize}px` }}
            />
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-white mb-6 tracking-tight">
            {settings.storeName}
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
            {settings.tagline}
          </p>
        </div>

        {/* NEW: Search & Filter Toolbar */}
        {products.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12 flex flex-col sm:flex-row gap-4 bg-white dark:bg-stone-900 p-2 rounded-2xl md:rounded-full border border-stone-100 dark:border-stone-800 shadow-sm sticky top-24 z-40">
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-stone-400 absolute left-4" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-stone-800 dark:text-white placeholder-stone-400 text-sm font-medium"
              />
            </div>
            <div className="sm:border-l border-stone-100 dark:border-stone-800 pl-2">
              <select 
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl md:rounded-full text-sm font-bold text-stone-600 dark:text-stone-300 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="in_stock">In Stock Only</option>
                <option value="check_seller">Ask Seller</option>
              </select>
            </div>
          </div>
        )}

        {/* Product Grid & Empty States */}
        {products.length === 0 ? (
          <div className="text-center text-stone-500 py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">Your catalog is empty.</p>
            <p className="text-sm">Log into the admin portal to add your first product.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center bg-white/50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-4">
              <FilterX className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-white mb-2">No products found.</p>
            <p className="text-stone-500 text-sm mb-6">We couldn't find anything matching "{searchQuery}".</p>
            <button 
              onClick={() => { setSearchQuery(''); setStockFilter('all'); }}
              className="px-6 py-2.5 bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} telegramHandle={settings.telegramHandle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}