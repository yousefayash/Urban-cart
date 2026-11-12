import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
    path: fileURLToPath(new URL('../.env', import.meta.url))
});

export const JWT_SECRET = process.env.JWT_SECRET;

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim().length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}
