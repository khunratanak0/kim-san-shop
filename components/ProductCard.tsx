'use client';
import { Send } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  status: 'in_stock' | 'out_of_stock' | 'check_seller';
}

export default function ProductCard({ product, telegramHandle }: { product: Product, telegramHandle: string }) {
  
  const handleTelegramBuy = () => {
    if (product.status === 'out_of_stock') return;
    const message = `Hi, I am interested in *${product.name}* priced at $${product.price}. Is it available?`;
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/${telegramHandle}?text=${encodedMessage}`;
    window.open(telegramUrl, '_blank');
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'in_stock':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>In Stock</span>;
      case 'out_of_stock':
        return <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Out of Stock</span>;
      case 'check_seller':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Check with Seller</span>;
    }
  };

  const isOutOfStock = product.status === 'out_of_stock';

  return (
    <div className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 flex-grow">{product.description}</p>
        
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
          
          <button
            onClick={handleTelegramBuy}
            disabled={isOutOfStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isOutOfStock 
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
            }`}
          >
            <Send className="w-4 h-4" />
            {isOutOfStock ? 'Unavailable' : 'Inquire'}
          </button>
        </div>
      </div>
    </div>
  );
}