import { Injectable } from '@nestjs/common';

import type { User } from '../generated/prisma/client.js';
import { calculateTargets } from './targets.js';
import type { UpsertProfileInput } from './users.schemas.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  resolveByDeviceId(deviceId: string): Promise<User> {
    return this.users.findOrCreateByDeviceId(deviceId);
  }

  /**
   * Saves the profile and recalculates targets on the server, so the stored plan never
   * depends on numbers sent by the client.
   */
  saveProfile(user: User, profile: UpsertProfileInput): Promise<User> {
    return this.users.updateProfile(user.id, profile, calculateTargets(profile));
  }
}
