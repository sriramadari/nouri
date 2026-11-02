import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { User } from '../../generated/prisma/client.js';
import type { UsersService } from '../../users/users.service.js';
import { ApiException } from '../errors/api.exception.js';
import { DeviceGuard } from './device.guard.js';

const user = { id: 'user-1', deviceId: 'device-abc-123' } as User;

function contextWithHeaders(headers: Record<string, string>) {
  const request: { header: (name: string) => string | undefined; user?: User } = {
    header: (name) => headers[name.toLowerCase()],
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function createGuard(isPublic = false) {
  const reflector = { getAllAndOverride: () => isPublic } as unknown as Reflector;
  const resolveByDeviceId = vi.fn().mockResolvedValue(user);
  const usersService = { resolveByDeviceId } as unknown as UsersService;
  return { guard: new DeviceGuard(reflector, usersService), resolveByDeviceId };
}

async function expectErrorCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ApiException);
  await expect(promise).rejects.toMatchObject({ code });
}

describe('DeviceGuard', () => {
  it('resolves the user and attaches it to the request', async () => {
    const { guard, resolveByDeviceId } = createGuard();
    const { context, request } = contextWithHeaders({ 'x-device-id': 'device-abc-123' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(resolveByDeviceId).toHaveBeenCalledWith('device-abc-123');
    expect(request.user).toBe(user);
  });

  it('rejects a request without a device id', async () => {
    const { guard } = createGuard();
    await expectErrorCode(guard.canActivate(contextWithHeaders({}).context), 'DEVICE_ID_MISSING');
  });

  it('rejects a malformed device id', async () => {
    const { guard } = createGuard();
    const { context } = contextWithHeaders({ 'x-device-id': 'bad id!' });
    await expectErrorCode(guard.canActivate(context), 'DEVICE_ID_INVALID');
  });

  it('lets public routes through without a device id', async () => {
    const { guard, resolveByDeviceId } = createGuard(true);
    await expect(guard.canActivate(contextWithHeaders({}).context)).resolves.toBe(true);
    expect(resolveByDeviceId).not.toHaveBeenCalled();
  });
});
