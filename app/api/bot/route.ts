import { NextResponse } from 'next/server';
import { Telegraf, Markup } from 'telegraf';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { bilingual, bilingualShort, t } from '@/lib/translations';

const MASTER_ADMIN_ID = 2014829368;
const STEPS_ORDER = ['NAME', 'CATEGORY', 'PRICE', 'DESCRIPTION', 'IMAGE', 'VARIANTS', 'CONFIRM'];

// In-memory cache of authorized admin IDs, refreshed on settings change
let cachedAdmins: number[] | null = null;
async function getAdmins(db: Firestore): Promise<number[]> {
  if (cachedAdmins) return cachedAdmins;
  const snap = await db.collection('settings').doc('global').get();
  const stored = snap.exists ? (snap.data()?.admins || []) : [];
  cachedAdmins = [MASTER_ADMIN_ID, ...stored];
  return cachedAdmins;
}
function bustAdminCache() { cachedAdmins = null; }

export async function GET() {
  const token = process.env.BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: 'BOT_TOKEN missing' }, { status: 500 });
  try {
    const bot = new Telegraf(token);
    const botInfo = await bot.telegram.getMe();
    return NextResponse.json({ ok: true, bot: botInfo.username });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = process.env.BOT_TOKEN;
    if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 500 });

    const adminDb = getAdminDb();
    const bot = new Telegraf(token);
    const body = await req.json();

    const tgUser = body.message?.from || body.callback_query?.from;
    if (!tgUser) return NextResponse.json({ ok: true });

    const admins = await getAdmins(adminDb);
    if (!admins.includes(tgUser.id)) {
      return NextResponse.json({ ok: true });
    }

    const userId = String(tgUser.id);
    const userName = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '') + (tgUser.username ? ` (@${tgUser.username})` : '');

    const sessionRef = adminDb.collection('botSessions').doc(userId);
    const sessionSnap = await sessionRef.get();
    let session = sessionSnap.exists ? (sessionSnap.data() as any) : { step: 'IDLE', data: {} };

    const goToStep = async (ctx: any, nextStep: string, promptKey: keyof typeof import('@/lib/translations')['T'], vars?: Record<string, string | number>, extraMenu?: any) => {
      await sessionRef.set({ step: nextStep, data: session.data }, { merge: true });
      const text = bilingual(promptKey, vars);
      if (extraMenu) {
        return ctx.reply(text, extraMenu);
      }
      return ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback(bilingualShort('btn_back'), 'action_back'), Markup.button.callback(bilingualShort('btn_cancel'), 'action_cancel')]
      ]));
    };

    // ---- Commands ----
    bot.command('start', async (ctx: any) => {
      await sessionRef.delete();
      return ctx.reply(bilingual('start'));
    });

    bot.command('cancel', async (ctx: any) => {
      await sessionRef.delete();
      return ctx.reply(bilingual('cancel'));
    });

    bot.command('add', async (ctx: any) => {
      session.data = {};
      session.data.userName = userName;
      return goToStep(ctx, 'NAME', 'step_name');
    });

    // ---- Admin management commands (master only) ----
    bot.command('addadmin', async (ctx: any) => {
      if (tgUser.id !== MASTER_ADMIN_ID) return ctx.reply(bilingual('unauthorized'));
      const arg = ctx.message?.text?.split(' ').slice(1).join(' ').trim();
      if (!arg) return ctx.reply('⚠️ Usage: /addadmin @username or /addadmin 123456789');

      let targetId: number | null = null;
      // Try parsing as numeric ID
      if (/^\d+$/.test(arg)) {
        targetId = parseInt(arg, 10);
      } else {
        // Resolve @username
        const cleanName = arg.replace('@', '');
        try {
          const chat = await bot.telegram.getChat(`@${cleanName}`);
          targetId = chat.id;
        } catch {
          return ctx.reply(`❌ Cannot find Telegram user "${arg}". Make sure they have started a chat with this bot first.`);
        }
      }

      if (!targetId) return ctx.reply('❌ Could not resolve that user.');

      await adminDb.collection('settings').doc('global').set(
        { admins: FieldValue.arrayUnion(targetId) },
        { merge: true },
      );
      bustAdminCache();
      return ctx.reply(`✅ Admin added! ID: ${targetId}. They can now use /add to add products.`);
    });

    bot.command('removeadmin', async (ctx: any) => {
      if (tgUser.id !== MASTER_ADMIN_ID) return ctx.reply(bilingual('unauthorized'));
      const arg = ctx.message?.text?.split(' ').slice(1).join(' ').trim();
      const id = parseInt(arg, 10);
      if (!arg || isNaN(id)) return ctx.reply('⚠️ Usage: /removeadmin 123456789');

      await adminDb.collection('settings').doc('global').set(
        { admins: FieldValue.arrayRemove(id) },
        { merge: true },
      );
      bustAdminCache();
      return ctx.reply(`✅ Removed admin ID: ${id}`);
    });

    bot.command('listadmins', async (ctx: any) => {
      const list = await getAdmins(adminDb);
      const lines = list.map((id, i) => `${i === 0 ? '👑' : '👤'} ${id}${id === MASTER_ADMIN_ID ? ' (Master)' : ''}`);
      return ctx.reply(`📋 *Authorized Admins:*\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
    });

    // ---- Inline actions ----
    bot.action('action_cancel', async (ctx: any) => {
      await ctx.answerCbQuery().catch(() => {});
      await sessionRef.delete();
      return ctx.reply(bilingual('cancel'));
    });

    bot.action('action_back', async (ctx: any) => {
      await ctx.answerCbQuery().catch(() => {});
      const currentIdx = STEPS_ORDER.indexOf(session.step);
      if (currentIdx <= 0) {
        await sessionRef.delete();
        return ctx.reply(bilingual('back_to_main'));
      }
      const prevStep = STEPS_ORDER[currentIdx - 1];
      session.step = prevStep;

      if (prevStep === 'NAME') return goToStep(ctx, 'NAME', 'step_name_reenter');
      if (prevStep === 'CATEGORY') return sendCategoryPrompt(ctx);
      if (prevStep === 'PRICE') return goToStep(ctx, 'PRICE', 'step_price_reenter');
      if (prevStep === 'DESCRIPTION') return goToStep(ctx, 'DESCRIPTION', 'step_description_reenter');
      if (prevStep === 'IMAGE') return goToStep(ctx, 'IMAGE', 'step_image_reenter');
      if (prevStep === 'VARIANTS') return goToStep(ctx, 'VARIANTS', 'step_variants_reenter');
    });

    // ---- Category prompt ----
    const sendCategoryPrompt = async (ctx: any) => {
      const globalSettings = await adminDb.collection('settings').doc('global').get();
      const categories: string[] = globalSettings.exists ? (globalSettings.data()?.categories || []) : [];

      const buttons = categories.map((cat: string) => [Markup.button.callback(cat, `cat_${cat}`)]);
      buttons.push([Markup.button.callback(bilingualShort('btn_back'), 'action_back'), Markup.button.callback(bilingualShort('btn_cancel'), 'action_cancel')]);

      return goToStep(ctx, 'CATEGORY', 'step_category', undefined, Markup.inlineKeyboard(buttons));
    };

    bot.action(/^cat_(.+)$/, async (ctx: any) => {
      await ctx.answerCbQuery().catch(() => {});
      session.data.category = ctx.match[1];
      await sessionRef.set(session);
      return goToStep(ctx, 'PRICE', 'step_price');
    });

    // ---- Skip variants action ----
    bot.action('action_skip_variants', async (ctx: any) => {
      await ctx.answerCbQuery().catch(() => {});
      session.data.variants = [{ name: 'Standard', price: session.data.price }];
      session.step = 'CONFIRM';
      await sessionRef.set(session);
      return showConfirm(ctx);
    });

    // ---- Save product ----
    bot.action('action_save_product', async (ctx: any) => {
      await ctx.answerCbQuery().catch(() => {});
      await ctx.reply(bilingual('saving'));

      try {
        const variants = session.data.variants || [{ name: 'Standard', price: session.data.price }];
        const basePrice = session.data.price;
        const adminLabel = session.data.userName || userName;

        const snapshot = await adminDb.collection('products').get();
        const finalProduct = {
          name: session.data.name,
          category: session.data.category,
          price: basePrice,
          description: session.data.description,
          descriptionKh: '',
          imageUrl: session.data.imageUrl,
          status: 'in_stock',
          hidePrice: false,
          manualOrder: snapshot.size,
          variants,
          createdAt: Date.now(),
        };

        await adminDb.collection('products').add(finalProduct);

        await adminDb.collection('activityLogs').add({
          admin: adminLabel,
          adminId: userId,
          action: 'Added Product',
          target: finalProduct.name,
          details: `Category: ${finalProduct.category}, Price: $${basePrice}, Variants: ${variants.length}`,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        });

        if (finalProduct.category) {
          await adminDb.collection('settings').doc('global').set(
            { categories: FieldValue.arrayUnion(finalProduct.category) },
            { merge: true },
          );
        }

        await sessionRef.delete();
        return ctx.reply(bilingual('success', { name: finalProduct.name }), { parse_mode: 'Markdown' });
      } catch (err: any) {
        return ctx.reply(bilingual('db_error', { msg: err.message }));
      }
    });

    // ---- Parse variants from text ----
    const parseVariants = (input: string): { name: string; price: number }[] | null => {
      const parts = input.split(',').map((p) => p.trim()).filter(Boolean);
      const result: { name: string; price: number }[] = [];
      for (const part of parts) {
        const match = part.match(/^(.+):(\d+\.?\d*)$/);
        if (!match) return null;
        const name = match[1].trim();
        const price = parseFloat(match[2]);
        if (!name || isNaN(price)) return null;
        result.push({ name, price });
      }
      return result.length > 0 ? result : null;
    };

    // ---- Format variants for display ----
    const formatVariants = (variants: { name: string; price: number }[]): string => {
      return variants.map((v) => `${v.name} = $${v.price.toFixed(2)}`).join(', ');
    };

    // ---- Show confirmation ----
    const showConfirm = async (ctx: any) => {
      const variants = session.data.variants || [{ name: 'Standard', price: session.data.price }];
      const summary = bilingual('confirm_summary', {
        name: session.data.name,
        category: session.data.category,
        basePrice: session.data.price.toFixed(2),
        variants: formatVariants(variants),
        description: session.data.description,
      });

      return ctx.replyWithPhoto(session.data.imageUrl, {
        caption: summary,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(bilingualShort('btn_confirm'), 'action_save_product')],
          [Markup.button.callback(bilingualShort('btn_back'), 'action_back'), Markup.button.callback(bilingualShort('btn_cancel'), 'action_cancel')],
        ]),
      });
    };

    // ---- Message pipeline ----
    bot.on('message', async (ctx: any) => {
      const msgText = ctx.message?.text || '';
      if (msgText.startsWith('/')) return;

      // NAME
      if (session.step === 'NAME') {
        session.data.name = msgText.trim();
        await sessionRef.set(session);
        return sendCategoryPrompt(ctx);
      }

      // CATEGORY (typed)
      if (session.step === 'CATEGORY') {
        session.data.category = msgText.trim();
        await sessionRef.set(session);
        return goToStep(ctx, 'PRICE', 'step_price');
      }

      // PRICE
      if (session.step === 'PRICE') {
        const cleanPrice = parseFloat(msgText.replace('$', '').trim());
        if (isNaN(cleanPrice)) {
          return ctx.reply(bilingual('invalid_price'));
        }
        session.data.price = cleanPrice;
        await sessionRef.set(session);
        return goToStep(ctx, 'DESCRIPTION', 'step_description');
      }

      // DESCRIPTION
      if (session.step === 'DESCRIPTION') {
        session.data.description = msgText.trim();
        await sessionRef.set(session);
        return goToStep(ctx, 'IMAGE', 'step_image');
      }

      // IMAGE
      if (session.step === 'IMAGE') {
        const photoArray = ctx.message?.photo;
        if (!photoArray || photoArray.length === 0) {
          return ctx.reply(bilingual('not_a_photo'));
        }

        await ctx.reply(bilingual('photo_received'));

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
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadData.secure_url) {
            throw new Error(uploadData.error?.message || 'Cloudinary upload rejection.');
          }

          session.data.imageUrl = uploadData.secure_url;
          await sessionRef.set(session);

          // Go to VARIANTS step (with skip button)
          return goToStep(ctx, 'VARIANTS', 'step_variants', undefined,
            Markup.inlineKeyboard([
              [Markup.button.callback(bilingualShort('btn_skip_variants'), 'action_skip_variants')],
              [Markup.button.callback(bilingualShort('btn_back'), 'action_back'), Markup.button.callback(bilingualShort('btn_cancel'), 'action_cancel')],
            ]),
          );
        } catch (uploadError: any) {
          console.error('Cloudinary Engine Fault:', uploadError);
          return ctx.reply(bilingual('cloudinary_error', { msg: uploadError.message }));
        }
      }

      // VARIANTS (text input)
      if (session.step === 'VARIANTS') {
        const trimmed = msgText.trim().toLowerCase();
        if (trimmed === 'skip') {
          session.data.variants = [{ name: 'Standard', price: session.data.price }];
          session.step = 'CONFIRM';
          await sessionRef.set(session);
          return showConfirm(ctx);
        }

        const parsed = parseVariants(msgText);
        if (!parsed) {
          return ctx.reply(bilingual('invalid_variants'));
        }

        session.data.variants = parsed;
        session.step = 'CONFIRM';
        await sessionRef.set(session);
        return showConfirm(ctx);
      }
    });

    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Critical webhook processing error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}