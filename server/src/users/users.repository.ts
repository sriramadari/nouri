import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import type { User } from '../generated/prisma/client.js';
import type { Targets } from './targets.js';
import type { UpsertProfileInput } from './users.schemas.js';

/** All user persistence. The only place in the users module that talks to Prisma. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the user for this device, creating an empty profile on first contact. */
  findOrCreateByDeviceId(deviceId: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { deviceId },
      create: { deviceId },
      update: {},
    });
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
