/// <reference lib="webworker" />

import type { Comment } from "./src/api/types/comments";
import { api, connectDb } from "./src/container";

declare const self: ServiceWorkerGlobalScope;

const CACHE_KEY = 'pwa-l5-67';
const EXTERNAL_API_PATH = import.meta.env.VITE_API_URL;
const CACHE_SWR_ID_HEADER = 'X-SWR-ID';

const staticAssets = [
	'/',
	'/vite.svg',
	'/manifest.json',
	'/images/icon.png'
];

self.addEventListener('install', function(event){
	self.skipWaiting();

	event.waitUntil(
		fetch('/.vite/manifest.json', { cache: 'no-store' })
			.then(r => r.json())
			.then(manifest => Object.values(manifest).map((val: any) => [
				'/' + val.file,
				...( val.css ?? [] ).map((cssVal: any) => '/' + cssVal)
			]).flat())
			.then(manifestAssets => manifestAssets.filter(path => path !== '/sw.js'))
			.then(manifestAssets => {
				console.log(manifestAssets);
				return manifestAssets;
			})
			.then(manifestAssets => [...new Set(manifestAssets)])
			.catch(() => [])
			.then(manifestAssets => 
				caches.open(CACHE_KEY)
					.then(cache => cache.addAll([ ...staticAssets, ...manifestAssets ]))
			)
	)
});

self.addEventListener('activate', function(e){
	e.waitUntil(
		self.clients.claim()
			.then(() => caches.keys()
			.then(keys => keys.filter(key => key !== CACHE_KEY))
			.then(keys => keys.forEach(key => {
				caches.delete(key);
			}))
	));
});

self.addEventListener('sync', async (event) => {
  if (event.tag === "comments-failed-store-retry") {
		event.waitUntil(syncFailedComments());
  }
});

async function syncFailedComments(){
	const db = await connectDb();
	const comments = await db.getAll('commentsFailedStores');
	const results: Comment[] = [];

	for(const comment of comments){
		const storedComment = await api.comments.create(comment.item, comment.itemId, comment.body);
		// clients post message like swr
		await db.delete('commentsFailedStores', comment.key);
		await db.delete('commentsForm', `post.${comment.itemId}`);
		console.log(`sync comment ${comment.body.idk}`)
		results.push(storedComment);
	}

	if(results.length){
		self.clients.matchAll().then(clients => {
			for (const client of clients) {
				client.postMessage({ 
					type: "comments-failed-stored", 
					data: results
				});
			}
		})
	}
}

self.addEventListener('periodicsync', async (event) => {
  if (event.tag === 'posts-latest-sync') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
	try {
		const response = await api.posts.all();
		const cache = await caches.open(CACHE_KEY);
		const postsUrl = new URL('/posts', EXTERNAL_API_PATH).toString();

		const newResponse = new Response(JSON.stringify(response), {
			headers: {
				'Content-Type': 'application/json',
				'Date': new Date().toUTCString()
			}
		});

		await cache.put(postsUrl, newResponse);
		console.log('Periodic sync: posts updated successfully');
	} catch (error) {
		console.error('Periodic sync failed:', error);
	}
}

self.addEventListener('fetch', function(event){
	if(event.request.method !== 'GET'){
		return;
	}

	// recom ignore: video etc, !http

	if(event.request.url.startsWith(self.location.origin)) {
		if(event.request.cache !== 'no-store'){
			/* mb todo: 
				html -> networkFirst
				css,js -> cacheFirst
				img -> ... cacheTTLNetworkFallback
			*/			
			//event.respondWith(cacheFirst(event.request));
			event.respondWith(networkFirst(event.request));
		}

		return;
	}

	if(event.request.url.startsWith(EXTERNAL_API_PATH)) {
		event.respondWith(networkFirst(event.request));
		return;
	}
})

self.addEventListener('push', function(event) {
	const data: any = event.data?.json()
	console.log('push', data)
	const title = data.title || 'Новый комментарий';
	const options: NotificationOptions = {
		body: data.body || '',
	};
	event.waitUntil(
		self.registration.showNotification(title, options)
	);
});

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
});

export async function networkOnly(request: Request){
	return await fetch(request, { cache: 'no-store' });
}

export async function networkFirst(request: Request){
	try{
		const networkResponse = await fetch(request);

		if(networkResponse.ok){
			console.log('n1 from network', request.url)
			const cache = await caches.open(CACHE_KEY);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	}
	catch(e){
		console.log('n1 from cache', request.url)
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		return cachedResponse ?? Response.error();
	}
}

export async function cacheFirst(request: Request){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });

		if(cachedResponse){
			console.log('c1 from cache', request.url)
			return cachedResponse;
		}

		const networkResponse = await fetch(request);

		if(networkResponse.ok){
			console.log('c1 from network', request.url)
			const cache = await caches.open(CACHE_KEY);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	}
	catch(e){
		console.log('c1 error', request.url)
		return Response.error();
	}
}

export async function cacheFirstTTL(request: Request, time: number){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			const cachedAt = +(new Date(cachedResponse.headers.get('date')!));
			const expiredAt = cachedAt + time - Date.now();

			if(expiredAt > 0){
				console.log(`c1 from cache, exp in ${parseInt(`${expiredAt / 1000}`)}`, request.url)
				return cachedResponse;
			}
		}

		const networkResponse = await fetch(request);

		if(networkResponse.ok){
			console.log('c1 from network', request.url)
			const cache = await caches.open(CACHE_KEY);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	}
	catch(e){
		console.log('c1 error', request.url)
		return Response.error();
	}
}

export async function cacheTTLNetworkFallback(request: Request, time: number){
	let cacheFallback;

	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			const cachedAt = +(new Date(cachedResponse.headers.get('date')!));
			const expiredAt = cachedAt + time - Date.now();

			if(expiredAt > 0){
				console.log(`c1 from cache, exp in ${parseInt(`${expiredAt / 1000}`)}`, request.url)
				return cachedResponse;
			}
			else{
				cacheFallback = cachedResponse;
			}
		}

		/* if(!navigator.onLine){
			throw {};
		} */

		const networkResponse = await fetch(request);

		if(networkResponse.ok){
			console.log('c1 from network', request.url)
			const cache = await caches.open(CACHE_KEY);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	}
	catch(e){
		if(cacheFallback){
			console.log('c1 expired fallback', request.url)
			return cacheFallback;
		}

		console.log('c1 error', request.url)
		return Response.error();
	}
}

export async function cacheSwrClassic(request: Request){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			runNetwork(request).then(() => {
				console.log('swr background upd', request.url)
			}); // waitUntil, Nikita AI, need check
			console.log('swr cache', request.url)
			return cachedResponse;
		}

		console.log('swr network', request.url)
		return await runNetwork(request);
	}
	catch(e){
		console.log('swr error', request.url)
		return Response.error();
	}
}

/*
	Limitations:
		1. use only for json or text
		2. we have to provide custom header to 
*/
export async function cacheSwrWithMessage(request: Request){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			runNetwork(request).then(async response => {
				console.log('swr background upd', request.url)
				const id = request.headers.get(CACHE_SWR_ID_HEADER);
				const data = await response.json(); // if json || text -> look to header contentType

				self.clients.matchAll().then(clients => {
					for (const client of clients) {
						client.postMessage({ 
							type: "swr-updated", 
							id,
							data
						});
					}
				})
			}); 

			console.log('swr cache', request.url)
			return cachedResponse;
		}

		console.log('swr network', request.url)
		return await runNetwork(request);
	}
	catch(e){
		console.log('swr error', request.url)
		return Response.error();
	}
}

export async function runNetwork(request: Request){
	const networkResponse = await fetch(request);

	if(networkResponse.ok){
		const cache = await caches.open(CACHE_KEY);
		cache.put(request, networkResponse.clone());
	}

	return networkResponse;
}