-- Brand logo upload (phase B of the property-setup work; phase A was 0009).
-- This is the project's FIRST use of Supabase Storage — PROJECT.md records a
-- deliberate earlier decision not to add Storage for invoice PDFs, so the
-- choices here are spelled out rather than assumed.
--
-- Bucket is PUBLIC, on purpose. A hotel's logo is printed on invoices handed
-- to guests; it is not sensitive. Public read also avoids signed-URL expiry,
-- which matters because @react-pdf/renderer fetches the image server-side at
-- render time — a short-lived signed URL would be one more thing that can
-- expire mid-render. Writes are still fully gated (see the policies below);
-- "public" here means read-only-to-anyone, not writable-by-anyone.
--
-- MIME types are restricted to PNG and JPEG at the BUCKET level, not just in
-- app code, because @react-pdf/renderer's <Image> only handles those two
-- reliably (SVG and WebP are not supported). Letting an SVG through would
-- produce a logo that renders on the HTML invoice but silently breaks the
-- PDF — so the constraint belongs where it can't be bypassed.

alter table properties add column logo_path text;

comment on column properties.logo_path is
  'Object path within the property-logos bucket, e.g. "<property_id>/logo.png". Stores the PATH, not a URL, so the Supabase project URL is never baked into the database and the bucket can move without a data migration.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-logos',
  'property-logos',
  true,
  1048576,                                -- 1 MB; far more than a logo needs
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Read: anyone. The bucket is public and the logo is on guest-facing invoices.
create policy property_logos_read on storage.objects for select
  using (bucket_id = 'property-logos');

-- Write: only an owner/admin of the property whose id is the first path
-- segment. The regex guard matters — `(storage.foldername(name))[1]::uuid`
-- raises a cast error on a malformed path instead of cleanly denying, and an
-- erroring policy is a worse failure mode than a false one.
create policy property_logos_write on storage.objects for all
  to authenticated
  using (
    bucket_id = 'property-logos'
    and (storage.foldername(name))[1] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and internal.current_property_role(((storage.foldername(name))[1])::uuid)
        in ('owner', 'admin')
  )
  with check (
    bucket_id = 'property-logos'
    and (storage.foldername(name))[1] ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and internal.current_property_role(((storage.foldername(name))[1])::uuid)
        in ('owner', 'admin')
  );
