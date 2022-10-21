exports.up = async (knex) => {
  // check extension is not installed
  const [extInstalled] = await knex('pg_extension').select('*').where({ extname: 'uuid-ossp' })

  if (!extInstalled) {
    await knex.raw('CREATE EXTENSION "uuid-ossp"')
  }

  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('attachments', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('filename', 255).notNullable()
    def.binary('binary_blob').notNullable()
    def.datetime('created_at').notNullable().default(now())

    def.primary(['id'])
  })

  await knex.schema.createTable('recipes', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())

    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.string('external_id').notNullable()
    def.string('name').notNullable()
    def.uuid('image_attachment_id').notNullable()
    def.string('material').notNullable()
    def.string('alloy').notNullable()
    def.string('price').notNullable()
    def.json('required_certs').notNullable()
    def.string('supplier').notNullable()
    def.string('owner', 48).notNullable()
    def.integer('latest_token_id')
    def.integer('original_token_id')
    def.primary(['id'])

    def.foreign('image_attachment_id').references('id').on('attachments').onDelete('CASCADE').onUpdate('CASCADE')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('recipes')
  await knex.schema.dropTable('attachments')
  await knex.raw('DROP EXTENSION "uuid-ossp"')
}
