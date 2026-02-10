export function delegate<T extends Element>(
  box: Element, 
  eventname: string, 
  selector: string, 
  handler: (this: T, e: Event) => void
){
	box.addEventListener(eventname, function(evt){
		let el = evt.target instanceof Element ? evt.target.closest(selector) : null;
		
		if(el !== null && box.contains(el)){
			handler.call(el as T, evt); 
		}
	});
}