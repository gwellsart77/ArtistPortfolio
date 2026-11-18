// Wipe the THROWAWAY test database (localhost:5433, never the live one)
const { Client } = require('pg');
(async () => {
  const c = new Client({ user: 'u', password: 'p', host: 'localhost', port: 5433, database: 'art' });
  await c.connect();
  await c.query('drop schema public cascade; create schema public;');
  console.log('reset');
  await c.end();
})();
