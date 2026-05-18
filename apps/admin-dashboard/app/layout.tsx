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
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TM3M2K7Z');`
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-TM3M2K7Z"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
