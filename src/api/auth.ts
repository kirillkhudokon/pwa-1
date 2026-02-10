import type { AxiosInstance } from "axios";
import type { User } from "./types/user";
import type { WithTimestamps } from "./types/general";

export default function initAuthApi(http: AxiosInstance){
  return {
    async check(){
      const response = await http.get<AuthResponse>('/auth/check')
      return response.data;
    },
    async login(body: LoginBody){
      const response = await http.post<LoginResponse>('/auth/login', body);
      return response.data;
    }
  }
}

export type AuthCheckFailed = {
  auth: false
}

export type AuthCheckSuccess = {
  auth: true,
  user: User
}

export type AuthResponse = AuthCheckFailed | AuthCheckSuccess

export type LoginBody = {
  login: string,
  password: string
}

export type LoginResponse = {
  token: string,
  user: WithTimestamps<User>
}