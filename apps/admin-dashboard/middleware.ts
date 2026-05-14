import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  
  // Detection du sous-domaine mobile m.elkassa.com ou m.localhost:3000
  const isMobileSubdomain = host.startsWith('m.');
  
  // On peut aussi detecter le user agent si on veut forcer la version mobile sur smartphone
  // même sans le sous-domaine (optionnel, selon le choix de separation stricte)
  const userAgent = request.headers.get('user-agent') || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Si c'est le sous-domaine mobile, on reecrit vers le dossier interne /mobile
  if (isMobileSubdomain) {
    // Eviter les boucles si le chemin commence deja par /mobile
    if (!url.pathname.startsWith('/mobile')) {
      url.pathname = `/mobile${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// Configurer le middleware pour s'appliquer a toutes les routes sauf statiques
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
