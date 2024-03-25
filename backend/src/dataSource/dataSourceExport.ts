import DataSourceService from './DataSourceService';

const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

const dataSourceService = DataSourceService.getInstance();

export const dataSourceExport = dataSourceService.getDataSource();
