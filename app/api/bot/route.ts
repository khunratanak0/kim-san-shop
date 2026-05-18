import { NextResponse } from 'next/server';
import { Telegraf, Markup } from 'telegraf';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const ADMIN_ID = 2014829368; // Your verified Telegram ID
const STEPS_ORDER = ['NAME', 'CATEGORY', 'PRICE', 'DESCRIPTION', 'IMAGE', 'CONFIRM'];

export async function POST(req: Request) {
  try {
    const token = process.env.BOT_TOKEN;
    if (!token) return NextResponse.json({ error: "Token missing" }, { status: 500 });

    const adminDb = getAdminDb();
    const bot = new Telegraf(token);
    const body = await req.json();

    // Intercept incoming user info
    const tgUser = body.message?.from || body.callback_query?.from;
    if (!tgUser || tgUser.id !== ADMIN_ID) {
      return NextResponse.json({ ok: true }); // Ignore unauthorized users
    }

    const sessionRef = adminDb.collection('botSessions').doc(String(ADMIN_ID));
    const sessionSnap = await sessionRef.get();
    let session = sessionSnap.exists ? (sessionSnap.data() as any) : { step: 'IDLE', data: {} };

    // Helper to change steps
    const goToStep = async (ctx: any, nextStep: string, promptText: string, extraMenu?: any) => {
      await sessionRef.set({ step: nextStep, data: session.data }, { merge: true });
      if (extraMenu) {
        return ctx.reply(promptText, extraMenu);
      } else {
        return ctx.reply(promptText, Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Go Back', 'action_back'), Markup.button.callback('❌ Cancel', 'action_cancel')]
        ]));
      }
    };

    // Command Handlers
    bot.command('start', async (ctx) => {
      await sessionRef.delete();
      return ctx.reply('🛒 Lazy Admin Bot Active!\n\nUse /add to start adding a product step-by-step.');
    });

    bot.command('cancel', async (ctx) => {
      await sessionRef.delete();
      return ctx.reply('🚫 Add process cancelled. Back to idle.');
    });

    bot.command('add', async (ctx) => {
      session.data = {};
      return goToStep(ctx, 'NAME', '📝 Step 1: Enter the **Product Name**:');
    });

    // Inline Button Actions
    bot.action('action_cancel', async (ctx) => {
      await sessionRef.delete();
      await ctx.answerCbQuery();
      return ctx.reply('🚫 Add process cancelled.');
    });

    bot.action('action_back', async (ctx) => {
      await ctx.answerCbQuery();
      const currentIdx = STEPS_ORDER.indexOf(session.step);
      if (currentIdx <= 0) {
        await sessionRef.delete();
        return ctx.reply('Back to main menu. Use /add to start over.');
      }

      const prevStep = STEPS_ORDER[currentIdx - 1];
      session.step = prevStep;

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

    const sendCategoryPrompt = async (ctx: any) => {
      const globalSettings = await adminDb.collection('settings').doc('global').get();
      const categories: string[] = globalSettings.exists ? (globalSettings.data()?.categories || []) : [];

      const buttons = categories.map((cat: string) => [Markup.button.callback(cat, `cat_${cat}`)]);
      buttons.push([Markup.button.callback('⬅️ Go Back', 'action_back'), Markup.button.callback('❌ Cancel', 'action_cancel')]);

      return goToStep(ctx, 'CATEGORY', '📁 Step 2: Select a **Category** below, or type a brand new one directly into the chat:', Markup.inlineKeyboard(buttons));
    };

    bot.action(/^cat_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const selectedCategory = ctx.match[1];
      session.data.category = selectedCategory;
      await sessionRef.set(session);
      return goToStep(ctx, 'PRICE', '💰 Step 3: Enter the **Price** (e.g., 24.50):');
    });

    bot.action('action_save_product', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('⏳ Saving product to your website dashboard...');

      try {
        const snapshot = await adminDb.collection('products').get();
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

        await adminDb.collection('products').add(finalProduct);

        await adminDb.collection('activityLogs').add({
          admin: 'Telegram Wizard',
          action: 'Added Product',
          target: finalProduct.name,
          details: `Category: ${finalProduct.category}, Price: $${finalProduct.price}`,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });

        if (finalProduct.category) {
          await adminDb.collection('settings').doc('global').set(
            { categories: FieldValue.arrayUnion(finalProduct.category) },
            { merge: true }
          );
        }

        await sessionRef.delete();
        return ctx.reply(`🎉 Success! *${finalProduct.name}* has been published to your store!`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        return ctx.reply(`❌ Database Transaction Failed: ${err.message}`);
      }
    });

    // Message Processing Pipeline (Text inputs & Images)
    bot.on('message', async (ctx: any) => {
      const msgText = ctx.message?.text || '';
      if (msgText.startsWith('/')) return;

      if (session.step === 'NAME') {
        session.data.name = msgText.trim();
        await sessionRef.set(session);
        return sendCategoryPrompt(ctx);
      }

      else if (session.step === 'CATEGORY') {
        session.data.category = msgText.trim();
        await sessionRef.set(session);
        return goToStep(ctx, 'PRICE', '💰 Step 3: Enter the **Price** (e.g., 15.00):');
      }

      else if (session.step === 'PRICE') {
        const cleanPrice = parseFloat(msgText.replace('$', '').trim());
        if (isNaN(cleanPrice)) {
          return ctx.reply('⚠️ Invalid price! Please enter a valid number (e.g. 12 or 19.99):');
        }
        session.data.price = cleanPrice;
        await sessionRef.set(session);
        return goToStep(ctx, 'DESCRIPTION', '✍️ Step 4: Enter the **Product Description**:');
      }

      else if (session.step === 'DESCRIPTION') {
        session.data.description = msgText.trim();
        await sessionRef.set(session);
        return goToStep(ctx, 'IMAGE', '🖼️ Step 5: Send or upload a **Photo** of the product directly to this chat:');
      }

      else if (session.step === 'IMAGE') {
        const photoArray = ctx.message?.photo;
        if (!photoArray || photoArray.length === 0) {
          return ctx.reply('⚠️ That was not a photo! Please upload or snap an actual image file:');
        }

        await ctx.reply('⚡ Photo received! Uploading directly to Cloudinary...');

        try {
          const largestPhoto = photoArray[photoArray.length - 1];
          const fileLinkObj = await bot.telegram.getFileLink(largestPhoto.file_id);
          const telegramDirectUrl = fileLinkObj.toString();

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
          await sessionRef.set(session);

          const summaryMarkdown =
            `🔎 *Review Your Product Details* 🔎\n\n` +
            `📛 *Name:* ${session.data.name}\n` +
            `📁 *Category:* ${session.data.category}\n` +
            `💰 *Price:* $${session.data.price.toFixed(2)}\n` +
            `✍️ *Description:* ${session.data.description}\n\n` +
            `🖼️ *Image uploaded safely to Cloudinary!*`;

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
          return ctx.reply(`❌ Cloudinary Upload Failed: ${uploadError.message}. Please try sending the image again:`);
        }
      }
    });

    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Critical webhook processing error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}