'use client';

import { useCart } from '@/lib/cartContext';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, Minus, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<string>('en');
  const [telegramHandle, setTelegramHandle] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('siteLang') || 'en';
    setLang(savedLang);

    // Fetch telegram handle from settings
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

  if (!mounted) return null;

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

    return message;
  };

  const telegramUrl = `https://t.me/${cleanHandle}?text=${encodeURIComponent(generateMessage())}`;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-8 text-stone-800 dark:text-stone-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-extrabold">{dict.yourCart}</h1>
          </div>
          <span className="text-sm font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
            {items.length} {dict.item.toLowerCase()}
          </span>
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 p-12 text-center">
            <p className="text-stone-400 font-bold mb-6">{dict.empty}</p>
            <Link href="/" className="inline-block px-6 py-3 bg-orange-400 text-white font-bold rounded-2xl hover:bg-orange-500 transition-colors">
              {dict.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {items.map((item, idx) => (
                  <div key={idx} className="p-6 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          {item.variantName}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        {!item.hidePrice && (
                          <div className="text-right">
                            <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">{dict.price}</p>
                            <p className="font-bold text-orange-500">${item.price.toFixed(2)}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.variantName, item.quantity - 1)}
                            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.variantName, item.quantity + 1)}
                            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {!item.hidePrice && (
                          <div className="text-right">
                            <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">{dict.subtotal}</p>
                            <p className="font-bold text-stone-800 dark:text-white">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => removeFromCart(item.id, item.variantName)}
                          className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 p-6 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{dict.total}</span>
                {items.some(item => !item.hidePrice) ? (
                  <span className="text-2xl text-orange-500">${total.toFixed(2)}</span>
                ) : (
                  <span className="text-sm text-stone-500">Contact seller for pricing</span>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[#2AABEE] text-white hover:bg-[#229ED9] rounded-2xl font-bold transition-colors shadow-lg shadow-[#2AABEE]/20"
                >
                  <Send className="w-5 h-5" />
                  {dict.inquireVia}
                </a>

                <button
                  onClick={clearCart}
                  className="w-full px-4 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-2xl font-bold transition-colors"
                >
                  {dict.emptyCart}
                </button>

                <Link
                  href="/"
                  className="block w-full text-center px-4 py-3 bg-orange-400 text-white hover:bg-orange-500 rounded-2xl font-bold transition-colors"
                >
                  {dict.continueShopping}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}