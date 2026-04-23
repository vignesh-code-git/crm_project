const { Lead, Deal, Company, Ticket, User, sequelize } = require("../models");

async function migrate() {
  console.log("🚀 Starting Multi-Owner Data Migration...");

  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const entities = [
      { model: Lead, junctionField: 'shared_owners', name: 'Leads' },
      { model: Deal, junctionField: 'shared_owners', name: 'Deals' },
      { model: Company, junctionField: 'shared_owners', name: 'Companies' },
      { model: Ticket, junctionField: 'shared_owners', name: 'Tickets' },
    ];

    for (const { model, junctionField, name } of entities) {
      console.log(`📦 Migrating ${name}...`);
      const records = await model.findAll();
      
      for (const record of records) {
        // Use the existing multi_owners array column
        const ownerIds = record.multi_owners || [];
        
        // Add the primary owner_id if it's not already in the array
        if (record.owner_id && !ownerIds.includes(record.owner_id)) {
          ownerIds.push(record.owner_id);
        }

        if (ownerIds.length > 0) {
          // Filter out nulls/NaNs and ensure they exist in User table
          const potentialIds = [...new Set(ownerIds.filter(id => id && !isNaN(id)))];
          const existingUsers = await User.findAll({
            where: { id: potentialIds },
            attributes: ['id']
          });
          const validIds = existingUsers.map(u => u.id);
          
          if (validIds.length > 0) {
            // Sequelize belongsToMany helper: set[AsName]
            // For Lead it will be record.setShared_owners(validIds)
            // But usually it's camelCase based on the 'as' alias.
            
            // To be safe, use the specific methods based on 'as'
            const method = `setShared_owners`; // Check index.js 'as'
            // Actually, Sequelize lowercase matching: shared_owners -> setShared_owners or setSharedOwners
            
            // Let's use the explicit method name:
            if (typeof record.setShared_owners === 'function') {
                await record.setShared_owners(validIds);
            } else if (typeof record.setSharedOwners === 'function') {
                await record.setSharedOwners(validIds);
            } else {
                // Fallback: manually insert into junction table
                const table = `${name.toLowerCase().slice(0, -1)}_owners`;
                for (const uid of validIds) {
                    await sequelize.query(
                        `INSERT INTO ${table} (${name.toLowerCase().slice(0, -1)}_id, user_id, created_at) 
                         VALUES (${record.id}, ${uid}, NOW()) 
                         ON CONFLICT DO NOTHING`
                    );
                }
            }
          }
        }
      }
      console.log(`✅ ${name} migration complete.`);
    }

    console.log("🎉 All data migrated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
