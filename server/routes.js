import express from 'express';
import bcrypt from 'bcrypt';
import { query } from './db.js';

const router = express.Router();
const saltRounds = 10;

// USER AUTHENTICATION 

// POST /api/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        // Check if username already exists
        const existingUser = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        const passwordHash = await bcrypt.hash(password, saltRounds);
        const result = await query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
        const newUser = { id: result.insertId, username };
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const users = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            const userResponse = { id: user.id, username: user.username };
            res.json({ message: 'Login successful', user: userResponse });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// GROUP MANAGEMENT

// GET /api/groups
router.get('/groups', async (req, res) => {
    try {
        const groups = await query('SELECT * FROM `groups`');
        // Also fetch membership statuses for the frontend to render buttons correctly
        const memberships = await query('SELECT * FROM group_members');
        res.json({ groups, memberships });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/groups
router.post('/groups', async (req, res) => {
    const { name, creatorId } = req.body;
    try {
        const result = await query('INSERT INTO `groups` (name, creator_id) VALUES (?, ?)', [name, creatorId]);
        const groupId = result.insertId;
        // The creator is automatically an approved member of their own group
        await query('INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, ?)', [groupId, creatorId, 'approved']);
        res.status(201).json({ message: 'Group created successfully', groupId });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/groups/:groupId/join
router.post('/groups/:groupId/join', async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    try {
        await query('INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, ?)', [groupId, userId, 'pending']);
        res.status(200).json({ message: 'Join request sent' });
    } catch (error) {
        console.error('Error sending join request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/groups/:groupId/requests
router.get('/groups/:groupId/requests', async (req, res) => {
    const { groupId } = req.params;
    try {
        const requests = await query(
            `SELECT u.id as user_id, u.username 
             FROM users u
             JOIN group_members gm ON u.id = gm.user_id
             WHERE gm.group_id = ? AND gm.status = 'pending'`,
            [groupId]
        );
        res.json(requests);
    } catch (error) {
        console.error('Error fetching join requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/groups/:groupId/approve
router.post('/groups/:groupId/approve', async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    try {
        await query(
            'UPDATE group_members SET status = "approved" WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        res.status(200).json({ message: 'User approved' });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// MESSAGES

// GET /api/groups/:groupId/messages
router.get('/groups/:groupId/messages', async (req, res) => {
    const { groupId } = req.params;
    try {
        const messages = await query(
            `SELECT m.content, m.timestamp, m.is_anonymous, u.id as userId, u.username 
             FROM messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.group_id = ? 
             ORDER BY m.timestamp ASC`,
            [groupId]
        );
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

