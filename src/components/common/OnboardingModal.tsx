/**
 * Onboarding modal shown on first visit
 */

import { MapPin, Navigation, Smartphone, Wifi } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

export function OnboardingModal() {
  const onboardingCompleted = useSettingsStore((state) => state.onboardingCompleted);
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);

  const handleGetStarted = () => {
    setOnboardingCompleted(true);
  };

  if (onboardingCompleted) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">ZET Live</h1>
          <p className="text-lg text-base-content/70">Zagreb javni prijevoz uživo</p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Pregledaj linije</h3>
              <p className="text-sm text-base-content/70">
                Pogledaj sve tramvajske i autobusne linije u Zagrebu
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Odaberi stanicu</h3>
              <p className="text-sm text-base-content/70">
                Klikni na stanicu za prikaz rasporeda i dolaska vozila
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Vozila uživo</h3>
              <p className="text-sm text-base-content/70">
                Prati vozila na karti u stvarnom vremenu
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Radi offline</h3>
              <p className="text-sm text-base-content/70">
                Rasporedi dostupni i bez internetske veze
              </p>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleGetStarted}
          className="btn btn-primary w-full"
        >
          Započni
        </button>
      </div>
    </div>
  );
}
