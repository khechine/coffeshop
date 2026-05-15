import React from 'react';
import HelpClient from './HelpClient';
import { getUserContext } from '../../actions';

export const metadata = {
  title: 'Centre d\'aide - ElKassa Marketplace B2B',
  description: 'Apprenez à utiliser toutes les fonctionnalités de la marketplace ElKassa : commandes, devis, messagerie et plus.',
};

export default async function HelpPage() {
  const user = await getUserContext();
  
  return <HelpClient store={user?.store} />;
}
