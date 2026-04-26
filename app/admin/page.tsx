'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { CldUploadWidget } from 'next-cloudinary';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
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
  ChevronDown,
  CheckSquare,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';

const DEFAULT_CATEGORY = '';

// Extracted ProductRow Component wrapper with React.memo
const ProductRow = React.memo(function ProductRow({
  product,
  index,
  totalCount,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  onBump,
  onMoveStep,
  onDragStart,
  onDrop,
  lang,
}: {
  product: any;
  index: number;
  totalCount: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onBump: (id: string) => void;
  onMoveStep: (index: number, dir: 'up' | 'down') => void;
  onDragStart: (e: React.DragEvent<any>, id: string) => void;
  onDrop: (e: React.DragEvent<any>, id: string) => void;
  lang: string;
}) {
  const t = (en: string, kh: string) => lang === 'kh' ? kh : en;
  const DEFAULT_CATEGORY = '';

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, product.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, product.id)}
      className={`hover:bg-orange-50/30 dark:hover:bg-stone-800/30 transition-colors group ${isSelected ? 'bg-orange-50/20 dark:bg-orange-500/5' : ''}`}
    >
      <td className="px-6 py-5 text-center">
        <input type="checkbox" checked={isSelected} onChange={() => onToggle(product.id)} className="w-4 h-4 accent-orange-500" />
      </td>
      <td className="px-2 py-5">
        <div className="inline-flex items-center gap-1.5 text-stone-400 font-medium">
          <GripVertical className="w-4 h-4 cursor-grab" />
          <div className="flex flex-col">
            <button onClick={() => onMoveStep(index, 'up')} disabled={index === 0} className="hover:text-stone-800 disabled:opacity-30 p-1"><ArrowUp className="w-3 h-3" /></button>
            <button onClick={() => onMoveStep(index, 'down')} disabled={index === totalCount - 1} className="hover:text-stone-800 disabled:opacity-30 p-1"><ArrowDown className="w-3 h-3" /></button>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-2xl border border-stone-100 dark:border-stone-700 bg-white" loading="lazy" />
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
          <span className="text-stone-400 text-sm font-bold bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">{t('Hidden', 'លាក់')}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {product.variants?.length > 0 ? product.variants.map((v: any, i: number) => (
              <span key={i} className="text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-stone-800 dark:text-orange-400 px-2 py-1 rounded-lg">
                {v.name}: ${parseFloat(v.price).toFixed(2)}
              </span>
            )) : (
              <span className="font-extrabold text-stone-800 dark:text-white">${parseFloat(product.price).toFixed(2)}</span>
            )}
          </div>
        )}
      </td>
      <td className="px-6 py-5">
        <span className={`text-xs px-3 py-1.5 rounded-full font-bold inline-block ${
          product.status === 'in_stock' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
          : product.status === 'out_of_stock' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
          : 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400'
        }`}>
          {product.status === 'in_stock' ? t('In Stock', 'មានក្នុងស្តុក')
            : product.status === 'out_of_stock' ? t('Out of Stock', 'អស់ពីស្តុក')
            : t('Ask Seller', 'សួរអ្នកលក់')}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onBump(product.id)} className="p-2.5 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-stone-800 rounded-xl transition-colors text-xs font-bold" title={t('Move to Top', 'រុញទៅលើគេ')}>
            {t('Top', 'លើគេ')}
          </button>
          <button onClick={() => onEdit(product)} className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-xl transition-colors" title={t('Edit', 'កែសម្រួល')}>
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title={t('Delete', 'លុប')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('siteLang') || 'en';
    }
    return 'en';
  });
  const [showSettings, setShowSettings] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineKh, setTaglineKh] = useState('');
  const[telegramHandle, setTelegramHandle] = useState('');
  const [defaultLang, setDefaultLang] = useState('en');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(48);
  const [logoOffsetY, setLogoOffsetY] = useState(0);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const[heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageSize, setHeroImageSize] = useState(128);
  const [isProcessingHeroImage, setIsProcessingHeroImage] = useState(false);

  const[editingId, setEditingId] = useState<string | null>(null);
  const[productName, setProductName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const[isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionKh, setDescriptionKh] = useState('');
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([
    { name: 'Standard', price: '' },
  ]);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [hidePrice, setHidePrice] = useState(false);
  const[imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('in_stock');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const[isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const[globalCategories, setGlobalCategories] = useState<string[]>([]);
  
  // New State for Bulk Actions & Filters
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const[adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const t = (en: string, kh: string) => (lang === 'kh' ? kh : en);

  // NEW: Activity Logger - IMPROVED
  const logActivity = useCallback(async (action: string, targetName: string, details?: string) => {
    try {
      const currentUser = user || auth.currentUser;
      const adminIdentity = currentUser?.displayName || currentUser?.email || 'Unknown Admin';
      
      console.log(`[LOG] Action: ${action}, Target: ${targetName}, Admin: ${adminIdentity}`);
      
      const logEntry = {
        admin: adminIdentity,
        action,
        target: targetName,
        details: details || '',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'activityLogs'), logEntry);
      console.log(`[LOG] Activity logged successfully with ID: ${docRef.id}`);
    } catch (error) {
      console.error('[LOG ERROR] Failed to log activity:', error);
      console.error('[LOG ERROR] Details:', { action, targetName, details });
    }
  }, [user]);

  const getSettingsDiff = (oldSettings: any, newSettings: any) => {
    if (!oldSettings) return [];
    const changed: string[] = [];
    const keys = [
      'storeName',
      'tagline',
      'taglineKh',
      'telegramHandle',
      'defaultLang',
      'facebookUrl',
      'tiktokUrl',
      'mapsUrl',
      'logoUrl',
      'logoSize',
      'logoOffsetY',
      'heroImageUrl',
      'heroImageSize',
    ];
    keys.forEach((key) => {
      if ((oldSettings[key] ?? '') !== (newSettings[key] ?? '')) {
        changed.push(key);
      }
    });
    return changed;
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en';
    setLang(newLang);
    localStorage.setItem('siteLang', newLang);
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
        setFacebookUrl(data.facebookUrl || '');
        setTiktokUrl(data.tiktokUrl || '');
        setMapsUrl(data.mapsUrl || '');
        setGlobalCategories(data.categories || []);
        setOriginalSettings({
          storeName: data.storeName || '',
          tagline: data.tagline || '',
          taglineKh: data.taglineKh || '',
          telegramHandle: data.telegramHandle || '',
          defaultLang: data.defaultLang || 'en',
          facebookUrl: data.facebookUrl || '',
          tiktokUrl: data.tiktokUrl || '',
          mapsUrl: data.mapsUrl || '',
          logoUrl: data.logoUrl || '',
          logoSize: data.logoSize || 48,
          logoOffsetY: data.logoOffsetY || 0,
          heroImageUrl: data.heroImageUrl || '',
          heroImageSize: data.heroImageSize || 128,
        });
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
  },[]);

  useEffect(() => {
    setMounted(true);

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
  },[fetchData]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set([
      ...globalCategories,
      ...products.map((p) => p.category)
    ].filter((c) => c && c.trim() !== '')); // This removes the blanks
    return Array.from(cats);
  }, [products, globalCategories]);

  // Admin list filters
  const filteredAdminProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(adminSearchQuery.toLowerCase());
      const matchesCat = adminCategoryFilter === 'all' || (product.category || DEFAULT_CATEGORY) === adminCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, adminSearchQuery, adminCategoryFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      alert(t('Invalid credentials', 'ព័ត៌មានសម្ងាត់មិនត្រឹមត្រូវ'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert(t('Google Sign-In failed', 'ការចូលតាមរយៈ Google បរាជ័យ'));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const settingsPayload = {
        storeName,
        tagline,
        taglineKh,
        telegramHandle,
        defaultLang,
        facebookUrl,
        tiktokUrl,
        mapsUrl,
        logoUrl,
        logoSize,
        logoOffsetY,
        heroImageUrl,
        heroImageSize,
      };

      await setDoc(
        doc(db, 'settings', 'global'),
        settingsPayload,
        { merge: true }
      );

      const changedFields = getSettingsDiff(originalSettings, settingsPayload);
      const details = changedFields.length > 0 ? `Updated fields: ${changedFields.join(', ')}` : 'Saved store settings';
      await logActivity('Updated Store Settings', 'Store Settings', details);

      setOriginalSettings(settingsPayload);
      alert(t('Settings Saved Successfully!', 'រក្សាទុកការកំណត់ដោយជោគជ័យ!'));
    } catch (error) {
      console.error('Error saving settings', error);
      alert(t('Error saving settings.', 'មានកំហុសក្នុងការរក្សាទុកការកំណត់។'));
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (window.confirm(t(`Remove category "${catToDelete}"? (Products will remain but lose this category)`, `លុបប្រភេទ "${catToDelete}"?`))) {
      try {
        await updateDoc(doc(db, 'settings', 'global'), {
          categories: arrayRemove(catToDelete)
        });
        setGlobalCategories(prev => prev.filter(c => c !== catToDelete));

        // Move all products using this category to empty string ("")
        const productsToUpdate = products.filter(p => p.category === catToDelete);
        if (productsToUpdate.length > 0) {
          const batch = writeBatch(db);
          productsToUpdate.forEach(p => {
            batch.update(doc(db, 'products', p.id), { category: "" });
          });
          await batch.commit();
          await fetchData(); 
        }

        await logActivity('Deleted Category', catToDelete, `Removed category and unassigned ${productsToUpdate.length} product(s)`);
      } catch(error) {
        console.error('Error removing category', error);
      }
    }
  };

  const handleRenameCategory = async (oldName: string) => {
    const newName = window.prompt(t('Enter new name for category:', 'បញ្ចូលឈ្មោះថ្មីសម្រាប់ប្រភេទ៖'), oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    const trimmedName = newName.trim();

    try {
      // 1. Update global settings (Firestore requires 2 steps for array replace)
      await updateDoc(doc(db, 'settings', 'global'), {
        categories: arrayRemove(oldName)
      });
      await updateDoc(doc(db, 'settings', 'global'), {
        categories: arrayUnion(trimmedName)
      });
      
      setGlobalCategories(prev => {
        const updated = prev.filter(c => c !== oldName);
        updated.push(trimmedName);
        return updated;
      });

      // 2. Bulk update all products holding the old category
      const productsToUpdate = products.filter(p => p.category === oldName);
      if (productsToUpdate.length > 0) {
        const batch = writeBatch(db);
        productsToUpdate.forEach(p => {
          batch.update(doc(db, 'products', p.id), { category: trimmedName });
        });
        await batch.commit();
        await fetchData();
      }
      await logActivity('Renamed Category', `${oldName} → ${trimmedName}`, `Updated ${productsToUpdate.length} product(s)`);
    } catch(error) {
      console.error('Error renaming category', error);
      alert(t('Failed to rename category.', 'បរាជ័យក្នុងការប្តូរឈ្មោះប្រភេទ។'));
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
    const next =[...variants];
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
          const result: string[] =[];
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
          alert(t('CSV must contain "Name" and "Variants" columns.', 'CSV ត្រូវតែមានជួរឈរ "Name" និង "Variants"។'));
          setIsUploadingCsv(false);
          return;
        }

        const uploadPromises =[];

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
        alert(lang === 'kh' ? `បាននាំចូលផលិតផល ${uploadPromises.length} ដោយជោគជ័យ!` : `Successfully imported ${uploadPromises.length} products!`);
        await fetchData();
        await logActivity('Imported CSV Products', `${uploadPromises.length} products`, 'Imported products from CSV upload');
      } catch (error) {
        console.error('CSV Import Error:', error);
        alert(t('Failed to parse CSV. Ensure it is formatted correctly.', 'បរាជ័យក្នុងការអាន CSV។ សូមប្រាកដថាមានទម្រង់ត្រឹមត្រូវ។'));
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
        alert(t('Product Updated!', 'បានធ្វើបច្ចុប្បន្នភាពផលិតផល!'));
        
        // Log with detailed change info
        const priceInfo = hidePrice ? 'Hidden' : `$${formattedVariants[0]?.price || 0}`;
        await logActivity(
          'Updated Product', 
          productName,
          `Name: ${productName}, Category: ${finalCategory}, Price: ${priceInfo}, Status: ${status}`
        );
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: Date.now(),
          manualOrder: products.length,
        });
        alert(t('Product Added!', 'បានបន្ថែមផលិតផល!'));
        await logActivity('Added Product', productName);
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving product', error);
      alert(t('Error saving product.', 'មានកំហុសក្នុងការរក្សាទុកផលិតផល។'));
    }
  };

  const handleEditClick = useCallback((product: any) => {
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
  }, [uniqueCategories]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    if (window.confirm(t('Are you sure you want to delete this product?', 'តើអ្នកប្រាកដជាចង់លុបផលិតផលនេះទេ?'))) {
      const productToDelete = products.find((product) => product.id === id);
      const targetName = productToDelete?.name || id;
      const price = productToDelete?.price ? `$${productToDelete.price}` : 'No price';
      
      await deleteDoc(doc(db, 'products', id));
      await logActivity(
        'Deleted Product', 
        targetName,
        `ID: ${id}, Price: ${price}, Category: ${productToDelete?.category || 'None'}`
      );
      await fetchData();
      setSelectedProductIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [t, fetchData, products, logActivity]);

  // Bulk Actions
  const toggleSelection = useCallback((id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  },[]);

  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredAdminProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredAdminProducts.map(p => p.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedProductIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedProductIds.forEach(id => {
        batch.update(doc(db, 'products', id), { status: newStatus });
      });
      await batch.commit();
      await fetchData();
      const actionTarget = `${selectedProductIds.size} products`;
      await logActivity('Bulk Status Change', actionTarget, `Set status to ${newStatus}`);
      setSelectedProductIds(new Set());
    } catch (error) {
      console.error('Bulk update error', error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkCategoryChange = async (newCategory: string) => {
    if (!newCategory || selectedProductIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedProductIds.forEach(id => {
        batch.update(doc(db, 'products', id), { category: newCategory });
      });
      await batch.commit();
      await fetchData();
      await logActivity('Bulk Category Change', `${selectedProductIds.size} products`, `Set category to ${newCategory}`);
      setSelectedProductIds(new Set());
    } catch (error) {
      console.error('Bulk category update error', error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t(`Delete ${selectedProductIds.size} products?`, `លុបផលិតផល ${selectedProductIds.size}?`))) {
      setIsProcessingBulk(true);
      try {
        const batch = writeBatch(db);
        selectedProductIds.forEach(id => {
          batch.delete(doc(db, 'products', id));
        });
        await batch.commit();
        await fetchData();
        await logActivity('Bulk Delete', `${selectedProductIds.size} products`, 'Removed selected products');
        setSelectedProductIds(new Set());
      } catch (error) {
        console.error('Bulk delete error', error);
      } finally {
        setIsProcessingBulk(false);
      }
    }
  };

  const persistManualOrder = async (items: any[], reason?: string) => {
    setIsSavingOrder(true);
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        batch.update(doc(db, 'products', item.id), { manualOrder: index });
      });
      await batch.commit();
      setProducts(items.map((item, index) => ({ ...item, manualOrder: index })));
      if (reason) {
        await logActivity('Reordered Products', `${items.length} products`, reason);
      }
    } catch (error) {
      console.error('Error saving manual order', error);
      alert(t('Failed to save product order.', 'បរាជ័យក្នុងការរក្សាទុកលំដាប់ផលិតផល។'));
      await fetchData();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleBumpToTop = useCallback(async (id: string) => {
    const current = [...products];
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return;

    const [item] = current.splice(index, 1);
    current.unshift(item);

    await persistManualOrder(current, `Bumped ${item.name} to top (moved from position ${index + 1} to 1)`);
  }, [products, persistManualOrder]);

  const handleMoveStep = useCallback(async (index: number, direction: 'up' | 'down') => {
    if (adminSearchQuery || adminCategoryFilter !== 'all') {
      alert("Clear filters to manually reorder products.");
      return;
    }

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const next = [...products];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]]; 

    setProducts(next);
    const movedProduct = next[swapIndex];
    await persistManualOrder(next, `Moved ${movedProduct.name} ${direction} (from position ${index + 1} to ${swapIndex + 1})`);
  },[products, adminSearchQuery, adminCategoryFilter]);

  const handleDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement | HTMLTableRowElement>,
    draggedId: string
  ) => {
    e.dataTransfer.setData('text/plain', draggedId);
    e.dataTransfer.effectAllowed = 'move';
  },[]);

  const handleDropReorder = useCallback(async (
    e: React.DragEvent<HTMLDivElement | HTMLTableRowElement>,
    targetId: string
  ) => {
    e.preventDefault();
    if (adminSearchQuery || adminCategoryFilter !== 'all') {
      alert("Clear filters to manually reorder products.");
      return;
    }

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const next = [...products];
    const fromIndex = next.findIndex((p) => p.id === draggedId);
    const toIndex = next.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setProducts(next);
    await persistManualOrder(next, `Dragged ${moved.name} to position ${toIndex + 1}`);
  },[products, adminSearchQuery, adminCategoryFilter]);

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
        {t('Loading...', 'កំពុងផ្ទុក...')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 relative">
        {/* NEW: Back to Store button on Login Screen */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 p-2.5 rounded-xl text-stone-500 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800 transition-all font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('Back to Store', 'ត្រឡប់ទៅហាង')}</span>
          </Link>
        </div>

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
            {t('Admin Portal', 'វិបផតថលអ្នកគ្រប់គ្រង')}
          </h2>

          <div className="space-y-4 mb-6">
            <input
              type="email"
              placeholder={t('Email address', 'អាសយដ្ឋានអ៊ីមែល')}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
            <input
              type="password"
              placeholder={t('Password', 'ពាក្យសម្ងាត់')}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98] mb-4"
          >
            {t('Log In', 'ចូល')}
          </button>

          <div className="relative flex items-center py-2 mb-4">
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
            <span className="flex-shrink-0 mx-4 text-stone-400 text-sm font-bold">{t('OR', 'ឬ')}</span>
            <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
          </div>

          {/* NEW: Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-white py-4 rounded-xl font-bold text-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('Sign in with Google', 'ចូលតាមរយៈ Google')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 md:p-10 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900 pb-32">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Header & Global Actions */}
        <div className="flex flex-col gap-4 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-3xl border border-orange-50 dark:border-stone-800 shadow-sm animate-fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-white">
                {t('Dashboard Overview', 'ទិដ្ឋភាពទូទៅនៃផ្ទាំងគ្រប់គ្រង')}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-1">
                {t('Manage your storefront settings and inventory.', 'គ្រប់គ្រងការកំណត់ហាងនិងស្តុករបស់អ្នក។')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label
                className={`cursor-pointer relative overflow-hidden flex items-center gap-2 px-4 sm:px-5 py-3 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl hover:opacity-90 transition-opacity font-bold text-sm ${isUploadingCsv ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                <span className="whitespace-nowrap">
                  {isUploadingCsv ? t('Importing...', 'កំពុងនាំចូល...') : t('Bulk Import CSV', 'នាំចូល CSV')}
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

              {/* NEW: Back to Store Button in Admin Header */}
              <Link
                href="/"
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors w-full sm:flex-1 md:flex-none justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('View Store', 'មើលហាង')}
              </Link>

              <Link
                href="/admin/logs"
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl font-bold hover:bg-orange-200 dark:hover:bg-orange-500/20 transition-colors w-full sm:flex-1 md:flex-none justify-center"
              >
                {t('Activity Logs', 'កំណត់ហេតុសកម្មភាព')}
              </Link>

              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full sm:flex-1 md:flex-none justify-center"
              >
                <LogOut className="w-4 h-4" />
                {t('Sign Out', 'ចាកចេញ')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Settings Section */}
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-1 h-fit animate-fade-up">
            <div 
              className="flex items-center justify-between mb-8 cursor-pointer xl:cursor-default"
              onClick={() => setShowSettings(!showSettings)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                  {t('Store Settings', 'ការកំណត់ហាង')}
                </h2>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-stone-400 transition-transform xl:hidden ${showSettings ? 'rotate-180' : ''}`} 
              />
            </div>

            <div className={`flex flex-col gap-6 ${showSettings ? 'flex' : 'hidden xl:flex'}`}>
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase">
                      {t('Header Logo', 'និមិត្តសញ្ញា')}
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> {t('Remove', 'លុប')}
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
                      {isProcessingLogo ? t('Processing...', 'កំពុងដំណើរការ...') : t('Upload Logo', 'បង្ហោះនិមិត្តសញ្ញា')}
                      <input type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={handleLogoUpload} className="hidden" disabled={isProcessingLogo} />
                    </label>
                  </div>

                  {logoUrl && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                          <span>{t('Logo Size', 'ទំហំនិមិត្តសញ្ញា')}</span>
                          <span className="text-orange-400">{logoSize}px</span>
                        </div>
                        <input type="range" min="20" max="120" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full accent-orange-400" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                          <span>{t('Vertical Align (Offset)', 'តម្រឹមបញ្ឈរ')}</span>
                          <span className="text-orange-400">{logoOffsetY}px</span>
                        </div>
                        <input type="range" min="-30" max="30" value={logoOffsetY} onChange={(e) => setLogoOffsetY(Number(e.target.value))} className="w-full accent-orange-400" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-400 uppercase">
                      {t('Hero Image (Above Title)', 'រូបភាពទាក់ទាញ (ខាងលើចំណងជើង)')}
                    </label>
                    {heroImageUrl && (
                      <button type="button" onClick={() => setHeroImageUrl('')} className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1">
                        <X className="w-3 h-3" /> {t('Remove', 'លុប')}
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
                    <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${isProcessingHeroImage ? 'bg-orange-100 text-orange-400' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}>
                      <UploadCloud className="w-4 h-4" />
                      {isProcessingHeroImage ? t('Processing...', 'កំពុងដំណើរការ...') : t('Upload Hero Image', 'បង្ហោះរូបភាពទាក់ទាញ')}
                      <input type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={handleHeroUpload} className="hidden" disabled={isProcessingHeroImage} />
                    </label>
                  </div>

                  {heroImageUrl && (
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-400 mb-2">
                        <span>{t('Hero Display Size', 'ទំហំបង្ហាញរូបភាព')}</span>
                        <span className="text-orange-400">{heroImageSize}px</span>
                      </div>
                      <input type="range" min="40" max="300" value={heroImageSize} onChange={(e) => setHeroImageSize(Number(e.target.value))} className="w-full accent-orange-400" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Store Name', 'ឈ្មោះហាង')}</label>
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClasses} required />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Tagline (English)', 'ពាក្យស្លោក (អង់គ្លេស)')}</label>
                    <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClasses} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Tagline (Khmer)', 'ពាក្យស្លោក (ខ្មែរ)')}</label>
                    <input value={taglineKh} onChange={(e) => setTaglineKh(e.target.value)} className={inputClasses} placeholder={t('Optional', 'ជាជម្រើស')} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Telegram Handle', 'ឈ្មោះតេឡេក្រាម (Telegram Handle)')}</label>
                  <input value={telegramHandle} onChange={(e) => setTelegramHandle(e.target.value)} placeholder="username" className={inputClasses} required />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Default Store Language', 'ភាសាដើមរបស់ហាង')}</label>
                  <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} className={inputClasses}>
                    <option value="en">{t('English (EN)', 'អង់គ្លេស (EN)')}</option>
                    <option value="kh">{t('Khmer (KH)', 'ខ្មែរ (KH)')}</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4 mt-4">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('Social & Map Links', 'តំណភ្ជាប់សង្គម')}</label>
                  <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="Facebook Page URL" className={inputClasses} />
                  <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="TikTok Profile URL" className={inputClasses} />
                  <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="Google Maps Link" className={inputClasses} />
                </div>

                <button type="submit" disabled={isProcessingLogo || isProcessingHeroImage} className="w-full bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 py-3.5 rounded-xl font-bold mt-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
                  {t('Save Settings', 'រក្សាទុកការកំណត់')}
                </button>
              </form>

              {/* Manage Categories Section */}
              <div className="pt-6 mt-2 border-t border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-800 dark:text-white mb-4 uppercase">
                  {t('Manage Categories', 'គ្រប់គ្រងប្រភេទ')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {globalCategories.map(cat => (
                    <div key={cat} className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 pl-3 pr-1 py-1.5 rounded-lg text-sm font-bold">
                      <span className="mr-2">{cat}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRenameCategory(cat)} 
                        className="p-1 text-stone-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(cat)} 
                        className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {globalCategories.length === 0 && (
                    <span className="text-xs text-stone-400">{t('No custom categories saved.', 'មិនមានប្រភេទផ្ទាល់ខ្លួនត្រូវបានរក្សាទុកទេ។')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit Product Section */}
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-2 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                  {editingId ? t('Edit Product', 'កែសម្រួលផលិតផល') : t('Add New Product', 'បន្ថែមផលិតផលថ្មី')}
                </h2>
              </div>

              {editingId && (
                <button onClick={resetForm} className="text-sm font-bold text-stone-400 hover:text-orange-400 transition-colors">
                  {t('Cancel Edit', 'បោះបង់ការកែសម្រួល')}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Product Name', 'ឈ្មោះផលិតផល')}</label>
                <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputClasses} required />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Category', 'ប្រភេទ')}</label>
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
                  <option value="" disabled>{t('Select a Category', 'ជ្រើសរើសប្រភេទ')}</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new_custom" className="font-bold text-orange-500">
                    + {t('Add New Category', 'បន្ថែមប្រភេទថ្មី')}
                  </option>
                </select>

                {isCustomCategory && (
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('Type new category...', 'វាយបញ្ចូលប្រភេទថ្មី...')} className={`${inputClasses} mt-3 border-orange-300 ring-2 ring-orange-400/20`} required autoFocus />
                )}
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('Variants & Prices', 'ជម្រើសនិងតម្លៃ')}</label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-orange-400 cursor-pointer transition-colors">
                    <input type="checkbox" checked={hidePrice} onChange={(e) => setHidePrice(e.target.checked)} className="w-3.5 h-3.5 accent-orange-400" />
                    {t('Hide Prices (Ask Seller)', 'លាក់តម្លៃ (សួរអ្នកលក់)')}
                  </label>
                </div>

                <div className="space-y-3">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-3 items-center">
                      <input value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder={t('Variant Name (e.g., 30cm, Red)', 'ឈ្មោះជម្រើស (ឧទាហរណ៍៖ 30cm, ពណ៌ក្រហម)')} className={inputClasses} required />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                        <input type="number" step="0.01" value={variant.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} className={`${inputClasses} pl-8 ${hidePrice ? 'opacity-50 bg-stone-100 dark:bg-stone-900' : ''}`} required={!hidePrice} disabled={hidePrice} placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeVariant(idx)} disabled={variants.length === 1} className={`p-3.5 rounded-xl border transition-colors ${variants.length === 1 ? 'border-stone-100 text-stone-300 dark:border-stone-800 dark:text-stone-700' : 'border-red-100 text-red-400 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-500/10'}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addVariant} className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-500 transition-colors px-1">
                  <Plus className="w-4 h-4" /> {t('Add Variant', 'បន្ថែមជម្រើស')}
                </button>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Product Image', 'រូបភាពផលិតផល')}</label>
                <div className="flex flex-col gap-3">
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t('Paste an image URL...', 'បិទភ្ជាប់តំណរូបភាព...')} className={inputClasses} required />
                  <CldUploadWidget uploadPreset="kimsan285" onSuccess={(result: any) => { const newImageUrl = result?.info?.secure_url; if (newImageUrl) setImageUrl(newImageUrl); }}>
                    {({ open }) => (
                      <button type="button" onClick={() => open()} className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300">
                        <UploadCloud className="w-5 h-5" />
                        {t('Upload via Cloudinary', 'បង្ហោះតាមរយៈ Cloudinary')}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                {imageUrl && (
                  <div className="mt-4 flex items-center justify-between bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-orange-100 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm shrink-0">
                        <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" loading="lazy" />
                      </div>
                      <p className="text-xs text-stone-500 font-medium">{t('Image ready.', 'រូបភាពត្រៀមរៀបរាល់។')}</p>
                    </div>
                    <button type="button" onClick={() => setImageUrl('')} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold">
                      <X className="w-4 h-4" /> <span className="hidden sm:inline">{t('Remove', 'លុប')}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Description (English)', 'ការពិពណ៌នា (អង់គ្លេស)')}</label>
                  <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} className={`${inputClasses} resize-none`} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Description (Khmer)', 'ការពិពណ៌នា (ខ្មែរ)')}</label>
                  <textarea value={descriptionKh} rows={3} onChange={(e) => setDescriptionKh(e.target.value)} className={`${inputClasses} resize-none`} placeholder={t('Optional', 'ជាជម្រើស')} />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-5 items-end">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Stock Status', 'ស្ថានភាពស្តុក')}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClasses}>
                    <option value="in_stock">{t('In Stock', 'មានក្នុងស្តុក')}</option>
                    <option value="out_of_stock">{t('Out of Stock', 'អស់ពីស្តុក')}</option>
                    <option value="check_seller">{t('Ask Seller', 'សួរអ្នកលក់')}</option>
                  </select>
                </div>

                <button type="submit" disabled={isProcessingImage} className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-orange-400 text-white rounded-xl font-bold py-3.5 hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98] disabled:opacity-50">
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? t('Update Product', 'ធ្វើបច្ចុប្បន្នភាពផលិតផល') : t('Add Product', 'បន្ថែមផលិតផល')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 overflow-hidden animate-fade-up mt-8">
          <div className="p-4 sm:p-6 border-b border-orange-50 dark:border-stone-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-stone-50/50 dark:bg-stone-950/50">
            <div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                {t('Inventory Management', 'ការគ្រប់គ្រងស្តុក')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {t('Search, filter, select, or manually reorder your items.', 'ស្វែងរក ត្រង ជ្រើសរើស ឬរៀបចំទំនិញឡើងវិញ។')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text" 
                  placeholder={t("Search admin...", "ស្វែងរក...")}
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-3 py-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-sm outline-none focus:border-orange-400"
                />
              </div>
              <div className="relative w-full sm:w-auto flex items-center">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <select 
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-3 py-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-sm outline-none focus:border-orange-400 appearance-none font-bold"
                >
                  <option value="all">{t('All Categories', 'ប្រភេទទាំងអស់')}</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto mt-2 sm:mt-0">
                {isSavingOrder && (
                  <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                )}
                <span className="bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 py-1.5 px-4 rounded-full text-sm font-bold shrink-0">
                  {filteredAdminProducts.length} {t('Items', 'ទំនិញ')}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Action Bar at Top for Bulk Selection - NOW ACCESSIBLE */}
          {selectedProductIds.size > 0 && (
            <div className="sticky top-0 left-0 right-0 z-45 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl m-4 p-4 shadow-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 animate-slide-in-up border border-orange-400">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-white flex-shrink-0" />
                <span className="font-bold text-sm">{selectedProductIds.size} {t('Selected', 'បានជ្រើសរើស')}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                <select 
                  className="bg-white/20 border border-white/30 text-white text-xs px-3 py-2 rounded-lg font-bold outline-none flex-1 sm:flex-none backdrop-blur hover:bg-white/30 transition-colors"
                  onChange={(e) => {
                    handleBulkCategoryChange(e.target.value);
                    e.target.value = "";
                  }}
                  disabled={isProcessingBulk}
                  defaultValue=""
                >
                  <option value="" disabled className="text-stone-900 bg-white">{t('Set Category...', 'កំណត់ប្រភេទ...')}</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat} className="text-stone-900 bg-white">{cat}</option>)}
                </select>
                
                <select 
                  className="bg-white/20 border border-white/30 text-white text-xs px-3 py-2 rounded-lg font-bold outline-none flex-1 sm:flex-none backdrop-blur hover:bg-white/30 transition-colors"
                  onChange={(e) => {
                    handleBulkStatusChange(e.target.value);
                    e.target.value = "";
                  }}
                  disabled={isProcessingBulk}
                  defaultValue=""
                >
                  <option value="" disabled className="text-stone-900 bg-white">{t('Set Status...', 'កំណត់ស្ថានភាព...')}</option>
                  <option value="in_stock" className="text-stone-900 bg-white">{t('In Stock', 'មានក្នុងស្តុក')}</option>
                  <option value="out_of_stock" className="text-stone-900 bg-white">{t('Out of Stock', 'អស់ពីស្តុក')}</option>
                  <option value="check_seller" className="text-stone-900 bg-white">{t('Ask Seller', 'សួរអ្នកលក់')}</option>
                </select>

                <button 
                  onClick={handleBulkDelete} 
                  disabled={isProcessingBulk}
                  className="bg-red-400/30 text-white hover:bg-red-400 hover:text-white p-2 rounded-lg transition-colors shrink-0 border border-white/30 hover:border-white/50"
                  title="Bulk Delete"
                >
                  {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Product List */}
          <div className="block lg:hidden p-4 space-y-4">
            {filteredAdminProducts.length === 0 ? (
              <div className="px-4 py-10 text-center text-stone-400 font-medium">
                {t('No products found.', 'រកមិនឃើញផលិតផលទេ។')}
              </div>
            ) : (
              filteredAdminProducts.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropReorder(e, product.id)}
                  className={`rounded-2xl border p-4 transition-all overflow-hidden ${selectedProductIds.has(product.id) ? 'border-orange-400 bg-orange-50/20 dark:bg-orange-500/5' : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col gap-2 items-center mt-1">
                      <input 
                        type="checkbox" 
                        checked={selectedProductIds.has(product.id)} 
                        onChange={() => toggleSelection(product.id)}
                        className="w-4 h-4 accent-orange-500 mb-2"
                      />
                      <button onClick={() => handleMoveStep(index, 'up')} disabled={index === 0} className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMoveStep(index, 'down')} disabled={index === products.length - 1} className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30">
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
                        {t('Hidden', 'លាក់')}
                      </span>
                    ) : product.variants?.length ? (
                      product.variants.map((v: any, i: number) => (
                        <span key={i} className="text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-stone-800 dark:text-orange-400 px-2 py-1 rounded-lg">
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
                    <button onClick={() => handleBumpToTop(product.id)} className="flex-1 min-w-[100px] p-2.5 text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-xl font-bold text-sm">
                      {t('Top', 'លើគេ')}
                    </button>
                    <button onClick={() => handleEditClick(product)} className="flex-1 min-w-[90px] p-2.5 text-orange-500 bg-orange-50 dark:bg-orange-500/10 rounded-xl font-bold text-sm">
                      {t('Edit', 'កែសម្រួល')}
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 min-w-[90px] p-2.5 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl font-bold text-sm">
                      {t('Delete', 'លុប')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto pb-6">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={filteredAdminProducts.length > 0 && selectedProductIds.size === filteredAdminProducts.length} className="w-4 h-4 accent-orange-500" />
                  </th>
                  <th className="px-2 py-5 font-bold">{t('Order', 'លំដាប់')}</th>
                  <th className="px-6 py-5 font-bold">{t('Product', 'ផលិតផល')}</th>
                  <th className="px-6 py-5 font-bold">{t('Category', 'ប្រភេទ')}</th>
                  <th className="px-6 py-5 font-bold">{t('Variants & Prices', 'ជម្រើសនិងតម្លៃ')}</th>
                  <th className="px-6 py-5 font-bold">{t('Status', 'ស្ថានភាព')}</th>
                  <th className="px-6 py-5 font-bold text-right">{t('Actions', 'សកម្មភាព')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {filteredAdminProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-stone-400 font-medium">
                      {t('No products found.', 'រកមិនឃើញផលិតផលទេ។')}
                    </td>
                  </tr>
                ) : (
                  filteredAdminProducts.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      index={index}
                      totalCount={products.length}
                      isSelected={selectedProductIds.has(product.id)}
                      onToggle={toggleSelection}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteProduct}
                      onBump={handleBumpToTop}
                      onMoveStep={handleMoveStep}
                      onDragStart={handleDragStart}
                      onDrop={handleDropReorder}
                      lang={lang}
                    />
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