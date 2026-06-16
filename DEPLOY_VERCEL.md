# Desplegar Doña Mago en Vercel

El proyecto está listo para Vercel gracias a `vercel.json`, que fuerza el preset
`vercel` de Nitro al compilar.

## Pasos

1. **Sube el repo a GitHub** (o conéctalo desde Lovable → GitHub).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repo.
3. Vercel detectará `vercel.json` automáticamente. No cambies el Build Command.
4. En **Environment Variables** añade (los mismos valores que ves en `.env`):

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | tu URL de Lovable Cloud |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | tu publishable key |
   | `VITE_SUPABASE_PROJECT_ID` | tu project id |
   | `SUPABASE_URL` | igual que `VITE_SUPABASE_URL` |
   | `SUPABASE_PUBLISHABLE_KEY` | igual que la publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key (pídela en Lovable → Cloud → Settings) |

5. **Deploy**. Listo: frontend, server functions y pagos sandbox quedan en Vercel.

## Pagos reales

Las pasarelas están en modo sandbox (genera referencias `pi_…`, `PAY_…`, `MP_…`).
Para producción edita `src/lib/checkout.functions.ts` y reemplaza `fakeRef()` por
llamadas reales a Stripe, PayPal y Mercado Pago, agregando las claves como
variables de entorno en Vercel (`STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, etc.).
