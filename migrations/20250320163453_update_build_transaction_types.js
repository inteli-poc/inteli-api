/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('build_transactions', (table) => {
        table.specificType('type', `ENUM('Schedule', 'Start', 'progress-update', 'Complete', 'Simulation', 'Approval', 'Created')`).alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
};
