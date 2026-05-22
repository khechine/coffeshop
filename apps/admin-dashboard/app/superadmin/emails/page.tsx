import React from 'react';
import EmailsClient from './EmailsClient';
import { getEmailLogsAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EmailsPage() {
  const logs = await getEmailLogsAction();
  return <EmailsClient initialLogs={logs} />;
}
