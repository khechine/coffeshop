import { prisma } from '@coffeeshop/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const units = await prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(units);
}
