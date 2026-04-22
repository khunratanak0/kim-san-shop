'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Trash2, Edit, Plus, Settings, LogOut, Package, Sun, Moon, UploadCloud } from 'lucide-react'; 

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('in_stock');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
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
        setTelegramHandle(data.telegramHandle || '');
      }
    });

    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    productsData.sort((a: any, b: any) => b.createdAt - a.createdAt);
    setProducts(productsData);
  };

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
      await setDoc(doc(db, 'settings', 'global'), { storeName, tagline, telegramHandle });
      alert('Settings Saved Successfully!');
    } catch (error) {
      console.error("Error saving settings", error);
    }
  };

  // --- NEW: Magic Base64 Image Compressor ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Keeps quality high but file size low
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only resize if the image is larger than MAX_WIDTH
        if (img.width > MAX_WIDTH) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to Base64 Text (JPEG format, 80% quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setImageUrl(compressedBase64);
        setIsProcessingImage(false);
      };
    };
    reader.readAsDataURL(file);
  };
  // ------------------------------------------

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: productName,
        description,
        price: parseFloat(price),
        imageUrl,
        status,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        alert('Product Updated!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().getTime(),
        });
        alert('Product Added!');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving product", error);
      alert("Error saving product. The image might be too large.");
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setProductName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImageUrl(product.imageUrl);
    setStatus(product.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setProductName(''); setDescription(''); setPrice(''); setImageUrl(''); setStatus('in_stock');
  };

  const inputClasses = "w-full p-3.5 rounded-xl bg-stone-50 border border-orange-100/50 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 outline-none dark:bg-stone-950 dark:border-stone-800 dark:text-white dark:focus:border-orange-400 transition-all text-sm";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-orange-400">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
        <form onSubmit={handleLogin} className="bg-white dark:bg-stone-900 p-10 rounded-[2rem] shadow-xl shadow-orange-400/5 dark:shadow-none w-full max-w-md border border-orange-50 dark:border-stone-800 relative">
          {mounted && (
            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-6 right-6 p-2 rounded-xl text-stone-400 hover:bg-orange-50 hover:text-orange-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-all">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <h2 className="text-3xl font-extrabold mb-8 text-center text-stone-800 dark:text-white tracking-tight">Admin Portal</h2>
          <div className="space-y-4 mb-8">
            <input type="email" placeholder="Email address" onChange={(e)=>setEmail(e.target.value)} className={inputClasses} />
            <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} className={inputClasses} />
          </div>
          <button type="submit" className="w-full bg-orange-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98]">Log In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6 md:p-10 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300 selection:bg-orange-200 selection:text-orange-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-50 dark:border-stone-800 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-800 dark:text-white">Dashboard Overview</h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">Manage your storefront settings and inventory.</p>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 bg-orange-50 text-orange-400 dark:bg-stone-800 dark:text-stone-300 rounded-xl hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Settings Column */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-1 h-fit">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                <Settings className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Store Settings</h2>
            </div>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Store Name</label>
                <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} className={inputClasses} required />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Tagline</label>
                <input value={tagline} onChange={(e)=>setTagline(e.target.value)} className={inputClasses} required />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Telegram Handle</label>
                <input value={telegramHandle} onChange={(e)=>setTelegramHandle(e.target.value)} placeholder="username" className={inputClasses} required />
              </div>
              <button type="submit" className="w-full bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 py-3.5 rounded-xl font-bold mt-4 hover:opacity-90 transition-opacity active:scale-[0.98]">Save Settings</button>
            </form>
          </div>

          {/* Product Form Column */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 xl:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-stone-800 rounded-lg">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              {editingId && (
                <button onClick={resetForm} className="text-sm font-bold text-stone-400 hover:text-orange-400 transition-colors">Cancel Edit</button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Product Name</label>
                <input value={productName} onChange={(e)=>setProductName(e.target.value)} className={inputClasses} required />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Price ($)</label>
                <input value={price} type="number" step="0.01" onChange={(e)=>setPrice(e.target.value)} className={inputClasses} required />
              </div>
              
              {/* NEW: Updated Image Input Area */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Product Image</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={imageUrl} 
                    onChange={(e)=>setImageUrl(e.target.value)} 
                    placeholder="Paste an image URL..." 
                    className={`${inputClasses} flex-1`} 
                    required 
                  />
                  <div className="flex items-center justify-center font-bold text-stone-400 text-sm px-2">OR</div>
                  <label className={`cursor-pointer flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isProcessingImage ? 'bg-orange-100 text-orange-400' : 'bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300'}`}>
                    <UploadCloud className="w-5 h-5" />
                    {isProcessingImage ? 'Processing...' : 'Upload Local File'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      disabled={isProcessingImage}
                    />
                  </label>
                </div>
                
                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-orange-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 shadow-sm">
                      <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                    <p className="text-xs text-stone-500 font-medium">Image preview ready.</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Description</label>
                <textarea value={description} rows={3} onChange={(e)=>setDescription(e.target.value)} className={`${inputClasses} resize-none`} required />
              </div>
              <div className="md:col-span-2 flex flex-col md:flex-row gap-5 items-end">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Stock Status</label>
                  <select value={status} onChange={(e)=>setStatus(e.target.value)} className={inputClasses}>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="check_seller">Check with Seller</option>
                  </select>
                </div>
                <button type="submit" disabled={isProcessingImage} className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-orange-400 text-white rounded-xl font-bold py-3.5 hover:bg-orange-500 shadow-lg shadow-orange-400/20 transition-all active:scale-[0.98] disabled:opacity-50">
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Enhanced Inventory Table */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-orange-50 dark:border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-orange-50 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/50">
            <h2 className="text-xl font-bold text-stone-800 dark:text-white">Inventory Management</h2>
            <span className="bg-orange-50 dark:bg-stone-800 text-orange-500 dark:text-orange-400 py-1.5 px-4 rounded-full text-sm font-bold">{products.length} Items</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-950 text-stone-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold">Product</th>
                  <th className="px-6 py-5 font-bold">Price</th>
                  <th className="px-6 py-5 font-bold">Status</th>
                  <th className="px-6 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {products.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-medium">No products found. Add one above!</td></tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-orange-50/30 dark:hover:bg-stone-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-2xl border border-stone-100 dark:border-stone-700 bg-white" />
                          <div>
                            <div className="font-bold text-stone-800 dark:text-white mb-1">{product.name}</div>
                            <div className="text-xs text-stone-400 max-w-[250px] truncate">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-extrabold text-stone-800 dark:text-white">${parseFloat(product.price).toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold inline-block
                          ${product.status === 'in_stock' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                            product.status === 'out_of_stock' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 
                            'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                          {product.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(product)} className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-xl transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete">
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