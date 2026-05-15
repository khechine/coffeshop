import React from 'react';
import VendorMessagesClient from './VendorMessagesClient';

export const metadata = {
  title: 'Messages - TradeMessager Portal',
  description: 'Gérez vos discussions avec les acheteurs et répondez aux demandes d\'informations.',
};

export default function VendorMessagesPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8">
      <VendorMessagesClient />
    </div>
  );
}
