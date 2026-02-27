import { useState, useCallback, useEffect } from 'react';
import { useNavigationStore } from '../stores/navigationStore';

export function useGeolocation(onSuccess?: (lat: number, lon: number) => void) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locateError, setLocateError] = useState<string | null>(null);

    const setLocateAction = useNavigationStore(s => s.setLocateAction);
    const setLocatingStore = useNavigationStore(s => s.setLocating);

    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            setLocateError('Geolokacija nije dostupna u ovom pregledniku.');
            return;
        }
        setLocatingStore(true);
        setLocateError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ lat: latitude, lon: longitude });
                setLocatingStore(false);
            },
            () => {
                setLocateError('Lokacija nije dostupna. Provjerite dozvole preglednika.');
                setLocatingStore(false);
                setTimeout(() => setLocateError(null), 4000);
            },
            { timeout: 8000, maximumAge: 30000 }
        );
    }, [setLocatingStore]);

    useEffect(() => {
        setLocateAction(handleLocateMe);
        return () => setLocateAction(null);
    }, [handleLocateMe, setLocateAction, onSuccess]);

    return {
        userLocation,
        setUserLocation,
        locateError
    };
}
