import { hasPermission, type RoleLevel } from '@emdash-cms/auth';

type ContributorUser = { id: string; role: RoleLevel; disabled?: boolean };

export function canContribute(user: ContributorUser | null | undefined): boolean {
 return !!user && !user.disabled && hasPermission(user, 'content:create');
}

export function contributorAccess(user: ContributorUser | null | undefined, url: URL): Response | null {
 if (canContribute(user)) return null;
 const headers = new Headers({ 'Cache-Control': 'private, no-store' });
 if (!user) {
  headers.set('Location', '/_emdash/admin/login?redirect=' + encodeURIComponent(url.pathname + url.search));
  return new Response(null, { status: 302, headers });
 }
 headers.set('Content-Type', 'text/plain; charset=utf-8');
 return new Response('This page is available to contributors and editors.', { status: 403, headers });
}
