import { Game } from "./Game.js";

const msgElem = document.querySelector("[data-message]");
const headerElem = document.querySelector("[data-header]");
const sock = new WebSocket("ws://localhost:8080");
const body = document.body;


const App = {
	init: function(){
		sock.addEventListener("open", this.connected.bind(this));
		sock.addEventListener("error", this.failure.bind(this));

		if (localStorage.getItem("--tttTheme"))
		{
			body.className = localStorage.getItem("--tttTheme");
		}


		headerElem.onclick = () => {
			if (body.className === "dark"){
				body.className = "light";
			}else{
				body.className = "dark";
			}
			localStorage.setItem("--tttTheme",body.className);
		}
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
