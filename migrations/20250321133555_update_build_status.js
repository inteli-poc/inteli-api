/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.raw(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'build_status') THEN
              CREATE TYPE build_status AS ENUM (
                  'Created',
                  'Scheduled',
                  'Started',
                  'Completed',
                  'Simulated',
                  'Approved'
              );
          END IF;
      END
      $$;
  
      ALTER TABLE build ADD COLUMN status_new build_status;
  
      UPDATE build SET status_new = type::text::build_status;
  
      ALTER TABLE build DROP COLUMN status;
  
      ALTER TABLE build RENAME COLUMN status_new TO status;
    `);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
  };
  