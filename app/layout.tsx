import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers'; // Import the provider

// Fetch settings for dynamic OpenGraph metadata
async function getStoreSettings() {
  try {
    const projectId = "YOUR_FIREBASE_PROJECT_ID"; 
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/global`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  
  const storeName = settings?.storeName?.stringValue || "Kim San Shop";
  const tagline = settings?.tagline?.stringValue || "Curated excellence. Discover our exclusive collection.";
  const heroImageUrl = settings?.heroImageUrl?.stringValue || "";

  return {
    title: storeName,
    description: tagline,
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
    }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is REQUIRED for next-themes
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Wrap your children in the Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}