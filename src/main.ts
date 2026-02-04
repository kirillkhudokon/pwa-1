import 'bootstrap/dist/css/bootstrap.css'
import './assets/css/main.css'

import type { BeforeInstallPromptEvent } from './types/events'

import { Router } from "./core/router";
import Error404Page from "./pages/e404";
import HomePage from "./pages/home";
import PostPage from "./pages/post";
import PostsPage from "./pages/posts";
import AuthLoginPage from './pages/auth/login';

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

function pwaInit(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
      .then(regisration => console.log('reg', regisration.scope))
      .catch(e => console.log('no worker', e))
  
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      if(data.type == 'swr-updated'){
        console.log(data)
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

pwaInit();