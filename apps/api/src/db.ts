import { PrismaClient } from "../generated/client/index.js";

// Single shared Prisma client instance for the whole process.
export const db = new PrismaClient();
