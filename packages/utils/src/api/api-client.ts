import type { Logger } from '@1stcathays/remix-logging';

type Url = string | URL;

export class ApiClient {
  constructor(
    /**
     * Bearer token for authenticated user
     */
    private readonly accessToken: string,

    /**
     * Logger for request logging
     */
    private readonly logger?: Logger,
  ) {
    this.accessToken = accessToken;
    this.logger = logger;
  }

  /**
   * Perform a GET request
   * @param {Url} url - the resource path
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {T} the request's response
   */
  get<T>(url: Url, requestOptions?: RequestInit): Promise<T> {
    return this.jsonRequest(url, { ...requestOptions, method: 'GET' });
  }

  /**
   * Perform a POST request
   * @param {Url} url - the resource path
   * @param {unknown} body - the request body
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {T} the request's response
   */
  post<T, V = unknown>(url: Url, body?: V, requestOptions?: RequestInit): Promise<T> {
    const isAlreadySerialised = body instanceof FormData || body instanceof URLSearchParams;
    const serialisedBody = isAlreadySerialised ? body : JSON.stringify(body);

    return this.jsonRequest(url, {
      ...requestOptions,
      body: body ? serialisedBody : null,
      method: 'POST',
    });
  }

  /**
   * Perform a PUT request
   * @param {Url} url - the resource path
   * @param {unknown} body - the request body
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {T} the request's response
   */
  put<T>(url: Url, body?: unknown, requestOptions?: RequestInit): Promise<T> {
    return this.jsonRequest(url, {
      ...requestOptions,
      body: body ? JSON.stringify(body) : null,
      method: 'PUT',
    });
  }

  /**
   * Perform a PATCH request
   * @param {Url} url - the resource path
   * @param {unknown} body - the request body
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {T} the request's response
   */
  patch<T>(url: Url, body: unknown, requestOptions?: RequestInit): Promise<T> {
    return this.jsonRequest(url, {
      ...requestOptions,
      body: JSON.stringify(body),
      method: 'PATCH',
    });
  }

  /**
   * Perform a streaming download GET request
   * @param {Url} url - the resource path
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {Response} the request's response
   */
  download(url: Url, requestOptions?: RequestInit): Promise<Response> {
    const options = {
      ...requestOptions,
      headers: {
        Accept: 'application/octet-stream',
        'Content-Type': 'application/octet-stream',
        ...requestOptions?.headers,
      },
      responseType: 'stream',
    };

    return this.jsonRequest(url, options);
  }

  /**
   * Perform an uploading POST request
   * @param {Url} url - the resource path
   * @param {FormData} body - request body
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {Response} the request's response
   */
  upload(url: Url, body: FormData, requestOptions?: RequestInit): Promise<Response> {
    return this.jsonRequest(url, {
      ...requestOptions,
      body,
      method: 'POST',
    });
  }

  /**
   * Perform a HEAD request
   * @param {Url} url - the resource path
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {Response} the request's response
   */
  head(url: Url, requestOptions?: RequestInit): Promise<Response> {
    return this.jsonRequest(url, {
      ...requestOptions,
      method: 'HEAD',
    });
  }

  /**
   * Perform a DELETE request
   * @param {Url} url - the resource path
   * @param {RequestInit} requestOptions - request (fetch) options
   * @returns {T} the request's response
   */
  delete<T>(url: Url, requestOptions?: RequestInit): Promise<T> {
    return this.jsonRequest(url, {
      ...requestOptions,
      method: 'DELETE',
    });
  }

  private async jsonRequest<T>(url: Url, requestOptions?: RequestInit): Promise<T> {
    const options = {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...requestOptions?.headers,
      },
    };

    return this.authorisedRequest(url, options).then(async (response) => {
      if (response.status !== 204) {
        const json = await response.json();
        this.logger?.debug({ json }, 'API response body');

        return json;
      }
    });
  }

  private async authorisedRequest(url: Url, requestOptions: RequestInit = {}): Promise<Response> {
    const options: RequestInit = {
      method: 'GET',
      ...requestOptions,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...requestOptions.headers,
      },
    };

    this.logger?.debug({ url, ...options }, 'API request');

    return fetch(url, options).then((response) => {
      this.logger?.debug(
        {
          headers: response.headers,
          status: response.status,
          url,
        },
        'API response',
      );

      if (response.ok) return response;

      return response
        .text()
        .catch((err) => {
          this.logger?.error({ err }, 'Failed to get error response body');
        })
        .then((body) => {
          let errorMessage;

          try {
            if (body) {
              const { message } = JSON.parse(body);
              errorMessage = message ?? body;
            }
          } catch (err) {
            errorMessage = body;
          }

          this.logger?.error({
            body,
            method: options.method,
            status: response.status,
            statusText: response.statusText,
            url,
          });

          throw new Response(JSON.stringify({ message: errorMessage ?? 'API request error encountered' }), {
            headers: {
              'Content-Type': 'application/json',
            },
            status: response.status,
          });
        });
    });
  }
}
