import React from 'react'
import { assets } from '../assets/assets'
import {format} from 'date-fns';

const Footer = () => {
    
    const currentYear = format(new Date(), 'yyyy')

  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

            {/* ----- Left Section ----- */}
            <div>
                <img className='mb-5 w-40' src={assets.logo} alt="" />
                <p className='w-full md:w-2/3 text-gray-600 eading-6'>Lorem ipsum is simply dummy text of the printing and typesetting industry. In blessed pains I will come, reason inventor, something deserts the sayings that because desire as if life flees follow except where, debts similar consectetur nothing!</p>
            </div>

            {/* ----- Center Section ----- */}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Conatact us</li>
                    <li>Privacy policy</li>
                </ul>
            </div>

            {/* ----- Right Section ----- */}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>+1-290-800-2924</li>
                    <li>contactprescribia@gmail.com</li>
                </ul>
            </div>
        </div>

        {/* Copyright Text */}
        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright {currentYear} &copy; Prescribia. All Rights Reserved</p>
        </div>
    </div>
  )
}

export default Footer