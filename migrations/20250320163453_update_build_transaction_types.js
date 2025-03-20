/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.raw(`
        CREATE TYPE build_transaction_type AS ENUM (
            'Schedule',
            'Start',
            'progress-update',
            'Complete',
            'Simulation',
            'Approval',
            'Created'
        );

        ALTER TABLE build_transactions 
        ALTER COLUMN type TYPE build_transaction_type 
        USING type::text::build_transaction_type;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
};
