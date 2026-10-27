/* db.mjs — turns a @netlify/database client into the `q(text, params) -> rows` function the store wants.
 * Used by the serverless function and the edge function alike, and by the tests with a local Postgres.
 * `sql.unsafe` takes a plain SQL string with $1.. placeholders (values stay parameterised) and is awaitable. */
export function queryFrom(db) {
  return async (text, params = []) => await db.sql.unsafe(text, params);
}
