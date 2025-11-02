import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';

const AgentLoading = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <IconSpinner className="size-8 text-text-muted" />
        <p className="text-text-muted text-sm">Laden...</p>
      </div>
    </div>
  );
};

export default AgentLoading;
