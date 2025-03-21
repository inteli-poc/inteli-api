const logger = require('../app/utils/Logger')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'build_transaction_type') THEN
                CREATE TYPE build_transaction_type AS ENUM (
                    'Schedule',
                    'Start',
                    'progress-update',
                    'Complete',
                    'Simulation',
                    'Approval',
                    'Created'
                );
            END IF;
        END $$;

        ALTER TABLE build_transactions ADD COLUMN type_new build_transaction_type;

        UPDATE build_transactions SET type_new = type::text::build_transaction_type;

        ALTER TABLE build_transactions DROP COLUMN type;

        ALTER TABLE build_transactions RENAME COLUMN type_new TO type;
    `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {
  logger.log('Warning: PostgreSQL does not support removing ENUM values.')
}
