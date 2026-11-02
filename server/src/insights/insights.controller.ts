import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { CurrentUser } from '../common/identity/current-user.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import type { User } from '../generated/prisma/client.js';
import { type PhraseInsightInput, phraseInsightSchema } from './insights.schemas.js';
import { type PhrasedInsight, InsightsService } from './insights.service.js';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  phrase(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(phraseInsightSchema)) body: PhraseInsightInput,
  ): Promise<PhrasedInsight> {
    return this.insightsService.phrase(user, body);
  }
}
