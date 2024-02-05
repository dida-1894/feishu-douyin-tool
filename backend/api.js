import serverless from "serverless-http";

const app = require('./app');

export const handler = serverless(app);