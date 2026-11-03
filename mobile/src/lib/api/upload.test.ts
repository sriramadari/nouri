import { buildUploadForm } from './upload';

// A device file whose bytes are simply its path, so the test can see which file was read.
jest.mock('expo-file-system', () => ({
  File: jest.fn((uri: string) => ({
    bytes: () => Promise.resolve(new TextEncoder().encode(uri)),
  })),
}));

// Jest runs on Node's FormData, which stringifies objects; Expo's keeps the part as is.
// So check what is appended rather than reading it back.
const append = jest.spyOn(FormData.prototype, 'append');

beforeEach(() => append.mockClear());

describe('buildUploadForm (native)', () => {
  it('sends a part that reads the file from disk, with a type guessed from the extension', async () => {
    await buildUploadForm({ uri: 'file:///cache/report.PDF', name: 'report.PDF' });
    const part = append.mock.calls[0]![1] as unknown as {
      name: string;
      type: string;
      bytes: () => Promise<Uint8Array>;
    };
    expect(part).toMatchObject({ name: 'report.PDF', type: 'application/pdf' });
    // Expo's fetch reads the body through bytes(); it must come from the picked file.
    await expect(part.bytes()).resolves.toEqual(
      new TextEncoder().encode('file:///cache/report.PDF'),
    );
  });

  it('prefers the type the picker reported', async () => {
    await buildUploadForm({ uri: 'file:///x', name: 'scan', mimeType: 'image/jpeg' });
    expect(append).toHaveBeenCalledWith('file', expect.objectContaining({ type: 'image/jpeg' }));
  });

  it('sends a browser File as is', async () => {
    const file = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
    await buildUploadForm({ uri: 'blob:x', name: 'report.pdf', file });
    expect(append).toHaveBeenCalledWith('file', file);
  });
});
