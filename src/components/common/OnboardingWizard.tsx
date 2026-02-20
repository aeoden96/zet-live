import { useState, useEffect } from 'react';
import { X, Navigation, MapPin, Smartphone, Wifi, LayoutList, Map } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

export function OnboardingWizard() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);
  const onboardingStep = useSettingsStore((s) => s.onboardingStep);
  const setOnboardingStep = useSettingsStore((s) => s.setOnboardingStep);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sync local step whenever store value changes (allows external reset)
    setStep(onboardingStep ?? 0);
  }, [onboardingStep]);

  if (onboardingCompleted) return null;

  const steps = [
    {
      title: 'Dobrodošli u ZET Live',
      body: 'Brzi pregled tramvaja i autobusa uživo u Zagrebu. Ovo kratko uputstvo prikazuje ključne značajke.'
    },
    {
      title: 'Pretraži linije',
      body: 'Koristi polje za pretragu na vrhu da brzo pronađeš liniju ili stanicu. Klikom otvaraš detalje i raspored.'
    },
    {
      title: 'Načini i teme',
      body: 'Prebaci između načina rada: karta (vizualni prikaz) i popis (pregled bez karte). U Postavkama možeš promijeniti temu (svijetla / tamna).'
    },
    {
      title: 'Prikaz rute',
      body: 'Odaberi liniju za prikaz rute, oblika, vozila i praćenje uživo. Možeš otvoriti puni prikaz rute za detalje.'
    },
    {
      title: 'Prikaz stanice',
      body: 'Stanica ima dva načina: lista vozila koja dolaze (uživo) i klasični raspored (tabelarni pregled vremena polazaka).'
    },
    {
      title: 'Offline podrška',
      body: 'Postupno preuzima podatke za offline korištenje. Podaci se keširaju kako bi aplikacija radila bolje bez stalne veze.'
    }
  ];

  const handleClose = () => {
    setOnboardingCompleted(true);
    setOnboardingStep(0);
  };

  const next = () => {
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    setOnboardingStep(nextStep);
  };

  const back = () => {
    const prev = Math.max(step - 1, 0);
    setStep(prev);
    setOnboardingStep(prev);
  };

  const iconForStep = (i: number) => {
    switch (i) {
      case 0:
        return <Navigation className="w-6 h-6 text-primary" />;
      case 1:
        return <MapPin className="w-6 h-6 text-primary" />;
      case 2:
        return <Map className="w-6 h-6 text-primary" />;
      case 3:
        return <LayoutList className="w-6 h-6 text-primary" />;
      case 4:
        return <Smartphone className="w-6 h-6 text-primary" />;
      default:
        return <Wifi className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {iconForStep(step)}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{steps[step].title}</h2>
              <p className="text-sm text-base-content/70">{steps[step].body}</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full mt-2">
          <div className="flex items-center gap-2 justify-center mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`w-8 h-1 rounded ${i === step ? 'bg-primary' : 'bg-base-300'}`} />
            ))}
          </div>

          <div className="flex justify-between gap-2">
            <button onClick={back} disabled={step === 0} className="btn btn-outline flex-1">
              Natrag
            </button>
            {step < steps.length - 1 ? (
              <button onClick={next} className="btn btn-primary flex-1">
                Sljedeće
              </button>
            ) : (
              <button onClick={handleClose} className="btn btn-primary flex-1">
                Završi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
