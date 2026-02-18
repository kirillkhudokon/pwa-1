import type { WithTimestamps } from "./general"
import type { WithUser } from "./user"

export type Commentables = 'post' | 'image'

export type Comment = WithTimestamps<WithUser<{
  id: number
  idk: string,
  text: string
  UserId: number
  PostId: number | null
  ImageId: number | null
}>>