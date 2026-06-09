export const SEED_ADMIN = {
  email: 'admin@marhas.com',
  password: 'marhas123',
  name: 'MARHAS Admin'
};

export const validateAdminCredentials = (email, password) => {
  const normalizedEmail = email?.trim().toLowerCase() || '';

  return (
    normalizedEmail === SEED_ADMIN.email.toLowerCase() && password === SEED_ADMIN.password
  );
};
