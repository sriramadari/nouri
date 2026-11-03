import { Injectable } from '@nestjs/common';

import { isUniqueViolation } from '../database/prisma-errors.js';
import { PrismaService } from '../database/prisma.service.js';
import type { User } from '../generated/prisma/client.js';
import type { Targets } from './targets.js';
import type { UpsertProfileInput } from './users.schemas.js';

/** All user persistence. The only place in the users module that talks to Prisma. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the user for this device, creating an empty profile on first contact. */
  async findOrCreateByDeviceId(deviceId: string): Promise<User> {
    try {
      return await this.prisma.user.upsert({
        where: { deviceId },
        create: { deviceId },
        update: {},
      });
    } catch (error) {
      // A new phone sends several requests at once; they all try to create the user and only
      // one wins. The others read the row the winner just created.
      if (!isUniqueViolation(error)) throw error;
      return this.prisma.user.findUniqueOrThrow({ where: { deviceId } });
    }
  }

  updateProfile(userId: string, profile: UpsertProfileInput, targets: Targets): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...profile,
        calorieTarget: targets.calories,
        proteinTarget: targets.proteinG,
      },
    });
  }
}
