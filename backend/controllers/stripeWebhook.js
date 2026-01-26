import appointmentModel from '../models/appointmentModel.js'
import stripe from '../stripe.js'

export const stripeWebhook = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_KEY_SECRET)
    const sig = request.headers['stripe-signature']
    let event

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        response.status(400).send(`Webhook Error: ${error.message}`)
    }

    if(event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object
        const paymentIntentId = paymentIntent.id

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntentId,
        })

        const {appointmentId} = session.data[0].metadata

        await appointmentModel.findByIdAndUpdate(appointmentId, {payment: true, paymentMethod: "Stripe"})
    } else {
        console.log("Inhandled event true", event.type)
    }
    response.json({received: true})
}