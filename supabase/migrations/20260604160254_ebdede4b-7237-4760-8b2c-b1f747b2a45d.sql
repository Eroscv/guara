CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can read all resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'::app_role));