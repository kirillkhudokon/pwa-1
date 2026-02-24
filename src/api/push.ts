import type { AxiosInstance } from "axios";

export default function initPushApi(http: AxiosInstance){
  return {
    async publicKey(){
      const response = await http.get<PushPublicKeyResponse>('/push/public-key');
      return response.data;
    },
    async subscribe(subscription: PushSubscription){
      const response = await http.post<PushSubscribeResponse>('/push/subscribe', subscription);
      return response.data;
    },
    async unsubscribe(body: PushUnsubscribeBody){
      const response = await http.delete<PushUnsubscribeResponse>('/push/subscribe', { data: body });
      return response.data;
    }
  }
}

export type PushPublicKeyResponse = {
  publicKey: string
}

export type PushSubscribeResponse = {
  endpoint: string,
  subscribed: boolean
}

export type PushUnsubscribeBody = {
  endpoint: string
}

export type PushUnsubscribeResponse = { unsubscribed: boolean, endpoint: string, deleted: boolean }