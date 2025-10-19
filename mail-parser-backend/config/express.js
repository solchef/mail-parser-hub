import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

import constant from './directory.js';

const app = express();

dotenv.config();

app.set('port', process.env.APP_PORT || 4000);
app.set('host', process.env.APP_HOST || 'localhost');

app.use(express.static(constant.distDir));

app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);
app.use(compression());
app.use(methodOverride());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static(constant.assetsDir));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;