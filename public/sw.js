const CACHE_KEY = 'pwa-ai-adv-end-v-5';
const EXTERNAL_API_PATH = 'http://localhost:3001';
const CACHE_SWR_ID_HEADER = 'X-SWR-ID';

const staticAssets = [
	'/',
	'/vite.svg',
	'/manifest.json',
	'/images/icon.png'
];

self.addEventListener('install', function(event){
	self.skipWaiting();
	// clients claim

	event.waitUntil(
		networkOnly('/.vite/manifest.json')
			.then(r => r.json())
			.then(manifest => Object.values(manifest).map(val => [
				'/' + val.file,
				...( val.css ?? [] ).map(cssVal => '/' + cssVal)
			]).flat())
			.then(manifestAssets => [...new Set(manifestAssets)])
			.catch(() => [])
			.then(manifestAssets => 
				caches.open(CACHE_KEY)
					.then(cache => cache.addAll([ ...staticAssets, ...manifestAssets ]))
			)
	)
});

self.addEventListener('activate', function(){
	caches.keys()
		.then(keys => keys.filter(key => key !== CACHE_KEY))
		.then(keys => keys.forEach(key => {
			caches.delete(key);
		}));
});

self.addEventListener('fetch', function(event){
	// recom ignore: video etc, !http

	if(event.request.url.startsWith(self.location.origin)) {
		if(event.request.cache !== 'no-store'){
			/* mb todo: 
				html -> networkFirst
				css,js -> cacheFirst
				img -> ... cacheTTLNetworkFallback
			*/			

			event.respondWith(cacheTTLNetworkFallback(event.request, 30 * 1000));
		}

		return;
	}

	if(event.request.url.startsWith(EXTERNAL_API_PATH)) {
		event.respondWith(cacheSwrWithMessage(event.request));
		return;
	}
})

async function networkOnly(request){
	return await fetch(request, { cache: 'no-store' });
}

async function networkFirst(request){
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

async function cacheFirst(request){
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

async function cacheFirstTTL(request, time){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			const cachedAt = +(new Date(cachedResponse.headers.get('date')));
			const expiredAt = cachedAt + time - Date.now();

			if(expiredAt > 0){
				console.log(`c1 from cache, exp in ${parseInt(expiredAt / 1000)}`, request.url)
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

async function cacheTTLNetworkFallback(request, time){
	let cacheFallback;

	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			const cachedAt = +(new Date(cachedResponse.headers.get('date')));
			const expiredAt = cachedAt + time - Date.now();

			if(expiredAt > 0){
				console.log(`c1 from cache, exp in ${parseInt(expiredAt / 1000)}`, request.url)
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

async function cacheSwrClassic(request){
	try{
		const cachedResponse = await caches.match(request, { cacheName: CACHE_KEY });
		
		if(cachedResponse){
			runNetwork(request).then(resp => {
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
async function cacheSwrWithMessage(request){
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
			// waitUntil, Nikita AI, need check
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

async function runNetwork(request){
	const networkResponse = await fetch(request);

	if(networkResponse.ok){
		const cache = await caches.open(CACHE_KEY);
		cache.put(request, networkResponse.clone());
	}

	return networkResponse;
}