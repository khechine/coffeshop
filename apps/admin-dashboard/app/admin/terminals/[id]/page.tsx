import React from 'react';
import { getTerminalAction } from '../../../actions';
import { notFound } from 'next/navigation';
import TerminalDetailClient from './TerminalDetailClient';

export const dynamic = 'force-dynamic';

export default async function TerminalDetailPage({ params }: { params: { id: string } }) {
  try {
    const terminal = await getTerminalAction(params.id);
    
    if (!terminal) {
      return notFound();
    }

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <TerminalDetailClient terminal={terminal} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching terminal:', error);
    return notFound();
  }
}
