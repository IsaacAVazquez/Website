// postcss.config.js
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss(),    // ← note the call here
    autoprefixer(),
  ],
}