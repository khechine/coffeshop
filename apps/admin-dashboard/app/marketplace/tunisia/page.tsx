import { getMarketplaceData, getUserContext } from '../../actions';
import TunisiaMarketplaceClient from './TunisiaMarketplaceClient';

export default async function TunisiaMarketplacePage() {
  const user = await getUserContext();
  const initialData = await getMarketplaceData(undefined, undefined, undefined, false, true);

  return (
    <TunisiaMarketplaceClient initialData={initialData} store={user?.store} user={user} />
  );
}
