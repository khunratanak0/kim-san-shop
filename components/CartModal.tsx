'use client';

import { useCart } from '@/lib/cartContext';
import { Trash2, Plus, Minus, Send, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CartModal() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotal, isCartOpen, setIsCartOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<string>('en');
  const [telegramHandle, setTelegramHandle] = useState('');

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('siteLang') || 'en';
    setLang(savedLang);

    // Listen for language change events
    const handleLanguageChange = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail?.lang) {
        setLang(event.detail.lang);
      }
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/global`
        );
        if (res.ok) {
          const data = await res.json();
          setTelegramHandle(data.fields?.telegramHandle?.stringValue || 'your_telegram_username');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const t = {
    en: {
      yourCart: 'Your Cart',
      empty: 'Your cart is empty',
      continueShopping: 'Continue Shopping',
      item: 'Item',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      total: 'Total',
      inquireVia: 'Inquire via Telegram',
      remove: 'Remove',
      emptyCart: 'Clear Cart',
    },
    kh: {
      yourCart: 'កន្ត្រករបស់អ្នក',
      empty: 'កន្ត្រករបស់អ្នកគឺទទេ',
      continueShopping: 'បន្តការទិញ',
      item: 'ផលិតផល',
      quantity: 'ចំនួន',
      price: 'តម្លៃ',
      subtotal: 'សរុប',
      total: 'ទាំងអស់',
      inquireVia: 'សាកសួរតាម Telegram',
      remove: 'លុប',
      emptyCart: 'សម្អាតកន្ត្រក',
    },
  };

  const dict = t[lang as keyof typeof t] || t.en;
  const cleanHandle = telegramHandle.replace('@', '').trim();
  const total = getTotal();

  const generateMessage = () => {
    let message = lang === 'kh' 
      ? 'សួស្តី ខ្ញុំសុំសួរព័ត៌មានអំពីមុខទំនិញខាងក្រោម៖\n\n'
      : 'Hi, I am interested in the following items:\n\n';

    items.forEach((item) => {
      if (item.hidePrice) {
        message += lang === 'kh'
          ? `• ${item.name} (${item.variantName}) - ចំនួន: ${item.quantity}\n`
          : `• ${item.name} (${item.variantName}) - Qty: ${item.quantity}\n`;
      } else {
        message += lang === 'kh'
          ? `• ${item.name} (${item.variantName}) - $${item.price.toFixed(2)} x ${item.quantity}\n`
          : `• ${item.name} (${item.variantName}) - $${item.price.toFixed(2)} x ${item.quantity}\n`;
      }
    });

    const hasVisiblePrices = items.some(item => !item.hidePrice);
    if (hasVisiblePrices) {
      message += `\n${lang === 'kh' ? 'សរុប' : 'Total'}: $${total.toFixed(2)}`;
    }

    message += lang === 'kh'
      ? '\n\nតើអីវ៉ាន់ទាំងនេះនៅមានស្តុកដែរឬទេ?'
      : '\n\nAre these items available?';

    return encodeURIComponent(message);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
          isCartOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-stone-950 shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
        isCartOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 p-4 sm:p-6 bg-white dark:bg-stone-950 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
            {dict.yourCart}
          </h1>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-stone-300 dark:text-stone-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                {dict.empty}
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.variantName}`}
                  className="flex gap-3 sm:gap-4 pb-4 border-b border-stone-200 dark:border-stone-800 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 dark:text-white text-sm sm:text-base truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                      {item.variantName}
                    </p>
                    {!item.hidePrice && (
                      <p className="text-base sm:text-lg font-bold text-orange-500 mt-1">
                        ${item.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.variantName, item.quantity - 1)
                        }
                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded transition-colors text-stone-600 dark:text-stone-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-semibold text-sm text-stone-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.variantName, item.quantity + 1)
                        }
                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded transition-colors text-stone-600 dark:text-stone-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        removeFromCart(item.id, item.variantName)
                      }
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      aria-label={`${dict.remove} ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 dark:border-stone-800 p-4 sm:p-6 space-y-3 bg-white dark:bg-stone-950 flex-shrink-0">
            <div className="flex justify-between text-base sm:text-lg font-bold text-stone-900 dark:text-white">
              <span>{dict.total}:</span>
              <span className="text-orange-500">${total.toFixed(2)}</span>
            </div>

            <a
              href={`https://t.me/${cleanHandle}?text=${generateMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#2AABEE] hover:bg-[#229ED9] active:scale-95 text-white font-bold rounded-xl transition-all duration-300 group shadow-lg shadow-[#2AABEE]/20"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              {dict.inquireVia}
            </a>

            <div className="flex gap-2 flex-col sm:flex-row">
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-900 dark:text-white font-semibold rounded-xl transition-colors active:scale-95 text-sm sm:text-base"
              >
                {dict.continueShopping}
              </button>
              <button
                onClick={() => clearCart()}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors active:scale-95 text-sm sm:text-base"
              >
                {dict.emptyCart}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
