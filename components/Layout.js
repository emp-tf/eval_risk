import Head from 'next/head';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children, title = 'AfriRisk — Real Estate Risk Platform' }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-powered real estate risk assessment for African markets" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
        }}
      />
    </>
  );
}
