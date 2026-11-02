import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../common/identity/current-user.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import type { User } from '../generated/prisma/client.js';
import { toUserResponse, type UserResponse } from './user.response.js';
import { upsertProfileSchema, type UpsertProfileInput } from './users.schemas.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): UserResponse {
    return toUserResponse(user);
  }

  /** Creates or replaces the profile for this device and returns the recalculated targets. */
  @Post('me')
  async saveMe(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(upsertProfileSchema)) body: UpsertProfileInput,
  ): Promise<UserResponse> {
    return toUserResponse(await this.usersService.saveProfile(user, body));
  }
}
