# Chat Application

A real-time group chat application built with Node.js, Express, WebSockets, and MySQL. This application allows users to create accounts, join groups, and communicate in real-time with features like anonymous messaging and profile pictures.

## Features

### User Management
- **User Registration and Login**: Secure authentication with bcrypt password hashing
- **Profile Pictures**: Optional profile picture upload during registration
- **Session Management**: Client-side session storage for persistent login

### Group Communication
- **Create Groups**: Users can create new chat groups
- **Join Groups**: Request to join existing groups with approval system
- **Group Management**: Group creators can approve/deny join requests
- **Real-time Messaging**: Instant message delivery using WebSockets
- **Anonymous Mode**: Toggle anonymous messaging within groups
- **Message History**: All messages are stored and retrieved when joining groups
- **Auto-scroll**: Automatic scrolling to latest messages when entering groups

### User Interface
- **Responsive Design**: Mobile-first design optimized for various screen sizes
- **Modern UI**: Clean, intuitive interface with proper visual feedback
- **Real-time Updates**: Live message updates without page refresh
- **Avatar System**: User profile pictures and anonymous user indicators

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **WebSocket (ws)**: Real-time communication
- **MySQL**: Database for data persistence
- **bcrypt**: Password hashing and security
- **multer**: File upload handling for profile pictures
- **dotenv**: Environment variable management

### Frontend
- **Vanilla JavaScript**: Client-side functionality
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables and flexbox
- **WebSocket API**: Real-time client-server communication

### Database
- **MySQL**: Relational database with four main tables:
  - `users`: User accounts and profile information
  - `groups`: Chat group information
  - `group_members`: Group membership and approval status
  - `messages`: Chat messages with anonymous flag support

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- MySQL server
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app-ge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database
   - Import the schema from `database.sql`:
   ```bash
   mysql -u your_username -p your_database_name < database.sql
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=chat_app_db
   ```

5. **Start the application**
   
   For development:
   ```bash
   npm run dev
   ```
   
   For production:
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
chat-app-ge/
├── public/                 # Static frontend files
│   ├── index.html         # Main HTML file
│   ├── client.js          # Frontend JavaScript
│   ├── style.css          # Application styles
│   └── uploads/           # User profile pictures
├── server/                # Backend modules
│   ├── db.js             # Database connection and queries
│   ├── routes.js         # API routes and handlers
│   └── websocket.js      # WebSocket server setup
├── database.sql          # Database schema
├── server.js            # Main server file
├── package.json         # Project dependencies and scripts
└── README.md           # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User authentication
- `POST /api/upload-profile-picture` - Upload user profile picture

### Groups
- `GET /api/groups` - Get all groups and user memberships
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/join` - Request to join group
- `POST /api/groups/:id/approve` - Approve join request (group creator only)
- `GET /api/groups/:id/requests` - Get pending join requests
- `GET /api/groups/:id/messages` - Get group message history

## WebSocket Events

### Client to Server
- `message` - Send new message to group

### Server to Client
- `message` - Receive new message from group member

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password_hash`: Bcrypt hashed password
- `profile_picture_url`: Optional profile picture path
- `created_at`: Account creation timestamp

### Groups Table
- `id`: Primary key
- `name`: Group name
- `creator_id`: Foreign key to users table
- `created_at`: Group creation timestamp

### Group Members Table
- `group_id`: Foreign key to groups table
- `user_id`: Foreign key to users table
- `status`: Membership status (pending/approved)
- `joined_at`: Join request timestamp

### Messages Table
- `id`: Primary key
- `group_id`: Foreign key to groups table
- `user_id`: Foreign key to users table
- `content`: Message text content
- `is_anonymous`: Boolean flag for anonymous messages
- `timestamp`: Message creation timestamp

## Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Input Validation**: Server-side validation for all user inputs
- **File Upload Security**: Restricted file types and size limits for profile pictures
- **SQL Injection Prevention**: Parameterized queries using prepared statements
- **Authentication Required**: Protected routes require valid user session

## Development

### Available Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon for auto-restart

### Development Dependencies
- `nodemon`: Development server with auto-restart capability

## Browser Compatibility

The application is compatible with modern browsers that support:
- WebSocket API
- ES6+ JavaScript features
- CSS Grid and Flexbox
- File API for profile picture uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions about this application, please refer to the project documentation or create an issue in the repository.
