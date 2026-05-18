// Casual/Khmer (primary) + English (secondary) translations for the Telegram bot
// Khmer translations use everyday spoken language, not formal/literary Khmer.

export const T = {
  start: {
    km: '🛒 សួស្តី! Bot រួចរាល់ហើយ\n\nចុច /add ដើម្បីដាក់ទំនិញថ្មី',
    en: '🛒 Bot is ready!\n\nUse /add to add a new product',
  },
  cancel: {
    km: '🚫 បានបោះបង់ហើយ។ ត្រឡប់ទៅទំពេរវិញ',
    en: '🚫 Cancelled. Back to idle.',
  },
  step_name: {
    km: '📝 ជំហានទី 1: បញ្ចូល **ឈ្មោះទំនិញ**៖',
    en: '📝 Step 1: Enter the Product Name:',
  },
  step_name_reenter: {
    km: '📝 ជំហានទី 1: បញ្ចូលឈ្មោះទំនិញម្តងទៀត៖',
    en: '📝 Step 1: Re-enter the Product Name:',
  },
  step_category: {
    km: '📁 ជំហានទី 2: ជ្រើសរើសប្រភេទ ឬវាយបញ្ចូលថ្មី៖',
    en: '📁 Step 2: Select a category or type a new one:',
  },
  step_price: {
    km: '💰 ជំហានទី 3: បញ្ចូល **តម្លៃមូលដ្ឋាន** (គិតជាដុល្លារ ឧ. 15.00)៖',
    en: '💰 Step 3: Enter the Base Price (in USD, e.g. 15.00):',
  },
  step_price_reenter: {
    km: '💰 ជំហានទី 3: បញ្ចូលតម្លៃម្តងទៀត (លេខតែប៉ុណ្ណោះ)៖',
    en: '💰 Step 3: Re-enter the Price (numbers only):',
  },
  step_description: {
    km: '✍️ ជំហានទី 4: សរសេរ **ការពិពណ៌នា** អំពីទំនិញ៖',
    en: '✍️ Step 4: Enter the Product Description:',
  },
  step_description_reenter: {
    km: '✍️ ជំហានទី 4: សរសេរការពិពណ៌នាម្តងទៀត៖',
    en: '✍️ Step 4: Re-enter the Description:',
  },
  step_image: {
    km: '🖼️ ជំហានទី 5: ផ្ញើរូបថតរបស់ទំនិញមក៖',
    en: '🖼️ Step 5: Send a photo of the product:',
  },
  step_image_reenter: {
    km: '🖼️ ជំហានទី 5: ផ្ញើរូបថតម្តងទៀត៖',
    en: '🖼️ Step 5: Send the product image again:',
  },
  step_variants: {
    km: '📏 ជំហានទី 6: បញ្ចូល **ទំហំនិងតម្លៃ** (បើមានច្រើនទំហំ)៖\n\n'
      + 'ឧទាហរណ៍: 2cm:15, 5cm:20, 10cm:30\n'
      + 'ឬវាយ skip បើមានតែមួយតម្លៃ',
    en: '📏 Step 6: Enter Size & Price variants:\n\n'
      + 'Example: 2cm:15, 5cm:20, 10cm:30\n'
      + 'Or type skip for a single-price product',
  },
  step_variants_reenter: {
    km: '📏 បញ្ចូលទំហំនិងតម្លៃម្តងទៀត៖',
    en: '📏 Re-enter size & price variants:',
  },
  invalid_price: {
    km: '⚠️ តម្លៃមិនត្រឹមត្រូវ! សូមបញ្ចូលលេខ (ឧ. 12 ឬ 19.99)៖',
    en: '⚠️ Invalid price! Please enter a valid number (e.g. 12 or 19.99):',
  },
  invalid_variants: {
    km: '⚠️ ទម្រង់មិនត្រឹមត្រូវ! សូមប្រើ: ទំហំ:តម្លៃ, ទំហំ:តម្លៃ\nឧទាហរណ៍: 2cm:15, 5cm:20',
    en: '⚠️ Invalid format! Use: size:price, size:price\nExample: 2cm:15, 5cm:20',
  },
  not_a_photo: {
    km: '⚠️ នេះមិនមែនជារូបថតទេ! សូមផ្ញើរូបថតមក៖',
    en: '⚠️ That was not a photo! Please send an actual image:',
  },
  photo_received: {
    km: '⚡ បានទទួលរូបថត! កំពុង upload ទៅ Cloudinary...',
    en: '⚡ Photo received! Uploading to Cloudinary...',
  },
  saving: {
    km: '⏳ កំពុងរក្សាទុកទំនិញទៅកាន់ website...',
    en: '⏳ Saving product to your website dashboard...',
  },
  success: {
    km: '🎉 ជោគជ័យ! *{name}* បានដាក់លក់នៅលើ store ហើយ!',
    en: '🎉 Success! *{name}* has been published to your store!',
  },
  db_error: {
    km: '❌ មានបញ្ហាក្នុងការរក្សាទុក: {msg}',
    en: '❌ Database Transaction Failed: {msg}',
  },
  cloudinary_error: {
    km: '❌ Upload មិនបានសម្រេច: {msg}។ សូមព្យាយាមម្តងទៀត៖',
    en: '❌ Cloudinary Upload Failed: {msg}. Please try sending the image again:',
  },
  back_to_main: {
    km: 'ត្រឡប់ទៅម៉ឺនុយដើមវិញ។ ចុច /add ដើម្បីចាប់ផ្តើមម្តងទៀត',
    en: 'Back to main menu. Use /add to start over.',
  },
  unauthorized: {
    km: '🚫 អ្នកគ្មានសិទ្ធិប្រើ bot នេះទេ',
    en: '🚫 You are not authorized to use this bot.',
  },
  confirm_summary: {
    km: '🔎 *ពិនិត្យមើលទំនិញរបស់អ្នក* 🔎\n\n'
      + '📛 *ឈ្មោះ:* {name}\n'
      + '📁 *ប្រភេទ:* {category}\n'
      + '💰 *តម្លៃមូលដ្ឋាន:* ${basePrice}\n'
      + '📏 *ទំហំ:* {variants}\n'
      + '✍️ *ការពិពណ៌នា:* {description}\n\n'
      + '🖼️ *រូបថតបាន upload ទៅ Cloudinary ហើយ!*',
    en: '🔎 *Review Your Product* 🔎\n\n'
      + '📛 *Name:* {name}\n'
      + '📁 *Category:* {category}\n'
      + '💰 *Base Price:* ${basePrice}\n'
      + '📏 *Sizes:* {variants}\n'
      + '✍️ *Description:* {description}\n\n'
      + '🖼️ *Image uploaded to Cloudinary!*',
  },
  btn_confirm: {
    km: '✅ យល់ព្រម & ដាក់លក់',
    en: '✅ Confirm & Publish',
  },
  btn_back: {
    km: '⬅️ ថយក្រោយ',
    en: '⬅️ Back',
  },
  btn_cancel: {
    km: '❌ បោះបង់',
    en: '❌ Cancel',
  },
  btn_skip_variants: {
    km: '⏭️ រំលង (តម្លៃតែមួយ)',
    en: '⏭️ Skip (Single Price)',
  },
} as const;

/** Format a translation key with variables like {name}, {msg}, etc. */
export function t(
  key: keyof typeof T,
  lang: 'km' | 'en',
  vars?: Record<string, string | number>,
): string {
  let text = T[key][lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Return bilingual text: Khmer first, then English on a new line in small text */
export function bilingual(key: keyof typeof T, vars?: Record<string, string | number>): string {
  const km = t(key, 'km', vars);
  const en = t(key, 'en', vars);
  return `${km}\n\n${en}`;
}

/** Simple bilingual without the double newline gap (for buttons, etc.) */
export function bilingualShort(key: keyof typeof T, vars?: Record<string, string | number>): string {
  const km = t(key, 'km', vars);
  const en = t(key, 'en', vars);
  return `${km}`;
}