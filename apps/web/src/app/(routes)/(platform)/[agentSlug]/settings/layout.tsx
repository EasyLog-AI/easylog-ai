import NavigationMenu from '@/app/_ui/components/NavigationMenu/NavigationMenu';
import NavigationMenuItem from '@/app/_ui/components/NavigationMenu/NavigationMenuItem';
import NavigationMenuProvider from '@/app/_ui/components/NavigationMenu/NavigationMenuProvider';

const SettingsLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    agentSlug: string;
  }>;
}) => {
  const { agentSlug } = await params;

  return (
    <div className="">
      <NavigationMenuProvider>
        <div className="border-border-muted bg-surface-primary sticky top-14 z-50 mx-auto border-b">
          <div className="container">
            <NavigationMenu direction="horizontal">
              <NavigationMenuItem href={`/${agentSlug}/settings/agent`}>
                Agent
              </NavigationMenuItem>
              <NavigationMenuItem href={`/${agentSlug}/settings/roles`}>
                Rollen
              </NavigationMenuItem>
              <NavigationMenuItem href={`/${agentSlug}/settings/knowledge`}>
                Kennisbank
              </NavigationMenuItem>
            </NavigationMenu>
          </div>
        </div>
      </NavigationMenuProvider>
      <div className="container py-10">{children}</div>
    </div>
  );
};

export default SettingsLayout;
