import { prisma } from '@coffeeshop/database';
import ReferentielsClient from './ReferentielsClient';

export const dynamic = 'force-dynamic';

export default async function ReferentielsPage() {
  const [units, activityPoles] = await Promise.all([
    prisma.globalUnit.findMany({ orderBy: { name: 'asc' } }),
    prisma.activityPole.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <ReferentielsClient
      units={units}
      activityPoles={activityPoles}
    />
  );
}
