'use client';

import React, { useState } from 'react';
import FloorPlanEditor from './FloorPlanEditor';

export default function TablesClient({ initialTables, initialZones }: { initialTables: any[], initialZones: any[] }) {
  return (
    <div className="space-y-8">
      <FloorPlanEditor initialTables={initialTables} initialZones={initialZones} />
    </div>
  );
}

