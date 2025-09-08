-- Enable realtime for instagram_carousels table
ALTER TABLE public.instagram_carousels REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instagram_carousels;