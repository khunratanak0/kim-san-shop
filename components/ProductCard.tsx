'use client';

import { Send, X, ZoomIn, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/lib/cartContext';

interface Variant {
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  descriptionKh?: string;
  price?: number;
  variants?: Variant[];
  hidePrice?: boolean;
  imageUrl: string;
  status: 'in_stock' | 'out_of_stock' | 'check_seller';
}

const dict = {
  en: {
    dmPrice: 'DM FOR PRICE',
    inStock: 'IN STOCK',
    outOfStock: 'OUT OF STOCK',
    askSeller: 'ASK SELLER',
    unavailable: 'CURRENTLY UNAVAILABLE',
    inquire: 'Inquire via Telegram',
    msgHidden: 'Hi, I am interested in *{name}*. Can you provide the price and availability?',
    msgPrice: 'Hi, I am interested in *{name}* priced at ${price}. Is it available?',
  },
  kh: {
    dmPrice: 'ឆាតសួរតម្លៃ',
    inStock: 'មានក្នុងស្តុក',
    outOfStock: 'អស់ពីស្តុក',
    askSeller: 'សួរអ្នកលក់',
    unavailable: 'បច្ចុប្បន្នមិនមានលក់ទេ',
    inquire: 'សាកសួរតាម Telegram',
    msgHidden: 'សួស្តី ខ្ញុំសុំសួរព័ត៌មានពី *{name}*។ តើអីវ៉ាន់នេះនៅមានស្តុកទេ ហើយតម្លៃប៉ុន្មានដែរ?',
    msgPrice: 'សួស្តី ខ្ញុំចង់សួរពី *{name}* (តម្លៃ ${price})។ តើនៅមានស្តុកដែរទេ?',
  },
};

export default function ProductCard({
  product,
  telegramHandle,
  lang = 'en',
}: {
  product: Product;
  telegramHandle: string;
  lang?: string;
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedVarIdx, setSelectedVarIdx] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { addToCart } = useCart();

  const hasVariants = product.variants && product.variants.length > 0;
  const displayVariants = hasVariants
    ? product.variants!
    : [{ name: 'Standard', price: product.price || 0 }];

  const activeVariant = displayVariants[selectedVarIdx] || displayVariants[0];
  const t = dict[lang as keyof typeof dict] || dict.en;

  const displayDescription =
    lang === 'kh' && product.descriptionKh ? product.descriptionKh : product.description;

  const safeHandle = telegramHandle || 'your_telegram_username';
  const cleanHandle = safeHandle.replace('@', '').trim();

  const variantText =
    hasVariants && activeVariant.name !== 'Standard' ? ` (${activeVariant.name})` : '';
  const fullNameStr = `${product.name}${variantText}`;

  const message = product.hidePrice
    ? t.msgHidden.replace('{name}', fullNameStr)
    : t.msgPrice.replace('{name}', fullNameStr).replace('{price}', activeVariant.price.toFixed(2));

  const encodedMessage = encodeURIComponent(message);
  const telegramUrl = `https://t.me/${cleanHandle}?text=${encodedMessage}`;

  const getStatusBadge = () => {
    const baseClasses =
      'text-[11px] sm:text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 uppercase tracking-wider w-fit';

    switch (product.status) {
      case 'in_stock':
        return (
          <span className={`${baseClasses} bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t.inStock}
          </span>
        );
      case 'out_of_stock':
        return (
          <span className={`${baseClasses} bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {t.outOfStock}
          </span>
        );
      case 'check_seller':
        return (
          <span className={`${baseClasses} bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20`}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {t.askSeller}
          </span>
        );
      default:
        return null;
    }
  };

  const isOutOfStock = product.status === 'out_of_stock';
  const buttonClasses =
    'w-full flex items-center justify-center gap-2 px-4 py-4 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 active:scale-[0.98]';

  const openLightbox = () => {
    if (!product.imageUrl) return;
    
    setIsLightboxOpen(true);
    setIsClosing(false);
    requestAnimationFrame(() => setIsMounted(true));
  };

  const closeLightbox = () => {
    setIsClosing(true);
    setIsMounted(false);
    setTimeout(() => {
      setIsLightboxOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      variantName: activeVariant.name,
      price: activeVariant.price,
      quantity: 1,
      hidePrice: product.hidePrice || false,
    });
    
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  useEffect(() => {
    setSelectedVarIdx(0);
  }, [product.id]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto'; 
    };
  }, [isLightboxOpen]);

  return (
    <>
      <div className="group flex flex-col bg-white dark:bg-stone-900 rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:shadow-stone-200 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-500 relative">
        <div
          onClick={openLightbox}
          className={`relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-950 flex items-center justify-center ${product.imageUrl ? 'cursor-zoom-in' : ''}`}
        >
          {product.imageUrl && (
            <>
              <div className="absolute top-3 right-3 z-20 bg-black/30 backdrop-blur-md p-2.5 sm:p-2 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
              </div>

              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30 blur-2xl scale-110 saturate-150 transition-all duration-500 group-hover:scale-125"
                style={{ backgroundImage: `url(${product.imageUrl})` }}
              />

              <img
                src={product.imageUrl}
                alt={product.name || 'Product Image'}
                className="relative z-10 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] object-contain rounded-2xl group-hover:scale-105 transition-transform duration-700 ease-out shadow-2xl"
                loading="lazy"
              />
            </>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-3 sm:gap-4 mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight leading-tight">
              {product.name}
            </h3>

            <span className="text-lg sm:text-xl font-extrabold text-orange-400 shrink-0 mt-0.5">
              {product.hidePrice ? (
                <span className="text-[10px] sm:text-[11px] px-2.5 py-1.5 font-bold tracking-wider bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                  {t.dmPrice}
                </span>
              ) : (
                `$${activeVariant.price.toFixed(2)}`
              )}
            </span>
          </div>

          <div className="mb-4">{getStatusBadge()}</div>

          <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 font-semibold flex-grow mb-5 leading-relaxed whitespace-pre-wrap">
            {displayDescription}
          </p>

          {hasVariants && displayVariants.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {displayVariants.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVarIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 hover:scale-[1.05] active:scale-95 ${
                    selectedVarIdx === idx
                      ? 'bg-orange-400 text-white border-orange-400 shadow-md shadow-orange-400/20'
                      : 'bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-500/50'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          {isOutOfStock ? (
            <button
              disabled
              className={`${buttonClasses} bg-stone-50 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500 cursor-not-allowed`}
            >
              <Send className="w-5 h-5 sm:w-4 sm:h-4" />
              {t.unavailable}
            </button>
          ) : (
            <div className="space-y-2 mt-auto">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClasses} bg-[#2AABEE] text-white hover:bg-[#229ED9] hover:scale-[1.02] shadow-lg shadow-[#2AABEE]/20 hover:shadow-[#2AABEE]/40`}
              >
                <Send className="w-5 h-5 sm:w-4 sm:h-4" />
                {t.inquire}
              </a>
              
              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                  addedFeedback
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {addedFeedback ? (lang === 'kh' ? '✓ បានបញ្ចូល!' : '✓ Added!') : (lang === 'kh' ? 'ដាក់ចូលកន្ត្រក' : 'Add to Cart')}
              </button>
            </div>
          )}
        </div>
      </div>

      {isLightboxOpen && product.imageUrl && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 transition-opacity duration-300 ease-out ${
            isMounted && !isClosing ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeLightbox}
        >
          <button
            className={`absolute top-4 sm:top-6 right-4 sm:right-6 p-3 sm:p-4 bg-white/10 hover:bg-white/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-300 z-[101] ${
              isMounted && !isClosing ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <img
            src={product.imageUrl}
            className={`w-[95vw] h-[95vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 ${
              isMounted && !isClosing
                ? 'scale-100 translate-y-0 blur-none opacity-100'
                : 'scale-90 translate-y-8 blur-sm opacity-0'
            }`}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
}