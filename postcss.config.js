// FIX TW-3: autoprefixer is built into Tailwind v4 — no longer needed as a separate plugin
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
