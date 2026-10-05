import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const comparePassword = (plain, passwordHash) =>
  bcrypt.compare(plain, passwordHash);
