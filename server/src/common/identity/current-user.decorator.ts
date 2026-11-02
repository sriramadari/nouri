import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { User } from '../../generated/prisma/client.js';
import type { DeviceRequest } from './device-request.js';

/** Injects the user that DeviceGuard resolved for this request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<DeviceRequest>().user,
);
