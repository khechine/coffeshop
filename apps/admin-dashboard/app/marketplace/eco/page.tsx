import { getMarketplaceData, getUserContext } from '../../actions';
import EcoMarketplaceClient from './EcoMarketplaceClient';

export default async function EcoMarketplacePage() {
  const user = await getUserContext();
  const initialData = await getMarketplaceData(undefined, undefined, undefined, true);

  return (
    <EcoMarketplaceClient initialData={initialData} store={user?.store} user={user} />
  );
}
