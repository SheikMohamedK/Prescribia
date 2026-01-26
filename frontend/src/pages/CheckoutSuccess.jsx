import { assets } from '../assets/assets'
import {Link, useSearchParams} from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AppContext } from '../context/Context'
import axios from 'axios'
import { toast } from 'react-toastify'


const CheckoutSuccess = () => {

    const { backendUrl, token } = useContext(AppContext)

    const [searchParams] = useSearchParams()

    const session_id = searchParams.get("session_id")

    useEffect(() => {
        const verifyStripe = async () => {
            try {
            const {data} = await axios.post(backendUrl + '/api/user/checkout-success', {session_id}, {headers: {token}})
            if (data.success) {
                console.log(data.success)
                toast.success("Payment confirmed!");
            } else {
                toast.error(data.message);
            }
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
            
        }
        verifyStripe()
    },[session_id])

  return (
    <div className='bg-gray-100 h-screen'>
        <div className='bg-white p-6 md:mx-auto'>
            <img className='text-green-600 w-16 h-16 mx-auto my-6' src={assets.verified_icon} alt="" />
            <div className='text-center'>
                <h3 className='md:text-2xl text-base text-gray-900 font-semibold text-center'>
                    Payment Done!
                </h3>
                <p className='text-gray-600 my-2'>
                    Thank you for completing your secure online payment.
                </p>
                <p> Have a great day! </p>
                <div className='py-10 text-center'>
                    <Link to='/' className='px-12 bg-primary text-white font-semibold py-3 rounded-lg'>
                        Go Back To Home
                    </Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default CheckoutSuccess