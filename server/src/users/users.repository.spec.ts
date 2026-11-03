import type { PrismaService } from '../database/prisma.service.js';
import { Prisma, type User } from '../generated/prisma/client.js';
import { UsersRepository } from './users.repository.js';

const user = { id: 'user-1', deviceId: 'device-abc-123' } as User;
const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
  code: 'P2002',
  clientVersion: 'test',
});

function setup(upsert: ReturnType<typeof vi.fn>) {
  const findUniqueOrThrow = vi.fn().mockResolvedValue(user);
  const prisma = { user: { upsert, findUniqueOrThrow } } as unknown as PrismaService;
  return { repository: new UsersRepository(prisma), findUniqueOrThrow };
}

describe('UsersRepository.findOrCreateByDeviceId', () => {
  it('creates or returns the user in one step', async () => {
    const { repository, findUniqueOrThrow } = setup(vi.fn().mockResolvedValue(user));
    await expect(repository.findOrCreateByDeviceId(user.deviceId)).resolves.toBe(user);
    expect(findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('reads the existing row when a parallel request created it first', async () => {
    const { repository, findUniqueOrThrow } = setup(vi.fn().mockRejectedValue(uniqueViolation));
    await expect(repository.findOrCreateByDeviceId(user.deviceId)).resolves.toBe(user);
    expect(findUniqueOrThrow).toHaveBeenCalledWith({ where: { deviceId: user.deviceId } });
  });

  it('passes other database errors through', async () => {
    const { repository } = setup(vi.fn().mockRejectedValue(new Error('connection lost')));
    await expect(repository.findOrCreateByDeviceId(user.deviceId)).rejects.toThrow(
      'connection lost',
    );
  });
});
