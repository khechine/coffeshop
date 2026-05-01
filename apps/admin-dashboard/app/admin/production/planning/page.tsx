import { getProductionPlanningAction } from '../../../../app/actions';
import PlanningClient from './PlanningClient';

export const dynamic = 'force-dynamic';

export default async function ProductionPlanningPage() {
  const planning = await getProductionPlanningAction();

  return (
    <div className="page-content">
      <PlanningClient initialPlanning={JSON.parse(JSON.stringify(planning))} />
    </div>
  );
}
