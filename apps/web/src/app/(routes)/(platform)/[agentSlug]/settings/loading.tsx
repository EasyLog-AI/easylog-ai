import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import Skeleton from '@/app/_ui/components/Skeleton/Skeleton';

const SettingsLoading = () => {
  return (
    <div className="space-y-6">
      {/* Multiple cards to match the settings layout */}
      {[1, 2, 3].map((index) => (
        <Card key={index}>
          <CardContent>
            <div className="space-y-4">
              {/* Card title */}
              <Skeleton className="h-6 w-48" />

              {/* Form fields */}
              <div className="space-y-4">
                {[1, 2, 3].map((fieldIndex) => (
                  <div key={fieldIndex} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SettingsLoading;
