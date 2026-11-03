import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../common/identity/current-user.decorator.js';
import {
  AUDIO_TYPES,
  IMAGE_TYPES,
  MB,
  requireUpload,
  UPLOAD_FIELD,
} from '../common/files/uploads.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import type { User } from '../generated/prisma/client.js';
import type { DayMealsResponse, MealDraft, MealResponse } from './meal.response.js';
import {
  type CreateMealInput,
  createMealSchema,
  type ListMealsQuery,
  listMealsQuerySchema,
  type StreakQuery,
  streakQuerySchema,
  type SummaryQuery,
  summaryQuerySchema,
} from './meals.schemas.js';
import type { DayTotals } from './meals.repository.js';
import type { Streak } from './streak.js';
import { MealsService } from './meals.service.js';

/** Photos are compressed on the phone to well under 1 MB; this leaves room for raw uploads. */
const MAX_MEAL_UPLOAD_BYTES = 10 * MB;

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  /** Multipart upload of a meal photo or voice note. Returns a draft; does not save. */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor(UPLOAD_FIELD, { limits: { fileSize: MAX_MEAL_UPLOAD_BYTES } }))
  analyze(@UploadedFile() file: Express.Multer.File | undefined): Promise<MealDraft> {
    return this.mealsService.analyze(
      requireUpload(file, [...IMAGE_TYPES, ...AUDIO_TYPES], 'meal photo or voice note'),
    );
  }

  @Post()
  save(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createMealSchema)) body: CreateMealInput,
  ): Promise<MealResponse> {
    return this.mealsService.save(user, body);
  }

  /** Per day totals for the weekly wins card. */
  @Get('summary')
  summary(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(summaryQuerySchema)) query: SummaryQuery,
  ): Promise<{ days: DayTotals[] }> {
    return this.mealsService.summary(user, query);
  }

  @Get('streak')
  streak(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(streakQuerySchema)) query: StreakQuery,
  ): Promise<Streak> {
    return this.mealsService.streak(user, query);
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(listMealsQuerySchema)) query: ListMealsQuery,
  ): Promise<DayMealsResponse> {
    return this.mealsService.listForDay(user, query);
  }
}
