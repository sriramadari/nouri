import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UsersService } from '../../users/users.service.js';
import { AppError } from '../errors/app-error.js';
import { DEVICE_ID_HEADER, type DeviceRequest } from './device-request.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/** The app sends a UUID; this also allows other opaque ids without allowing junk. */
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Identity without login: every request carries an `x-device-id` header generated on the
 * phone. The guard resolves that device to a user (creating one on first contact) and
 * attaches it to the request. Registered globally, so new routes are protected by default.
 */
@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<DeviceRequest>();
    const deviceId = request.header(DEVICE_ID_HEADER)?.trim();

    if (!deviceId) {
      throw new AppError('DEVICE_ID_MISSING', `The ${DEVICE_ID_HEADER} header is required.`);
    }
    if (!DEVICE_ID_PATTERN.test(deviceId)) {
      throw new AppError(
        'DEVICE_ID_INVALID',
        `The ${DEVICE_ID_HEADER} header is not a valid device id.`,
      );
    }

    request.user = await this.usersService.resolveByDeviceId(deviceId);
    return true;
  }
}
