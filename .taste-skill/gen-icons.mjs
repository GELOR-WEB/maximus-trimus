const pole = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><pattern id='s' width='8' height='8' patternUnits='userSpaceOnUse' patternTransform='rotate(-30)'><rect width='8' height='8' fill='#f5deb3'/><rect width='8' height='3' fill='#c0392b'/><rect y='4' width='8' height='3' fill='#1a6fb5'/></pattern></defs><circle cx='16' cy='2.4' r='1.7' fill='#d4af37'/><circle cx='16' cy='29.6' r='1.7' fill='#d4af37'/><rect x='9' y='4' width='14' height='3' rx='1.5' fill='#d4af37'/><rect x='9' y='25' width='14' height='3' rx='1.5' fill='#d4af37'/><rect x='10' y='7' width='12' height='18' rx='2' fill='url(#s)'/><rect x='10' y='7' width='12' height='18' rx='2' fill='none' stroke='#d4af37' stroke-width='1.2'/></svg>`;
const close = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 6l12 12M18 6L6 18' stroke='#f5deb3' stroke-width='1.8' stroke-linecap='round'/></svg>`;
console.log('POLE');
console.log(encodeURIComponent(pole).replace(/%20/g, ' '));
console.log('CLOSE');
console.log(encodeURIComponent(close).replace(/%20/g, ' '));
