import React, { useCallback, useEffect, useState } from 'react';
import { SWUpdateBanner } from './components/PWABanners';
import { SplashIntro } from './components/SplashIntro';
import { resetDefaultPWAMetadata } from './lib/pwaManifest';
import {
  fetchOwnerNegocioBundle,
  type FullBusinessBundle,
  getCurrentSaaSUser,
  signOutOwner,
} from './lib/saasService';
import { AuthPage } from './pages/AuthPage';
import { DemoPage } from './pages/DemoPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OwnerPanelPage } from './pages/OwnerPanelPage';
import { PublicBookingPage } from './pages/PublicBookingPage';
import type { PlanId, SaaSUser } from './types/saas';

type RouteState =
  | { view: 'landing' }
  | { view: 'demo' }
  | { view: 'auth'; mode: 'register' | 'login' }
  | { view: 'onboarding' }
  | { view: 'panel' }
  | { view: 'public_slug'; slug: string };

function parseRouteFromPathname(pathname: string): RouteState {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean.startsWith('/n/')) {
    const slug = decodeURIComponent(clean.slice(3)).split('/')[0];
    if (slug) return { view: 'public_slug', slug };
  }
  if (clean === '/demo') return { view: 'demo' };
  if (clean === '/auth') return { view: 'auth', mode: 'login' };
  if (clean === '/registro') return { view: 'auth', mode: 'register' };
  if (clean === '/onboarding') return { view: 'onboarding' };
  if (clean === '/panel') return { view: 'panel' };
  return { view: 'landing' };
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRouteFromPathname(
      typeof window !== 'undefined' ? window.location.pathname : '/'
    )
  );
  const [saasUser, setSaasUser] = useState<SaaSUser | null>(null);
  const [businessBundle, setBusinessBundle] =
    useState<FullBusinessBundle | null>(null);
  const [preselectedPlan, setPreselectedPlan] = useState<PlanId>('pro');
  const [initializingSession, setInitializingSession] = useState<boolean>(true);

  const navigate = useCallback((nextRoute: RouteState, path: string) => {
    setRoute(nextRoute);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sincronizar botones atrás/adelante del navegador
  useEffect(() => {
    const handlePop = () => {
      const parsed = parseRouteFromPathname(window.location.pathname);
      setRoute(parsed);
      if (parsed.view !== 'public_slug') {
        resetDefaultPWAMetadata();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Restaurar sesión activa de Supabase Auth (o vista previa local) y negocio del dueño
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentSaaSUser();
        if (!mounted) return;
        setSaasUser(user);
        if (user) {
          const bundle = await fetchOwnerNegocioBundle(user.id);
          if (!mounted) return;
          setBusinessBundle(bundle);
        }
      } finally {
        if (mounted) setInitializingSession(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthenticated = async (user: SaaSUser) => {
    setSaasUser(user);
    const bundle = await fetchOwnerNegocioBundle(user.id);
    if (bundle) {
      setBusinessBundle(bundle);
      navigate({ view: 'panel' }, '/panel');
    } else {
      setBusinessBundle(null);
      navigate({ view: 'onboarding' }, '/onboarding');
    }
  };

  const handleLogout = async () => {
    await signOutOwner();
    setSaasUser(null);
    setBusinessBundle(null);
    navigate({ view: 'landing' }, '/');
  };

  const handleGoToPanelOrOnboarding = () => {
    if (!saasUser) {
      navigate({ view: 'auth', mode: 'login' }, '/auth');
      return;
    }
    if (businessBundle) {
      navigate({ view: 'panel' }, '/panel');
    } else {
      navigate({ view: 'onboarding' }, '/onboarding');
    }
  };

  if (initializingSession && route.view === 'panel') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
        Cargando tu panel...
      </div>
    );
  }

  return (
    <>
      <SplashIntro />
      <SWUpdateBanner />

      {route.view === 'public_slug' && (
        <PublicBookingPage
          slug={route.slug}
          onBackToSaaSLanding={() => {
            resetDefaultPWAMetadata();
            navigate({ view: 'landing' }, '/');
          }}
        />
      )}

      {route.view === 'demo' && (
        <DemoPage
          onBackToSaaSLanding={() => navigate({ view: 'landing' }, '/')}
          onCreateAccount={() =>
            navigate({ view: 'auth', mode: 'register' }, '/registro')
          }
        />
      )}

      {route.view === 'auth' && (
        <AuthPage
          initialMode={route.mode}
          onBack={() => navigate({ view: 'landing' }, '/')}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {route.view === 'onboarding' && saasUser && (
        <OnboardingPage
          user={saasUser}
          initialPlan={preselectedPlan}
          onComplete={(bundle) => {
            setBusinessBundle(bundle);
            navigate({ view: 'panel' }, '/panel');
          }}
          onLogout={handleLogout}
        />
      )}

      {route.view === 'panel' && saasUser && businessBundle && (
        <OwnerPanelPage
          user={saasUser}
          bundle={businessBundle}
          onUpdateBundle={setBusinessBundle}
          onOpenPublicSlug={(slug) =>
            navigate({ view: 'public_slug', slug }, `/n/${slug}`)
          }
          onBackToLanding={() => navigate({ view: 'landing' }, '/')}
          onLogout={handleLogout}
        />
      )}

      {(route.view === 'landing' ||
        (route.view === 'onboarding' && !saasUser) ||
        (route.view === 'panel' && (!saasUser || !businessBundle))) && (
        <LandingPage
          hasActiveSession={Boolean(saasUser)}
          onGoToPanel={handleGoToPanelOrOnboarding}
          onCreateAccount={(plan) => {
            if (plan) setPreselectedPlan(plan);
            navigate({ view: 'auth', mode: 'register' }, '/registro');
          }}
          onLogin={() => navigate({ view: 'auth', mode: 'login' }, '/auth')}
          onViewDemo={() => navigate({ view: 'demo' }, '/demo')}
        />
      )}
    </>
  );
}
