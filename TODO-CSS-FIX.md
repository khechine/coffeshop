# PostCSS @import Order Fix - Next.js Turbopack Build Error

## Plan Implementation Steps

### 1. [✅ DONE] Edit apps/admin-dashboard/app/globals.css
- Moved both @import statements after Tailwind directives, before any style rules.
- File updated successfully (edit_file confirmed, no logic changes).

### 2. [⚠️ NEXT] Test build
- Run `cd apps/admin-dashboard && pnpm turbo dev` or `pnpm build`
- Verify no PostCSS errors, Leaflet styles/maps load.

### 3. [PENDING] Clear cache if needed
- `rm -rf apps/admin-dashboard/.next`

### 4. [PENDING] Verify in browser
- Check fonts load, sidebar styles, maps work (e.g., superadmin/marketplace/map).

**Status: CSS fix applied. Run build test next to confirm resolution.**
