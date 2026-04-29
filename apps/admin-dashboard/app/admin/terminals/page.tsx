import { getTerminalsAction, getStore } from '../../actions';
import TerminalsClient from './TerminalsClient';


export default async function TerminalsPage() {
  const store = await getStore();
  const terminalsRaw = await getTerminalsAction();
  
  // Transform dates and decimals for client serialization
  const terminals = (terminalsRaw || []).map((t: any) => ({
    ...t,
    lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
  }));

  return (
    <div className="admin-container" style={{ padding: '32px 40px' }}>
      <TerminalsClient terminals={terminals} storeId={store?.id} />
    </div>

  );
}
