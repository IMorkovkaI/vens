# Supabase CLI

Vensight uses Prisma migrations as the source of truth for application schema changes. The Supabase CLI is installed locally as a dev dependency for project inspection, linking, local Supabase stack workflows, and Supabase platform utilities.

## Setup

Check the local CLI version:

```bash
npm run supabase:version
```

Log in with your Supabase access token:

```bash
npm run supabase:login
```

Link the repo to the hosted Supabase project:

```bash
npm run supabase:link -- --project-ref <project-ref>
```

After linking, inspect migration state:

```bash
npm run supabase:migrations
```

## Project Rules

- Keep Prisma migrations in `prisma/migrations` as the app schema source of truth.
- Use `npm run prisma:migrate:deploy` for hosted Supabase schema deployment.
- Use `npm run supabase:rls:enable` and `npm run supabase:rls:check` after migrations add public tables.
- Do not commit Supabase access tokens, database passwords, service-role keys, or generated local env files.
- Use Supabase CLI migration commands only for Supabase-managed objects that Prisma does not own, and document why.

## Useful Commands

```bash
npm run supabase:help
npm run supabase:projects
npm run supabase:migrations
npm run supabase:rls:check
```

For one-off CLI commands, use:

```bash
npx supabase <command> --help
```
