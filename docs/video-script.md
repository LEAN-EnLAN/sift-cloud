# Video Script: Presentando Sift

*(Duración estimada: 5 - 8 minutos)*

**[00:00] Presentación rápida y Qué problema resuelve**
"Hola a todos, mi nombre es [Tu Nombre], y hoy les presento **Sift**, un motor de búsqueda inteligente para repositorios de GitHub.
Todos sabemos que la búsqueda nativa de GitHub tiene limitaciones. Cuando buscas 'como edito pdfs en python', a menudo te arroja listas 'Awesome', proyectos de juguete hechos hace 5 años, o proyectos que tienen muchísimas estrellas pero que ya no son mantenidos. Sift cambia esto analizando verdaderamente la salud de cada repositorio de manera determinista explicable."

**[01:00] Arquitectura General y Transformación del lenguaje**
"Sift está dividido en etapas. Primero, tomamos el lenguaje natural de tu búsqueda. En lugar de mandar eso directo a GitHub, lo pasamos por un pipeline de **Query Understanding**. Extraigo las palabras clave (como 'pdf', 'python'), detecto si hay trampas léxicas, e identifico un *Dominio*. Por ejemplo, si es JWT o un ORM, inyecto *seeds* o repositorios canónicos para asegurar que las bibliotecas base del ecosistema sean consideradas."

**[02:30] Llamada a GitHub y Extracción de Features**
"Con mis variantes de búsqueda sólidas, pido a la API pública de GitHub posibles candidatos. Pero aquí está la clave: no me quedo sólo con lo que dice la API. Para cada candidato, **extraigo features estructurales**. Mido la velocidad de commits, la frecuencia de releases, abro el archivo README y analizo su longitud, busco si hay ejemplos de uso o guías de instalación. También identifico si usan CI, o integran herramientas modernas como ESM y TypeScript."

**[04:00] Fórmula de Scoring y Pesos**
"Todo esto alimenta mi sistema de *Scoring Determinista*. No uso algoritmos oscuros de caja negra. Cada repositorio gana una nota de 0 a 100 basada en una fórmula clara:
- La relevancia del texto tiene un 30% de peso.
- Mantenimiento pesa el 20%.
- Documentación 15%, y Comunidad 15%.
- Y si el repositorio revela riesgos —por ejemplo, está abandonado, es un fork o parece ser un proyecto genérico para un tutorial— le resto un factor penalizador o 'Risk Penalty'."

**[05:30] Ejemplo real de búsqueda**
"Hagamos un ejemplo. Si busco 'autenticacion jwt python', Sift rápidamente me detecta que el ecosistema pertinente en Python son herramientas como `pyjwt` o `authlib`. En la interfaz (y gracias al modo *Debug* que incluí), podemos ver no sólo el puntaje total, sino cada sub-puntaje exacto y **por qué** Sift definió ese score. Sift me dará una pequeña explicación que indica que este candidato cuenta con una documentación excelente y uso canónico."

**[07:00] Rate limits y Escalabilidad**
"Actualmente, hago fetching en vivo de la API, y eso significa chocar fácilmente con *Rate Limits* de GitHub, por eso incluyo notificaciones nativas en el debug mode si se alcanza el techo de uso de la cuota.
Si tuviera que hacerlo escalar para cientos de desarrolladores al día, implementaría un Redis para cachear los perfiles de los repositorios extraídos, y metería Embeddings Vectoriales puramente de los READMEs de cada repositorio extraído para búsquedas súper profundas de funcionalidades semánticas."

**[08:00] Cierre**
"Sift demuestra que la mezcla de entendimiento inteligente del query original y un framework determinista duro puede producir una experiencia de descubrimiento técnico radicalmente superior a solo cruzar palabras clave contra títulos. Muchas gracias."
