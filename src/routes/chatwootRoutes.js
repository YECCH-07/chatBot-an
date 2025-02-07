import express from 'express';
import chatwootController from '../controllers/chatwootController.js';

const router = express.Router();

// Validation middleware
const validateChatwootWebhook = (req, res, next) => {
    try {
        const event = req.body;
        
        if (!event) {
            throw new Error('No request body');
        }

        if (!event.event) {
            throw new Error('No event type specified');
        }

        if (event.event === 'message_created' && !event.message) {
            throw new Error('Message event without message data');
        }

        next();
    } catch (error) {
        console.error('Chatwoot validation error:', error);
        res.status(400).json({ 
            error: 'Invalid request',
            details: error.message
        });
    }
};

router.post('/chatwoot-hook', validateChatwootWebhook, chatwootController.handleIncoming);
router.get('/chatwoot-hook', chatwootController.verifyWebhook);

// Error handler specific to Chatwoot routes
router.use((error, req, res, next) => {
    console.error('Chatwoot route error:', error);
    res.status(500).json({ error: 'Chatwoot processing error' });
});

export default router;
