import { OnboardingWizard } from '../components/common/OnboardingWizard';

export function DrivingMode() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
            <OnboardingWizard variant="driving" />
            <div className="badge badge-primary mb-4">U izradi</div>
            <h1 className="text-2xl font-bold mb-2">Auto Način</h1>
            <p className="text-base-content/70 max-w-md">
                Ovdje će biti prikazane javne garaže, električne punionice i zatvorene ceste.
            </p>
        </div>
    );
}
