import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routers
import authRouter from './routes/auth.routes.js';
import eventsRouter from './routes/events.routes.js';
import managersRouter from './routes/managers.routes.js';
import registrationsRouter from './routes/registrations.routes.js';
import tasksEventsRouter from './routes/tasks-events.routes.js';
import volunteersEventsRouter from './routes/volunteers-events.routes.js';
import participantRouter from './routes/participant.routes.js';
import adminRouter from './routes/admin.routes.js';
import volunteerRouter from './routes/volunteer.routes.js';
import volunteerApplicationRouter from './routes/volunteerApplication.routes.js';
import taskRouter from './routes/task.routes.js';
import certificateRouter from './routes/certificate.routes.js';
import paymentRouter from './routes/payment.routes.js';
import csvRouter from './routes/csv.routes.js';
import { rateLimit } from './middleware/rateLimit.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for credentials & dev server origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Request body JSON parsing middleware
app.use(express.json());

// Mount routers
app.use('/auth', rateLimit({ windowMs: 60_000, max: 40, keyPrefix: 'auth' }), authRouter);
app.use('/events', eventsRouter);
app.use('/registrations', registrationsRouter);
app.use('/tasks', taskRouter);
app.use('/volunteer', volunteerRouter);
app.use('/volunteer-applications', volunteerApplicationRouter);
app.use('/volunteers', volunteersEventsRouter);
app.use('/managers', managersRouter);
app.use('/participant', participantRouter);
app.use('/admin', adminRouter);
app.use('/certificate', certificateRouter);
app.use('/payments', paymentRouter);
app.use('/csv', csvRouter);

// Health check / welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Marathon Management Portal (MMP) Backend REST API!',
    status: 'ONLINE',
    timestamp: new Date()
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Launch server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`MMP Server successfully running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
