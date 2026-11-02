// Runs before any test file is imported. AppModule validates the environment on import,
// so test values must be in place first. Real values from .env are never needed here.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.AI_PROVIDER = 'mock';
