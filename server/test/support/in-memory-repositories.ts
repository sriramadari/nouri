import type { Meal, User } from '../../src/generated/prisma/client.js';
import type { NewMeal } from '../../src/meals/meals.repository.js';
import type { Targets } from '../../src/users/targets.js';
import type { UpsertProfileInput } from '../../src/users/users.schemas.js';

/** Stand ins for the Prisma backed repositories, so e2e tests run without a database. */
export class InMemoryUsersRepository {
  private readonly byDevice = new Map<string, User>();

  async findOrCreateByDeviceId(deviceId: string): Promise<User> {
    const existing = this.byDevice.get(deviceId);
    if (existing) return existing;
    const user = {
      id: `user-${this.byDevice.size + 1}`,
      deviceId,
      name: null,
      age: null,
      sex: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      goal: null,
      calorieTarget: null,
      proteinTarget: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } satisfies User;
    this.byDevice.set(deviceId, user);
    return user;
  }

  async updateProfile(userId: string, profile: UpsertProfileInput, targets: Targets) {
    const user = [...this.byDevice.values()].find((u) => u.id === userId)!;
    const updated: User = {
      ...user,
      ...profile,
      calorieTarget: targets.calories,
      proteinTarget: targets.proteinG,
    };
    this.byDevice.set(user.deviceId, updated);
    return updated;
  }
}

export class InMemoryMealsRepository {
  private readonly rows: Meal[] = [];

  async createOnce(meal: NewMeal) {
    const existing = this.rows.find(
      (row) => row.userId === meal.userId && row.clientRequestId === meal.clientRequestId,
    );
    if (existing) return { meal: existing, created: false };
    const row = {
      ...meal,
      id: `meal-${this.rows.length + 1}`,
      createdAt: new Date(),
    } as unknown as Meal;
    this.rows.push(row);
    return { meal: row, created: true };
  }

  async findBetween(userId: string, from: Date, to: Date) {
    return this.rows.filter((r) => r.userId === userId && r.eatenAt >= from && r.eatenAt < to);
  }
}
