/**
 * MominAI Payment Integration Service
 * Stripe integration for subscription management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    constructor() {
        this.subscriptionPlans = {
            free: {
                name: 'Free',
                price: 0,
                features: ['WebContainer IDE', 'Basic AI assistance', '1GB storage'],
                limits: { requests: 100, storage: '1GB' }
            },
            premium: {
                name: 'Premium',
                price: 1000, // $10.00 in cents
                stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
                features: ['Docker containers', 'Remote development', 'Advanced debugging', 'Unlimited AI requests'],
                limits: { requests: 500, storage: 'unlimited' }
            },
            team: {
                name: 'Team',
                price: 800, // $8.00 per user in cents
                stripePriceId: process.env.STRIPE_TEAM_PRICE_ID,
                features: ['Everything in Premium', 'Team collaboration', 'Admin dashboard', 'Priority support'],
                limits: { requests: 1000, storage: 'unlimited' }
            },
            enterprise: {
                name: 'Enterprise',
                price: 'custom',
                features: ['Everything in Team', 'On-premise deployment', 'Custom integrations', 'Dedicated support'],
                limits: { requests: 'unlimited', storage: 'unlimited' }
            }
        };
    }

    async createCustomer(user) {
        try {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.username,
                metadata: {
                    userId: user.id,
                    username: user.username
                }
            });

            return {
                success: true,
                customerId: customer.id
            };
        } catch (error) {
            console.error('Error creating Stripe customer:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSubscription(customerId, planId) {
        try {
            if (planId === 'free') {
                return {
                    success: true,
                    subscription: null,
                    message: 'Free plan activated'
                };
            }

            const plan = this.subscriptionPlans[planId];
            if (!plan || !plan.stripePriceId) {
                throw new Error('Invalid plan or price ID not configured');
            }

            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: plan.stripePriceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
            });

            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    clientSecret: subscription.latest_invoice.payment_intent.client_secret
                }
            };
        } catch (error) {
            console.error('Error creating subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });

            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    cancelAt: subscription.cancel_at
                }
            };
        } catch (error) {
            console.error('Error canceling subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    currentPeriodStart: subscription.current_period_start,
                    currentPeriodEnd: subscription.current_period_end,
                    cancelAt: subscription.cancel_at,
                    items: subscription.items.data.map(item => ({
                        priceId: item.price.id,
                        quantity: item.quantity
                    }))
                }
            };
        } catch (error) {
            console.error('Error retrieving subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createPaymentIntent(amount, currency = 'usd', customerId = null) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                customer: customerId,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                success: true,
                clientSecret: paymentIntent.client_secret
            };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleWebhook(payload, signature) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            switch (event.type) {
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdate(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCanceled(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Webhook error:', error);
            return { success: false, error: error.message };
        }
    }

    async handleSubscriptionUpdate(subscription) {
        // Update user subscription status in database
        console.log(`Subscription updated: ${subscription.id} - ${subscription.status}`);
        // In a real implementation, update the user's subscription in the database
    }

    async handleSubscriptionCanceled(subscription) {
        // Handle subscription cancellation
        console.log(`Subscription canceled: ${subscription.id}`);
        // In a real implementation, downgrade user to free plan
    }

    async handlePaymentSucceeded(invoice) {
        // Handle successful payment
        console.log(`Payment succeeded for invoice: ${invoice.id}`);
        // In a real implementation, extend user's subscription
    }

    async handlePaymentFailed(invoice) {
        // Handle failed payment
        console.log(`Payment failed for invoice: ${invoice.id}`);
        // In a real implementation, notify user and potentially suspend account
    }

    getPlans() {
        return this.subscriptionPlans;
    }

    getPlan(planId) {
        return this.subscriptionPlans[planId] || null;
    }
}

module.exports = PaymentService;
