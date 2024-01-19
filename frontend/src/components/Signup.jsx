import { useState } from 'react'
import authService from '../services/authService.js'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store/authSlice'
import { Button, Input, Logo } from './index.js'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'

function Signup() {
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const dispatch = useDispatch()
    const { register, handleSubmit, formState: { errors } } = useForm()

    const create = async (data) => {
        console.log(data)
        setError("")
        try {
            const userData = await authService.createAccount(data)
            if (userData) {
                const userData = await authService.getCurrentUser()
                if (userData) dispatch(login(userData));
                navigate("/")
            }
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="flex items-center justify-center">
            <div className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}>
                <div className="mb-2 flex justify-center">
                    <span className="inline-block w-full max-w-[100px]">
                        <Logo width="100%" />
                    </span>
                </div>
                <h2 className="text-center text-2xl font-bold leading-tight">Sign up to create account</h2>
                <p className="mt-2 text-center text-base text-black/60">
                    Already have an account?&nbsp;
                    <Link
                        to="/login"
                        className="font-medium text-primary transition-all duration-200 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
                {error && <p className="text-red-600 mt-8 text-center">{error}</p>}

                <form onSubmit={handleSubmit(create)}>
                    <div className='space-y-5'>
                        <Input
                            label="Full Name: "
                            placeholder="Enter your full name"
                            isRequired={true}
                            {...register("fullname", {
                                required: true,
                            })}
                            hasError={errors.fullname}
                        />
                        <Input
                            label="Username: "
                            placeholder="Enter your username"
                            isRequired={true}
                            {...register("username", {
                                required: true,
                                validate: {
                                    matchPatern: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value) ||
                                        "Username must be a valid",
                                }
                            })}
                            hasError={errors.username}
                        />
                        <Input
                            label="Email: "
                            placeholder="Enter your email"
                            isRequired={true}
                            type="email"
                            {...register("email", {
                                required: true,
                                validate: {
                                    matchPatern: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                                        "Email address must be a valid address",
                                }
                            })}
                            hasError={errors.email}
                        />
                        <Input
                            label="Password: "
                            type="password"
                            placeholder="Enter your password"
                            isRequired={true}
                            {...register("password", {
                                required: true,
                                validate: {
                                    matchPatern: (value) => /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(value) ||
                                        "Password must be at least 8 characters long and contain at least one letter and one number",
                                }
                            })}
                            hasError={errors.password}
                        />
                        <Input 
                            label="Upload Avatar: "
                            type="file" 
                            isRequired={true}
                            {...register('avatarImg', {
                                required: true,
                            })} 
                            hasError={errors.avatarImg}
                        />
                        <Input 
                            label="Upload Cover Image: "
                            type="file" 
                            {...register('coverImg')} 
                        />

                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                    </div>
                </form>
            </div>

        </div>
    )
}

export default Signup