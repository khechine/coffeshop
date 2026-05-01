import { getStore } from '../../actions';
import PremiumRequestClient from './PremiumRequestClient';

export default async function PremiumRequestPage() {
  const store = await getStore();
  
  return <PremiumRequestClient store={JSON.parse(JSON.stringify(store))} />;
}
