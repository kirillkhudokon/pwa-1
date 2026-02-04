export type WithTimestamps<T extends object> = T & {
  createdAt: string, 
  updatedAt: string, 
}

export type Pagination = {
  page: number
  batch: number
  count: number
  maxPage: number
}