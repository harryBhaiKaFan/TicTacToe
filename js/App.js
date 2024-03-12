import { Game } from "./Game.js";

const msgElem = document.querySelector("[data-message]");
const sock = new WebSocket("ws://localhost:8080");

// TODO:
// 0. Restructure Server Code.
// 1. Becomes buggy after 2-3 matches
// 2. Dark mode
// 3. Player Account
// 4. Friends
// 5. Chats
// 6. Firebase integration	

const App = {
	init: function(){
		sock.addEventListener("open", this.connected.bind(this));
		sock.addEventListener("error", this.failure.bind(this));
		
	},
	connected: ()=>{
		msgElem.innerText = "Connected to the server!";
		msgElem.className = "message succ-txt";


		msgElem.timer = setTimeout(()=>{
			msgElem.className = "message hid-txt";
		},1600);

		Game.init(sock,msgElem);
	},
	failure: ()=>{
		msgElem.innerText = "Error in connecting the server, try refreshing!";
		msgElem.className = "message err-txt";
	}
};

window.onload = App.init.bind(App);
