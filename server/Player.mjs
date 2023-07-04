export function Player({ws,id},atExit,onMessage)
{
	this.ws = ws;
	this.id = id;
	
	this.ws.onclose = () => {
		atExit(this);
	};

	this.ws.onmessage = (e) => {
		onMessage(this,e);
	};
}

