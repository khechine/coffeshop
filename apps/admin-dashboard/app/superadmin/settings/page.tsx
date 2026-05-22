import React from 'react';
import SettingsClient from './SettingsClient';
import { getSmtpConfigAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const smtpConfig = await getSmtpConfigAction();
  return <SettingsClient initialConfig={smtpConfig} />;
}
