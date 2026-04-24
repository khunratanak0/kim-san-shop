'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  writeBatch,
} from 'firebase/firestore';
import {
  Trash2,
  Edit,
  Plus,
  Settings,
  LogOut,
  Package,
  Sun,
  Moon,
  UploadCloud,
  Image as ImageIcon,
  X,
  FileUp,
  Loader2,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';

const DEFAULT_CATEGORY = 'General';

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineKh, setTaglineKh] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [defaultLang, setDefaultLang] = useState('en');

  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(48);
  const [logoOffsetY, setLogoOffsetY] = useState(0);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageSize, setHeroImageSize] = useState(128);
  const [isProcessingHeroImage, setIsProcessingHeroImage] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionKh, setDescriptionKh] = useState('');
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([
    { name: 'Standard', price: '' },
  ]);
  const [hidePrice, setHidePrice] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('in_stock');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);

  const t = (en: string, kh: string) => (lang === 'kh' ? kh : en);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en';
    setLang(newLang);
    localStorage.setItem('adminLang', newLang);
  };

  const sortProducts = (items: any[]) => {
    return [...items].sort((a, b) => {
      const aOrder = typeof a.manualOrder === 'number' ? a.manualOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.manualOrder === 'number' ? b.manualOrder : Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  };

  const fetchData = useCallback(async () => {
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    settingsSnapshot.forEach((docSnap) => {
      if (docSnap.id === 'global') {
        const data = docSnap.data();
        setStoreName(data.storeName || '');
        setTagline(data.tagline || '');
        setTaglineKh(data.taglineKh || '');
        setTelegramHandle(data.telegramHandle || '');
        setDefaultLang(data.defaultLang || 'en');
        setLogoUrl(data.logoUrl || '');
        setLogoSize(data.logoSize || 48);
        setLogoOffsetY(data.logoOffsetY || 0);
        setHeroImageUrl(data.heroImageUrl || '');
        setHeroImageSize(data.heroImageSize || 128);
        setGlobalCategories(data.categories || []);
      }
    });

    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      category: docSnap.data().category || DEFAULT_CATEGORY,
      manualOrder:
        typeof docSnap.data().manualOrder === 'number' ? docSnap.data().manualOrder : null,
      ...docSnap.data(),
    }));

    setProducts(sortProducts(productsData));
  }, []);

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem('adminLang');
    if (storedLang) setLang(storedLang);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchData();
      }
      setLoading(false);
    });

    const onPageShow = async (event: Event) => {
      const e = event as PageTransitionEvent;
      document.body.style.overflow = 'auto';
      if (e.persisted && auth.currentUser) {
        await fetchData();
      }
    };

    window.addEventListener('pageshow', onPageShow);

    return () => {
      unsubscribe();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [fetchData]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set([
      ...globalCategories,
      ...products.map((p) => p.category || DEFAULT_CATEGORY),
    ]);
    return Array.from(cats);
  }, [products, globalCategories]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      alert('Invalid credentials');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        {
          storeName,
          tagline,
          taglineKh,
          telegramHandle,
          defaultLang,
          logoUrl,
          logoSize,
          logoOffsetY,
          heroImageUrl,
          heroImageSize,
        },
        { merge: true }
      );
      alert(t('Settings Saved Successfully!', 'Settings Saved Successfully!'));
    } catch (error) {
      console.error('Error saving settings', error);
      alert(t('Error saving settings.', 'Error saving settings.'));
    }
  };

  const processImage = (file: File, maxWidth: number, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;

        if (img.width > maxWidth) {
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        callback(canvas.toDataURL(outputType, 0.8));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    processImage(file, 800, (base64) => {
      setImageUrl(base64);
      setIsProcessingImage(false);
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    processImage(file, 400, (base64) => {
      setLogoUrl(base64);
      setIsProcessingLogo(false);
    });
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingHeroImage(true);
    processImage(file, 600, (base64) => {
      setHeroImageUrl(base64);
      setIsProcessingHeroImage(false);
    });
  };

  const addVariant = () => setVariants([...variants, { name: '', price: '' }]);

  const updateVariant = (index: number, field: 'name' | 'price', value: string) => {
    const next = [...variants];
    next[index][field] = value;
    setVariants(next);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;

        const parseRow = (rowStr: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < rowStr.length; i++) {
            if (rowStr[i] === '"') {
              inQuotes = !inQuotes;
            } else if (rowStr[i] === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += rowStr[i];
            }
          }

          result.push(current.trim());
          return result;
        };

        const lines = text.split('\n').filter((line) => line.trim() !== '');
        const headers = parseRow(lines[0]).map((h) => h.toLowerCase());

        const nameIdx = headers.findIndex((h) => h.includes('name'));
        const descIdx = headers.findIndex((h) => h.includes('description'));
        const catIdx = headers.findIndex((h) => h.includes('category'));
        const varIdx = headers.findIndex((h) => h.includes('variant'));

        if (nameIdx === -1 || varIdx === -1) {
          alert('CSV must contain "Name" and "Variants" columns.');
          setIsUploadingCsv(false);
          return;
        }

        const uploadPromises = [];

        for (let i = 1; i < lines.length; i++) {
          const row = parseRow(lines[i]);
          if (!row[nameIdx]) continue;

          const name = row[nameIdx];
          const description = descIdx !== -1 ? row[descIdx] : '';
          const csvCategory = catIdx !== -1 && row[catIdx] ? row[catIdx] : DEFAULT_CATEGORY;
          const rawVariants = row[varIdx] || '';

          const parsedVariants = rawVariants
            .split(',')
            .map((v) => {
              const [vName, vPrice] = v.split(':');
              return {
                name: vName ? vName.trim() : 'Standard',
                price: vPrice ? parseFloat(vPrice.trim()) : 0,
              };
            })
            .filter((v) => v.name && !isNaN(v.price));

          if (parsedVariants.length === 0) {
            parsedVariants.push({ name: 'Standard', price: 0 });
          }

          const productData = {
            name,
            category: csvCategory,
            description,
            descriptionKh: '',
            variants: parsedVariants,
            price: parsedVariants[0].price,
            hidePrice: false,
            imageUrl: '',
            status: 'in_stock',
            createdAt: Date.now(),
          };

          uploadPromises.push(addDoc(collection(db, 'products'), productData));
        }

        await Promise.all(uploadPromises);
        alert(`Successfully imported ${uploadPromises.length} products!`);
        await fetchData();
      } catch (error) {
        console.error('CSV Import Error:', error);
        alert('Failed to parse CSV. Ensure it is formatted correctly.');
      } finally {
        setIsUploadingCsv(false);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const finalCategory = category || DEFAULT_CATEGORY;

      if (!globalCategories.includes(finalCategory)) {
        await setDoc(
          doc(db, 'settings', 'global'),
          { categories: arrayUnion(finalCategory) },
          { merge: true }
        );
        setGlobalCategories((prev) => [...prev, finalCategory]);
      }

      const formattedVariants = variants.map((v) => ({
        name: v.name || 'Standard',
        price: hidePrice ? 0 : parseFloat(v.price) || 0,
      }));

      const productData = {
        name: productName,
        category: finalCategory,
        description,
        descriptionKh,
        variants: formattedVariants,
        price: formattedVariants[0]?.price || 0,
        hidePrice,
        imageUrl,
        status,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        alert(t('Product Updated!', 'Product Updated!'));
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: Date.now(),
          manualOrder: products.length,
        });
        alert(t('Product Added!', 'Product Added!'));
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving product', error);
      alert(t('Error saving product.', 'Error saving product.'));
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setProductName(product.name);

    const prodCategory = product.category || DEFAULT_CATEGORY;
    setCategory(prodCategory);
    setIsCustomCategory(!uniqueCategories.includes(prodCategory) && prodCategory !== DEFAULT_CATEGORY);

    setDescription(product.description || '');
    setDescriptionKh(product.descriptionKh || '');

    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map((v: any) => ({ name: v.name, price: String(v.price) })));
    } else {
      setVariants([{ name: 'Standard', price: product.price ? String(product.price) : '0' }]);
    }

    setHidePrice(product.hidePrice || false);
    setImageUrl(product.imageUrl || '');
    setStatus(product.status || 'in_stock');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm(t('Are you sure you want to delete this product?', 'Are you sure you want to delete this product?'))) {
      await deleteDoc(doc(db, 'products', id));
      await fetchData();
    }
  };

  const persistManualOrder = async (items: any[]) => {
    setIsSavingOrder(true);
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        batch.update(doc(db, 'products', item.id), { manualOrder: index });
      });
      await batch.commit();
      setProducts(items.map((item, index) => ({ ...item, manualOrder: index })));
    } catch (error) {
      console.error('Error saving manual order', error);
      alert('Failed to save product order.');
      await fetchData();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleBumpToTop = async (id: string) => {
    const current = [...products];
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return;

    const [item] = current.splice(index, 1);
    current.unshift(item);

    await persistManualOrder(current);
  };

  const handleMoveStep = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const next = [...products];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]]; // Swap positions

    setProducts(next);
    await persistManualOrder(next);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement | HTMLTableRowElement>,
    draggedId: string
  ) => {
    e.dataTransfer.setData('text/plain', draggedId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropReorder = async (
    e: React.DragEvent<HTMLDivElement | HTMLTableRowElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const next = [...products];
    const fromIndex = next.findIndex((p) => p.id === draggedId);
    const toIndex = next.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setProducts(next);
    await persistManualOrder(next);
  };

  const resetForm = () => {
    setEditingId(null);
    setProductName('');
    setCategory(DEFAULT_CATEGORY);
    setIsCustomCategory(false);
    setDescription('');
    setDescriptionKh('');
    setVariants([{ name: 'Standard', price: '' }]);
    setHidePrice(false);
    setImageUrl('');
    setStatus('in_stock');
  };

  const inputClasses =
    'w-full p-3.5 rounded-xl bg-stone-50 border border-orange-100/50 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 outline-none dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:border-orange-400 transition-all text-sm';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-orange-400">
        {t('Loading...', 'Loading...')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4 sm:p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-stone-900 p-6 sm:p-10 rounded-[2rem] shadow-xl shadow-orange-400/5 dark:shadow-none w-full max-w-md border border-orange-50 dark:border-stone-800 relative animate-fade-up"
        >
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2">
            {mounted && (
              <button
                type="button"
                onClick={toggleLang}
                className="relative overflow-hidden w-9 h-9 rounded-xl text-stone-400 hover:bg-orange-50 hover:text-orange-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-all flex items-center justify-center font-bold text-xs"
              >
                <span className={`absolute transition-all duration-500 ${lang === 'en' ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-75'}`}>EN</span>
                <span className={`absolute transition-all duration-500 ${lang === 'kh' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>KH</span>
              </button>
            )}

            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl text-stone-400 hover:bg-orange-50 hover:text-orange-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>

          <h2 className="text-3xl font-extrabold mb-8 text-center text-stone-800 dark:text-white tracking-tight">
            {t('Admin Portal', 'Admin Portal')}
          </h2>

          <div className="space-y-4 mb-8">
            <input
              type="email"
              placeholder={t('Email address', 'Email address')}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
            <input
              type="password"
              placeholder={t('Password', 'Password')}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98]"
          >
            {t('Log In', 'Log In')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 md:p-10 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border border-orange-50 dark:border-stone-800 shadow-sm animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-white">
                {t('Dashboard Overview', 'Dashboard Overview')}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-1">
                {t('Manage your storefront settings and inventory.', 'Manage your storefront settings and inventory.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label
                className={`cursor-pointer relative overflow-hidden flex items-center gap-2 px-4 sm:px-5 py-3 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl hover:opacity-90 transition-opacity font-bold text-sm ${isUploadingCsv ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                <span className="whitespace-nowrap">
                  {isUploadingCsv ? t('Importing...', 'Importing...') : t('Bulk Import CSV', 'Bulk Import CSV')}
                </span>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" disabled={isUploadingCsv} />
              </label>

              {mounted && (
                <button
                  onClick={toggleLang}
                  className="relative overflow-hidden w-11 h-11 bg-orange-50 text-orange-400 dark:bg-stone-800 dark:text-stone-300 rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors flex items-center justify-center font-bold text-sm shrink-0"
                >
                  <span className={`absolute transition-all duration-500 ${lang === 'en' ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-75'}`}>EN</span>
                  <span className={`absolute transition-all duration-500 ${lang === 'kh' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>KH</span>
                </button>
              )}

              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-3 bg-orange-50 text-orange-400 dark:bg-stone-800 dark:text-stone-300 rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors shrink-0"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              {/* Fixed wrapping for signout button to ensure it displays well on mobile */}
              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full sm:flex-1 md:flex-none justify-center"
              >
                <LogOut className="w-4 h-4" />
                {t('Sign Out', 'Sign Out')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-1 h-fit animate-fade-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                <Settings className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                {t('Store Settings', 'Store Settings')}
              </h2>
            </div>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-400 uppercase">
                    {t('Header Logo', 'Header Logo')}
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {t('Remove', 'Remove')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="object-contain w-full h-full p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <label
                    className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${isProcessingLogo ? 'bg-orange-100 text-orange-400' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isProcessingLogo ? t('Processing...', 'Processing...') : t('Upload Logo', 'Upload Logo')}
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isProcessingLogo}
                    />
                  </label>
                </div>

                {logoUrl && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                        <span>{t('Logo Size', 'Logo Size')}</span>
                        <span className="text-orange-400">{logoSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full accent-orange-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                        <span>{t('Vertical Align (Offset)', 'Vertical Align (Offset)')}</span>
                        <span className="text-orange-400">{logoOffsetY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={logoOffsetY}
                        onChange={(e) => setLogoOffsetY(Number(e.target.value))}
                        className="w-full accent-orange-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-400 uppercase">
                    {t('Hero Image (Above Title)', 'Hero Image (Above Title)')}
                  </label>
                  {heroImageUrl && (
                    <button
                      type="button"
                      onClick={() => setHeroImageUrl('')}
                      className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {t('Remove', 'Remove')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                    {heroImageUrl ? (
                      <img src={heroImageUrl} alt="Hero" className="object-contain w-full h-full p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <label
                    className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${isProcessingHeroImage ? 'bg-orange-100 text-orange-400' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isProcessingHeroImage ? t('Processing...', 'Processing...') : t('Upload Hero Image', 'Upload Hero Image')}
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleHeroUpload}
                      className="hidden"
                      disabled={isProcessingHeroImage}
                    />
                  </label>
                </div>

                {heroImageUrl && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                      <span>{t('Hero Display Size', 'Hero Display Size')}</span>
                      <span className="text-orange-400">{heroImageSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="300"
                      value={heroImageSize}
                      onChange={(e) => setHeroImageSize(Number(e.target.value))}
                      className="w-full accent-orange-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Store Name', 'Store Name')}
                </label>
                <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClasses} required />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                    {t('Tagline (English)', 'Tagline (English)')}
                  </label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                    {t('Tagline (Khmer)', 'Tagline (Khmer)')}
                  </label>
                  <input value={taglineKh} onChange={(e) => setTaglineKh(e.target.value)} className={inputClasses} placeholder={t('Optional', 'Optional')} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Telegram Handle', 'Telegram Handle')}
                </label>
                <input value={telegramHandle} onChange={(e) => setTelegramHandle(e.target.value)} placeholder="username" className={inputClasses} required />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Default Store Language', 'Default Store Language')}
                </label>
                <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} className={inputClasses}>
                  <option value="en">English (EN)</option>
                  <option value="kh">Khmer (KH)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isProcessingLogo || isProcessingHeroImage}
                className="w-full bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 py-3.5 rounded-xl font-bold mt-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                {t('Save Settings', 'Save Settings')}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 sm:p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-2 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                  {editingId ? t('Edit Product', 'Edit Product') : t('Add New Product', 'Add New Product')}
                </h2>
              </div>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-sm font-bold text-stone-400 hover:text-orange-400 transition-colors"
                >
                  {t('Cancel Edit', 'Cancel Edit')}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Product Name', 'Product Name')}
                </label>
                <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputClasses} required />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Category', 'Category')}
                </label>

                <select
                  value={isCustomCategory ? 'new_custom' : category}
                  onChange={(e) => {
                    if (e.target.value === 'new_custom') {
                      setIsCustomCategory(true);
                      setCategory('');
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className={inputClasses}
                  required
                >
                  <option value="" disabled>
                    {t('Select a Category', 'Select a Category')}
                  </option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="new_custom" className="font-bold text-orange-500">
                    + {t('Add New Category', 'Add New Category')}
                  </option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={t('Type new category...', 'Type new category...')}
                    className={`${inputClasses} mt-3 border-orange-300 ring-2 ring-orange-400/20`}
                    required
                    autoFocus
                  />
                )}
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <label className="text-xs font-bold text-stone-400 uppercase">
                    {t('Variants & Prices', 'Variants & Prices')}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-orange-400 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={hidePrice}
                      onChange={(e) => setHidePrice(e.target.checked)}
                      className="w-3.5 h-3.5 accent-orange-400"
                    />
                    {t('Hide Prices (Ask Seller)', 'Hide Prices (Ask Seller)')}
                  </label>
                </div>

                <div className="space-y-3">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-3 items-center">
                      <input
                        value={variant.name}
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        placeholder={t('Variant Name (e.g., 30cm, Red)', 'Variant Name (e.g., 30cm, Red)')}
                        className={inputClasses}
                        required
                      />

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          className={`${inputClasses} pl-8 ${hidePrice ? 'opacity-50 bg-stone-100 dark:bg-stone-900' : ''}`}
                          required={!hidePrice}
                          disabled={hidePrice}
                          placeholder="0.00"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        disabled={variants.length === 1}
                        className={`p-3.5 rounded-xl border transition-colors ${variants.length === 1 ? 'border-stone-100 text-stone-300 dark:border-stone-800 dark:text-stone-700' : 'border-red-100 text-red-400 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-500/10'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-500 transition-colors px-1"
                >
                  <Plus className="w-4 h-4" /> {t('Add Variant', 'Add Variant')}
                </button>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                  {t('Product Image', 'Product Image')}
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder={t('Paste an image URL...', 'Paste an image URL...')}
                    className={inputClasses}
                    required
                  />
                  <label
                    className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isProcessingImage ? 'bg-orange-100 text-orange-400' : 'bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300'}`}
                  >
                    <UploadCloud className="w-5 h-5" />
                    {isProcessingImage ? t('Processing...', 'Processing...') : t('Upload Local File', 'Upload Local File')}
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={handleProductImageUpload}
                      className="hidden"
                      disabled={isProcessingImage}
                    />
                  </label>
                </div>

                {imageUrl && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-orange-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 shadow-sm">
                      <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" loading="lazy" />
                    </div>
                    <p className="text-xs text-stone-500 font-medium">{t('Image preview ready.', 'Image preview ready.')}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                    {t('Description (English)', 'Description (English)')}
                  </label>
                  <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} className={`${inputClasses} resize-none`} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                    {t('Description (Khmer)', 'Description (Khmer)')}
                  </label>
                  <textarea value={descriptionKh} rows={3} onChange={(e) => setDescriptionKh(e.target.value)} className={`${inputClasses} resize-none`} placeholder={t('Optional', 'Optional')} />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-5 items-end">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">
                    {t('Stock Status', 'Stock Status')}
                  </label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses}>
                    <option value="in_stock">{t('In Stock', 'In Stock')}</option>
                    <option value="out_of_stock">{t('Out of Stock', 'Out of Stock')}</option>
                    <option value="check_seller">{t('Ask Seller', 'Ask Seller')}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingImage}
                  className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-orange-400 text-white rounded-xl font-bold py-3.5 hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? t('Update Product', 'Update Product') : t('Add Product', 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 overflow-hidden animate-fade-up">
          <div className="p-4 sm:p-6 border-b border-orange-50 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50/50 dark:bg-stone-950/50">
            <div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                {t('Inventory Management', 'Inventory Management')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Drag items to reorder them, use arrows to move 1 step, or bump to top.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isSavingOrder && (
                <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving order...
                </span>
              )}
              <span className="bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 py-1.5 px-4 rounded-full text-sm font-bold">
                {products.length} {t('Items', 'Items')}
              </span>
            </div>
          </div>

          <div className="block lg:hidden p-4 space-y-4">
            {products.length === 0 ? (
              <div className="px-4 py-10 text-center text-stone-400 font-medium">
                {t('No products found. Add one above!', 'No products found. Add one above!')}
              </div>
            ) : (
              products.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropReorder(e, product.id)}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/70 dark:bg-stone-950/70 active:scale-[0.99] transition-all overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col gap-1 items-center">
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === products.length - 1}
                        className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-2xl border border-stone-100 dark:border-stone-700 bg-white shrink-0"
                      loading="lazy"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-stone-800 dark:text-white truncate">{product.name}</div>
                      <div className="text-xs text-stone-400 mt-1">{product.category || DEFAULT_CATEGORY}</div>
                      <div className="text-xs text-stone-500 mt-2 line-clamp-2 break-words">{product.description}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.hidePrice ? (
                      <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
                        {t('Hidden', 'Hidden')}
                      </span>
                    ) : product.variants?.length ? (
                      product.variants.map((v: any, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-stone-800 dark:text-orange-400 px-2 py-1 rounded-lg"
                        >
                          {v.name}: ${parseFloat(v.price).toFixed(2)}
                        </span>
                      ))
                    ) : (
                      <span className="font-extrabold text-stone-800 dark:text-white">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBumpToTop(product.id)}
                      className="flex-1 min-w-[100px] p-2.5 text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-xl font-bold text-sm"
                    >
                      Top
                    </button>
                    <button
                      onClick={() => handleEditClick(product)}
                      className="flex-1 min-w-[90px] p-2.5 text-orange-500 bg-orange-50 dark:bg-orange-500/10 rounded-xl font-bold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 min-w-[90px] p-2.5 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl font-bold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold">Order</th>
                  <th className="px-6 py-5 font-bold">{t('Product', 'Product')}</th>
                  <th className="px-6 py-5 font-bold">{t('Category', 'Category')}</th>
                  <th className="px-6 py-5 font-bold">{t('Variants & Prices', 'Variants & Prices')}</th>
                  <th className="px-6 py-5 font-bold">{t('Status', 'Status')}</th>
                  <th className="px-6 py-5 font-bold text-right">{t('Actions', 'Actions')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-medium">
                      {t('No products found. Add one above!', 'No products found. Add one above!')}
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={product.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, product.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropReorder(e, product.id)}
                      className="hover:bg-orange-50/30 dark:hover:bg-stone-800/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-1.5 text-stone-400 font-medium">
                          <GripVertical className="w-4 h-4 cursor-grab" />
                          <div className="flex flex-col">
                            <button onClick={() => handleMoveStep(index, 'up')} disabled={index === 0} className="hover:text-stone-800 disabled:opacity-30 p-1"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={() => handleMoveStep(index, 'down')} disabled={index === products.length - 1} className="hover:text-stone-800 disabled:opacity-30 p-1"><ArrowDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-2xl border border-stone-100 dark:border-stone-700 bg-white"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-bold text-stone-800 dark:text-white mb-1">{product.name}</div>
                            <div className="text-xs text-stone-400 max-w-[250px] truncate">{product.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 px-2.5 py-1 rounded-md text-xs font-bold">
                          {product.category || DEFAULT_CATEGORY}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {product.hidePrice ? (
                          <span className="text-stone-400 text-sm font-bold bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
                            {t('Hidden', 'Hidden')}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {product.variants && product.variants.length > 0 ? (
                              product.variants.map((v: any, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-stone-800 dark:text-orange-400 px-2 py-1 rounded-lg"
                                >
                                  {v.name}: ${parseFloat(v.price).toFixed(2)}
                                </span>
                              ))
                            ) : (
                              <span className="font-extrabold text-stone-800 dark:text-white">
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full font-bold inline-block ${
                            product.status === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : product.status === 'out_of_stock'
                              ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                              : 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400'
                          }`}
                        >
                          {product.status === 'in_stock'
                            ? t('In Stock', 'In Stock')
                            : product.status === 'out_of_stock'
                            ? t('Out of Stock', 'Out of Stock')
                            : t('Ask Seller', 'Ask Seller')}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleBumpToTop(product.id)}
                            className="p-2.5 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-xs font-bold"
                            title={t('Move to Top', 'Move to Top')}
                          >
                            Top
                          </button>

                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
                            title={t('Edit', 'Edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                            title={t('Delete', 'Delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}