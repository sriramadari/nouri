import { buildUploadForm } from './upload';

// Jest runs on Node's FormData, which stringifies objects; React Native's keeps the
// descriptor. So check what is appended rather than reading it back.
const append = jest.spyOn(FormData.prototype, 'append');

beforeEach(() => append.mockClear());

describe('buildUploadForm (native)', () => {
  it('sends a file descriptor with a type guessed from the extension', async () => {
    await buildUploadForm({ uri: 'file:///cache/report.PDF', name: 'report.PDF' });
    expect(append).toHaveBeenCalledWith('file', {
      uri: 'file:///cache/report.PDF',
      name: 'report.PDF',
      type: 'application/pdf',
    });
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
