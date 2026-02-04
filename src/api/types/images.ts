import type { WithTimestamps } from "./general"

export type Imageables = 'post'

export type Image = WithTimestamps<{
  url: string
  id: number
  name: string
  PostId: number
}>

