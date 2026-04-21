'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Form State
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('in_stock');
  
  // Products State
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchProducts();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(items);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Invalid credentials. Make sure you added this user in Firebase Auth.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        name: productName,
        price: parseFloat(price),
        status: status,
        createdAt: new Date(),
        imageUrl: "https://via.placeholder.com/400" // Placeholder for now
      });
      alert('Product Added!');
      fetchProducts(); // Refresh the table
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="p-8 border rounded-xl w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">Admin Login</h2>
          <input type="email" placeholder="Email" onChange={(e)=>setEmail(e.target.value)} className="p-3 border rounded-lg text-black" required />
          <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} className="p-3 border rounded-lg text-black" required />
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg">Log In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Kim San Shop - Admin</h1>
        <button onClick={() => signOut(auth)} className="text-red-500">Sign Out</button>
      </div>

      <form onSubmit={handleAddProduct} className="p-6 border rounded-xl grid grid-cols-1 gap-4 mb-8">
        <h2 className="text-xl font-bold">Add Product</h2>
        <input placeholder="Product Name" onChange={(e)=>setProductName(e.target.value)} className="p-3 border rounded-lg text-black" required />
        <input type="number" placeholder="Price" onChange={(e)=>setPrice(e.target.value)} className="p-3 border rounded-lg text-black" required />
        <select onChange={(e)=>setStatus(e.target.value)} className="p-3 border rounded-lg text-black">
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <button type="submit" className="bg-black text-white dark:bg-white dark:text-black p-3 rounded-lg">Save Product</button>
      </form>

      <h2 className="text-xl font-bold mb-4">Current Inventory</h2>
      <div className="flex flex-col gap-2">
        {products.map(product => (
          <div key={product.id} className="p-4 border rounded-lg flex justify-between">
            <span>{product.name}</span>
            <span>${product.price} ({product.status})</span>
          </div>
        ))}
      </div>
    </div>
  );
}