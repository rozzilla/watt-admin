import { createServer } from "node:http";

export function build() {
  return createServer((req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.end(
      JSON.stringify({ hello: 'from node1' })
    )
  })
}
