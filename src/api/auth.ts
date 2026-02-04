import type { AxiosInstance } from "axios";
import type { User } from "./types/user";
import type { WithTimestamps } from "./types/general";

export default function initAuthApi(http: AxiosInstance){
  return {
    async check(){
      const response = await http.get<AuthResponse>('/auth/check', { params: { delay: 1 } })
      return response.data;
    },
    async login(body: LoginBody){
      const response = await http.post<LoginResponse>('/auth/login', body);
      return response.data;
    }
  }
}

type AuthCheckFailed = {
  auth: false
}

type AuthCheckSuccess = {
  auth: true,
  user: User
}

type AuthResponse = AuthCheckFailed | AuthCheckSuccess

type LoginBody = {
  login: string,
  password: string
}

type LoginResponse = {
  token: string,
  user: WithTimestamps<User>
}