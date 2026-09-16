-- Storage bucket for generated invoice/quote PDFs, so the email sent to a
-- client can include a real "Download PDF" link (not just the attachment).
-- Files are stored at "<user_id>/<invoice|quote>/<document_id>.pdf" and the
-- bucket is public-read (the link goes out to a third-party client by design)
-- but only the owning user can write/replace/delete their own files.

insert into storage.buckets (id, name, public)
values ('document-pdfs', 'document-pdfs', true)
on conflict (id) do nothing;

drop policy if exists "owner write document-pdfs" on storage.objects;
create policy "owner write document-pdfs" on storage.objects
  for all
  using (bucket_id = 'document-pdfs' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'document-pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "public read document-pdfs" on storage.objects;
create policy "public read document-pdfs" on storage.objects
  for select
  using (bucket_id = 'document-pdfs');
