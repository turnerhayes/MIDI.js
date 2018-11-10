/*
	-----------------------------------------------------------
	dom.loadScript.js : 0.1.4 : 2014/02/12 : http://mudcu.be
	-----------------------------------------------------------
	Copyright 2011-2014 Mudcube. All rights reserved.
	-----------------------------------------------------------
	/// No verification
	loadScript.add("../js/jszip/jszip.js");
	/// Strict loading order and verification.
	loadScript.add({
		strictOrder: true,
		urls: [
			{
				url: "../js/jszip/jszip.js",
				verify: "JSZip",
				onsuccess: function() {
					console.log(1)
				}
			},
			{
				url: "../inc/downloadify/js/swfobject.js",
				verify: "swfobject",
				onsuccess: function() {
					console.log(2)
				}
			}
		],
		onsuccess: function() {
			console.log(3)
		}
	});
	/// Just verification.
	loadScript.add({
		url: "../js/jszip/jszip.js",
		verify: "JSZip",
		onsuccess: function() {
			console.log(1)
		}
	});
*/

const globalExists = function(path, root = window) {
	try {
		path = path.split('"').join("").split("'").join("").split("]").join("").split("[").join(".");
		const parts = path.split(".");
		const length = parts.length;
		for (let n = 0; n < length; n ++) {
			const key = parts[n];
			if (root[key] == null) {
				return false;
			} else { //
				root = root[key];
			}
		}
		return true;
	} catch (e) {
		return false;
	}
};

class loadScript {
	public loaded = {};

	public loading = {};

	public add(config) {
		if (typeof(config) === "string") {
			config = { url: config };
		}
		let urls = config.urls;
		if (typeof(urls) === "undefined") {
			urls = [{
				url: config.url,
				verify: config.verify,
			}];
		}

		/// adding the elements to the head
		const doc = document.getElementsByTagName("head")[0];

		const testElement = (element, test = null) => {
			if (this.loaded[element.url]) {
				return;
			}

			if (test && globalExists(test) === false) {
				return;
			}

			this.loaded[element.url] = true;

			if (this.loading[element.url]) {
				this.loading[element.url]();
			}

			delete this.loading[element.url];

			if (element.onsuccess) {
				element.onsuccess();
			}

			if (typeof (window as any).getNext !== "undefined") {
				(window as any).getNext();
			}
		};

		let hasError = false;
		let batchTest = [];
		const addElement = (element) => {
			if (typeof(element) === "string") {
				element = {
					url: element,
					verify: config.verify,
				};
			}
			if (/([\w\d.\[\]\'\"])$/.test(element.verify)) { // check whether its a variable reference
				const verify = element.test = element.verify;
				if (typeof(verify) === "object") {
					for (let n = 0; n < verify.length; n ++) {
						batchTest.push(verify[n]);
					}
				} else {
					batchTest.push(verify);
				}
			}
			if (this.loaded[element.url]) {
				return;
			}

			const script = document.createElement("script");
			(script as any).onreadystatechange = function() {
				if (this.readyState !== "loaded" && this.readyState !== "complete") { return; }
				testElement(element);
			};
			script.onload = function() {
				testElement(element);
			};
			script.onerror = function() {
				hasError = true;
				delete this.loading[element.url];
				if (typeof element.test === "object") {
					for (const key in element.test) {
						removeTest(element.test[key]);
					}
				} else {
					removeTest(element.test);
				}
			};
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", element.url);
			doc.appendChild(script);
			this.loading[element.url] = function() {};

			/// checking to see whether everything loaded properly
			const removeTest = (test) => {
				const ret = [];
				for (let n = 0; n < batchTest.length; n ++) {
					if (batchTest[n] === test) { continue; }
					ret.push(batchTest[n]);
				}
				batchTest = ret;
			};

			const onLoad = (element) => {
				if (element) {
					testElement(element, element.test);
				} else {
					for (let n = 0; n < urls.length; n ++) {
						testElement(urls[n], urls[n].test);
					}
				}
				let istrue = true;
				for (let n = 0; n < batchTest.length; n ++) {
					if (globalExists(batchTest[n]) === false) {
						istrue = false;
					}
				}
				if (!config.strictOrder && istrue) { // finished loading all the requested scripts
					if (hasError) {
						if (config.error) {
							config.error();
						}
					} else if (config.onsuccess) {
						config.onsuccess();
					}
				} else { // keep calling back the function
					setTimeout(function() { // - should get slower over time?
						onLoad(element);
					}, 10);
				}
			};

			/// loading methods;  strict ordering or loose ordering
			if (config.strictOrder) {
				let ID = -1;
				const getNext = () => {
					ID ++;
					if (!urls[ID]) { // all elements are loaded
						if (hasError) {
							if (config.error) {
								config.error();
							}
						} else if (config.onsuccess) {
							config.onsuccess();
						}
					} else { // loading new script
						const element = urls[ID];
						const url = element.url;
						if (this.loading[url]) { // already loading from another call (attach to event)
							this.loading[url] = () => {
								if (element.onsuccess) {
									element.onsuccess();
								}
								getNext();
							};
						} else if (!this.loaded[url]) { // create script element
							addElement(element);
							onLoad(element);
						} else { // it's already been successfully loaded
							getNext();
						}
					}
				};
				getNext();
			} else { // loose ordering
				for (let ID = 0; ID < urls.length; ID ++) {
					addElement(urls[ID]);
					onLoad(urls[ID]);
				}
			}
		};
	}
}

export default new loadScript();
