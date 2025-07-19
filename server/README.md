
# MTI Attendance System Backend

This is the Node.js backend for the MTI Attendance System application. It provides API endpoints for fetching attendance data, exporting to CSV/PDF, and retrieving summary statistics.

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example` template
4. Start the server:
   ```
   npm start
   ```

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

```
# Server Config
PORT=3000
NODE_ENV=development

# Database Config
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=your_db_server
DB_NAME=your_db_name
DB_PORT=1433
```

## API Endpoints

### Attendance Data
- `GET /api/attendance` - Get attendance records with pagination and filtering
- `GET /api/attendance/export/csv` - Export attendance records as CSV
- `GET /api/attendance/export/pdf` - Export attendance records as PDF
- `GET /api/attendance/summary` - Get attendance summary statistics
- `GET /api/filters` - Get filter options for departments, companies, etc.

## Development

Run the server in development mode with automatic restart:
```
npm run dev
```
