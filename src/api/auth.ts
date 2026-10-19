import { api } from './client'
import type { LoginRequest, LoginResponse, Member, SignupRequest, SignupResponse } from './types'

export const signup = (req: SignupRequest) => api.post<SignupResponse>('/api/auth/signup', req)

export const login = (req: LoginRequest) => api.post<LoginResponse>('/api/auth/login', req)

export const fetchMe = () => api.get<Member>('/api/members/me')
