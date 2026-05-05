import { getMarketplaceData, getStore } from '../../actions';
import EcoMarketplaceClient from './EcoMarketplaceClient';

export default async function EcoMarketplacePage() {
  const store = await getStore();
  const initialData = await getMarketplaceData(undefined, undefined, undefined, true);

  return (
    <EcoMarketplaceClient initialData={initialData} store={store} />
  );
}
