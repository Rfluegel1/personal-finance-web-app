const isStaging = process.env.NODE_ENV === 'staging';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const config = {
	webServer: isStaging ? undefined : {
		command: 'sh -c "npm run build && cd ../backend && npm start > playwright_test_server.log 2>&1"',
		port: 8090
	},
	use: {
		baseURL: isStaging ? 'https://express-web-app-template.fly.dev' : 'http://localhost:8090',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	timeout: 5000,
};

export default config;
