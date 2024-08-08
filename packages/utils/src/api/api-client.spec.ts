import { http, HttpResponse } from 'msw';
import { setupServer, type SetupServer } from 'msw/node';
import { ApiClient } from './api-client';
import {
  mockAccessToken,
  mockContentDisposition,
  mockContentType,
  mockDownloadResponse,
  handlers,
  mockGetResponse,
  mockPatchBody,
  mockPostBody,
  mockPutBody,
  mockUrl,
  mockSuccessResponse,
} from './mock';

describe('[module] ApiClient', () => {
  let client: ApiClient;
  let server: SetupServer;

  beforeAll(() => {
    server = setupServer(...handlers);
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    client = new ApiClient(mockAccessToken);
  });

  describe('[fn] GET', () => {
    async function mockRequestError(response = new HttpResponse(null, { status: 500 })) {
      server.use(
        http.get(
          mockUrl,
          () => {
            throw response;
          },
          { once: true },
        ),
      );

      let body = '';
      let status = 0;

      try {
        await client.get(mockUrl);
      } catch (err: unknown) {
        const response = err as Response;

        body = await response.json();
        status = response.status;
      }

      return {
        body,
        status,
      };
    }

    it('should be authorised', async () => {
      await expect(client.get(mockUrl)).resolves.toEqual(mockGetResponse);
    });

    it('should add custom request options', async () => {
      const correlationId = 'abc-123';
      await expect(client.get(mockUrl, { headers: { 'X-Correlation-ID': correlationId } })).resolves.toEqual(
        mockGetResponse,
      );
    });

    it('should reject with default error message', async () => {
      const { body, status } = await mockRequestError();
      expect(body).toEqual({ message: 'API request error encountered' });
      expect(status).toBe(500);
    });

    it('should reject with body when message is not specified', async () => {
      const error = 'some error has occurred';
      const { body, status } = await mockRequestError(HttpResponse.json({ error }, { status: 400 }));

      expect(body).toEqual({ message: `{"error":"${error}"}` });
      expect(status).toBe(400);
    });

    it('should reject with error response body', async () => {
      const html = '<html><body>Error!</body></html>';
      const { body, status } = await mockRequestError(HttpResponse.text(html, { status: 500 }));

      expect(body).toEqual({ message: html });
      expect(status).toBe(500);
    });

    it('should reject with API message', async () => {
      const message = 'Error message from service';
      const { body, status } = await mockRequestError(HttpResponse.json({ message }, { status: 400 }));

      expect(body).toEqual({ message });
      expect(status).toBe(400);
    });
  });

  describe('[fn] POST', () => {
    it('should resolve JSON data', async () => {
      await expect(client.post(mockUrl, mockGetResponse)).resolves.toEqual(mockSuccessResponse);
    });

    it('should resolve no content', async () => {
      server.use(
        http.post(
          mockUrl,
          () => new HttpResponse(null, { status: 204 }),
          { once: true },
        ),
      );

      await expect(client.post(mockUrl, mockPostBody)).resolves.toBeUndefined();
    });

    it('should send without a request body', async () => {
      const data = { message: 'complete' };

      server.use(
        http.post(
          mockUrl,
          () => HttpResponse.json(data, { status: 200 }),
          { once: true },
        ),
      );

      await expect(client.post(mockUrl)).resolves.toEqual(data);
    });
  });

  describe('[fn] PUT', () => {
    it('should resolve JSON data', async () => {
      await expect(client.put(mockUrl, mockPutBody)).resolves.toEqual(mockSuccessResponse);
    });

    it('should resolve no content', async () => {
      server.use(
        http.put(
          mockUrl,
          () => new HttpResponse(null, { status: 204 }),
          { once: true },
        ),
      );

      await expect(client.put(mockUrl, mockGetResponse)).resolves.toBeUndefined();
    });
  });

  describe('[fn] PATCH', () => {
    it('should resolve JSON data', async () => {
      await expect(client.patch(mockUrl, mockPatchBody)).resolves.toEqual(mockSuccessResponse);
    });

    it('should resolve no content', async () => {
      server.use(
        http.patch(
          mockUrl,
          () => new HttpResponse(null, { status: 204 }),
          { once: true },
        ),
      );

      await expect(client.patch(mockUrl, mockPatchBody)).resolves.toBeUndefined();
    });
  });

  describe('[fn] Download', () => {
    it('should resolve JSON data', async () => {
      await expect(client.patch(mockUrl, mockPatchBody)).resolves.toEqual(mockSuccessResponse);
    });

    it('should resolve file content', async () => {
      server.use(
        http.patch(
          mockUrl,
          () => new HttpResponse(null, { status: 204 }),
          { once: true },
        ),
      );

      const response = await client.download(`${mockUrl}/download`);

      expect(response.ok).toBeTruthy();
      expect(response.headers.get('Content-Type')).toBe(mockContentType);
      expect(response.headers.get('Content-Disposition')).toBe(mockContentDisposition);
      expect(await response.blob().then((b) => b.text())).toBe(mockDownloadResponse);
    });
  });

  describe('[fn] HEAD', () => {
    it('should resolve no content', async () => {
      await expect(client.head(mockUrl)).resolves.toBeUndefined();
    });
  });

  describe('[fn] DELETE', () => {
    it('should resolve no content', async () => {
      await expect(client.delete(mockUrl)).resolves.toBeUndefined();
    });
  });

  describe('[fn] UPLOAD', () => {
    it('should resolve successfully', async () => {
      const formData = new FormData();
      formData.append('file', new Blob());

      await expect(client.upload(`${mockUrl}/upload`, formData)).resolves.toBeDefined();
    });
  });
});
