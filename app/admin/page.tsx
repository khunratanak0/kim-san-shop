'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Settings State
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');

  // Product Form State
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('in_stock');
  
  // Inventory State
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchData();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    // Fetch Settings
    const settingsDoc = await getDocs(collection(db, 'settings'));
    settingsDoc.forEach((doc) => {
      if (doc.id === 'global') {
        const data = doc.data();
        setStoreName(data.storeName || '');
        setTagline(data.tagline || '');
        setTelegramHandle(data.telegramHandle || '');
      }
    });

    // Fetch Products
    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      await setDoc(doc(db, 'settings', 'global'), {
        storeName,
        tagline,
        telegramHandle
      });
      alert('Settings Saved Successfully!');
    } catch (error) {
      console.error("Error saving settings", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        name: productName,
        description,
        price: parseFloat(price),
        imageUrl,
        status,
        createdAt: new Date().getTime(),
      });
      alert('Product Added!');
      setProductName(''); setDescription(''); setPrice(''); setImageUrl('');
      fetchData(); // Refresh table
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-96 border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Admin Login</h2>
          <input type="email" placeholder="Email" onChange={(e)=>setEmail(e.target.value)} className="w-full mb-4 p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} className="w-full mb-6 p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          <button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-medium">Log In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button onClick={() => signOut(auth)} className="text-red-500 font-medium hover:underline">Sign Out</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Global Settings Form */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-4">Store Settings</h2>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="Store Name" className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent" required />
              <input value={tagline} onChange={(e)=>setTagline(e.target.value)} placeholder="Tagline / Subtitle" className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent" required />
              <input value={telegramHandle} onChange={(e)=>setTelegramHandle(e.target.value)} placeholder="Telegram Handle (no @)" className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent" required />
              <button type="submit" className="bg-black text-white dark:bg-white dark:text-black py-2 rounded-lg font-medium mt-2">Update Settings</button>
            </form>
          </div>

          {/* Add Product Form */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={productName} placeholder="Product Name" onChange={(e)=>setProductName(e.target.value)} className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent" required />
              <input value={price} type="number" step="0.01" placeholder="Price" onChange={(e)=>setPrice(e.target.value)} className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent" required />
              <input value={imageUrl} placeholder="Image URL" onChange={(e)=>setImageUrl(e.target.value)} className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent md:col-span-2" required />
              <textarea value={description} placeholder="Short Description" onChange={(e)=>setDescription(e.target.value)} className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent md:col-span-2" required />
              <select value={status} onChange={(e)=>setStatus(e.target.value)} className="p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-transparent">
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="check_seller">Check with Seller</option>
              </select>
              <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium py-3">Save Product</button>
            </form>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Current Inventory</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Image</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-3"><img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md bg-gray-100" /></td>
                  <td className="py-3 font-medium">{product.name}</td>
                  <td className="py-3">${product.price}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">{product.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}