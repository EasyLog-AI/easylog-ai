const ChatLayout = ({ children }: React.PropsWithChildren<{}>) => {
  return (
    <div className="flex h-[calc(100svh-4.25rem)] flex-col overflow-hidden">
      {children}
    </div>
  );
};

export default ChatLayout;
