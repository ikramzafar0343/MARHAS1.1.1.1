process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-minimum-32-characters-long';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/marhas_test?schema=public';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'src/uploads/test';
