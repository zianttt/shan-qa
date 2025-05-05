import { connect, disconnect } from 'mongoose';

async function connectToDatabase() {
    try {
        await connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error(`Failed to connect to database: ${error}`);
    }
}

async function disconnectFromDatabase() {
    try {
        await disconnect();
        console.log('Disconnected from database successfully');
    } catch (error) {
        console.error('Error disconnecting from database:', error);
        throw new Error(`Failed to disconnect from database: ${error}`);
    }
}

export { connectToDatabase, disconnectFromDatabase };