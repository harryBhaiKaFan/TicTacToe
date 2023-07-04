import { RequestBox } from '../components/RequestBox.js';

export const Game = {
	plyr_id_elem:null,
	plyr_num:null,
	plyr_sec:null,
	plyr_search:null,
	sock: null,
	msgElem: null,
	app_sec: null,
	game_sec: null,
	turn_elem: null,
	back_btn: null,
	reload_btn: null,
	ttt: null,
	cells: null,
	id:-1,
	players:[],
	isOnReq: false,
	isInGame: false,
	init: function(sock,msgElem){
		this.plyr_id_elem = document.querySelector("[data-player-id]");
		this.plyr_num = document.querySelector("[data-player-num]");
		this.plyr_sec = document.querySelector("[data-online-players]");
		this.plyr_search = document.querySelector("[data-player-search]");
		this.plyr_search.oninput = this.search_player.bind(this);
		this.app_sec = document.querySelector("[data-app]");
		this.game_sec = document.querySelector("[data-game]");
		this.ttt = document.querySelector("[data-ttt]");
		this.cells = document.querySelectorAll("[data-cell]");
		this.turn_elem = document.querySelector("[data-turn]");
		this.back_btn = document.querySelector("[data-back-btn]");
		this.reload_btn = document.querySelector("[data-reload-btn]");
		this.sock = sock;
		this.msgElem = msgElem;

		this.plyr_sec.onclick = this.playMatch.bind(this);

		this.msg_handler();
		RequestBox.init(document.body);
	},
	playMatch: function(e){
		if(e.target.className !== "player" || this.isOnReq) return;

		let selfID = this.id.toString();
		let otherID = e.target.textContent;

		let matchObj = {
			"launch_match":{
				"id1":selfID,
				"id2":otherID
			}
		};

		this.sock.send(JSON.stringify(matchObj));
		this.isOnReq = true;

		clearTimeout(this.msgElem.timer);
		this.msgElem.innerText = `Waiting for ID: ${otherID} to respond...`;
		this.msgElem.className = "message wait-txt";
	},
	search_player: function(e){
		let plyr_ids = document.querySelectorAll(".player");
		plyr_ids.forEach((val)=>{
			if(!val.textContent.includes(e.target.value))
				val.classList.add("hidden");
			else
				val.classList.remove("hidden");
		});
	},
	msg_handler: function(){
		this.sock.onmessage = (e)=>{
			this.sock.onmessage = this[e.data].bind(this);
		};
	},
	broadcast: function(e){
		this.players = JSON.parse(e.data);
		this.plyr_num.textContent = this.players.length;

		let plyr_ids = document.querySelectorAll(".player");
		plyr_ids.forEach((val)=>val.remove());

		this.players.forEach((value)=>{
			let elem = document.createElement("div");
			elem.classList.add("player");
			elem.textContent = value;
			this.plyr_sec.appendChild(elem);
		});

		this.msg_handler();
	},
	add: function(e){
		this.id = parseInt(e.data);
		this.plyr_id_elem.textContent = this.id;

		this.msg_handler();
	},
	request: function(e){
		this.isOnReq = true;
		RequestBox.display(`Accept match request from ID: ${e.data} ?`);

		RequestBox.ON_ACCEPT = () => {
			this.isOnReq = false;
			this.sock.send("accept");
			RequestBox.hide();
		};

		RequestBox.ON_REJECT = () => {
			this.isOnReq = false;
			this.sock.send("reject");
			RequestBox.hide();
		};

		this.msg_handler();
	},
	left: function(e){
		if(this.isOnReq){
			this.isOnReq = false;
			RequestBox.hide();

			clearTimeout(this.msgElem.timer);
			this.msgElem.innerText = "Other player left the game!";
			this.msgElem.className = "message err-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
			},3000);

		}else if(this.isInGame)
		{
			this.isInGame = false;

			clearTimeout(this.msgElem.timer);
			this.msgElem.innerText = "That Player left the game!";
			this.msgElem.className = "message err-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
				this.app_sec.style.display = "block";
				this.game_sec.style.display = "none";
			},2000);

		}

		this.msg_handler();
	},
	launch: function(e){
		this.isOnReq = false;
		this.isInGame = true;

		clearTimeout(this.msgElem.timer);
		this.msgElem.innerText = "Launching game!";
		this.msgElem.className = "message succ-txt";
		this.msgElem.timer = setTimeout(()=>{
			this.msgElem.className = 'message hid-txt';
		},1000);

		this.app_sec.style.display = "none";
		this.game_sec.style.display = "flex";

		this.msg_handler();
	},
	game: function(e){
		let data = e.data;

		this.reload_btn.onclick = () => {
			this.sock.send("Reload");
		};

		this.back_btn.onclick = () => {
			this.isInGame = false;
			this.sock.send("Quit");
		}

		if(data === "Your turn")
		{
			this.turn_elem.innerText = "Your turn";
			this.ttt.onclick = (e) => {
				let target = e.target;
				if(target.className != "cell")
					return;

				let i=0;
				for (; i<this.cells.length; i++){
					if(target == this.cells[i]){
						break;
					}
				}

				this.sock.send(i);
			}
		}else if (data === "Other turn")
		{
			this.ttt.onclick = null;
			this.turn_elem.innerText = "Other Player's turn";
		}else if(data === "Reload")
		{
			this.cells.forEach((val)=>{
				val.innerText = "";
			});
		}else if(data === "Error")
		{
			clearTimeout(this.msgElem.timer);
			this.msgElem.textContent = "Invalid move!";
			this.msgElem.className = "message err-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = "message hid-txt";
			},800);
		}else if(data === "Board")
		{
			this.sock.onmessage = this.render_board.bind(this);
		}else if(data === "Won")
		{
			clearTimeout(this.msgElem.timer);
			this.msgElem.innerText = "You Won!";
			this.msgElem.className = "message succ-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
			},2000);
		}else if(data === "Lost")
		{
			clearTimeout(this.msgElem.timer);
			this.msgElem.innerText = "You Lost!";
			this.msgElem.className = "message err-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
			},2000);
		}else if(data === "Draw")
		{
			clearTimeout(this.msgElem.timer);
			this.msgElem.innerText = "Its Draw!";
			this.msgElem.className = "message succ-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
			},3000);
		}else if(data === "Quit")
		{
			this.isInGame = false;
			this.msgElem.innerText = "Exiting the game!";
			this.msgElem.className = "message err-txt";
			this.msgElem.timer = setTimeout(()=>{
				this.msgElem.className = 'message hid-txt';
				this.app_sec.style.display = "block";
				this.game_sec.style.display = "none";
			},800);
			this.ttt.onclick = null;
			this.reload_btn.onclick = null;
			this.back_btn.onclick = null;
			this.cells.forEach((val)=>{
				val.innerText = "";
			});
			this.msg_handler();
		}else if(data === "left")
		{
			this.ttt.onclick = null;
			this.reload_btn.onclick = null;
			this.back_btn.onclick = null;
			this.cells.forEach((val)=>{
				val.innerText = "";
			});
			this.sock.onmessage = this.left.bind(this);
		}
	},
	render_board: function(e){
		let data = e.data;
		let board = data.split(",");

		this.cells.forEach((cell,i)=>{
			if (board[i] === "X" || board[i] === "O")
				cell.textContent = board[i];
		});

		this.sock.onmessage = this.game.bind(this);
	},
	reject: function(e){
		this.isOnReq = false;

		clearTimeout(this.msgElem.timer);
		this.msgElem.innerText = `ID: ${e.data} rejected your play request!`;
		this.msgElem.className = 'message err-txt';
		this.msgElem.timer = setTimeout(()=>{
			this.msgElem.className = 'message hid-txt';
		},2000);

		this.msg_handler();
	}
};
