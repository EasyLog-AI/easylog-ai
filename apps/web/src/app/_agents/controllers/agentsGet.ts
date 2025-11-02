import agentMiddleware from '@/app/_agents/middleware/agentMiddleware';

/** Get an agent by ID. */
const agentsGet = agentMiddleware
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/agents/:id',
      tags: ['Agents'],
      summary: 'Get an agent by ID'
    }
  })
  .query(async ({ ctx }) => {
    return ctx.agent;
  });

export default agentsGet;
