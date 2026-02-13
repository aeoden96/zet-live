import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock Leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: () => <div data-testid="circle-marker" />,
  Polyline: () => <div data-testid="polyline" />,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockInitialData = {
  stops: [
    {
      id: '98',
      code: '',
      name: 'Črnomerec',
      lat: 45.815,
      lon: 15.93446,
      locationType: 1,
      parentStation: null,
    },
  ],
  routes: [
    {
      id: '6',
      shortName: '6',
      longName: 'Črnomerec - Sopot',
      type: 0,
    },
  ],
  calendar: {
    '20260212': '0_20',
  },
  feedVersion: '000384',
  feedStartDate: '20260216',
  feedEndDate: '20301231',
};

describe('App', () => {
  beforeEach(() => {
    // Mock fetch for initial data
    global.fetch = vi.fn((url) => {
      if (url === '/data/initial.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInitialData),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Učitavanje podataka/i)).toBeInTheDocument();
  });

  it('renders map and sidebar after loading', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Učitavanje podataka/i)).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByText(/ZET Live/i)).toBeInTheDocument();
  });

  it('displays route tabs', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Tramvaji/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Autobusi/i)).toBeInTheDocument();
  });

  it('renders theme toggle button', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Učitavanje podataka/i)).not.toBeInTheDocument();
    });

    const themeButton = screen.getByLabelText(/toggle theme/i);
    expect(themeButton).toBeInTheDocument();
  });
});
