import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import { restaurants, menuItems } from '../drizzle/schema.js';
import { eq, and, sql } from 'drizzle-orm';
const app = new Hono();
export default app;
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in your environment variables");
}
const db = drizzle(process.env.DATABASE_URL);
const allRestaurants = await db.select().from(restaurants);
//this one gives all restaurants
app.get('/restaurants', (c) => {
    return c.json(allRestaurants);
});
//this one gives all items in a specific restaurant
app.get('/menu-items/:restaurantId', async (c) => {
    const restaurantId = c.req.param('restaurantId');
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.restaurantId, parseInt(restaurantId)));
    return c.json(allMenuItems);
});
//this one gives items in a specific category
app.get('/menu-items/:restaurantId/:category', async (c) => {
    const restaurantId = c.req.param('restaurantId');
    const category = c.req.param('category');
    if (!category) {
        return c.json({ error: 'Category is required' }, 400);
    }
    const allMenuItems = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, parseInt(restaurantId)), eq(sql `lower(${menuItems.category})`, sql `lower(${category})`)));
    if (!allMenuItems) {
        return c.json({ error: 'Menu items not found' }, 404);
    }
    if (allMenuItems.length === 0) {
        return c.json({ error: 'Menu items not found' }, 404);
    }
    return c.json(allMenuItems);
});
//so this one is the main one that will be used to get the menu item details
app.get('/menu-items/:restaurantId/:category/:itemId', async (c) => {
    const restaurantId = c.req.param('restaurantId');
    const category = c.req.param('category');
    const itemId = c.req.param('itemId');
    const menuItem = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, parseInt(restaurantId)), eq(sql `lower(${menuItems.category})`, sql `lower(${category})`), eq(menuItems.id, parseInt(itemId))));
    if (!menuItem) {
        return c.json({ error: 'Menu item not found' }, 404);
    }
    return c.json(menuItem);
});
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
        console.log(`Server is running on http://localhost:${info.port}`);
    });
}
