import db from './src/database/client';

async function querySuperAgents() {
  const superAgents = await db.query.superAgents.findMany({
    with: {
      agent: {
        columns: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: (superAgents, { desc }) => [desc(superAgents.createdAt)],
    limit: 10
  });
  
  console.log(JSON.stringify(superAgents, null, 2));
}

querySuperAgents().catch(console.error).finally(() => process.exit());
