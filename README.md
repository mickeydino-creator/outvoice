# InvoiceFlow

## Setup: Supabase + Resend

This app stores all data in Supabase and sends invoice/quote emails through Resend.

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL in `supabase/migrations/0001_init.sql` against your project (SQL editor, or `supabase db push`).
   - Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your project's API settings.
2. **Resend (server-side only)**
   - Deploy the edge function in `supabase/functions/send-email` to your Supabase project:
     ```
     supabase functions deploy send-email
     ```
   - Set your Resend API key as a function secret (never in the frontend):
     ```
     supabase secrets set RESEND_API_KEY=your-resend-api-key
     ```
   - Optionally set a verified sender: `supabase secrets set RESEND_FROM_EMAIL="Your Business <billing@yourdomain.com>"`.

Once both are configured, run `npm run dev`. The app starts with no data — go through onboarding and add your first client/invoice.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
