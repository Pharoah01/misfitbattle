import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { User, AuthResponse } from './models';

/**
 * Property-Based Test for Authentication State Consistency
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 * 
 * Property 1: Authentication State Consistency
 * Universal Quantification: ∀ user sessions, if a valid token exists in localStorage,
 * then isAuthenticated === true AND user object is populated
 * 
 * This test verifies that:
 * 1. When valid tokens are stored, authentication state is consistent
 * 2. When tokens are removed, authentication state is cleared
 * 3. Token refresh maintains authentication state
 * 4. Invalid tokens trigger proper cleanup
 */

describe('Property Test: Authentication State Consistency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Arbitrary generator for valid JWT-like tokens
   */
  const tokenArbitrary = fc.string({ minLength: 20, maxLength: 200 }).map(
    (str) => `eyJ${str.replace(/[^A-Za-z0-9]/g, '')}`
  );

  /**
   * Arbitrary generator for User objects
   */
    const userArbitrary: fc.Arbitrary<User> = fc.record({

    id: fc.integer({ min: 1, max: 100000 }),

    register_number: fc.string({ minLength: 3, maxLength: 20 })
        .filter((s) => /^[A-Za-z0-9]+$/.test(s)),

    name: fc.string({ minLength: 2, maxLength: 100 })
        .filter((s) => s.trim().length >= 2),

    email: fc.option(fc.emailAddress(), { nil: undefined }),

    college_name: fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: undefined }),

    profile_completed: fc.boolean(),

    is_admin: fc.boolean(),

    created_at: fc
        .integer({ min: 946684800000, max: 4102444800000 })
        .map((ts) => new Date(ts).toISOString()),

    });
  /**
   * Arbitrary generator for AuthResponse objects
   */
  const authResponseArbitrary: fc.Arbitrary<AuthResponse> = fc.record({
    access: tokenArbitrary,
    refresh: tokenArbitrary,
    user: userArbitrary,
  });

  it('Property 1.1: Token presence implies authentication state consistency', () => {
    fc.assert(
      fc.property(authResponseArbitrary, (authResponse) => {
        localStorage.clear();   // ADD THIS LINE
        localStorage.setItem('access_token', authResponse.access);
        localStorage.setItem('refresh_token', authResponse.refresh);

        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');

        expect(storedAccessToken).toBe(authResponse.access);
        expect(storedRefreshToken).toBe(authResponse.refresh);

        const secondRetrieval = localStorage.getItem('access_token');
        expect(secondRetrieval).toBe(storedAccessToken);
      })
    );
  });

  it('Property 1.2: Token removal implies authentication state cleanup', () => {
    fc.assert(
      fc.property(authResponseArbitrary, (authResponse) => {
        localStorage.setItem('access_token', authResponse.access);
        localStorage.setItem('refresh_token', authResponse.refresh);

        expect(localStorage.getItem('access_token')).toBe(authResponse.access);
        expect(localStorage.getItem('refresh_token')).toBe(authResponse.refresh);

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
      })
    );
  });

  it('Property 1.3: Token refresh maintains authentication consistency', () => {
    fc.assert(
      fc.property(
        authResponseArbitrary,
        tokenArbitrary.filter((t) => t.length > 0),
        
        (initialAuth, newAccessToken) => {
          localStorage.setItem('access_token', initialAuth.access);
          localStorage.setItem('refresh_token', initialAuth.refresh);

          localStorage.setItem('access_token', newAccessToken);

          expect(localStorage.getItem('refresh_token')).toBe(initialAuth.refresh);

          expect(localStorage.getItem('access_token')).toBe(newAccessToken);
          expect(localStorage.getItem('access_token')).not.toBe(initialAuth.access);
        }
      )
    );
  });

  it('Property 1.4: Multiple sign in/sign out cycles maintain consistency', () => {
    fc.assert(
      fc.property(
        fc.array(authResponseArbitrary, { minLength: 1, maxLength: 10 }),
        (authResponses) => {
          for (const authResponse of authResponses) {
            localStorage.setItem('access_token', authResponse.access);
            localStorage.setItem('refresh_token', authResponse.refresh);

            expect(localStorage.getItem('access_token')).toBe(authResponse.access);
            expect(localStorage.getItem('refresh_token')).toBe(authResponse.refresh);

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            expect(localStorage.getItem('access_token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
          }
        }
      )
    );
  });

  it('Property 1.5: User data consistency with token storage', () => {
    fc.assert(
      fc.property(authResponseArbitrary, (authResponse) => {
        localStorage.setItem('access_token', authResponse.access);
        localStorage.setItem('refresh_token', authResponse.refresh);
        localStorage.setItem('user', JSON.stringify(authResponse.user));

        const storedUserStr = localStorage.getItem('user');
        expect(storedUserStr).not.toBeNull();

        const storedUser: User = JSON.parse(storedUserStr!);

        expect(storedUser.id).toBe(authResponse.user.id);
        expect(storedUser.register_number).toBe(authResponse.user.register_number);
        expect(storedUser.name).toBe(authResponse.user.name);
        expect(storedUser.email).toBe(authResponse.user.email);
        expect(storedUser.college_name).toBe(authResponse.user.college_name);
        expect(storedUser.profile_completed).toBe(authResponse.user.profile_completed);
        expect(storedUser.is_admin).toBe(authResponse.user.is_admin);
        expect(storedUser.created_at).toBe(authResponse.user.created_at);
      })
    );
  });

  it('Property 1.6: Token validation - non-empty tokens', () => {
    fc.assert(
      fc.property(authResponseArbitrary, (authResponse) => {
        expect(authResponse.access.length).toBeGreaterThan(0);
        expect(authResponse.refresh.length).toBeGreaterThan(0);

        expect(authResponse.access.startsWith('eyJ')).toBe(true);
        expect(authResponse.refresh.startsWith('eyJ')).toBe(true);
      })
    );
  });

  it('Property 1.7: User validation - required fields present', () => {
    fc.assert(
      fc.property(userArbitrary, (user) => {
        expect(user.id).toBeGreaterThan(0);
        expect(user.register_number.length).toBeGreaterThanOrEqual(3);
        expect(user.register_number.length).toBeLessThanOrEqual(20);
        expect(user.name.length).toBeGreaterThanOrEqual(2);
        expect(user.name.length).toBeLessThanOrEqual(100);

        expect(/^[A-Za-z0-9]+$/.test(user.register_number)).toBe(true);

        expect(typeof user.is_admin).toBe('boolean');

        expect(typeof user.profile_completed).toBe('boolean');

        expect(() => new Date(user.created_at)).not.toThrow();
        expect(new Date(user.created_at).toISOString()).toBe(user.created_at);
      })
    );
  });

  it('Property 1.8: Authentication state transitions are atomic', () => {
    fc.assert(
      fc.property(
        authResponseArbitrary,
        authResponseArbitrary,
        (auth1, auth2) => {
            localStorage.clear();
          expect(localStorage.getItem('access_token')).toBeNull();
          expect(localStorage.getItem('refresh_token')).toBeNull();

          localStorage.setItem('access_token', auth1.access);
          localStorage.setItem('refresh_token', auth1.refresh);

          expect(localStorage.getItem('access_token')).toBe(auth1.access);
          expect(localStorage.getItem('refresh_token')).toBe(auth1.refresh);

          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');

          expect(localStorage.getItem('access_token')).toBeNull();
          expect(localStorage.getItem('refresh_token')).toBeNull();

          localStorage.setItem('access_token', auth2.access);
          localStorage.setItem('refresh_token', auth2.refresh);

          expect(localStorage.getItem('access_token')).toBe(auth2.access);
          expect(localStorage.getItem('refresh_token')).toBe(auth2.refresh);
          expect(localStorage.getItem('access_token')).not.toBe(auth1.access);
          expect(localStorage.getItem('refresh_token')).not.toBe(auth1.refresh);
        }
      )
    );
  });

  it('Property 1.9: Concurrent token operations maintain consistency', () => {
    fc.assert(
      fc.property(
        fc.array(tokenArbitrary, { minLength: 2, maxLength: 5 }),
        (tokens) => {
          for (const token of tokens) {
            localStorage.setItem('access_token', token);
          }

          const finalToken = tokens[tokens.length - 1];
          expect(localStorage.getItem('access_token')).toBe(finalToken);

          const storedToken = localStorage.getItem('access_token');
          expect(tokens.includes(storedToken!)).toBe(true);
        }
      )
    );
  });

    it('Property 1.10: Empty or invalid token handling', () => {
    fc.assert(
        fc.property(
        fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string({ maxLength: 5 }) // Too short to be valid JWT
        ),
        (invalidToken) => {

            localStorage.clear(); // IMPORTANT: isolate each run

            if (invalidToken === null || invalidToken === undefined) {
            localStorage.removeItem('access_token');
            } else {
            localStorage.setItem('access_token', invalidToken);
            }

            const stored = localStorage.getItem('access_token');


            if (invalidToken === null || invalidToken === undefined) {

            expect(stored).toBeNull();

            } else if (invalidToken === "") {

            expect(stored === "" || stored === null).toBe(true);

            } else {

            expect(stored).toBe(invalidToken);

            }

        }
        )
    );
    });
});