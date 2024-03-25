import winston from 'winston'

import cls from 'cls-hooked'
cls.getNamespace('global')
const createLogger = () => {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        transports: [new winston.transports.Console()]
    })
}

export const logger = createLogger()

export function getLogger() {
    const namespace = cls.getNamespace('global')
    const namespaceLogger = namespace?.get('logger')
    return namespaceLogger || logger
}
