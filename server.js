import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './server/routes.js';
import { setupWebSocket } from './server/websocket.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// MIDDLEWARE 
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// API ROUTES
app.use('/api', apiRoutes);

// WEBSOCKET
setupWebSocket(server);

// CATCH-ALL ROUTE

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SERVER 
server.listen(PORT, () => {
    console.log(`Server is listening on PORT: ${PORT}`);
});