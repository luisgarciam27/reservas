/**
 * Actualiza dinámicamente el título, theme-color y manifest PWA
 * para que al visitar /n/nombre-del-negocio la app se instale con
 * el nombre y color propio de ese negocio.
 */
let activeManifestBlobUrl: string | null = null;

export function applyBusinessPWAMetadata(params: {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  startUrl: string;
  slug?: string;
}) {
  if (typeof document === 'undefined') return;

  document.title = params.name;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', params.themeColor);
  }

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) {
    appleTitle.setAttribute('content', params.shortName);
  }

  const tenantScope = params.slug ? `/n/${params.slug}` : '/';

  const manifestPayload = {
    id: params.startUrl,
    name: params.name,
    short_name: params.shortName,
    description: params.description,
    start_url: params.startUrl,
    scope: tenantScope,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: params.themeColor,
    background_color: '#F8FAFC',
    lang: 'es-PE',
    icons: [
      {
        src: `${window.location.origin}/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${window.location.origin}/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };

  try {
    const json = JSON.stringify(manifestPayload);
    const blob = new Blob([json], { type: 'application/manifest+json' });
    const nextUrl = URL.createObjectURL(blob);

    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = nextUrl;

    if (activeManifestBlobUrl) {
      URL.revokeObjectURL(activeManifestBlobUrl);
    }
    activeManifestBlobUrl = nextUrl;
  } catch {
    // Fallback silencioso si el navegador restringe blobs de manifest
  }
}

export function resetDefaultPWAMetadata() {
  if (typeof document === 'undefined') return;
  document.title = 'MarIA Citas — Reservas y WhatsApp para Negocios';
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', '#4F46E5');
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute('content', 'MarIA Citas');
}
