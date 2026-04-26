import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// NEW: Import Vercel Analytics
import { Analytics } from '@vercel/analytics/next';

async function getStoreSettings() {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      return null;
    }

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/global`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.fields;
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  const storeName = settings?.storeName?.stringValue || 'Kim San Shop';
  const tagline =
    settings?.tagline?.stringValue ||
    'Welcome to Kim San Shop';
  const heroImageUrl = settings?.heroImageUrl?.stringValue || '';

  return {
    title: storeName,
    description: tagline,
    appleWebApp: {
      title: 'Kim San',
    },
    openGraph: {
      title: storeName,
      description: tagline,
      images: heroImageUrl ? [{ url: heroImageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description: tagline,
      images: heroImageUrl ? [heroImageUrl] : [],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="subpixel-antialiased min-h-screen bg-background text-foreground text-black dark:text-white">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}