import QRCode from 'qrcode';

export async function generateQrSvgDataUrl(text: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  } catch {
    return '';
  }
}
