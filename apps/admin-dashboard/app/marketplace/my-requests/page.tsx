import { getStoreRFQs, getStore } from '../../actions';
import MyRequestsClient from './MyRequestsClient';

export default async function MyRequestsPage() {
  const store = await getStore();
  const rfqs = await getStoreRFQs();

  return (
    <MyRequestsClient rfqs={rfqs} store={store} />
  );
}
