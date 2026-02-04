export function delegate(
  box: Element, 
  eventname: string, 
  selector: string, 
  handler: (this: Element, e: Event) => void
){
	box.addEventListener(eventname, function(evt){
		let el = evt.target instanceof Element ? evt.target.closest(selector) : null;
		
		if(el !== null && box.contains(el)){
			handler.call(el, evt); 
		}
	});
}