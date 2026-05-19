import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@coffeeshop/database';

const SUPERADMIN_KEY = process.env.SUPERADMIN_SECRET || 'elkassa_superadmin_2026';

// POST /api/superadmin/impersonate
// Body: { vendorId: string, superadminUserId: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorId, superadminUserId } = body;

    // 1. Verify the requester is a superadmin
    const user = await prisma.user.findUnique({
      where: { id: superadminUserId },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 403 });
    }

    // 2. Verify the vendor exists
    const vendor = await (prisma as any).vendorProfile.findUnique({
      where: { id: vendorId },
      select: { id: true, companyName: true, userId: true }
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendeur introuvable' }, { status: 404 });
    }

    // 3. Set impersonation cookies
    const response = NextResponse.json({
      success: true,
      data: {
        vendorId: vendor.id,
        companyName: vendor.companyName,
        redirectTo: '/vendor/portal/catalog'
      }
    });

    // Impersonation cookie (vendor's userId so getVendorProfile() resolves correctly)
    response.cookies.set('userId', vendor.userId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    // Marker cookie so we can show the banner "Mode Impersonation"
    response.cookies.set('impersonated_by', superadminUserId, {
      httpOnly: false, // readable by client JS to show banner
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2
    });

    response.cookies.set('impersonated_vendor_name', vendor.companyName || 'Vendeur', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2
    });

    return response;
  } catch (error: any) {
    console.error('Impersonate API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/superadmin/impersonate — Stop impersonation, restore original session
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const superadminUserId = searchParams.get('superadminUserId');

    const response = NextResponse.json({ success: true, redirectTo: '/superadmin/marketplace' });

    // Restore superadmin userId cookie
    if (superadminUserId) {
      response.cookies.set('userId', superadminUserId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
    }

    response.cookies.delete('impersonated_by');
    response.cookies.delete('impersonated_vendor_name');

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
