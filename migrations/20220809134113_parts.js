/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
    const now = () => knex.fn.now()
  
    await knex.schema.createTable('parts', (def) => {
      def.uuid('id').defaultTo(uuidGenerateV4())
      def.specificType('recipe_id','uuid').notNullable()
      def.specificType('build_id', 'uuid').notNullable()
      def.string('supplier').notNullable()
      def.json('certifications')
      def.datetime('created_at').notNullable().default(now())
      def.datetime('updated_at').notNullable().default(now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTable('parts')
};
