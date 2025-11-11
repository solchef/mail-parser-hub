import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import app from './config/express.js';
import routes from './routes/index.route.js';
import * as errorHandler from './middlewares/errorHandler.js';
import joiErrorHandler from './middlewares/joiErrorHandler.js';
import requestLogger from './middlewares/requestLogger.js';
import { init } from './config/lowdb.js';
import { migrate } from './config/migrate.js';
import { seed } from './db/seed.js'
import { startMailPolling } from './utils/cron.js';


dotenv.config();

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware
app.use(requestLogger);
app.use('/api', routes);

// Health check
app.get('/ping', (req, res) => res.send('pong'));

// Serve frontend (catch-all)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// Init database and cron polling before starting the server
(async () => {
  try {
    await init();
    // 🧱 Run migrations first
    await migrate();
    // 🌱 Then seed the database if first time
    await seed();
    await startMailPolling();

    app.listen(app.get('port'), app.get('host'), () => {
      console.log(`🚀 Server running at http://${app.get('host')}:${app.get('port')}`);
    });
  } catch (err) {
    console.error('❌ App startup failed:', err);
    process.exit(1);
  }
})();

// Error handlers (must be after all routes)
app.use(joiErrorHandler);
app.use(errorHandler.genericErrorHandler);
app.use(errorHandler.notFound);
app.use(errorHandler.methodNotAllowed);

export default app;
