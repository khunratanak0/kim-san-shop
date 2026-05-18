import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc, arrayUnion } from 'firebase/firestore';

const bot = new Telegraf(process.env.BOT_TOKEN as string);
const ADMIN_ID = 2014829368; // <-- REPLACE THIS WITH YOUR TELEGRAM ID NUMBER

bot.command('start', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('Lazy Admin Bot ready! 🚀\n\nSend /add followed by your product details on new lines.');
});

bot.command('add', async (ctx) => {
  // Security check: Only you can run this
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('Unauthorized');

  const text = ctx.message.text?.replace('/add', '').trim();
  if (!text) return ctx.reply('⚠️ Please provide the product details.');

  // Set up the default product structure
  const lines = text.split('\n');
  const product: any = { 
    status: 'in_stock', 
    variants: [], 
    hidePrice: false,
    createdAt: Date.now() 
  };

  // Read the message line by line
  lines.forEach(line => {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) return;
    
    const value = rest.join(':').trim();
    const k = key.trim().toLowerCase();

    if (k === 'name') product.name = value;
    if (k === 'category') product.category = value;
    if (k === 'price') {
      product.price = parseFloat(value) || 0;
      product.variants = [{ name: 'Standard', price: product.price }];
    }
    if (k === 'status') product.status = value;
    if (k === 'image') product.imageUrl = value;
    if (k === 'description') product.description = value;
  });

  if (!product.name) return ctx.reply('❌ Name is required!');

  try {
    ctx.reply('⏳ Adding product to your website...');

    // Log into Firebase in the background using your normal admin credentials
    await signInWithEmailAndPassword(
      auth, 
      process.env.ADMIN_EMAIL as string, 
      process.env.ADMIN_PASSWORD as string
    );

    // Get order number so it sorts correctly on your site
    const snapshot = await getDocs(collection(db, 'products'));
    product.manualOrder = snapshot.size;

    // Save product to database
    await addDoc(collection(db, 'products'), product);

    // Add it to your Activity Logs so you see it in the dashboard
    await addDoc(collection(db, 'activityLogs'), {
      admin: 'Telegram Bot',
      action: 'Added Product',
      target: product.name,
      details: `Price: $${product.price || 'Hidden'}`,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    });

    // Update global categories if this is a brand new category
    if (product.category) {
      await setDoc(doc(db, 'settings', 'global'), {
        categories: arrayUnion(product.category)
      }, { merge: true });
    }

    ctx.reply(`✅ Successfully added *${product.name}* to the store!`, { parse_mode: 'Markdown' });
  } catch (error: any) {
    ctx.reply(`❌ Error: ${error.message}`);
  }
});

// This turns your Next.js route into the Telegram Webhook listener
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false });
  }
}