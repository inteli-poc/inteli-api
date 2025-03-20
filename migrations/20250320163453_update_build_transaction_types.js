/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.raw(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'build_transaction_type') THEN
                CREATE TYPE build_transaction_type AS ENUM ('Schedule', 'Start', 'progress-update', 'Complete');
            END IF;
        END $$;
        
        ALTER TYPE build_transaction_type ADD VALUE IF NOT EXISTS 'Simulation';
        ALTER TYPE build_transaction_type ADD VALUE IF NOT EXISTS 'Approval';
        ALTER TYPE build_transaction_type ADD VALUE IF NOT EXISTS 'Created';

        ALTER TABLE build_transactions 
        ALTER COLUMN type TYPE build_transaction_type USING type::text::build_transaction_type;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
};
