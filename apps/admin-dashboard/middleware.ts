import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  
  const isMobileSubdomain = host.startsWith('m.');
  const response = NextResponse.next();

  // On passe l'info via un header ou un cookie pour que le layout puisse s'adapter
  if (isMobileSubdomain) {
    response.cookies.set('is_mobile_subdomain', 'true');
    
    // Si on veut quand meme utiliser le dossier /mobile pour les pages specifiques optimisées
    // On liste les pages optimisées
    const optimizedPaths = ['/', '/marketplace', '/orders', '/profile', '/vendor'];
    if (optimizedPaths.includes(url.pathname) || url.pathname.startsWith('/vendor/') || url.pathname === '') {
       url.pathname = `/mobile${url.pathname === '/' ? '' : url.pathname}`;
       const rewriteRes = NextResponse.rewrite(url);
       rewriteRes.cookies.set('is_mobile_subdomain', 'true');
       return rewriteRes;
    }
  } else {
    response.cookies.set('is_mobile_subdomain', 'false');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
