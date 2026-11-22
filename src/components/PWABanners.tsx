import React, { useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall, useSWUpdate } from '../hooks/usePWA';

export const PWAInstallBanner: React.FC<{
  accentColor?: string;
  isDark?: boolean;
}> = ({ accentColor = '#4F46E5', isDark = false }) => {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } =
    usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isDismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <div
        className={`rounded-3xl border p-4 shadow-xl backdrop-blur-md ${
          isDark
            ? 'border-white/10 bg-slate-900/80 text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Ícono MarIA"
              className="h-10 w-10 shrink-0 rounded-xl"
              width={40}
              height={40}
            />
            <div className="min-w-0">
              <p
                className={`truncate text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Instalar app de MarIA
              </p>
              <p
                className={`truncate text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isIOS
                  ? 'Acceso directo en tu iPhone'
                  : 'Úsala como app nativa en tu celular'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isInstallable ? (
              <button
                type="button"
                onClick={install}
                style={{ backgroundColor: accentColor }}
                className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Instalar app
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                style={{ backgroundColor: accentColor }}
                className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
              >
                <Share className="h-4 w-4" aria-hidden="true" />
                Instalar
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar aviso de instalación"
              className={`tap-feedback flex h-11 w-11 items-center justify-center rounded-xl ${
                isDark
                  ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {isIOS && !showIOSGuide && (
          <p
            className={`mt-2.5 border-t pt-2.5 text-xs ${
              isDark
                ? 'border-white/10 text-slate-300'
                : 'border-slate-100 text-slate-600'
            }`}
          >
            En Safari: toca <span className="font-semibold">Compartir</span> y
            luego <span className="font-semibold">Añadir a pantalla de inicio</span>.
          </p>
        )}
      </div>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3
              id="ios-install-title"
              className="text-lg font-bold text-slate-900"
            >
              Instalar en iPhone o iPad
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Toca <span className="font-semibold text-slate-900">Compartir</span>{' '}
              en la barra de Safari y luego{' '}
              <span className="font-semibold text-slate-900">
                Añadir a pantalla de inicio
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="tap-feedback mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const SWUpdateBanner: React.FC = () => {
  // Mantiene el registro silencioso del Service Worker sin mostrar aviso flotante
  useSWUpdate();
  return null;
};

export const OfflineNoticeInline: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
      <span>
        Sin conexión a internet · Recordatorio y Vista del dueño siguen
        funcionando.
      </span>
    </div>
  );
};
