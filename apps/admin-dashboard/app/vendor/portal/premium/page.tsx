import React from 'react';
import PremiumClient from './PremiumClient';

export const metadata = {
  title: 'Devenir Premium | Elkassa Marketplace',
  description: 'Boostez vos ventes B2B avec les fonctionnalités premium d\'Elkassa : Intelligence prédictive, vitrine personnalisée, et visibilité prioritaire.',
};

export const dynamic = 'force-dynamic';

export default function Page() {
  return <PremiumClient />;
}
