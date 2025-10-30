import { UIMessage as UIMessageAi } from 'ai';

export interface HeroContact {
  /** The email of the hero. */
  email: string;

  /** The name of the hero. */
  name: string;
}

export type UIMessage = UIMessageAi;
