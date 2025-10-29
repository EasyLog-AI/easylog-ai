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
    documents: r.many.documentAgents({
      from: r.agents.id,
      to: r.documentAgents.agentId
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
    }),
    documents: r.many.documentRoles({
      from: r.agentRoles.id,
      to: r.documentRoles.roleId
    })
  },
  documents: {
    agents: r.many.documentAgents({
      from: r.documents.id,
      to: r.documentAgents.documentId
    }),
    roles: r.many.documentRoles({
      from: r.documents.id,
      to: r.documentRoles.documentId
    }),
    data: r.many.documentData({
      from: r.documents.id,
      to: r.documentData.documentId
    })
  },
  documentAgents: {
    document: r.one.documents({
      from: r.documentAgents.documentId,
      to: r.documents.id,
      optional: false
    }),
    agent: r.one.agents({
      from: r.documentAgents.agentId,
      to: r.agents.id,
      optional: false
    })
  },
  documentRoles: {
    document: r.one.documents({
      from: r.documentRoles.documentId,
      to: r.documents.id,
      optional: false
    }),
    role: r.one.agentRoles({
      from: r.documentRoles.roleId,
      to: r.agentRoles.id,
      optional: false
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
