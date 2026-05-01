import { getMarketplaceBannersAdmin } from '../../../actions';
import BannersClient from './BannersClient';

export const dynamic = 'force-dynamic';

export default async function MarketplaceBannersPage() {
  let banners: any[] = [];
  try {
    banners = await getMarketplaceBannersAdmin();
  } catch (e) {
    // Table may not exist yet if migration hasn't run
    banners = [];
  }

  return <BannersClient banners={banners} />;
}
