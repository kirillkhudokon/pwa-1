export type User = {
  id: number, 
  login: string
}

export type WithUser<T extends object> = T & {
  User: User
}