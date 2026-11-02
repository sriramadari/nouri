import { ApiError } from '../api/api-error';
import { flushQueue, type QueuedJob, useOfflineQueue } from './offline-queue';

const offline = new ApiError(0, 'NETWORK_ERROR', 'Offline');
const invalid = new ApiError(400, 'VALIDATION_FAILED', 'Bad meal');

function queueJobs(...ids: string[]) {
  ids.forEach((id) => useOfflineQueue.getState().enqueue({ id, kind: 'meal', payload: { id } }));
}

const pendingIds = () => useOfflineQueue.getState().pending.map((job) => job.id);

beforeEach(() => {
  useOfflineQueue.setState({ pending: [], failed: [] });
});

describe('offline queue', () => {
  it('ignores a job that is already queued (same idempotency key)', () => {
    queueJobs('a', 'a');
    expect(pendingIds()).toEqual(['a']);
  });

  it('sends jobs oldest first and removes them once sent', async () => {
    queueJobs('a', 'b');
    const sent: string[] = [];

    await flushQueue(async (job: QueuedJob) => {
      sent.push(job.id);
    });

    expect(sent).toEqual(['a', 'b']);
    expect(pendingIds()).toEqual([]);
  });

  it('stops at the first connection problem and keeps the rest for later', async () => {
    queueJobs('a', 'b');
    const send = jest.fn().mockRejectedValue(offline);

    await flushQueue(send);

    expect(send).toHaveBeenCalledTimes(1);
    expect(pendingIds()).toEqual(['a', 'b']);
    expect(useOfflineQueue.getState().pending[0]).toMatchObject({
      attempts: 1,
      lastError: 'Offline',
    });
  });

  it('moves a job the server rejects for good to failed and carries on', async () => {
    queueJobs('a', 'b');
    const send = jest.fn().mockRejectedValueOnce(invalid).mockResolvedValueOnce(undefined);

    await flushQueue(send);

    expect(pendingIds()).toEqual([]);
    expect(useOfflineQueue.getState().failed.map((job) => job.id)).toEqual(['a']);
  });

  it('includes jobs added while a flush is running', async () => {
    queueJobs('a');
    const sent: string[] = [];
    await flushQueue(async (job) => {
      sent.push(job.id);
      if (job.id === 'a') queueJobs('b');
    });
    expect(sent).toEqual(['a', 'b']);
    expect(pendingIds()).toEqual([]);
  });

  it('runs only one flush at a time', async () => {
    queueJobs('a');
    let release: () => void = () => undefined;
    const send = jest.fn(() => new Promise<void>((resolve) => (release = resolve)));

    const first = flushQueue(send);
    const second = flushQueue(send); // joins the flush already running
    expect(second).toBe(first);
    release();
    await first;

    expect(send).toHaveBeenCalledTimes(1);
  });
});
