const { createClerkClient, verifyToken } = require('@clerk/backend');
const User = require('../models/User');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, error: 'Unauthorized: No token' });

        // Use the standalone verifyToken function
        const session = await verifyToken(token, { 
            secretKey: process.env.CLERK_SECRET_KEY 
        });

        if (!session) return res.status(401).json({ success: false, error: 'Unauthorized: Invalid session' });

        const clerkId = session.sub;

        // Auto-sync User
        let user = await User.findOne({ clerkId });
        if (!user) {
            const clerkUser = await clerkClient.users.getUser(clerkId);
            user = await User.create({
                clerkId,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                profileImageUrl: clerkUser.imageUrl
            });
        }
        
        req.auth = { userId: clerkId, user };
        next();
    } catch (e) {
        console.error('Auth Error Details:', e);
        res.status(401).json({ success: false, error: 'Auth failed: ' + e.message });
    }
};

module.exports = { requireAuth };
