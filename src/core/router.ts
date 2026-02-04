import { URLPattern } from "urlpattern-polyfill/urlpattern"
import { delegate } from "../shared/events"
import type { ComponentClass } from "./component"

type RouteRecord = {
	path: string,
	component: ComponentClass
}

export class Router{
	pageBox: HTMLElement
	routes: RouteRecord[]
	notFound: ComponentClass

	constructor(pageBox: HTMLElement, routes: RouteRecord[], notFound: ComponentClass){
		const router = this;
		this.pageBox = pageBox;
		this.routes = routes;
		this.notFound = notFound;

		window.addEventListener('popstate', () => {
			this.applyLocation();
		})

		delegate(document.body, 'click', 'a:not(.link-external)', function(e){
			e.preventDefault();
			const link = this as HTMLAnchorElement;
			router.go(link.href);
		})

		this.applyLocation();
	}

	go(url: string){
		window.history.pushState({}, '', url);
		this.applyLocation();
	}

	applyLocation(){
		const { pathname, origin } = window.location; 
		let activeComponent = this.notFound;
		let params: Record<string, string | undefined> = {};

		for(let route of this.routes){
			const pattern = new URLPattern({ pathname: route.path });
			const result = pattern.exec(pathname, origin);
			
			if(result !== null){
				activeComponent = route.component;
				params = result.pathname.groups;
				break;
			}
		}
		
		const pageWrapper = document.createElement('div');
		const component = new activeComponent(params, pageWrapper);
		
		component.setup().then(() => {
			this.pageBox.innerHTML = '';
			this.pageBox.appendChild(pageWrapper);
			component.render();
		});
	}
}