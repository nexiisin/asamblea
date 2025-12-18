-- Habilitar Realtime en todas las tablas
-- Ejecutar este script en Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE public.viviendas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.propietarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.asambleas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.asistencias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.propuestas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cronometro_debate;

-- Verificar que las tablas están en la publicación
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
