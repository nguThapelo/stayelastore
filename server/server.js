require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// FIX 431 ERROR: Increase header size limit
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
    req.setTimeout(0); // No timeout
    next();
});

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        console.log('Creating Stripe session...'); // Debug log
        const { lineItems } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:5000/success',
            cancel_url: 'http://localhost:5000/cart',
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
