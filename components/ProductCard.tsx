'use client';
import { Send } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  hidePrice?: boolean;
  imageUrl: string;
  status: 'in_stock' | 'out_of_stock' | 'check_seller';
}

const dict = {
  en: {
    dmPrice: "DM for Price",
    inStock: "IN STOCK",
    outOfStock: "OUT OF STOCK",
    askSeller: "ASK SELLER",
    unavailable: "Currently Unavailable",
    inquire: "Inquire via Telegram",
    msgHidden: "Hi, I am interested in *{name}*. Can you provide the price and availability?",
    msgPrice: "Hi, I am interested in *{name}* priced at ${price}. Is it available?"
  },
  km: {
    dmPrice: "ឆាតសួរតម្លៃ",
    inStock: "មានស្តុក",
    outOfStock: "អស់ស្តុក",
    askSeller: "សួរអ្នកលក់",
    unavailable: "បច្ចុប្បន្នមិនមាន",
    inquire: "សួរតាម Telegram",
    msgHidden: "សួស្តី ខ្ញុំចាប់អារម្មណ៍លើ *{name}*។ តើអ្នកអាចប្រាប់តម្លៃ និងស្តុកបានទេ?",
    msgPrice: "សួស្តី ខ្ញុំចាប់អារម្មណ៍លើ *{name}* ដែលមានតម្លៃ ${price}។ តើមានស្តុកទេ?"
  }
};

export default function ProductCard({ 
  product, 
  telegramHandle, 
  lang 
}: { 
  product: Product; 
  telegramHandle: string; 
  lang: 'en' | 'km'; 
}) {
  const t = dict[lang];
  const cleanHandle = telegramHandle.replace('@', '').trim();
  
  const message = product.hidePrice
    ? t.msgHidden.replace('{name}', product.name)
    : t.msgPrice.replace('{name}', product.name).replace('{price}', product.price.toFixed(2));
    
  const encodedMessage = encodeURIComponent(message);
  const telegramUrl = `https://t.me/${cleanHandle}?text=${encodedMessage}`;

  const getStatusBadge = () => {
    const baseClasses = "text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 uppercase tracking-wider w-fit";
    switch (product.status) {
      case 'in_stock':
        return <span className={`${baseClasses} bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{t.inStock}</span>;
      case 'out_of_stock':
        return <span className={`${baseClasses} bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20`}><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{t.outOfStock}</span>;
      case 'check_seller':
        return <span className={`${baseClasses} bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20`}><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>{t.askSeller}</span>;
    }
  };

  const isOutOfStock = product.status === 'out_of_stock';
  const buttonClasses = "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.98]";

  return (
    <div className="group flex flex-col bg-white dark:bg-stone-900 rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:shadow-stone-200 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-500">
      
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-950 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30 blur-2xl scale-110 saturate-150" 
          style={{ backgroundImage: `url(${product.imageUrl})` }}
        />
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="relative z-10 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] object-contain rounded-2xl group-hover:scale-105 transition-transform duration-700 ease-out shadow-2xl"
          loading="lazy"
        />
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight leading-tight">{product.name}</h3>
          
          <span className="text-xl font-extrabold text-orange-400 shrink-0 mt-0.5">
            {product.hidePrice ? (
              <span className="text-sm px-3 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-lg">{t.dmPrice}</span>
            ) : (
              `$${product.price.toFixed(2)}`
            )}
          </span>
        </div>
        
        <div className="mb-4">
          {getStatusBadge()}
        </div>
        
        <p className="text-sm text-stone-500 dark:text-stone-400 flex-grow mb-6 leading-relaxed whitespace-pre-wrap">
          {product.description}
        </p>
        
        {isOutOfStock ? (
          <button disabled className={`${buttonClasses} bg-stone-50 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500 cursor-not-allowed`}>
            <Send className="w-4 h-4" />
            {t.unavailable}
          </button>
        ) : (
          <a 
            href={telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${buttonClasses} bg-[#2AABEE] text-white hover:bg-[#229ED9] shadow-lg shadow-[#2AABEE]/20 hover:shadow-[#2AABEE]/40`}
          >
            <Send className="w-4 h-4" />
            {t.inquire}
          </a>
        )}
      </div>
    </div>
  );
}