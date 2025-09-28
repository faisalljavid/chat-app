import { WebSocketServer } from 'ws';
import { query } from './db.js';

// All active WebSocket connections
const groupConnections = new Map();

export function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected');

        let currentGroupId = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'message') {
                    // 1. Save the message to the database
                    const { content, userId, groupId, isAnonymous } = data;
                    const result = await query(
                        'INSERT INTO messages (content, user_id, group_id, is_anonymous) VALUES (?, ?, ?, ?)',
                        [content, userId, groupId, isAnonymous]
                    );

                    // 2. Get user info to broadcast with the message
                    const users = await query('SELECT username FROM users WHERE id = ?', [userId]);
                    if (users.length === 0) return; // User not found

                    const broadcastMessage = {
                        type: 'message',
                        id: result.insertId,
                        content,
                        userId,
                        groupId,
                        isAnonymous,
                        username: users[0].username,
                        timestamp: new Date().toISOString()
                    };

                    // 3. Keep track of which group this connection is for
                    if (currentGroupId !== groupId) {
                        // Remove from old group if switching
                        if (currentGroupId && groupConnections.has(currentGroupId)) {
                            groupConnections.get(currentGroupId).delete(ws);
                        }
                        currentGroupId = groupId;
                    }

                    // 4. Add the connection to the correct group's Set
                    if (!groupConnections.has(groupId)) {
                        groupConnections.set(groupId, new Set());
                    }
                    groupConnections.get(groupId).add(ws);

                    // 5. Broadcast the message to all clients in the same group
                    if (groupConnections.has(groupId)) {
                        for (const client of groupConnections.get(groupId)) {
                            if (client.readyState === ws.OPEN) {
                                client.send(JSON.stringify(broadcastMessage));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to process message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            // Remove the disconnected client from any group it was part of
            if (currentGroupId && groupConnections.has(currentGroupId)) {
                groupConnections.get(currentGroupId).delete(ws);
                // If the group becomes empty, remove it from the map
                if (groupConnections.get(currentGroupId).size === 0) {
                    groupConnections.delete(currentGroupId);
                }
            }
        });
    });
}

