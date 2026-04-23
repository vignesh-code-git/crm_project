const { sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

async function migrate() {
  console.log("🚀 STARTING MIGRATION: Junction Tables -> Array Column (Robust)...");

  const entities = [
    { table: 'leads', junction: 'lead_owners', id_col: 'lead_id' },
    { table: 'deals', junction: 'deal_owners', id_col: 'deal_id' },
    { table: 'companies', junction: 'company_owners', id_col: 'company_id' },
    { table: 'tickets', junction: 'ticket_owners', id_col: 'ticket_id' }
  ];

  try {
    for (const entity of entities) {
      console.log(`\n📦 Processing ${entity.table}...`);

      // 1. Drop FK constraint if it exists
      // We search for FKs pointing from this table's owner_id column.
      const constraints = await sequelize.query(`
        SELECT constraint_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = '${entity.table}' AND column_name = 'owner_id'
      `, { type: QueryTypes.SELECT });

      for (const c of constraints) {
        console.log(`🔗 Dropping constraint ${c.constraint_name}...`);
        await sequelize.query(`ALTER TABLE ${entity.table} DROP CONSTRAINT IF EXISTS "${c.constraint_name}" CASCADE;`);
      }

      // 2. Convert owner_id from INT to INT[]
      await sequelize.query(`
        ALTER TABLE ${entity.table} 
        ALTER COLUMN owner_id SET DATA TYPE INTEGER[] 
        USING ARRAY[owner_id];
      `);
      console.log(`✅ ${entity.table}.owner_id altered to INTEGER[].`);

      // 3. Merge IDs from junction table
      await sequelize.query(`
        UPDATE ${entity.table} e
        SET owner_id = (
          SELECT ARRAY_AGG(DISTINCT uid)
          FROM (
            SELECT UNNEST(e.owner_id) as uid
            UNION
            SELECT user_id FROM ${entity.junction} j WHERE j.${entity.id_col} = e.id
          ) combined
          WHERE uid IS NOT NULL
        )
        WHERE EXISTS (
          SELECT 1 FROM ${entity.junction} j WHERE j.${entity.id_col} = e.id
        );
      `);
      console.log(`✅ ${entity.table} data merged from ${entity.junction}.`);

      // 4. Drop the junction table
      await sequelize.query(`DROP TABLE IF EXISTS ${entity.junction} CASCADE;`);
      console.log(`✅ ${entity.junction} table dropped.`);
    }

    console.log("\n✨ MIGRATION COMPLETE!");
  } catch (err) {
    console.error("\n❌ MIGRATION FAILED:", err);
  } finally {
    process.exit();
  }
}

migrate();
