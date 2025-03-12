# VSCode Configuration for Supabase Edge Functions with Deno

This directory contains VSCode configuration files for working with Supabase Edge Functions that use Deno.

## Configuration Files

- `settings.json`: Contains VSCode settings for Deno integration
- `extensions.json`: Recommends the Deno extension for this workspace

## Deno Setup

The configuration is set up to:

1. Enable Deno only for files in the `supabase/functions` directory
2. Use the project's `deno.json` as the import map
3. Configure formatting for TypeScript/JavaScript files
4. Support common Deno import hosts (deno.land, esm.sh, etc.)

## Working with Edge Functions

When editing files in the `supabase/functions` directory:

- Deno language server will be active
- Import autocompletion will work for Deno standard library and third-party modules
- TypeScript checking will use Deno's built-in TypeScript

For the rest of the project (Next.js files), the regular TypeScript/JavaScript language server will be used.

## Troubleshooting

If you encounter issues with Deno integration:

1. Make sure the Deno extension is installed
2. Reload the VSCode window after changing settings
3. Check that the file you're editing is in the `supabase/functions` directory
4. Verify that the import map in `deno.json` is correctly configured
