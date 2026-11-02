import { AiError } from '../ai/ai.errors.js';
import { MockProvider } from '../ai/mock/mock.provider.js';
import type { User } from '../generated/prisma/client.js';
import type { NormalizedMarker } from './biomarkers/normalize.js';
import type { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

const user = { id: 'user-1', sex: 'FEMALE' } as User;
const upload = { buffer: Buffer.from('pdf'), mimetype: 'application/pdf' };

function setup(ai = new MockProvider()) {
  const repository = {
    startReport: vi.fn().mockResolvedValue('report-1'),
    completeReport: vi.fn(async (id: string, markers: NormalizedMarker[]) => ({
      id,
      userId: user.id,
      uploadedAt: new Date('2026-11-02T10:00:00Z'),
      status: 'COMPLETED',
      biomarkers: markers.map((marker, i) => ({ ...marker, id: `bm-${i}`, reportId: id })),
    })),
    failReport: vi.fn(),
    findLatestCompleted: vi.fn().mockResolvedValue(null),
  };
  return {
    ai,
    repository,
    reports: new ReportsService(ai, repository as unknown as ReportsRepository),
  };
}

describe('ReportsService', () => {
  it('extracts, normalises and stores the markers, flagged first', async () => {
    const { reports, repository } = setup();
    const result = await reports.upload(user, upload);

    expect(result.status).toBe('COMPLETED');
    expect(result.flaggedCount).toBe(5);
    expect(result.biomarkers.slice(0, 5).every((m) => m.status !== 'NORMAL')).toBe(true);
    expect(result.skipped).toEqual([{ name: 'Vitamin B12', reason: 'VALUE_UNREADABLE' }]);
    expect(repository.failReport).not.toHaveBeenCalled();
  });

  it('marks the report failed when the file is not a lab report', async () => {
    const { reports, repository, ai } = setup();
    vi.spyOn(ai, 'extractReport').mockResolvedValue({ issue: 'NOT_A_REPORT', markers: [] });

    await expect(reports.upload(user, upload)).rejects.toMatchObject({ code: 'REPORT_UNREADABLE' });
    expect(repository.failReport).toHaveBeenCalledWith('report-1');
  });

  it('marks the report failed when nothing usable was read', async () => {
    const { reports, repository, ai } = setup();
    vi.spyOn(ai, 'extractReport').mockResolvedValue({
      issue: 'NONE',
      markers: [{ name: 'LDL', value: null, unit: 'mg/dL', refLow: null, refHigh: 100 }],
    });

    await expect(reports.upload(user, upload)).rejects.toMatchObject({ code: 'REPORT_UNREADABLE' });
    expect(repository.failReport).toHaveBeenCalled();
  });

  it('marks the report failed and passes AI errors through', async () => {
    const { reports, repository, ai } = setup();
    vi.spyOn(ai, 'extractReport').mockRejectedValue(new AiError('TIMEOUT', 'slow'));

    await expect(reports.upload(user, upload)).rejects.toBeInstanceOf(AiError);
    expect(repository.failReport).toHaveBeenCalled();
  });

  it('says clearly when there is no report yet', async () => {
    await expect(setup().reports.latest(user)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
