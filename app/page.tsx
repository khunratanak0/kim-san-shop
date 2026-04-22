'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
      {/* Pass logoOffsetY down to the header */}
      <Header storeName={settings.storeName} logoUrl={settings.logoUrl} logoSize={settings.logoSize} logoOffsetY={settings.logoOffsetY} />
      
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          {/* Using dynamic sizing from admin panel */}
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

        {products.length === 0 ? (
          <div className="text-center text-stone-500 py-16 bg-white dark:bg-stone-900 rounded-3xl border border-orange-50 dark:border-stone-800 shadow-sm">
            No products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} telegramHandle={settings.telegramHandle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}