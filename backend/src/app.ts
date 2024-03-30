import PassportService from './passport/PassportService';
import cls from 'cls-hooked';
import cors from 'cors';
import express, { Express } from 'express';
import healthCheckRoutes from './healthCheck/healthCheckRoutes';
import heartbeatRoutes from './heartbeat/heartbeatRoutes';
import passportRoutes from './passport/passportRoutes';
import path from 'path';
import todoRoutes from './todos/todoRoutes';
import userRoutes from './users/userRoutes';
import verificationRoutes from './verification/verificationRoutes';
import { logger } from './logger';
import { v4 } from 'uuid';
import { determineAndSendError } from './utils';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import plaidRoutes from './plaid/plaidRoutes'
import bankRoutes from './banks/bankRoutes'

const app: Express = express();

const passportService = new PassportService();

app.use(passportService.configureSessionStore());
app.use(passportService.setAuthenticationStrategy());

const swaggerDefinition = {
	openapi: '3.0.0',
	info: {
		title: 'Express API with TypeScript',
		version: '1.0.0',
	},
};

const options = {
	swaggerDefinition,
	apis: ['./src/**/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors({
	origin: process.env.BASE_URL,
	credentials: true
}));

// allows for ip address to be fetched when behind a proxy
app.set('trust proxy', true);

app.use((request, response, next) => {
	response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	if (request.method === 'OPTIONS') {
		return response.status(200).send({});
	}
	next();
});

app.use((request, response, next) => {
	const namespace = cls.createNamespace('global');
	const requestId: any = v4();
	const clientIP = request.ip;
	namespace.run(() => {
		namespace.set('logger', logger.child({ requestId, clientIP }));
		next();
	});
});

passportService.useLocalStrategy();
passportService.serializeUser();
passportService.deserializeUser();

app.use(express.static(path.join(__dirname, '../build')));

app.use('/api', passportRoutes);
app.use('/api', plaidRoutes);
app.use('/api', todoRoutes);
app.use('/api', userRoutes);
app.use('/api', bankRoutes);
app.use('/api', verificationRoutes);
app.use('/api', healthCheckRoutes);
app.use('/api', heartbeatRoutes);

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.use((request, response, next) => {
	const error: Error = new Error(`Path not found for url=${request.url}`);
	next(error);
});

app.use(determineAndSendError());

export default app;