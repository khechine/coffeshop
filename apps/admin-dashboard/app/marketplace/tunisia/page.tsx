import { getMarketplaceData, getStore } from '../../actions';
import TunisiaMarketplaceClient from './TunisiaMarketplaceClient';

export default async function TunisiaMarketplacePage() {
  const store = await getStore();
  const initialData = await getMarketplaceData(undefined, undefined, undefined, false, true);

  return (
    <TunisiaMarketplaceClient initialData={initialData} store={store} />
  );
}
