/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, FilterRange } from "./types";
import {
  initStorage,
  getStoredUsers,
  syncFromDBToLocalStorage,
} from "./utils/storage";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Viajes from "./components/Viajes";
import GastosCombustible from "./components/GastosCombustible";
import MantenimientoComponent from "./components/Mantenimiento";
import Resumenes from "./components/Resumenes";
import Perfil from "./components/Perfil";
import Monotributo from "./components/Monotributo";
import Seguro from "./components/Seguro";

import {
  Car,
  LayoutDashboard,
  Compass,
  Fuel,
  Wrench,
  CalendarRange,
  UserCircle,
  LogOut,
  Menu,
  X,
  Clock,
  AlertTriangle,
  Lock,
  Sun,
  Moon,
  Receipt,
  ShieldCheck,
} from "lucide-react";

export default function App() {
  // Theme management: defaults to 'dark'
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("taxi_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("taxi_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Navigation & Session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>("dashboard");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global Sync Filter
  const [globalFilterRange, setGlobalFilterRange] =
    useState<FilterRange>("mes");

  // Trigger values for deep linking from dashboard quick actions
  const [initialFuelType, setInitialFuelType] = useState<
    "GNC" | "Nafta" | null
  >(null);
  const [initialMaintTrigger, setInitialMaintTrigger] =
    useState<boolean>(false);

  // Inactivity session expiration (5 minutes = 300 seconds)
  const [isSessionTimeoutWarning, setIsSessionTimeoutWarning] =
    useState<boolean>(false);
  const [inactivityTimer, setInactivityTimer] = useState<number>(300);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerCountdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Bootstrap data stores
    initStorage();

    // Check for persisted session in localStorage
    const savedSession = localStorage.getItem("taxi_session");
    if (savedSession) {
      try {
        const userId = JSON.parse(savedSession);
        const users = getStoredUsers();
        const found = users.find((u) => u.id === userId);
        if (found) {
          setCurrentUser(found);
          setActiveScreen("dashboard");
        }
      } catch (e) {
        localStorage.removeItem("taxi_session");
      }
    }

    // Dynamic storage change sync helper
    const handleStorageChange = () => {
      if (currentUser) {
        const users = getStoredUsers();
        const found = users.find((u) => u.id === currentUser.id);
        if (found) {
          setCurrentUser(found);
        }
      }
    };

    window.addEventListener("storage-update", handleStorageChange);
    return () => {
      window.removeEventListener("storage-update", handleStorageChange);
    };
  }, []);

  // Sync with MongoDB whenever user session starts
  useEffect(() => {
    if (currentUser?.id) {
      syncFromDBToLocalStorage(currentUser.id);
    }
  }, [currentUser?.id]);

  // --- INACTIVITY WATCHER ---
  useEffect(() => {
    if (!currentUser) {
      // Clear timers if logged out
      resetInactivityTimers();
      return;
    }

    // Initialize activity trackers
    const resetTimerOnUserAction = () => {
      // If we had a timeout warning active, clear it on any user action
      setIsSessionTimeoutWarning(false);
      setInactivityTimer(300); // restart 5 min

      if (userActivityTimeoutRef.current)
        clearTimeout(userActivityTimeoutRef.current);
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);

      // Set new inactivity watcher (triggers a pre-logout warning after 4.5 minutes of total silence)
      userActivityTimeoutRef.current = setTimeout(() => {
        setIsSessionTimeoutWarning(true);
        startWarningCountdown();
      }, 270000); // 4.5 minutes
    };

    const startWarningCountdown = () => {
      setInactivityTimer(30); // 30 seconds countdown to logout
      timerCountdownRef.current = setInterval(() => {
        setInactivityTimer((prev) => {
          if (prev <= 1) {
            handleLogoutDueToInactivity();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    // Attach events
    const activityEvents = [
      "mousedown",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimerOnUserAction),
    );

    // First trigger to boot up
    resetTimerOnUserAction();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimerOnUserAction),
      );
      if (userActivityTimeoutRef.current)
        clearTimeout(userActivityTimeoutRef.current);
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
    };
  }, [currentUser]);

  const resetInactivityTimers = () => {
    setIsSessionTimeoutWarning(false);
    if (userActivityTimeoutRef.current)
      clearTimeout(userActivityTimeoutRef.current);
    if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
  };

  const handleLogoutDueToInactivity = () => {
    resetInactivityTimers();
    localStorage.removeItem("taxi_session");
    setCurrentUser(null);
    setIsRegistering(false);
    alert(
      "Tu sesión ha expirado automáticamente por inactividad para proteger tus datos financieros.",
    );
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile, remember: boolean) => {
    setCurrentUser(user);
    setActiveScreen("dashboard");
    if (remember) {
      localStorage.setItem("taxi_session", JSON.stringify(user.id));
    }
  };

  // Sign out handler
  const handleLogout = () => {
    resetInactivityTimers();
    localStorage.removeItem("taxi_session");
    setCurrentUser(null);
    setIsRegistering(false);
  };

  // Profile update handler
  const handleUserUpdate = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  // Quick Action triggers from Dashboard
  const handleDashboardQuickAction = (action: string) => {
    if (action === "registrar_viaje") {
      setActiveScreen("viajes");
    } else if (action === "registrar_gnc") {
      setInitialFuelType("GNC");
      setActiveScreen("combustible");
    } else if (action === "registrar_nafta") {
      setInitialFuelType("Nafta");
      setActiveScreen("combustible");
    } else if (action === "registrar_mantenimiento") {
      setInitialMaintTrigger(true);
      setActiveScreen("mantenimiento");
    } else if (action === "ver_resumen") {
      setActiveScreen("resumenes");
    }
  };

  // Account deleted hook
  const handleAccountDeleted = () => {
    handleLogout();
  };

  // If not logged in, render Login or Register page
  if (!currentUser) {
    if (isRegistering) {
      return (
        <Register
          onRegisterSuccess={() => setIsRegistering(false)}
          onNavigateToLogin={() => setIsRegistering(false)}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setIsRegistering(true)}
      />
    );
  }

  // Active Screens mapping
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <Dashboard
            user={currentUser}
            onNavigate={setActiveScreen}
            onQuickAction={handleDashboardQuickAction}
          />
        );
      case "viajes":
        return (
          <Viajes
            userId={currentUser.id}
            globalFilterRange={globalFilterRange}
            setGlobalFilterRange={setGlobalFilterRange}
          />
        );
      case "combustible":
        return (
          <GastosCombustible
            userId={currentUser.id}
            globalFilterRange={globalFilterRange}
            setGlobalFilterRange={setGlobalFilterRange}
            initialTypeToRegister={initialFuelType}
            clearInitialTypeToRegister={() => setInitialFuelType(null)}
          />
        );
      case "mantenimiento":
        return (
          <MantenimientoComponent
            user={currentUser}
            onUserUpdate={handleUserUpdate}
            initialRegisterActive={initialMaintTrigger}
            clearInitialRegisterActive={() => setInitialMaintTrigger(false)}
          />
        );
      case "monotributo":
        return <Monotributo userId={currentUser.id} />;
      case "seguro":
        return <Seguro userId={currentUser.id} />;
      case "resumenes":
        return <Resumenes userId={currentUser.id} />;
      case "perfil":
        return (
          <Perfil
            user={currentUser}
            onUserUpdate={handleUserUpdate}
            onAccountDeleted={handleAccountDeleted}
          />
        );
      default:
        return (
          <Dashboard
            user={currentUser}
            onNavigate={setActiveScreen}
            onQuickAction={handleDashboardQuickAction}
          />
        );
    }
  };

  // Sidebar Menu Nav List
  const navItems = [
    { id: "dashboard", label: "Panel de Control", icon: LayoutDashboard },
    { id: "viajes", label: "Viajes Realizados", icon: Compass },
    { id: "combustible", label: "Combustible GNC/Nafta", icon: Fuel },
    { id: "mantenimiento", label: "Mantenimiento", icon: Wrench },
    { id: "monotributo", label: "Monotributo AFIP", icon: Receipt },
    { id: "seguro", label: "Seguro Automotor", icon: ShieldCheck },
    { id: "resumenes", label: "Auditoría / Resúmenes", icon: CalendarRange },
    { id: "perfil", label: "Mi Perfil", icon: UserCircle },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row relative"
      id="applet-viewport"
    >
      {/* Dynamic ambient background mesh */}
      <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-yellow-400/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[15%] right-[10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 blur-[150px] pointer-events-none z-0" />

      {/* MOBILE HEADER TOP BAR */}
      <header className="md:hidden bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between z-40 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2 text-white font-black text-sm font-display uppercase tracking-wider">
          <div className="h-16 w-24 rounded-md overflow-hidden border border-yellow-400/30 bg-slate-800 shrink-0">
            <img
              src="/src/public/images/taxi_dark_gold_1783567838853.jpg"
              alt="Logo Taxi"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span>
            Taxi <span className="text-yellow-400 font-bold">Control</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={
              theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-450" />
            )}
          </button>
          <img
            src={"/src/public/images/taxista-masculino.webp"}
            alt={currentUser.name}
            className="w-7 h-7 rounded-lg border border-yellow-400/30 object-cover"
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION SIDE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-40 md:hidden flex flex-col pt-16">
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveScreen(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeScreen === item.id
                      ? "bg-yellow-400 text-slate-950 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  <IconComponent className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-rose-400 hover:bg-rose-950/20 rounded-xl text-sm font-semibold transition-all mt-4"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP PERMANENT MINIMALIST SIDEBAR */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-zinc-950 border-r border-zinc-900 flex-col shrink-0 z-30 justify-between py-6 px-4 text-white">
        <div className="space-y-6">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 px-3 text-white font-extrabold text-lg tracking-tight font-display uppercase">
            <div className="flex items-center space-x-3 px-3 text-white font-extrabold text-lg tracking-tight font-display uppercase">
              <div className="h-16 w-24 rounded-lg overflow-hidden border border-yellow-400/30 bg-slate-800 shrink-0 relative shadow-md shadow-yellow-400/5 flex items-center justify-center">
                <img
                  src="/src/public/images/taxi_dark_gold_1783567838853.jpg"
                  alt="Logo Taxi"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span>
              Taxi <span className="text-yellow-400">Control</span>
            </span>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5" id="sidebar-navigation">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/10 font-black"
                      : "text-slate-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info footer and Logout action */}
        <div className="space-y-4 pt-4 border-t border-zinc-900">
          <div className="flex items-center space-x-3 px-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/40">
            <img
              // src={currentUser.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=taxi"}
              src={"/src/public/images/taxista-masculino.webp"}
              alt={currentUser.name}
              className="w-9 h-9 rounded-xl border border-zinc-800/80 object-cover"
            />
            <div className="truncate text-xs">
              <strong className="text-slate-200 block truncate">
                {currentUser.name}
              </strong>
              <span className="text-slate-500 text-[10px] font-mono block truncate">
                @{currentUser.username}
              </span>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-zinc-900/40 rounded-xl transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-400 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen px-4 py-6 md:px-8 z-10">
        {renderActiveScreen()}
      </main>

      {/* SESSION TIMEOUT WARNING MODAL OVERLAY */}
      {isSessionTimeoutWarning && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md text-center space-y-4 shadow-xl relative text-slate-900">
            <div className="h-12 w-12 rounded-full bg-yellow-400/10 text-yellow-600 flex items-center justify-center mx-auto animate-bounce">
              <Clock className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center justify-center space-x-2">
              <span>¿Sigues ahí, Chofer?</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tu sesión se cerrará automáticamente por inactividad en:
            </p>

            <div className="text-4xl font-mono font-black text-yellow-600 animate-pulse">
              {inactivityTimer}{" "}
              <span className="text-sm font-semibold">segundos</span>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Mueve el mouse, presiona una tecla o toca la pantalla para
              cancelar y renovar tu sesión de forma segura.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
