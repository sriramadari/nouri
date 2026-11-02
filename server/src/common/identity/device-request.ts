import type { Request } from 'express';

import type { User } from '../../generated/prisma/client.js';

export const DEVICE_ID_HEADER = 'x-device-id';

/** A request after DeviceGuard has resolved the caller. */
export interface DeviceRequest extends Request {
  user: User;
}
