# payment-deploy-pro-main

Proyecto de tienda online con React, Vite, Supabase y despliegue en Vercel.

## Repositorio GitHub

https://github.com/pepe036925/payment-deploy-pro-main

## Despliegue en Vercel

https://payment-deploy-pro-main.vercel.app

## Variables de entorno necesarias

El proyecto requiere estas variables para funcionar correctamente:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Usa `.env.example` como plantilla. En Vercel, agrega las mismas variables en el entorno de producción.

## Notas

- `SUPABASE_SERVICE_ROLE_KEY` es necesario para las funciones server-side que procesan compras.
- No subas el archivo `.env` al repositorio. Está excluido del control de versiones.
