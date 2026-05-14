import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sift',
  description: 'Intelligent GitHub repository search engine',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-zinc-300 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
