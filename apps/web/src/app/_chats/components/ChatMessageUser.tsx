import { motion } from 'motion/react';

export interface ChatMessageUserProps {
  isHidden?: boolean;
}

const ChatMessageUser = ({
  children,
  isHidden = false
}: React.PropsWithChildren<ChatMessageUserProps>) => {
  if (isHidden) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.2 }}
      className="my-3 flex w-full items-end justify-end"
    >
      <div className="from-fill-brand to-fill-brand-2 shadow-fill-brand/20 flex flex-col items-end gap-1.5 rounded-2xl bg-gradient-to-tr px-3 py-2 shadow-md">
        {children}
      </div>
    </motion.div>
  );
};

export default ChatMessageUser;
