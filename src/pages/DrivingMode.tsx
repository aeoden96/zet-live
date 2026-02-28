import { BaseMap } from '../components/Map/BaseMap';
import { OnboardingWizard } from '../components/common/OnboardingWizard';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSettingsStore } from '../stores/settingsStore';
import { PublicGaragesMap } from '../components/Map/PublicGaragesMap';

export function DrivingMode() {
    const { userLocation } = useGeolocation();
    const showPublicGarages = useSettingsStore(s => s.showPublicGarages);

    return (
        <div className="h-full w-full relative">
            <BaseMap userLocation={userLocation}>
                <PublicGaragesMap show={showPublicGarages} />
            </BaseMap>

            {/* Map Controls */}
            <OnboardingWizard variant="driving" />
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                <div className="badge badge-primary gap-1 shadow backdrop-blur-md bg-primary/80 border-white/20">
                    Auto Način
                </div>
            </div>
        </div>
    );
}
