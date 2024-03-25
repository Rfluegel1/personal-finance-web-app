if (process.env.NODE_ENV === 'test') {
    process.env.NODE_ENV = 'development'
}
const env = process.env.NODE_ENV || 'development'
require('dotenv').config({path: `.env.${env}`})