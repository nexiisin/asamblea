-- Query para depurar el estado del cronómetro
SELECT 
  id,
  codigo_acceso,
  estado_actual,
  cronometro_activo,
  cronometro_pausado,
  cronometro_duracion_segundos,
  cronometro_tiempo_pausado,
  cronometro_inicio,
  EXTRACT(EPOCH FROM (timezone('utc', now()) - cronometro_inicio))::INTEGER as segundos_transcurridos
FROM public.asambleas
ORDER BY created_at DESC
LIMIT 1;
