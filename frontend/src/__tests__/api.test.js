import { describe, it, expect, vi, afterEach } from 'vitest';
import { uploadImage } from '../core/api.js';

afterEach(() => { vi.restoreAllMocks(); });

describe('uploadImage', () => {
  it('POSTs the file as multipart form data and returns the filename', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ filename: 'abc.png' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['data'], 'pic.png', { type: 'image/png' });
    const filename = await uploadImage(file);

    expect(filename).toBe('abc.png');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/uploads');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get('file')).toBe(file);
  });

  it('throws when the upload fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(uploadImage(new File(['d'], 'a.png'))).rejects.toThrow();
  });
});
