import { Module } from '@nestjs/common';

import { MealsController } from './meals.controller.js';
import { MealsRepository } from './meals.repository.js';
import { MealsService } from './meals.service.js';

@Module({
  controllers: [MealsController],
  providers: [MealsService, MealsRepository],
})
export class MealsModule {}
