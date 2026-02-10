import { delegate } from "../shared/events";

export type ComponentClass = {
	new (
		routeParams: Record<string, unknown>,
		el: HTMLElement
	): Component
}

export class Component{
	props: Record<string, unknown>
	el: HTMLElement
	state: Record<string, any> = {}

	constructor(props: Record<string, unknown>, el: HTMLElement){
		this.props = props;
		this.el = el;
	}

	async setup() : Promise<void>{
		
	}

	render() : void | string{
		this.el.innerHTML = '';
	}

	on<T extends Element>(
		eventname: string, 
		selector: string, 
		handler: (this: T, e: Event) => void
	){
		return delegate(this.el, eventname, selector, handler);
	}

	setState(newState: Record<string, any>){
		this.state = { ...this.state, ...newState };
		this.render();
	}
}