import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_KEY_SECRET)

export default stripe