# Diario de Trading · app para alumnos

App web instalable (PWA) para que cada alumno lleve su diario de trading y haga el test de cada directo. Al responder cada pregunta ve el fragmento exacto del directo donde se explicó.

Se instala desde el navegador del móvil («Añadir a pantalla de inicio») y funciona sin conexión.

**App publicada:** https://alexgonziiaar-hub.github.io/diario-trading-app/

## Qué incluye esta versión (0.1)

- **Acceso** con nombre, email y código de alumno.
- **Inicio:** test del último directo, resultado del mes, plan del día, últimas operaciones, avisos y tarjeta para instalar la app.
- **Diario:** operaciones por mes, filtros, calendario de días en verde y en rojo, detalle de cada operación y borrado.
- **Nueva operación:** calcula solo el resultado en $, los puntos y la R a partir de entrada, salida y stop.
- **Tests:** un test por directo, porcentaje de alumnos que eligió cada opción, explicación de por qué cada respuesta incorrecta no lo es, extracto con transcripción sincronizada, resultados y repaso de fallos.
- **Apuntes:** extractos guardados, notas propias y buscador en todos los extractos.
- **Perfil:** estadísticas, preferencias de avisos, editar el plan de trading, exportar el diario a CSV y borrar los datos de ejemplo.

En esta versión los datos de cada alumno se guardan **solo en su teléfono** (no hay servidor todavía). Al entrar por primera vez se cargan operaciones y respuestas de ejemplo, que se pueden borrar desde Perfil.

## Arrancarla en tu ordenador

Necesitas Node.js 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

Abre la dirección que aparece (por defecto http://localhost:5173). Para probar la versión final, con instalación y modo sin conexión:

```bash
npm run build
```

```bash
npm run preview
```

## Editar el contenido

- **Tests de los directos:** `src/data/tests.ts`. Cada pregunta lleva su extracto en frases con el segundo en que empiezan (`segments`) y la frase clave marcada con `key: true`. Si añades `youtubeId` al directo, el extracto reproduce el vídeo real de YouTube justo en ese fragmento.
- **Activos, setups, emociones, plan por defecto y próximo directo:** `src/content.ts`.
- **Iconos de la app:** `npm run icons` (los genera en `public/`).

## Publicarla

Es una web estática y las direcciones internas van con `#` (`…/#/diario`), así que funciona en cualquier hosting sin configurar redirecciones.

**GitHub Pages (gratis, ya preparado):**

1. Sube este proyecto a un repositorio público de GitHub.
2. En el repositorio: Settings → Pages → Source: «GitHub Actions».
3. Cada vez que se sube un cambio a `main`, el flujo `.github/workflows/deploy.yml` compila y publica la app en `https://<usuario>.github.io/<repositorio>/`.

**Vercel o Netlify (sirve también con repositorio privado):** importa el repositorio. Comando de compilación: `npm run build`. Carpeta: `dist`.

Comparte el enlace con los alumnos. Al abrirlo en el móvil podrán instalarla.

## Próximos pasos

1. **Servidor (Supabase):** cuentas de alumno con código de acceso y datos guardados en la nube, así no se pierden al cambiar de teléfono.
2. **Panel del mentor:** subir cada día las preguntas y extractos del directo sin tocar código.
3. **Notificaciones push:** aviso de test nuevo y recordatorio del diario.
4. **Capturas del gráfico** en cada operación.
5. **App Store y Google Play**, si se quiere estar en las tiendas.
