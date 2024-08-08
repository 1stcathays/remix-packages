import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { config } from '@1stcathays/remix-config';
import type { Logger } from '@1stcathays/remix-logging';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import type { PrismaClient } from '@prisma/client';
import type { Session, User } from 'lucia';
import { Lucia, TimeSpan } from 'lucia';
import { createDate } from 'oslo';
import { serializeCookie, parseCookies } from 'oslo/cookie';
import { OAuth2Client, generateState } from 'oslo/oauth2';
import type { AuthConfig, OsmUser } from './types';

const STATE_COOKIE_NAME = 'osm_oauth_state';

export class OSMAuth {
  private oauth2Client: OAuth2Client;

  private lucia: Lucia<
    {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiry: Date;
    },
    User
  >;

  constructor(
    private authConfig: AuthConfig,
    private prisma: PrismaClient,
    private logger?: Logger,
  ) {
    const adapter = new PrismaAdapter(prisma.session, prisma.user);

    this.lucia = new Lucia(adapter, {
      sessionCookie: {
        name: '__session',
        expires: false,
        attributes: {
          secure: config.get('NODE_ENV', 'production') === 'production',
        },
      },
      getSessionAttributes({ accessToken, refreshToken, accessTokenExpiry }) {
        return {
          accessToken,
          refreshToken,
          accessTokenExpiry,
        };
      },
      getUserAttributes(attributes) {
        return attributes;
      },
    });

    this.oauth2Client = new OAuth2Client(authConfig.clientId, authConfig.authority, authConfig.tokenURI, {
      redirectURI: authConfig.redirectURI,
    });
  }

  async login() {
    const state = generateState();
    const authUrl = await this.oauth2Client.createAuthorizationURL({
      state,
      scopes: this.authConfig.scopes.split(','),
    });

    return redirect(authUrl.href, {
      headers: {
        'Set-Cookie': serializeCookie(STATE_COOKIE_NAME, state, {
          httpOnly: true,
          secure: true,
          maxAge: 60 * 10, // 10 mins,
          path: '/',
        }),
      },
    });
  }

  async validateAuthorisation(request: Request) {
    const stateCookie = this.getCookieByName(request, STATE_COOKIE_NAME);

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!stateCookie || !state || !code || stateCookie !== state) {
      this.logger?.error('Issue with code or status');
      return new Response('Invalid Request', { status: 400 });
    }

    try {
      const {
        access_token: accessToken,
        expires_in,
        refresh_token,
      } = await this.oauth2Client.validateAuthorizationCode(code, {
        credentials: this.authConfig.clientSecret,
        authenticateWith: 'request_body',
      });

      const osmResponse = await fetch(this.authConfig.resourceURI, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const { data: osmData } = (await osmResponse.json()) as OsmUser;

      const userId = osmData.user_id.toString();

      const existingUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!existingUser) {
        await this.prisma.user.create({
          data: {
            id: userId,
            name: osmData.full_name,
            email: osmData.email,
          },
        });
      }

      const session = await this.lucia.createSession(userId, {
        accessToken,
        refreshToken: refresh_token!,
        accessTokenExpiry: createDate(new TimeSpan(expires_in!, 's')),
      });
      const sessionCookie = this.lucia.createSessionCookie(session.id);

      return new Response(null, {
        status: 302,
        headers: {
          Location: 'https://localhost',
          'Set-Cookie': serializeCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes),
        },
      });
    } catch (e) {
      this.logger?.error(e as Object, 'Failed to validate authorisation');

      return new Response(null, { status: 500 });
    }
  }

  async authorise<T>(
    request: Request,
    response: LoaderFunctionArgs['response'],
    callback: (arg: { user: User; session: Session }) => T | Promise<T>,
  ): Promise<T> {
    try {
      const result = await this.getSession(request);

      // if session has been extended, create a new cookie
      if (result.session && result.session.fresh) {
        const sessionCookie = this.lucia.createSessionCookie(result.session.id);
        response!.headers.set('Set-Cookie', sessionCookie.serialize());
      }

      // delete cookie if session not found
      if (!result.session) {
        const sessionCookie = this.lucia.createBlankSessionCookie();
        response!.headers.set('Set-Cookie', sessionCookie.serialize());
      }

      if (!result.user) {
        // forcing return type to be Promise<T> so useRouteLoader type is nice
        // @ts-expect-error
        return this.login();
      }

      // refresh token if expired
      if (this.hasTokenExpired(result.session.accessTokenExpiry)) {
        await this.refreshToken(result.session);
      }

      return callback(result);
    } catch (e) {
      const error = e as Error;

      if (error.message === 'No session ID found') {
        // forcing return type to be Promise<T> so useRouteLoader type is nice
        // @ts-expect-error
        return this.login();
      }

      const sessionId = this.getCookieByName(request, this.lucia.sessionCookieName);

      if (sessionId) {
        // forcing return type to be Promise<T> so useRouteLoader type is nice
        // @ts-expect-error
        return this.logout(request);
      }

      this.logger?.error(e as Object, 'Unable to validate session');
      throw e;
    }
  }

  async logout(request: Request) {
    const sessionId = this.getCookieByName(request, this.lucia.sessionCookieName);

    if (!sessionId) {
      return redirect('/');
    }

    await this.lucia.invalidateSession(sessionId);

    return this.destroySession();
  }

  async getSession(request: Request) {
    const sessionId = this.getCookieByName(request, this.lucia.sessionCookieName);

    if (!sessionId) {
      throw new Error('No session ID found');
    }

    return await this.lucia.validateSession(sessionId);
  }

  private async refreshToken(session: Session) {
    try {
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in,
      } = await this.oauth2Client.refreshAccessToken(session.refreshToken, {
        credentials: this.authConfig.clientSecret,
        authenticateWith: 'request_body',
      });

      return await this.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          accessToken,
          refreshToken,
          accessTokenExpiry: createDate(new TimeSpan(expires_in!, 's')),
        },
      });
    } catch (e) {
      this.logger?.error(e as Object, 'Failed to validate authorisation');

      return new Response(null, { status: 500 });
    }
  }

  private hasTokenExpired(tokenExpiry: Date) {
    return tokenExpiry.getTime() < new Date().getTime();
  }

  private destroySession() {
    const sessionCookie = this.lucia.createBlankSessionCookie();

    return redirect('/', {
      headers: {
        'Set-Cookie': sessionCookie.serialize(),
      },
    });
  }

  private getCookieByName(request: Request, cookieName: string) {
    const cookies = parseCookies(request.headers.get('Cookie') ?? '');
    return cookies.get(cookieName);
  }
}

declare module 'lucia' {
  interface Register {
    Lucia: OSMAuth['lucia'];
    DatabaseUserAttributes: {
      id: number;
      name: string;
      email: string;
    };
    DatabaseSessionAttributes: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiry: Date;
    };
  }
}
