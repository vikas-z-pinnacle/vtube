import conf from "../conf/conf.js";
import axios from 'axios';
import store from "../store/store.js";
import { login, logout } from "../store/authSlice.js";

const API_BASE_URL = conf.apiUrl

export class AuthService {

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    async createAccount({fullname, username, email, password, avatarImg, coverImg}) {

        const avatar = avatarImg[0];
        const coverImage = coverImg[0];

        console.log(avatar)

        const response = await this.api.post('/users/register', {fullname, username, email, password, avatar, coverImage}, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
        }); 
        const { user, accessToken, refreshToken } = response.data.data;

        store.dispatch(login({ userData: user }));

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        return response.data;
    }

    async login({email, password}) {
        try {
            const response = await this.api.post('/users/login', {email, password}); 
            const { user, accessToken, refreshToken } = response.data.data;

            store.dispatch(login({ userData: user }));

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            return response.data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        const { auth } = store.getState();
        // console.log(auth)
        return auth.userData;
    }

    async logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        console.log("logout clicked")
        store.dispatch(logout());
    }
}

const authService = new AuthService();

export default authService
