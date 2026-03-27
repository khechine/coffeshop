import { getExpensesAction } from '../../actions';
import ExpensesClient from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const expenses = await getExpensesAction();
  
  return (
    <div className="page-content">
      <ExpensesClient initialExpenses={JSON.parse(JSON.stringify(expenses))} />
    </div>
  );
}
