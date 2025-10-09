import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId
    }),
    accounts: r.many.accounts({
      from: r.users.id,
      to: r.accounts.userId
    }),
    passkeys: r.many.passkeys({
      from: r.users.id,
      to: r.passkeys.userId
    }),
    chats: r.many.chats({
      from: r.users.id,
      to: r.chats.userId
    }),
    memories: r.many.memories({
      from: r.users.id,
      to: r.memories.userId
    }),
    scratchpadMessages: r.many.scratchpadMessages({
      from: r.users.id,
      to: r.scratchpadMessages.userId
    })
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
      optional: false
    })
  },
  accounts: {
    user: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
      optional: false
    })
  },
  passkeys: {
    user: r.one.users({
      from: r.passkeys.userId,
      to: r.users.id,
      optional: false
    })
  },
  memories: {
    user: r.one.users({
      from: r.memories.userId,
      to: r.users.id,
      optional: false
    })
  },
  agents: {
    documents: r.many.documents({
      from: r.agents.id,
      to: r.documents.agentId
    }),
    chats: r.many.chats({
      from: r.agents.id,
      to: r.chats.agentId
    }),
    roles: r.many.agentRoles({
      from: r.agents.id,
      to: r.agentRoles.agentId
    }),
    superAgents: r.many.superAgents({
      from: r.agents.id,
      to: r.superAgents.agentId
    })
  },
  agentRoles: {
    agent: r.one.agents({
      from: r.agentRoles.agentId,
      to: r.agents.id,
      optional: false
    }),
    activeChats: r.many.chats({
      from: r.agentRoles.id,
      to: r.chats.activeRoleId
    })
  },
  documents: {
    agent: r.one.agents({
      from: r.documents.agentId,
      to: r.agents.id,
      optional: false
    }),
    data: r.many.documentData({
      from: r.documents.id,
      to: r.documentData.documentId
    })
  },
  chats: {
    agent: r.one.agents({
      from: r.chats.agentId,
      to: r.agents.id,
      optional: false
    }),
    user: r.one.users({
      from: r.chats.userId,
      to: r.users.id,
      optional: false
    }),
    activeRole: r.one.agentRoles({
      from: r.chats.activeRoleId,
      to: r.agentRoles.id
    }),
    multipleChoiceQuestions: r.many.multipleChoiceQuestions({
      from: r.chats.id,
      to: r.multipleChoiceQuestions.chatId
    })
  },
  documentData: {
    document: r.one.documents({
      from: r.documentData.documentId,
      to: r.documents.id,
      optional: false
    })
  },
  verifications: {},
  multipleChoiceQuestions: {
    chat: r.one.chats({
      from: r.multipleChoiceQuestions.chatId,
      to: r.chats.id,
      optional: false
    })
  },
  superAgents: {
    agent: r.one.agents({
      from: r.superAgents.agentId,
      to: r.agents.id,
      optional: false
    }),
    scratchpadMessages: r.many.scratchpadMessages({
      from: r.superAgents.id,
      to: r.scratchpadMessages.superAgentId
    })
  },
  scratchpadMessages: {
    superAgent: r.one.superAgents({
      from: r.scratchpadMessages.superAgentId,
      to: r.superAgents.id,
      optional: false
    }),
    user: r.one.users({
      from: r.scratchpadMessages.userId,
      to: r.users.id,
      optional: false
    })
  }
}));

export default relations;
