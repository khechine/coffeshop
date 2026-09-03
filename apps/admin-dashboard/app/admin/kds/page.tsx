import React from 'react';
import KDSClient from '../../kds/KDSClient';
import { getKdsOrdersAction } from '../../actions';

export const metadata = {
  title: 'KDS - Écran Cuisine | Admin ElKassa',
  description: 'Écran de préparation et suivi des commandes en temps réel.'
};

export default async function AdminKdsPage() {
  let initialOrders = [];
  try {
    initialOrders = await getKdsOrdersAction();
  } catch (err) {
    console.error("Failed to load initial KDS orders:", err);
  }

  return (
    <div style={{ height: 'calc(100vh - 70px)', borderRadius: 16, overflow: 'hidden' }}>
      <KDSClient initialOrders={initialOrders} />
    </div>
  );
}
