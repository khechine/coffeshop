import { redirect } from 'next/navigation';
import { getStore } from '../../actions';
import SetupWizard from './SetupWizard';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const store = await getStore();
  if (!store) {
    redirect('/login');
  }

  // Si l'initialisation a déjà été effectuée, redirige vers l'admin principal
  // (Le gérant peut aussi y accéder intentionnellement via une query string ou paramètre si désiré)
  return (
    <SetupWizard
      storeName={store.name}
      initialIndustry={store.industry || 'COFFEE_SHOP'}
    />
  );
}
