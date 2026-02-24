import 'bootstrap/dist/css/bootstrap.css'
import './assets/css/main.css'

import type { BeforeInstallPromptEvent } from './types/events'

import { Router } from "./core/router";
import Error404Page from "./pages/e404";
import HomePage from "./pages/home";
import PostPage from "./pages/post";
import PostsPage from "./pages/posts";
import AuthLoginPage from './pages/auth/login';
import { api, authUser, DataEvent, eventBus, initUser } from './container';

appInit();

async function appInit(){
  console.log(navigator.storage.estimate())

  await initUser();
  const box = document.querySelector<HTMLDivElement>('#app')!;

  new Router(
    box, 
    [
      { path: '/', component: HomePage },
      { path: '/posts', component: PostsPage },
      { path: '/posts/:id', component: PostPage },
      { path: '/auth/login', component: AuthLoginPage }
    ], 
    Error404Page
  );

  await pwaInit()
}

const swEventToEventBus = ["comments-failed-stored", "swr-updated"];

async function pwaInit(){
  const btnPush = document.querySelector<HTMLButtonElement>('.pushPermissionBtn');
  const btnPushUnsubscribe = document.querySelector<HTMLButtonElement>('.pushUnsubscribeBtn');

  const syncPushButtons = async function(){
    if(!btnPush && !btnPushUnsubscribe){
      return;
    }

    if(!authUser || !('serviceWorker' in navigator) || !window.PushManager){
      btnPush?.classList.add('d-none');
      btnPushUnsubscribe?.classList.add('d-none');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    btnPush?.classList.toggle('d-none', !!subscription);
    btnPushUnsubscribe?.classList.toggle('d-none', !subscription);
  }

  if(btnPush) {
    btnPush.addEventListener('click', async function() {
      if (!navigator.serviceWorker || !window.PushManager) {
        console.log('Push notifications are not supported in this browser.');
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = await api.push.publicKey();
          const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey.publicKey
          };
          const subscription = await registration.pushManager.subscribe(subscribeOptions);
          await api.push.subscribe(subscription);
          console.log('Push включены!');
          await syncPushButtons();
        } else {
          console.log('Разрешение на push не получено.');
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  if(btnPushUnsubscribe){
    btnPushUnsubscribe.addEventListener('click', async function(){
      if (!navigator.serviceWorker || !window.PushManager) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if(!subscription){
          await syncPushButtons();
          return;
        }

        await api.push.unsubscribe({ endpoint: subscription.endpoint });

        await subscription.unsubscribe();
        console.log('Push отключены!');
        await syncPushButtons();
      } catch (err) {
        console.log(err);
      }
    })
  }

  await syncPushButtons();

  if('serviceWorker' in navigator){
    const swPath = import.meta.env.PROD ? '/sw.js' : '/sw.ts';

    navigator.serviceWorker.register(swPath, { type: 'module' })
      .then(async registration => {
        console.log('reg', registration.scope);
        await syncPushButtons();

        if(registration.periodicSync){
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
          
          if (status.state === 'granted') {
            try {
              await registration.periodicSync.register('posts-latest-sync', {
                minInterval: 1000 * 60 * 5, // cant test it in real
              });
              
              console.log('Periodic background sync registered!');
            } catch (err) {
              console.error('Periodic background sync registration failed:', err);
            }
          } else {
            console.log('Permission not granted for periodic background sync. Try to install website as an application!');
          }
        }
      })
      .catch(e => console.log('no worker', e))
  
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      if(swEventToEventBus.includes(data.type)){
        eventBus.dispatchEvent(new DataEvent(data.type, data))
      }
    })
  
    const btnInstall = document.querySelector('.appInstallBtn');
    let pwaPrompt: BeforeInstallPromptEvent | undefined;
  
    if(btnInstall){
      window.addEventListener('beforeinstallprompt', e => {
        console.log('bip');
        pwaPrompt = e as BeforeInstallPromptEvent;
        e.preventDefault();
        btnInstall.classList.remove('d-none');
      })
    
      btnInstall.addEventListener('click', async function(){
        if(pwaPrompt){
          pwaPrompt.prompt();
    
          const { outcome } = await pwaPrompt.userChoice;
          pwaPrompt = undefined;
    
          if (outcome === 'accepted') {
            console.log('User accepted the install prompt.');
            btnInstall.classList.add('d-none');
          } else if (outcome === 'dismissed') {
            console.log('User dismissed the install prompt');
          }
        }
      })
    }
  }
}
