import BrandLogo from '@/components/BrandLogo'
import { InputField } from '@/components/ui/InputField'
import React from 'react'

const Subscribe = () => {
  return (
    <div className='max-w-3xl mx-auto my-24 space-y-8'>
        <div className='space-y-4'>
            <h2 className='text-center text-2xl md:text-3xl lg:text-5xl text-brand-color-500 font-black'>Fresh News from the House</h2>
            <InputField
            placeholder='customer@gmail.com'
            />
            <button className='w-full bg-brand-color-500 text-white hover:bg-brand-color-600 py-2 rounded-lg text-lg cursor-pointer'>
                Subscribe Now
            </button>
        </div>

        <p className='text-center text-lg text-slate-500'>
          As a simple thank you for coming back, Harrison is always ready to welcome you home. Your table is here whenever you are.  
        </p>
        <div className='place-self-center my-24'>
            <BrandLogo className='lg:h-24'/>
        </div>
    </div>
  )
}

export default Subscribe
