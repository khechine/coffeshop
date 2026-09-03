import React from 'react';
import KDSClient from './KDSClient';
import { getKdsOrdersAction } from '../actions';

export const metadata = {
  title: 'KDS - Écran Cuisine & Bar | ElKassa POS',
  description: 'Écran de préparation et suivi des commandes en temps réel pour la cuisine et le bar.'
};

export default async function KdsPage() {
  let initialOrders = [];
  try {
    initialOrders = await getKdsOrdersAction();
  } catch (err) {
    console.error("Failed to load initial KDS orders:", err);
  }

  return <KDSClient initialOrders={initialOrders} />;
}
