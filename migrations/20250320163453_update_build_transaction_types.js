/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable("build_transactions", (table) => {
        table.enu("type", [
            "Schedule",
            "Start",
            "progress-update",
            "Complete",
            "Simulation",  
            "Approval",    
            "Created"      
        ]).notNullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    console.log("Warning: PostgreSQL does not support removing ENUM values.");
};
