'use strict'

import { join } from 'path'

const __dirname = import.meta.dirname

export default {
  plugins: {
    tailwindcss: {
      config: join(__dirname, '..', '..', 'node_modules', '@platformatic', 'ui-components', 'tailwind.config.cjs')
    },
    autoprefixer: {}
  }
}
