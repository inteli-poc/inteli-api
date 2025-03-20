/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.raw(`
        ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'Simulation';
        ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'Approval';
        ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'Created';
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
};
