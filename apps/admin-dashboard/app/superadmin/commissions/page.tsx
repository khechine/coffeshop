import React from 'react';
import { getCommissionRules } from '../../actions';
import CommissionRulesClient from './CommissionRulesClient';

export default async function CommissionRulesPage() {
  const rules = await getCommissionRules();
  
  return (
    <div style={{ padding: '20px' }}>
      <CommissionRulesClient rules={rules} />
    </div>
  );
}
