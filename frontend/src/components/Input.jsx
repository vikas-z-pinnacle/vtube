import React, {useId} from 'react'
import PropTypes from 'prop-types';

const Input = React.forwardRef( function Input({
    label,
    type = "text",
    placeholder,
    isRequired=false,
    className = "",
    hasError="",
    ...props
}, ref){
    const id = useId()
    return (
        <div className='w-full'>
            {label && <label 
            className='inline-block mb-1 pl-1 float-left' 
            htmlFor={id}>
                {label}{isRequired ? <span className="text-red-500">*</span> : ''}
            </label>
            }
            <input
            type={type}
            placeholder={placeholder}
            className={`px-3 py-2 rounded-lg bg-white ${hasError ? 'border-red-500' : 'border-gray-300'} text-black outline-none focus:bg-gray-50 duration-200 border border-gray-200 w-full ${className}`}
            ref={ref}
            {...props}
            id={id}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError.message}</p>}
        </div>
    )
})

Input.propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    isRequired: PropTypes.bool,
    hasError: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    className: PropTypes.string,
};

export default Input