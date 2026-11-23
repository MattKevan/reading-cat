import test from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@emdash-cms/auth';
import { canContribute, contributorAccess } from '../src/lib/contributor-access.ts';

test('anonymous readers are sent to login without receiving the editor page', () => {
 const denied = contributorAccess(null, new URL('https://example.com/write?id=review-1'));
 assert.equal(canContribute(null), false);
 assert.equal(denied.status, 302);
 assert.equal(denied.headers.get('Cache-Control'), 'private, no-store');
 const login = new URL(denied.headers.get('Location'), 'https://example.com');
 assert.equal(login.pathname, '/_emdash/admin/login');
 assert.equal(login.searchParams.get('redirect'), '/write?id=review-1');
});

test('a logged-in subscriber cannot view contributor pages', () => {
 const subscriber = { id: 'subscriber', role: Role.SUBSCRIBER };
 assert.equal(canContribute(subscriber), false);
 assert.equal(contributorAccess(subscriber, new URL('https://example.com/drafts')).status, 403);
});

test('contributors, authors, editors and administrators can use the editor', () => {
 for (const role of [Role.CONTRIBUTOR, Role.AUTHOR, Role.EDITOR, Role.ADMIN]) {
  const user = { id: 'contributor', role };
  assert.equal(canContribute(user), true);
  assert.equal(contributorAccess(user, new URL('https://example.com/write')), null);
 }
});

test('disabled accounts cannot use contributor pages', () => {
 const user = { id: 'disabled-admin', role: Role.ADMIN, disabled: true };
 assert.equal(canContribute(user), false);
 assert.equal(contributorAccess(user, new URL('https://example.com/write')).status, 403);
});
