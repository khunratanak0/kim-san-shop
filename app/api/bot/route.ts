import { NextResponse } from 'next/server';
import { Telegraf, Markup } from 'telegraf';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore';

const ADMIN_ID = 2014829368; // Your verified Telegram ID

// Define chronological order of steps for the back button
const STEPS_ORDER = ['NAME', 'CATEGORY', 'PRICE', 'DESCRIPTION', 'IMAGE', 'CONFIRM'];

export async function POST(req: Request) {
  try {
    const token = process.env.BOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Token missing" }, { status: 500 });

    const bot = new Telegraf(token);
    const body = await req.json();

    // 1. Intercept incoming user info to look up or initialize session state
    const tgUser = body.message?.from || body.callback_query?.from;
    if (!tgUser || tgUser.id !== ADMIN_ID) {
      return NextResponse.json({ ok: true }); // Ignore unauthorized users silently
    }

    const sessionRef = doc(db, 'botSessions', String(ADMIN_ID));
    const sessionSnap = await getDoc(sessionRef);
    let session = sessionSnap.exists() ? sessionSnap.data() : { step: 'IDLE', data: {} };

    // Helper to change steps and update database
    const goToStep = async (ctx: any, nextStep: string, promptText: string, extraMenu?: any) => {
      await setDoc(sessionRef, { step: nextStep, data: session.data }, { merge: true });
      if (extraMenu) {
        return ctx.reply(promptText, extraMenu);
      } else {
        // Default menu with Go Back & Cancel buttons
        return ctx.reply(promptText, Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Go Back', 'action_back'), Markup.button.callback('❌ Cancel', 'action_cancel')]
        ]));
      }
    };

    // 2. Setup Bot Command Handlers
    bot.command('start', async (ctx) => {
      await deleteDoc(sessionRef);
      return ctx.reply('🛒 Lazy Admin Bot Active!\n\nUse /add to start adding a product step-by-step.');
    });

    bot.command('cancel', async (ctx) => {
      await deleteDoc(sessionRef);
      return ctx.reply('🚫 Add process cancelled. Back to idle.');
    });

    bot.command('add', async (ctx) => {
      session.data = {}; // Reset data
      return goToStep(ctx, 'NAME', '📝 Step 1: Enter the **Product Name**:');
    });

    // 3. Handle Generic Action Clicks (Back / Cancel / Confirm)
    bot.action('action_cancel', async (ctx) => {
      await deleteDoc(sessionRef);
      await ctx.answerCbQuery();
      return ctx.reply('🚫 Add process cancelled.');
    });

    bot.action('action_back', async (ctx) => {
      await ctx.answerCbQuery();
      const currentIdx = STEPS_ORDER.indexOf(session.step);
      if (currentIdx <= 0) {
        await deleteDoc(sessionRef);
        return ctx.reply('Back to main menu. Use /add to start over.');
      }

      const prevStep = STEPS_ORDER[currentIdx - 1];
      session.step = prevStep; // Mutate local reference for prompt routing below
      
      // Trigger appropriate retro-prompts depending on where they backed up to
      if (prevStep === 'NAME') {
        return goToStep(ctx, 'NAME', '📝 Step 1: Re-enter the **Product Name**:');
      } else if (prevStep === 'CATEGORY') {
        return sendCategoryPrompt(ctx);
      } else if (prevStep === 'PRICE') {
        return goToStep(ctx, 'PRICE', '💰 Step 3: Re-enter the **Price** (numbers only):');
      } else if (prevStep === 'DESCRIPTION') {
        return goToStep(ctx, 'DESCRIPTION', '✍️ Step 4: Re-enter the **Description**:');
      } else if (prevStep === 'IMAGE') {
        return goToStep(ctx, 'IMAGE', '🖼️ Step 5: Please upload/send the **Product Image** again:');
      }
    });

    // Helper to generate categories menu
    const sendCategoryPrompt = async (ctx: any) => {
      const globalSettings = await getDoc(doc(db, 'settings', 'global'));
      const categories: string[] = globalSettings.exists() ? (globalSettings.data().categories || []) : [];
      
      // Build inline rows out of existing website categories
      const buttons = categories.map(cat => [Markup.button.callback(cat, `cat_${cat}`)]);
      buttons.push([Markup.button.callback('⬅️ Go Back', 'action_back'), Markup.button.callback('❌ Cancel', 'action_cancel')]);

      return goToStep(ctx, 'CATEGORY', '📁 Step 2: Select a **Category** from your website menu below, or type a brand new one directly into the chat:', Markup.inlineKeyboard(buttons));
    };

    bot.action(/^cat_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const selectedCategory = ctx.match[1];
      session.data.category = selectedCategory;
      await setDoc(sessionRef, session);
      return goToStep(ctx, 'PRICE', '💰 Step 3: Enter the **Price** (e.g., 24.50):');
    });

    bot.action('action_save_product', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('⏳ Writing data and logging access sessions securely...');
      
      try {
        await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL as string, process.env.ADMIN_PASSWORD as string);
        
        const snapshot = await getDocs(collection(db, 'products'));
        const finalProduct = {
          name: session.data.name,
          category: session.data.category,
          price: session.data.price,
          description: session.data.description,
          descriptionKh: '',
          imageUrl: session.data.imageUrl,
          status: 'in_stock',
          hidePrice: false,
          manualOrder: snapshot.size,
          variants: [{ name: 'Standard', price: session.data.price }],
          createdAt: Date.now()
        };

        await addDoc(collection(db, 'products'), finalProduct);
        
        await addDoc(collection(db, 'activityLogs'), {
          admin: 'Telegram Wizard',
          action: 'Added Product',
          target: finalProduct.name,
          details: `Category: ${finalProduct.category}, Price: $${finalProduct.price}`,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });

        if (finalProduct.category) {
          await setDoc(doc(db, 'settings', 'global'), { categories: arrayUnion(finalProduct.category) }, { merge: true });
        }

        await deleteDoc(sessionRef);
        return ctx.reply(`🎉 Success! *${finalProduct.name}* has been added to your website inventory!`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        return ctx.reply(`❌ Database Transaction Failed: ${err.message}`);
      }
    });

    // 4. Fallback Incoming Message Core Processor (Text inputs or Image files)
    bot.on('message', async (ctx: any) => {
      // Catch standard native commands immediately to bypass pipeline intercepts
      const msgText = ctx.message?.text || '';
      if (msgText.startsWith('/')) return; 

      if (session.step === 'NAME') {
        session.data.name = msgText.trim();
        await setDoc(sessionRef, session);
        return sendCategoryPrompt(ctx);
      } 
      
      else if (session.step === 'CATEGORY') {
        session.data.category = msgText.trim();
        await setDoc(sessionRef, session);
        return goToStep(ctx, 'PRICE', '💰 Step 3: Enter the **Price** (e.g., 15.00):');
      } 
      
      else if (session.step === 'PRICE') {
        const cleanPrice = parseFloat(msgText.replace('$', '').trim());
        if (isNaN(cleanPrice)) {
          return ctx.reply('⚠️ Invalid price! Please enter a valid number (e.g. 12 or 19.99):');
        }
        session.data.price = cleanPrice;
        await setDoc(sessionRef, session);
        return goToStep(ctx, 'DESCRIPTION', '✍精度 Step 4: Enter the **Product Description**:');
      } 
      
      else if (session.step === 'DESCRIPTION') {
        session.data.description = msgText.trim();
        await setDoc(sessionRef, session);
        return goToStep(ctx, 'IMAGE', '🖼️ Step 5: Tap the attachment clip 📎 or camera icon and **send a Photo** of the product directly to this chat:');
      } 
      
      else if (session.step === 'IMAGE') {
        const photoArray = ctx.message?.photo;
        if (!photoArray || photoArray.length === 0) {
          return ctx.reply('⚠️ That was not a photo! Please upload or snap an actual image file:');
        }

        await ctx.reply('⚡ Media received! Streaming secure buffers directly to Cloudinary servers...');
        
        try {
          // Get the highest resolution image object from array
          const largestPhoto = photoArray[photoArray.length - 1];
          const fileLinkObj = await bot.telegram.getFileLink(largestPhoto.file_id);
          const telegramDirectUrl = fileLinkObj.toString();

          // Stream straight to Cloudinary using basic built-in fetch structure
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          const formData = new FormData();
          formData.append('file', telegramDirectUrl);
          formData.append('upload_preset', 'kimsan285');

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadData.secure_url) {
            throw new Error(uploadData.error?.message || "Cloudinary upload rejection.");
          }

          session.data.imageUrl = uploadData.secure_url;
          session.step = 'CONFIRM';
          await setDoc(sessionRef, session);

          // Render summary display screen
          const summaryMarkdown = 
            `🔎 *Review Your Product Details* 🔎\n\n` +
            `📛 *Name:* ${session.data.name}\n` +
            `📁 *Category:* ${session.data.category}\n` +
            `💰 *Price:* $${session.data.price.toFixed(2)}\n` +
            `✍️ *Description:* ${session.data.description}\n\n` +
            `🖼️ *Image Uploaded successfully to Cloudinary!*`;

          return ctx.replyWithPhoto(session.data.imageUrl, {
            caption: summaryMarkdown,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Confirm & Publish to Store', 'action_save_product')],
              [Markup.button.callback('⬅️ Go Back', 'action_back'), Markup.button.callback('❌ Cancel', 'action_cancel')]
            ])
          });

        } catch (uploadError: any) {
          console.error("Cloudinary Engine Fault:", uploadError);
          return ctx.reply(`❌ Cloudinary Upload Failed: ${uploadError.message}. Please send the image again:`);
        }
      }
    });

    // 5. Execute Webhook Runtime engine update iteration loop pass
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Critical webhook processing error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}