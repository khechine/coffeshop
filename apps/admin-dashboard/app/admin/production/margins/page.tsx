import { getProductMarginsAction } from '../../../../app/actions';
import MarginsClient from './MarginsClient';

export const dynamic = 'force-dynamic';

export default async function ProductionMarginsPage() {
  const margins = await getProductMarginsAction();

  return (
    <div className="page-content">
      <MarginsClient initialMargins={JSON.parse(JSON.stringify(margins))} />
    </div>
  );
}
