import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import salesChallanRoutes from './routes/salesChallan.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    return sendSuccess(res, null, 200, "Server is running");
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', salesChallanRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/accounts/reports', reportRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;