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
        // Fetch Global Settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as any);
        }

        // Fetch Products
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by newest first
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">Loading storefront...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header storeName={settings.storeName} />
      
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            {settings.storeName}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {settings.tagline}
          </p>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No products available at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                telegramHandle={settings.telegramHandle} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}