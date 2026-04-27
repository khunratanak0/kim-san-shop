import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// NEW: Import Vercel Analytics
import { Analytics } from '@vercel/analytics/next';

async function getStoreSettings() {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      console.log('No project ID');
      return null;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/global`;
    console.log('Fetching metadata from:', url);

    const res = await fetch(url, {
      next: { revalidate: 0 },
    });

    console.log('Firestore response status:', res.status);

    if (!res.ok) {
      console.log('Firestore fetch failed:', res.status);
      return null;
    }

    const data = await res.json();
    console.log('Firestore data received:', data.fields?.tagline?.stringValue);
    return data.fields;
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  const storeName = settings?.storeName?.stringValue || 'Kim San Shop';
  const tagline =
    settings?.tagline?.stringValue ||
    'Welcome to Kim San Shop - Premium Products';
  const heroImageUrl = settings?.heroImageUrl?.stringValue || '';

  console.log('Generated metadata with tagline:', tagline);

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
      url: 'https://www.kimsan285.com',
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
      <body className="subpixel-antialiased min-h-screen bg-background text-foreground text-black dark:text-white" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}