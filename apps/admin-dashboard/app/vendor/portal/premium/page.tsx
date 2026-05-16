import React from 'react';
import PremiumClient from './PremiumClient';
import { getVendorProfile } from '../../../actions';

export const metadata = {
  title: 'Devenir Premium | Elkassa Marketplace',
  description: 'Boostez vos ventes B2B avec les fonctionnalités premium d\'Elkassa : Intelligence prédictive, vitrine personnalisée, et visibilité prioritaire.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getVendorProfile();
  return <PremiumClient isPremium={profile?.isPremium || false} />;
}
