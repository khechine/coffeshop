import './globals.css';
import LayoutShell from '../components/LayoutShell';

import { getStore } from './actions';

export const metadata = {
  title: 'CoffeeSaaS B2B — Dashboard',
  description: 'Plateforme SaaS B2B pour la gestion de cafés et bistros',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const hasMarketplace = (store as any)?.hasMarketplace === true;
  const planName = (store as any)?.subscription?.plan?.name || '';
  const isFiscalEnabled = (store as any)?.isFiscalEnabled === true;
  
  return (
    <html lang="fr">
      <body>
        <LayoutShell 
          storeName={store?.name || 'Mon Café'} 
          storeCity={store?.city || ''} 
          hasMarketplace={hasMarketplace}
          planName={planName}
          isFiscalEnabled={isFiscalEnabled}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
