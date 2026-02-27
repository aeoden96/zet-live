import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    TramFront,
    Bike,
    Car,
    Building2,
    Settings,
    HelpCircle,
    X,
    LocateFixed,
    Map,
    List
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigationStore } from '../../stores/navigationStore';

export function SpiderMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        setOnboardingStep,
        setOnboardingCompleted,
        appMode,
        setAppMode
    } = useSettingsStore();
    const { onLocateClick, locating } = useNavigationStore();

    const toggleMenu = () => setIsOpen(!isOpen);

    const menuItems = [
        {
            to: "/",
            icon: <TramFront className="w-5 h-5" />,
            label: "Javni prijevoz",
            color: 'bg-primary',
            hoverColor: 'hover:bg-primary/80',
            activeRing: 'ring-primary'
        },
        {
            to: "/cycling",
            icon: <Bike className="w-5 h-5" />,
            label: "Bicikl",
            color: 'bg-success',
            hoverColor: 'hover:bg-success/80',
            activeRing: 'ring-success'
        },
        {
            to: "/driving",
            icon: <Car className="w-5 h-5" />,
            label: "Auto",
            color: 'bg-orange-600',
            hoverColor: 'hover:bg-orange-500',
            activeRing: 'ring-orange-600'
        },
        {
            to: "/city",
            icon: <Building2 className="w-5 h-5" />,
            label: "Grad",
            color: 'bg-purple-600',
            hoverColor: 'hover:bg-purple-500',
            activeRing: 'ring-purple-600'
        }
    ];

    const actionItems = [
        {
            label: "Pomoć",
            icon: <HelpCircle className="w-5 h-5" />,
            onClick: () => {
                setOnboardingStep(0);
                setOnboardingCompleted(false);
            }
        },
        {
            label: "Postavke",
            icon: <Settings className="w-5 h-5" />,
            onClick: () => {
                navigate('/settings');
            }
        },
    ];

    const activeItem = menuItems.find(item => item.to === location.pathname) || menuItems[0];

    // Only show locate button on map page
    const showLocate = location.pathname === '/' && onLocateClick;

    return (
        <div className="fixed top-4 right-4 z-[2000] flex flex-col items-end">
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1999]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="relative z-[2000] flex flex-col items-end gap-3">
                {/* HUB BUTTON */}
                <button
                    onClick={toggleMenu}
                    className={`relative flex items-center justify-center w-14 h-14 text-white rounded-full shadow-2xl transition-all duration-300 ease-in-out border border-white/20 active:scale-95 backdrop-blur-xl ${isOpen ? 'bg-zinc-900 rotate-0' : `${activeItem.color} hover:brightness-110`}`}
                >
                    <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
                        {activeItem.icon}
                    </div>
                    <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`}>
                        <X className="w-6 h-6" />
                    </div>
                </button>

                {/* MENU ITEMS (STACKED VERTICALLY) */}
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 pointer-events-auto">
                        {menuItems.map((item, index) => (
                            <div key={item.to} className="flex items-center gap-3">
                                {item.to === "/" && (
                                    <div
                                        className="flex p-0.5 bg-neutral/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl animate-spider-reveal overflow-hidden"
                                        style={{ animationDelay: `${index * 50 + 50}ms` }}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAppMode('map');
                                            }}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300
                                                ${appMode === 'map'
                                                    ? 'bg-primary text-white shadow-lg scale-105'
                                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'}
                                            `}
                                        >
                                            <Map className="w-3 h-3" />
                                            KARTA
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAppMode('list');
                                            }}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-300
                                                ${appMode === 'list'
                                                    ? 'bg-primary text-white shadow-lg scale-105'
                                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'}
                                            `}
                                        >
                                            <List className="w-3 h-3" />
                                            POPIS
                                        </button>
                                    </div>
                                )}
                                <NavLink
                                    to={item.to}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-2 rounded-full shadow-xl transition-all duration-300
                                        text-white backdrop-blur-md border border-white/20 animate-spider-reveal
                                        ${item.color} ${item.hoverColor}
                                        ${isActive ? `ring-2 ${item.activeRing} ring-offset-2 ring-offset-neutral scale-105` : 'opacity-90 hover:opacity-100'}
                                    `}
                                    style={{
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                        {item.label}
                                    </span>
                                    <div className="shrink-0 transition-transform group-hover:scale-110">{item.icon}</div>
                                </NavLink>
                            </div>
                        ))}

                        <div className="h-px w-12 bg-white/20 my-1 mr-2 animate-spider-reveal" style={{ animationDelay: `${menuItems.length * 50}ms` }} />

                        <div className="flex gap-3 pr-1">
                            {actionItems.map((item, index) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.onClick?.();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center justify-center w-11 h-11 rounded-full bg-neutral/90 text-neutral-content shadow-lg border border-white/10 hover:bg-neutral hover:scale-110 transition-all duration-300 animate-spider-reveal"
                                    title={item.label}
                                    style={{
                                        animationDelay: `${(menuItems.length * 50) + 100 + (index * 50)}ms`
                                    }}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locate Button closer to the hub */}
                {showLocate && !isOpen && (
                    <button
                        onClick={onLocateClick}
                        disabled={locating}
                        className="btn btn-circle bg-neutral text-neutral-content border-white/10 shadow-lg hover:bg-neutral/80 transition-all duration-300 mt-3"
                        style={{ width: 56, height: 56 }}
                        title="Moja lokacija"
                    >
                        {locating ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            <LocateFixed className="w-6 h-6" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
