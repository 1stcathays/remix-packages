import { http, HttpResponse } from 'msw';

export const mockUrl = 'https://api.test/resource';
export const mockAccessToken = '--access-token--';

export const mockGetResponse = { one: 'two' };
export const mockPostBody = { three: 'four' };
export const mockPutBody = { five: 'six' };
export const mockPatchBody = { seven: 'eight' };

export const mockSuccessResponse = { message: 'success' };

export const mockContentType = 'application/octet-stream';
export const mockContentDisposition = 'attachment; filename=test-file.txt';
export const mockDownloadResponse = 'This is a text file';

const getHandler = http.get(mockUrl, ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${mockAccessToken}`)
    throw new HttpResponse(null, { status: 403 });

  const correlationId = request.headers.get('X-Correlation-ID');

  if (correlationId && correlationId !== 'abc-123') throw new HttpResponse(null, { status: 400 });

  return HttpResponse.json(mockGetResponse);
});

const postHandler = http.post(mockUrl, async ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${mockAccessToken}`)
    throw new HttpResponse(null, { status: 403 });

  const correlationId = request.headers.get('X-Correlation-ID');

  if (correlationId && correlationId !== 'abc-123') throw new HttpResponse(null, { status: 400 });

  if (!JSON.stringify((await request.json()) !== JSON.stringify(mockPostBody)))
    throw new HttpResponse(null, { status: 400 });

  return HttpResponse.json(mockSuccessResponse, { status: 200 });
});

const putHandler = http.put(mockUrl, async ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${mockAccessToken}`)
    throw new HttpResponse(null, { status: 403 });

  const correlationId = request.headers.get('X-Correlation-ID');

  if (correlationId && correlationId !== 'abc-123') throw new HttpResponse(null, { status: 400 });

  if (!JSON.stringify((await request.json()) !== JSON.stringify(mockPutBody)))
    throw new HttpResponse(null, { status: 400 });

  return HttpResponse.json(mockSuccessResponse, { status: 200 });
});

const patchHandler = http.patch(mockUrl, async ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${mockAccessToken}`)
    throw new HttpResponse(null, { status: 403 });

  const correlationId = request.headers.get('X-Correlation-ID');

  if (correlationId && correlationId !== 'abc-123') throw new HttpResponse(null, { status: 400 });

  if (!JSON.stringify((await request.json()) !== JSON.stringify(mockPatchBody)))
    throw new HttpResponse(null, { status: 400 });

  return HttpResponse.json(mockSuccessResponse, { status: 200 });
});

const downloadHandler = http.get(`${mockUrl}/download`, async ({ request }) => {
  if (request.headers.get('Authorization') !== `Bearer ${mockAccessToken}`)
    throw new HttpResponse(null, { status: 403 });

  const correlationId = request.headers.get('X-Correlation-ID');

  if (correlationId && correlationId !== 'abc-123') throw new HttpResponse(null, { status: 400 });

  if (!JSON.stringify((await request.json()) !== JSON.stringify(mockPatchBody)))
    throw new HttpResponse(null, { status: 400 });

  return HttpResponse.arrayBuffer(Buffer.from(mockDownloadResponse, 'utf8'), {
    headers: {
      'Content-Type': mockContentType,
      'Content-Disposition': mockContentDisposition,
    },
    status: 200,
  });
});

const headHandler = http.head(mockUrl, () => new HttpResponse(null, { status: 204 }));

const deleteHandler = http.delete(mockUrl, () => new HttpResponse(null, { status: 204 }));

const uploadHandler = http.post(`${mockUrl}/upload`, async ({ request }) => {
  const arrayBuffer = await request.arrayBuffer();

  if (!arrayBuffer) throw new HttpResponse(null, { status: 400 });

  return HttpResponse.json(mockSuccessResponse, { status: 200 });
});

export const handlers = [
  getHandler,
  postHandler,
  putHandler,
  patchHandler,
  downloadHandler,
  headHandler,
  deleteHandler,
  uploadHandler,
];
