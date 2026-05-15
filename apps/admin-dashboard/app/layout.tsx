import './globals.css';
import LayoutShell from '../components/LayoutShell';

import { getStore } from './actions';

export const metadata = {
  title: 'ElKassa Patisserie B2B — Dashboard',
  description: 'Plateforme SaaS B2B pour la gestion de pâtisseries et commerces',
  manifest: '/manifest.json',
  themeColor: '#E31E24',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const hasMarketplace = (store as any)?.hasMarketplace === true;
  const planName = (store as any)?.subscription?.plan?.name || '';
  const isFiscalEnabled = (store as any)?.isFiscalEnabled === true;
  
  return (
    <html lang="fr">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <LayoutShell 
          storeName={store?.name || 'Mon Café'} 
          storeCity={store?.city || ''} 
          hasMarketplace={hasMarketplace}
          planName={planName}
          isFiscalEnabled={isFiscalEnabled}
          industry={(store as any)?.industry || 'COFFEE_SHOP'}
          businessType={(store as any)?.businessType || 'STORE'}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
