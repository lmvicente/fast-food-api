    
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import { restaurants, menuItems } from '../drizzle/schema.js'

const app = new Hono()


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}
const db = drizzle(process.env.DATABASE_URL);

const allRestaurants = await db.select().from(restaurants);

app.get('/restaurants', (c) => {
  return c.json(allRestaurants)
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
