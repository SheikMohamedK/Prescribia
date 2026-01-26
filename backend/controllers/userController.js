import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import stripe from '../stripe.js'
import razorpay from "razorpay"

// API to register user
const registerUser = async (req, res) => {
    try {
        
        const {name, email, password} = req.body

        if (!name || !password || !email) {
            return res.json({success: false, message: "Missing Details"})
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({success: false, message: "Enter a valid email"})
        }

        // validating a strong password
        if (password.length < 8) {
            return res.json({success: false, message: "Enter a strong password"})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password : hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

        res.json({success: true, token})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// API for user login
const loginUser = async (req, res) => {
    

    try {

        const {email, password} = req.body
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({success: false, message: "User does not exist"})
        }
        
        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
            res.json({success: true, token})
        } else {
            res.json({success: false, message: 'Inavlid credentials'})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }

}

// API to get user profile data
const getProfile = async (req, res) => {
    
    try {
        
        const userId = req.user.userId
        const userData = await userModel.findById(userId).select('-password')

        res.json({success: true, userData})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }

}

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        
        const {name , phone, address, dob, gender} = req.body
        const userId = req.user.userId
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({success: false, message: "Data Missing"})
        }

        await userModel.findByIdAndUpdate(userId, {name, phone, address: JSON.parse(address), dob, gender})

        if (imageFile) {
            
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: 'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, {image: imageURL})
        }

        res.json({success: true, message: "Profile Updated"})


    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// API to book apointment
const bookAppointment = async (req, res) => {
    try {

        const userId = req.user.userId
        const {docId, slotDate, slotTime} = req.body

        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData.available) {
            return res.json({success: false, message: 'Doctor not available'})
        }

        let slot_booked = docData.slot_booked 
        
        // checking for slot availability
        if (slot_booked[slotDate]) {
            if (slot_booked[slotDate].includes(slotTime)) {
                return res.json({success: false, message: 'Slot not available'})
            } else {
                slot_booked[slotDate].push(slotTime)
            }
        } else {
            slot_booked[slotDate] = []
            slot_booked[slotDate].push(slotTime)
        }
        

        const userData = await userModel.findById(userId).select('-password')


        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save your slot data in docData
        await doctorModel.findByIdAndUpdate(docId,{slot_booked})

        res.json({success: true, message: 'Appointment booked'})
        
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
} 

// API to get user appointments for frontend my-appointment pade
const listAppointment = async (req, res) => {
    try {

        const userId = req.user.userId
        const appointments = await appointmentModel.find({userId})

        res.json({success: true, appointments})
        
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {

    try {
        
        const userId = req.user.userId
        const {appointmentId} = req.body
        

        const appointmentData = await appointmentModel.findById(appointmentId)
        

        // verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({success: false, message: "Unauthorized action"})
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})

        // releasing doctor slot
        const {docId, slotDate, slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slot_booked = doctorData.slot_booked

        slot_booked[slotDate] = slot_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slot_booked})

        res.json({success: true, message: "Appointment cancelled"})

    } catch (error) {
         console.log(error)
        res.json({success: false, message: error.message})
    }

}

/* const checkoutSession = async (req, res) => {
    try {
        
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
        return res.json({ success: false, message: "Appointment cancelled or not found" });
        }

        const stripe = new Stripe(process.env.STRIPE_KEY_SECRET)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: process.env.VITE_FRONTEND_URL + '/chekout-success',
            cancel_url: process.env.VITE_FRONTEND_URL + '/my-appointments',
            line_items: [
            {
                price_data: {
                currency: process.env.CURRENCY,
                product_data: {
                    name: 'Appointment',
                    description: 'Appointment Payment',
                },
                unit_amount: appointmentData.amount * 100,
                },
                quantity: 1,
            },
        ],
        })

        console.log(session);
        

        res.json({success: true, chechoutUrl: session.url})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
} */

const paymentStripe = async (req, res) => {

    
    try {
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
        return res.json({ success: false, message: "Appointment cancelled or not found" });
        }

        const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                currency: process.env.CURRENCY,
                product_data: {
                    name: 'Appointment',
                    description: 'Appointment Payment',
                },
                unit_amount: appointmentData.amount * 100,
                },
                quantity: 1,
            },
        ],
    mode: 'payment',
    success_url:  `${process.env.VITE_FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.VITE_FRONTEND_URL + '/my-appointments',
    metadata: {
        appointmentId,
    }
    
  })
        
        
        appointmentData.paymentSessionId = session.id
        await appointmentData.save()

        res.json({success: true, checkoutUrl: session.url})

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

const checkoutSuccess =  async (req, res) => {
 try  {
    const sessionId = req.body.session_id;
    
    const paymentInfo = await stripe.checkout.sessions.retrieve(sessionId)
    if (paymentInfo.payment_status === "paid")
        await appointmentModel.findOneAndUpdate({paymentSessionId : sessionId}, {payment: true})        

    res.send("Success")
 } catch(err){    
    res.status(500).send("Failed")
 }
}

export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentStripe, checkoutSuccess}