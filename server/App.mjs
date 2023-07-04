import { WebSocketServer } from 'ws';
import { Game } from "./Game.mjs";


const App = {
	server:null,
	init: function(){
		console.log("game server started!");
		Game.init();

		this.server.on("connection",(ws)=>{
			Game.players.add(ws);
		});
	}
};


App.server = new WebSocketServer({port: 8080},App.init.bind(App));
