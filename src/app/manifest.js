export default function manifest() {
  return {
    name: 'Township Banking',
    short_name: 'TownshipBank',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#fb8c00',
    lang: 'en-ZA',
    icons: [
      {
        src: '/next.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/next.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}