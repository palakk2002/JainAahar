const dns = require('node:dns');
// Use public DNS to prevent Atlas SRV resolution failures
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const { MongoClient } = require('mongodb');

const sourceUri = 'mongodb+srv://orangebasket:orange123098@orangebasket.el1udca.mongodb.net/orangebasket';
const targetUri = 'mongodb+srv://aaharjain_db_user:QU7tOXjXgDl5TEDu@cluster0.yggwdhz.mongodb.net/?appName=Cluster0';

async function migrate() {
  const sourceDbName = 'orangebasket';
  // Target DB is 'test' as approved by user
  const targetDbName = 'test';
  
  console.log(`Starting migration from Source DB "${sourceDbName}" to Target DB "${targetDbName}"...`);
  
  let sourceClient;
  let targetClient;
  
  try {
    sourceClient = new MongoClient(sourceUri);
    targetClient = new MongoClient(targetUri);
    
    await sourceClient.connect();
    console.log('Connected to Source MongoDB successfully.');
    
    await targetClient.connect();
    console.log('Connected to Target MongoDB successfully.');
    
    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);
    
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database.`);
    
    for (const colInfo of collections) {
      const colName = colInfo.name;
      
      // Skip system collections
      if (colName.startsWith('system.')) {
        console.log(`Skipping system collection: ${colName}`);
        continue;
      }
      
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);
      
      const docCount = await sourceCol.countDocuments();
      console.log(`\nMigrating collection: "${colName}" (${docCount} documents)`);
      
      // Drop target collection to start fresh
      try {
        await targetCol.drop();
        console.log(`  - Dropped existing collection "${colName}" on target.`);
      } catch (err) {
        if (err.codeName !== 'NamespaceNotFound') {
          console.log(`  - Info: Could not drop collection "${colName}": ${err.message}`);
        }
      }
      
      if (docCount > 0) {
        // Read all documents from source
        const documents = await sourceCol.find({}).toArray();
        
        // Insert into target
        const result = await targetCol.insertMany(documents);
        console.log(`  - Successfully inserted ${result.insertedCount} documents into target.`);
      } else {
        // If empty, create the collection on the target
        await targetDb.createCollection(colName);
        console.log(`  - Created empty collection "${colName}" on target.`);
      }
      
      // Copy indexes (except the default _id index)
      try {
        const indexes = await sourceCol.indexes();
        for (const idx of indexes) {
          if (idx.name === '_id_') continue;
          
          let key = idx.key;
          const options = {};
          if (idx.unique) options.unique = true;
          if (idx.name) options.name = idx.name;
          if (idx.background) options.background = true;
          if (idx.sparse) options.sparse = true;
          if (idx.expireAfterSeconds !== undefined) options.expireAfterSeconds = idx.expireAfterSeconds;
          if (idx.partialFilterExpression) options.partialFilterExpression = idx.partialFilterExpression;
          if (idx.collation) options.collation = idx.collation;
          
          // Handle text indexes
          if (idx.weights) {
            key = {};
            for (const field of Object.keys(idx.weights)) {
              key[field] = 'text';
            }
            options.weights = idx.weights;
            if (idx.default_language) options.default_language = idx.default_language;
            if (idx.language_override) options.language_override = idx.language_override;
          }
          
          await targetCol.createIndex(key, options);
          console.log(`  - Recreated index "${idx.name}"`);
        }
      } catch (idxErr) {
        console.error(`  - Warning: Failed to recreate indexes for "${colName}": ${idxErr.message}`);
      }
    }
    
    console.log('\n=============================================');
    console.log('🎉 Migration completed successfully!');
    console.log('=============================================');
    
  } catch (error) {
    console.error('Migration failed with error:', error);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

migrate();
