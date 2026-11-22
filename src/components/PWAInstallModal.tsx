import React, { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWA';

interface PWAInstallModalProps {
  open: boolean;
  onClose: () => void;
  accentColor?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  open,
  onClose,
  accentColor = '#4F46E5',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  if (!open) return null;

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="MarIA App"
              className="h-12 w-12 shrink-0 rounded-2xl border border-slate-200"
            />
            <div>
              <h3
                id="pwa-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Descargar App al móvil
              </h3>
              <p className="text-xs text-slate-500">
                App nativa ligera (PWA) · Sin Play Store ni App Store
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-feedback flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-700">
          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-xs font-semibold">
                Ya estás usando la app instalada en modo nativo en tu dispositivo.
              </p>
            </div>
          ) : isInstallable ? (
            <>
              <p className="text-xs leading-relaxed text-slate-600">
                Instala MarIA en la pantalla de inicio de tu celular para reservar en 1 toque, consultar tu historial y ver tus recordatorios sin abrir el navegador.
              </p>
              <button
                type="button"
                disabled={installing}
                onClick={handleNativeInstall}
                style={{ backgroundColor: accentColor }}
                className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                {installing ? 'Instalando...' : 'Instalar App ahora'}
              </button>
            </>
          ) : isIOS ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Share className="h-4 w-4 text-sky-600" /> Pasos para iPhone / iPad (Safari):
              </p>
              <ol className="list-decimal space-y-1.5 pl-4">
                <li>
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </li>
                <li>
                  Desliza hacia abajo y elige <strong>Añadir a pantalla de inicio</strong>.
                </li>
                <li>
                  Toca <strong>Añadir</strong> y la app quedará instalada con su ícono.
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-indigo-600" /> Cómo instalar en tu celular o navegador:
              </p>
              <ol className="list-decimal space-y-1.5 pl-4">
                <li>
                  En <strong>Android (Chrome)</strong>: toca el menú <strong>⋮</strong> arriba a la derecha y selecciona <strong>Instalar aplicación</strong>.
                </li>
                <li>
                  En <strong>iPhone (Safari)</strong>: toca <strong>Compartir</strong> y elige <strong>Añadir a pantalla de inicio</strong>.
                </li>
                <li>
                  En <strong>PC / Mac</strong>: haz clic en el ícono de instalar en la barra de direcciones.
                </li>
              </ol>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] font-semibold text-slate-600">
            <div className="rounded-xl bg-slate-50 p-2.5">
              Acceso 1 toque
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              Ocupa &lt; 2 MB
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              Modo sin barra web
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="tap-feedback mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
