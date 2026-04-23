'use client';
import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Trash2, Edit, Plus, Settings, LogOut, Package, Sun, Moon, UploadCloud, Image as ImageIcon, X, FileUp, Loader2, ArrowUp } from 'lucide-react';

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Store Settings State
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

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('កំប៉ុង'); 
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionKh, setDescriptionKh] = useState('');
  const [variants, setVariants] = useState<{name: string, price: string}[]>([{ name: 'Standard', price: '' }]);
  const [hidePrice, setHidePrice] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('in_stock');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]); // New: Sync global categories

  const t = (en: string, kh: string) => lang === 'kh' ? kh : en;

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en';
    setLang(newLang);
    localStorage.setItem('adminLang', newLang);
  };

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem('adminLang');
    if (storedLang) setLang(storedLang);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchData();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    const settingsDoc = await getDocs(collection(db, 'settings'));
    settingsDoc.forEach((doc) => {
      if (doc.id === 'global') {
        const data = doc.data();
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
        setGlobalCategories(data.categories || []); // Fetch Categories
      }
    });

    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      category: doc.data().category || 'កំប៉ុង', 
      ...doc.data() 
    }));
    productsData.sort((a: any, b: any) => b.createdAt - a.createdAt);
    setProducts(productsData);
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set([...globalCategories, ...products.map(p => p.category || 'កំប៉ុង')]);
    return Array.from(cats);
  }, [products, globalCategories]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Invalid credentials");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        storeName, tagline, taglineKh, telegramHandle, defaultLang,
        logoUrl, logoSize, logoOffsetY, 
        heroImageUrl, heroImageSize 
      }, { merge: true }); // Prevent overwriting categories
      alert(t('Settings Saved Successfully!', 'រក្សាទុកការកំណត់ដោយជោគជ័យ!'));
    } catch (error) {
      console.error("Error saving settings", error);
      alert(t('Error saving settings.', 'មានកំហុសក្នុងការរក្សាទុកការកំណត់។'));
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
    processImage(file, 800, (base64) => { setImageUrl(base64); setIsProcessingImage(false); });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    processImage(file, 400, (base64) => { setLogoUrl(base64); setIsProcessingLogo(false); });
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingHeroImage(true);
    processImage(file, 600, (base64) => { setHeroImageUrl(base64); setIsProcessingHeroImage(false); });
  };

  const addVariant = () => setVariants([...variants, { name: '', price: '' }]);
  const updateVariant = (index: number, field: 'name' | 'price', value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
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
          const result = [];
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

        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = parseRow(lines[0]).map(h => h.toLowerCase());
        
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const descIdx = headers.findIndex(h => h.includes('description'));
        const catIdx = headers.findIndex(h => h.includes('category')); 
        const varIdx = headers.findIndex(h => h.includes('variant'));

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
          const csvCategory = catIdx !== -1 && row[catIdx] ? row[catIdx] : 'កំប៉ុង'; 
          const rawVariants = row[varIdx] || ''; // FIX: Prevent undefined crash

          const parsedVariants = rawVariants.split(',').map(v => {
            const [vName, vPrice] = v.split(':');
            return {
              name: vName ? vName.trim() : 'Standard',
              price: vPrice ? parseFloat(vPrice.trim()) : 0
            };
          }).filter(v => v.name && !isNaN(v.price));

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
            createdAt: new Date().getTime()
          };

          uploadPromises.push(addDoc(collection(db, 'products'), productData));
        }

        await Promise.all(uploadPromises);
        alert(`Successfully imported ${uploadPromises.length} products!`);
        fetchData();
      } catch (error) {
        console.error("CSV Import Error:", error);
        alert("Failed to parse CSV. Ensure it is formatted correctly.");
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
      const finalCategory = category || 'កំប៉ុង';

      // Push new category to Global settings to prevent the Storefront filter bug
      if (!globalCategories.includes(finalCategory)) {
        await setDoc(doc(db, 'settings', 'global'), {
          categories: arrayUnion(finalCategory)
        }, { merge: true });
        setGlobalCategories(prev => [...prev, finalCategory]);
      }

      const formattedVariants = variants.map(v => ({
        name: v.name || 'Standard',
        price: hidePrice ? 0 : (parseFloat(v.price) || 0) // FIX: Prevents NaN in database
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
        status 
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        alert(t('Product Updated!', 'បានធ្វើបច្ចុប្បន្នភាពផលិតផល!'));
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().getTime() });
        alert(t('Product Added!', 'បានបន្ថែមផលិតផល!'));
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product", error);
      alert(t('Error saving product.', 'មានកំហុសក្នុងការរក្សាទុក។'));
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); 
    setProductName(product.name); 
    
    const prodCategory = product.category || 'កំប៉ុង';
    setCategory(prodCategory);
    setIsCustomCategory(!uniqueCategories.includes(prodCategory) && prodCategory !== 'កំប៉ុង');

    setDescription(product.description);
    setDescriptionKh(product.descriptionKh || '');
    
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map((v: any) => ({ name: v.name, price: v.price.toString() })));
    } else {
      setVariants([{ name: 'Standard', price: product.price ? product.price.toString() : '0' }]);
    }
    
    setHidePrice(product.hidePrice || false);
    setImageUrl(product.imageUrl); 
    setStatus(product.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm(t('Are you sure you want to delete this product?', 'តើអ្នកប្រាកដជាចង់លុបផលិតផលនេះទេ?'))) {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    }
  };

  // NEW: Feature to push an item to the top of the Storefront layout
  const handleBumpToTop = async (id: string) => {
    try {
      await updateDoc(doc(db, 'products', id), { createdAt: new Date().getTime() });
      fetchData();
    } catch (error) {
      console.error("Error bumping product", error);
      alert('Failed to reorder item.');
    }
  };

  const resetForm = () => {
    setEditingId(null); 
    setProductName(''); 
    setCategory('កំប៉ុង'); 
    setIsCustomCategory(false);
    setDescription(''); 
    setDescriptionKh(''); 
    setVariants([{ name: 'Standard', price: '' }]); 
    setHidePrice(false); 
    setImageUrl(''); 
    setStatus('in_stock');
  };

  const inputClasses = "w-full p-3.5 rounded-xl bg-stone-50 border border-orange-100/50 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 outline-none dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:border-orange-400 transition-all text-sm";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-orange-400">{t('Loading...', 'កំពុងផ្ទុក...')}</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
        <form onSubmit={handleLogin} className="bg-white dark:bg-stone-900 p-10 rounded-[2rem] shadow-xl shadow-orange-400/5 dark:shadow-none w-full max-w-md border border-orange-50 dark:border-stone-800 relative">
          <div className="absolute top-6 right-6 flex gap-2">
            {mounted && (
              <button type="button" onClick={toggleLang} className="relative overflow-hidden w-9 h-9 rounded-xl text-stone-400 hover:bg-orange-50 hover:text-orange-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-all flex items-center justify-center font-bold text-xs">
                <span className={`absolute transition-all duration-500 ${lang === 'en' ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-75'}`}>EN</span>
                <span className={`absolute transition-all duration-500 ${lang === 'kh' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>KH</span>
              </button>
            )}
            {mounted && (
              <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl text-stone-400 hover:bg-orange-50 hover:text-orange-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-all">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
          <h2 className="text-3xl font-extrabold mb-8 text-center text-stone-800 dark:text-white tracking-tight">{t('Admin Portal', 'វិបផតថលអ្នកគ្រប់គ្រង')}</h2>
          <div className="space-y-4 mb-8">
            <input type="email" placeholder={t('Email address', 'អាសយដ្ឋានអ៊ីមែល')} onChange={(e)=>setEmail(e.target.value)} className={inputClasses} />
            <input type="password" placeholder={t('Password', 'ពាក្យសម្ងាត់')} onChange={(e)=>setPassword(e.target.value)} className={inputClasses} />
          </div>
          <button type="submit" className="w-full bg-orange-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98]">{t('Log In', 'ចូល')}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6 md:p-10 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-50 dark:border-stone-800 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-white">{t('Dashboard Overview', 'ទិដ្ឋភាពទូទៅនៃផ្ទាំងគ្រប់គ្រង')}</h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">{t('Manage your storefront settings and inventory.', 'គ្រប់គ្រងការកំណត់ហាង និងបញ្ជីសារពើភណ្ឌរបស់អ្នក។')}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer relative overflow-hidden flex items-center gap-2 px-5 py-3 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl hover:opacity-90 transition-opacity font-bold text-sm ${isUploadingCsv ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {isUploadingCsv ? t('Importing...', 'កំពុងនាំចូល...') : t('Bulk Import CSV', 'នាំចូល CSV ជាដុំ')}
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" disabled={isUploadingCsv} />
            </label>

            {mounted && (
              <button onClick={toggleLang} className="relative overflow-hidden w-11 h-11 bg-orange-50 text-orange-400 dark:bg-stone-800 dark:text-stone-300 rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors flex items-center justify-center font-bold text-sm">
                <span className={`absolute transition-all duration-500 ${lang === 'en' ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-75'}`}>EN</span>
                <span className={`absolute transition-all duration-500 ${lang === 'kh' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>KH</span>
              </button>
            )}
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 bg-orange-50 text-orange-400 dark:bg-stone-800 dark:text-stone-300 rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              <LogOut className="w-4 h-4" /> {t('Sign Out', 'ចាកចេញ')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-1 h-fit">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg"><Settings className="w-5 h-5 text-orange-400" /></div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">{t('Store Settings', 'ការកំណត់ហាង')}</h2>
            </div>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
              
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('Header Logo', 'ឡូហ្គោខាងលើ')}</label>
                  {logoUrl && <button type="button" onClick={() => setLogoUrl('')} className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {t('Remove', 'លុបចេញ')}</button>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="object-contain w-full h-full p-1" /> : <ImageIcon className="w-6 h-6 text-stone-300" />}
                  </div>
                  <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${isProcessingLogo ? 'bg-orange-100 text-orange-400' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}>
                    <UploadCloud className="w-4 h-4" /> {isProcessingLogo ? t('Processing...', 'កំពុងដំណើរការ...') : t('Upload Logo', 'ផ្ទុកឡើងឡូហ្គោ')}
                    <input type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = '' }} onChange={handleLogoUpload} className="hidden" disabled={isProcessingLogo} />
                  </label>
                </div>
                {logoUrl && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-400 mb-2"><span>{t('Logo Size', 'ទំហំឡូហ្គោ')}</span><span className="text-orange-400">{logoSize}px</span></div>
                      <input type="range" min="20" max="120" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full accent-orange-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-400 mb-2"><span>{t('Vertical Align (Offset)', 'តម្រឹមបញ្ឈរ (Offset)')}</span><span className="text-orange-400">{logoOffsetY}px</span></div>
                      <input type="range" min="-30" max="30" value={logoOffsetY} onChange={(e) => setLogoOffsetY(Number(e.target.value))} className="w-full accent-orange-400" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('Hero Image (Above Title)', 'រូបភាពកណ្តាល (ខាងលើចំណងជើង)')}</label>
                  {heroImageUrl && <button type="button" onClick={() => setHeroImageUrl('')} className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {t('Remove', 'លុបចេញ')}</button>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                    {heroImageUrl ? <img src={heroImageUrl} alt="Hero" className="object-contain w-full h-full p-1" /> : <ImageIcon className="w-6 h-6 text-stone-300" />}
                  </div>
                  <label className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${isProcessingHeroImage ? 'bg-orange-100 text-orange-400' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'}`}>
                    <UploadCloud className="w-4 h-4" /> {isProcessingHeroImage ? t('Processing...', 'កំពុងដំណើរការ...') : t('Upload Hero Image', 'ផ្ទុកឡើងរូបភាពកណ្តាល')}
                    <input type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = '' }} onChange={handleHeroUpload} className="hidden" disabled={isProcessingHeroImage} />
                  </label>
                </div>
                {heroImageUrl && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-stone-400 mb-2"><span>{t('Hero Display Size', 'ទំហំរូបភាពកណ្តាល')}</span><span className="text-orange-400">{heroImageSize}px</span></div>
                    <input type="range" min="40" max="300" value={heroImageSize} onChange={(e) => setHeroImageSize(Number(e.target.value))} className="w-full accent-orange-400" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Store Name', 'ឈ្មោះហាង')}</label>
                <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} className={inputClasses} required />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Tagline (English)', 'ពាក្យស្លោក (អង់គ្លេស)')}</label>
                  <input value={tagline} onChange={(e)=>setTagline(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Tagline (Khmer)', 'ពាក្យស្លោក (ខ្មែរ)')}</label>
                  <input value={taglineKh} onChange={(e)=>setTaglineKh(e.target.value)} className={inputClasses} placeholder={t("Optional", "ជម្រើស")} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Telegram Handle', 'ឈ្មោះ Telegram')}</label>
                <input value={telegramHandle} onChange={(e)=>setTelegramHandle(e.target.value)} placeholder="username" className={inputClasses} required />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Default Store Language', 'ភាសាលំនាំដើមរបស់ហាង')}</label>
                <select value={defaultLang} onChange={(e)=>setDefaultLang(e.target.value)} className={inputClasses}>
                  <option value="en">English (EN)</option>
                  <option value="kh">Khmer (KH)</option>
                </select>
              </div>
              <button type="submit" disabled={isProcessingLogo || isProcessingHeroImage} className="w-full bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 py-3.5 rounded-xl font-bold mt-2 hover:opacity-90 transition-opacity active:scale-[0.98]">{t('Save Settings', 'រក្សាទុកការកំណត់')}</button>
            </form>
          </div>

          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg"><Package className="w-5 h-5 text-orange-400" /></div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">{editingId ? t('Edit Product', 'កែសម្រួលផលិតផល') : t('Add New Product', 'បន្ថែមផលិតផលថ្មី')}</h2>
              </div>
              {editingId && <button onClick={resetForm} className="text-sm font-bold text-stone-400 hover:text-orange-400 transition-colors">{t('Cancel Edit', 'បោះបង់ការកែសម្រួល')}</button>}
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Product Name', 'ឈ្មោះផលិតផល')}</label>
                <input value={productName} onChange={(e)=>setProductName(e.target.value)} className={inputClasses} required />
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
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new_custom" className="font-bold text-orange-500">+ {t('Add New Category', 'បន្ថែមប្រភេទថ្មី')}</option>
                </select>

                {isCustomCategory && (
                  <input 
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={t("Type new category...", "វាយបញ្ចូលប្រភេទថ្មី...")}
                    className={`${inputClasses} mt-3 border-orange-300 ring-2 ring-orange-400/20`}
                    required
                    autoFocus
                  />
                )}
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('Variants & Prices', 'ប្រភេទ និងតម្លៃ')}</label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-orange-400 cursor-pointer transition-colors">
                    <input type="checkbox" checked={hidePrice} onChange={(e) => setHidePrice(e.target.checked)} className="w-3.5 h-3.5 accent-orange-400" />
                    {t('Hide Prices (Ask Seller)', 'លាក់តម្លៃ (សួរអ្នកលក់)')}
                  </label>
                </div>
                
                <div className="space-y-3">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        value={variant.name} 
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)} 
                        placeholder={t("Variant Name (e.g., 30cm, Red)", "ឈ្មោះប្រភេទ (ឧ. 30cm, ក្រហម)")} 
                        className={`${inputClasses} flex-1`} 
                        required 
                      />
                      <div className="relative w-1/3">
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
                  <Plus className="w-4 h-4" /> {t('Add Variant', 'បន្ថែមប្រភេទ')}
                </button>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Product Image', 'រូបភាពផលិតផល')}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder={t("Paste an image URL...", "បិទភ្ជាប់តំណរូបភាព...")} className={`${inputClasses} flex-1`} required />
                  <div className="flex items-center justify-center font-bold text-stone-400 text-sm px-2">{t('OR', 'ឬ')}</div>
                  <label className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isProcessingImage ? 'bg-orange-100 text-orange-400' : 'bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300'}`}>
                    <UploadCloud className="w-5 h-5" /> {isProcessingImage ? t('Processing...', 'កំពុងដំណើរការ...') : t('Upload Local File', 'ផ្ទុកឡើងឯកសារ')}
                    <input type="file" accept="image/*" onClick={(e) => { (e.target as HTMLInputElement).value = '' }} onChange={handleProductImageUpload} className="hidden" disabled={isProcessingImage}/>
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-orange-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 shadow-sm">
                      <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" loading="lazy" />
                    </div>
                    <p className="text-xs text-stone-500 font-medium">{t('Image preview ready.', 'រូបភាពត្រៀមរួចរាល់។')}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Description (English)', 'ការពិពណ៌នា (អង់គ្លេស)')}</label>
                  <textarea value={description} rows={3} onChange={(e)=>setDescription(e.target.value)} className={`${inputClasses} resize-none`} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Description (Khmer)', 'ការពិពណ៌នា (ខ្មែរ)')}</label>
                  <textarea value={descriptionKh} rows={3} onChange={(e)=>setDescriptionKh(e.target.value)} className={`${inputClasses} resize-none`} placeholder={t("Optional", "ជម្រើស")} />
                </div>
              </div>
              
              <div className="md:col-span-2 flex flex-col md:flex-row gap-5 items-end">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t('Stock Status', 'ស្ថានភាពស្តុក')}</label>
                  <select value={status} onChange={(e)=>setStatus(e.target.value)} className={inputClasses}>
                    <option value="in_stock">{t('In Stock', 'មានក្នុងស្តុក')}</option>
                    <option value="out_of_stock">{t('Out of Stock', 'អស់ពីស្តុក')}</option>
                    <option value="check_seller">{t('Ask Seller', 'សាកសួរអ្នកលក់')}</option>
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

        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-orange-50 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/50">
            <h2 className="text-xl font-bold text-stone-800 dark:text-white">{t('Inventory Management', 'ការគ្រប់គ្រងបញ្ជីសារពើភណ្ឌ')}</h2>
            <span className="bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 py-1.5 px-4 rounded-full text-sm font-bold">{products.length} {t('Items', 'ទំនិញ')}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold">{t('Product', 'ផលិតផល')}</th>
                  <th className="px-6 py-5 font-bold">{t('Category', 'ប្រភេទ')}</th>
                  <th className="px-6 py-5 font-bold">{t('Variants & Prices', 'ប្រភេទ និងតម្លៃ')}</th>
                  <th className="px-6 py-5 font-bold">{t('Status', 'ស្ថានភាព')}</th>
                  <th className="px-6 py-5 font-bold text-right">{t('Actions', 'សកម្មភាព')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400 font-medium">{t('No products found. Add one above!', 'រកមិនឃើញផលិតផលទេ។ បន្ថែមមួយខាងលើ!')}</td></tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-orange-50/30 dark:hover:bg-stone-800/30 transition-colors group">
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
                          {product.category || 'កំប៉ុង'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {product.hidePrice ? (
                          <span className="text-stone-400 text-sm font-bold bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">{t('Hidden', 'លាក់')}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {product.variants && product.variants.length > 0 ? (
                              product.variants.map((v: any, i: number) => (
                                <span key={i} className="text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-stone-800 dark:text-orange-400 px-2 py-1 rounded-lg">
                                  {v.name}: ${parseFloat(v.price).toFixed(2)}
                                </span>
                              ))
                            ) : (
                              <span className="font-extrabold text-stone-800 dark:text-white">${parseFloat(product.price).toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold inline-block
                          ${product.status === 'in_stock' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                            product.status === 'out_of_stock' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 
                            'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                          {product.status === 'in_stock' ? t('In Stock', 'មានក្នុងស្តុក') : 
                           product.status === 'out_of_stock' ? t('Out of Stock', 'អស់ពីស្តុក') : 
                           t('Ask Seller', 'សាកសួរអ្នកលក់')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {/* NEW BUMP TO TOP BUTTON */}
                          <button onClick={() => handleBumpToTop(product.id)} className="p-2.5 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-stone-800 rounded-xl transition-colors" title={t('Move to Top', 'រុញទៅលើគេ')}>
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          
                          <button onClick={() => handleEditClick(product)} className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-xl transition-colors" title={t('Edit', 'កែសម្រួល')}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title={t('Delete', 'លុប')}>
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