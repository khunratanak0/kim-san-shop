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
    telegramHandle: 'your_telegram_username'
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
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-orange-400 font-medium">Loading storefront...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <Header storeName={settings.storeName} />
      
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-20">
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