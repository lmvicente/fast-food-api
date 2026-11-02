    
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { restaurants, menuItems } from '../drizzle/schema.js'
import { eq, and, sql } from 'drizzle-orm'

const app = new Hono()
export default app

// 5432 is Supabase session mode, capped at 15 clients. 6543 shares connections.
const databaseUrl = process.env.DATABASE_URL?.replace(
  'pooler.supabase.com:5432',
  'pooler.supabase.com:6543',
)
const db = databaseUrl
  ? drizzle({ client: postgres(databaseUrl, { max: 1, prepare: false, ssl: 'require' }) })
  : undefined

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

app.get('/', (c) => c.json({ ok: true }))

app.get('/restaurants', async (c) => {
  if (!db) return c.json({ error: 'DATABASE_URL is not defined' }, 500)
  return c.json(await db.select().from(restaurants))
})

//this one gives all items in a specific restaurant
app.get('/menu-items/:restaurantId', async (c) => {
  if (!db) return c.json({ error: 'DATABASE_URL is not defined' }, 500)
  const restaurantId = c.req.param('restaurantId')
  const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, parseInt(restaurantId)))
  return c.json(allMenuItems)
})

//this one gives items in a specific category
app.get('/menu-items/:restaurantId/:category', async (c) => {
  const restaurantId = c.req.param('restaurantId')
  const category = c.req.param('category')
  if(!category) {
    return c.json({ error: 'Category is required' }, 400)
  }
  if (!db) return c.json({ error: 'DATABASE_URL is not defined' }, 500)
  const allMenuItems = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, parseInt(restaurantId)), eq(sql`lower(${menuItems.category})`, sql`lower(${category})`)))
  if(!allMenuItems) {
    return c.json({ error: 'Menu items not found' }, 404)
  }
  if(allMenuItems.length === 0) {
    return c.json({ error: 'Menu items not found' }, 404)
  }
  return c.json(allMenuItems)
})

//so this one is the main one that will be used to get the menu item details
app.get('/menu-items/:restaurantId/:category/:itemId', async (c) => {
  const restaurantId = c.req.param('restaurantId')
  const category = c.req.param('category')
  const itemId = c.req.param('itemId')
  if (!db) return c.json({ error: 'DATABASE_URL is not defined' }, 500)
  const menuItem = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, parseInt(restaurantId)), eq(sql`lower(${menuItems.category})`, sql`lower(${category})`), eq(menuItems.id, parseInt(itemId))))
  if(!menuItem) {
    return c.json({ error: 'Menu item not found' }, 404)
  }
  return c.json(menuItem)

})

/* app.get('/menu-items/:restaurantId/:category/:itemId/nutrition', async (c) => {
  const restaurantId = c.req.param('restaurantId')
  const category = c.req.param('category')
  const itemId = c.req.param('itemId')
  const nutrition = await db.select().from(nutrition).where(and(eq(nutrition.restaurantId, parseInt(restaurantId)), eq(sql`lower(${nutrition.category})`, sql`lower(${category})`), eq(nutrition.itemId, parseInt(itemId))))
  if(!nutrition) {
    return c.json({ error: 'Nutrition not found' }, 404)
  }
  return c.json(nutrition)
}) */

if (!process.env.VERCEL) {
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}
