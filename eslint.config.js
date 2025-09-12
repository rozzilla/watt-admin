import neostandard from 'neostandard'
export default neostandard({
  ignores: [
    'node_modules',
    'web/*/dist',
    'web/frontend/public',
    'web/frontend/src/client'
  ],
  ts: true
})
