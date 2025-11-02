import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';

const AgentLoading = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <IconSpinner className="text-text-muted size-4" />
      </div>
    </div>
  );
};

export default AgentLoading;
