    
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import { restaurants, menuItems } from '../drizzle/schema.js'
import { eq, and, sql } from 'drizzle-orm'

const app = new Hono()


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in your environment variables");
}
const db = drizzle(process.env.DATABASE_URL);

const allRestaurants = await db.select().from(restaurants);

app.get('/restaurants', (c) => {
  return c.json(allRestaurants)
})

app.get('/menu-items/:restaurantId', async (c) => {
  const restaurantId = c.req.param('restaurantId')
  const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, parseInt(restaurantId)))
  return c.json(allMenuItems)
})

app.get('/menu-items/:restaurantId/:category', async (c) => {
  const restaurantId = c.req.param('restaurantId')
  const category = c.req.param('category')
  if(!category) {
    return c.json({ error: 'Category is required' }, 400)
  }
  const allMenuItems = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, parseInt(restaurantId)), eq(sql`lower(${menuItems.category})`, sql`lower(${category})`)))
  if(!allMenuItems) {
    return c.json({ error: 'Menu items not found' }, 404)
  }
  if(allMenuItems.length === 0) {
    return c.json({ error: 'Menu items not found' }, 404)
  }
  return c.json(allMenuItems)
})
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
