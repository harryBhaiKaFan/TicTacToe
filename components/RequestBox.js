export const RequestBox = {
	requestBox:null,
	requestText:null,
	y_btn:null,
	n_btn:null,
	root:null,
	init: function(root){
		this.requestBox = document.createElement("div");
		this.requestBox.className = "request-box";

		this.requestText = document.createElement("p");
		this.requestText.className = "request-text";

		this.y_btn = document.createElement("div");
		this.y_btn.textContent = "Accept";
		this.y_btn.className = "btn y_btn";

		this.n_btn = document.createElement("div");
		this.n_btn.textContent = "Reject";
		this.n_btn.className = "btn n_btn";

		this.requestBox.appendChild(this.requestText);
		this.requestBox.appendChild(this.y_btn);
		this.requestBox.appendChild(this.n_btn);

		if(root)
		this.ROOT = root;
	},
	display: function(text){
		this.requestBox.classList.add("show-req-box");
		this.requestText.textContent = text;
	},
	hide: function(){
		this.requestBox.classList.remove("show-req-box");
	},
	set ROOT(val){
		if (this.root != null)
			this.requestBox.remove();
		this.root = val;
		this.root.appendChild(this.requestBox);
	},
	set ON_ACCEPT(fn){
		this.y_btn.onclick = fn;
	},
	set ON_REJECT(fn){
		this.n_btn.onclick = fn;
	}
};
