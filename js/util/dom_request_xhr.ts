/*
	----------------------------------------------------------
	util/Request : 0.1.1 : 2015-03-26
	----------------------------------------------------------
	util.request({
		url: './dir/something.extension',
		data: 'test!',
		format: 'text', // text | xml | json | binary
		responseType: 'text', // arraybuffer | blob | document | json | text
		headers: {},
		withCredentials: true, // true | false
		///
		onerror: function(evt, percent) {
			console.log(evt);
		},
		onsuccess: function(evt, responseText) {
			console.log(responseText);
		},
		onprogress: function(evt, percent) {
			percent = Math.round(percent * 100);
			loader.create('thread', 'loading... ', percent);
		}
	});
*/

let NodeFS;

/// NodeJS
if (typeof module !== "undefined" && module.exports) {
	NodeFS = require("fs");
	(global as any).XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

const isLocalUrl = (url) => {
	return !/^https?:\/\//.test(url);
};

const XHRequest = (opts, onsuccess?, onerror?, onprogress?) => {
	if (typeof opts === "string") {
		opts = {
			url: opts,
		};
	}

	const data = opts.data;
	const url = opts.url;
	const method = opts.method || (opts.data ? "POST" : "GET");
	const format = opts.format;
	const headers = opts.headers;
	const responseType = opts.responseType;
	const withCredentials = opts.withCredentials || false;

	onsuccess = onsuccess || opts.onsuccess;
	onerror = onerror || opts.onerror;
	onprogress = onprogress || opts.onprogress;

	if (typeof NodeFS !== "undefined" && isLocalUrl(url)) {
		NodeFS.readFile(url, "utf8", function(err, res) {
			if (err) {
				onerror && onerror(err);
			} else {
				onsuccess && onsuccess({
					responseText: res,
				});
			}
		});
		return;
	}

	const xhr = new XMLHttpRequest();
	xhr.open(method, url, true);

	if (headers) {
		for (const type in headers) {
			xhr.setRequestHeader(type, headers[type]);
		}
	} else if (data) { // set the default headers for POST
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}
	if (format === "binary") { // - default to responseType="blob" when supported
		if (xhr.overrideMimeType) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}
	}
	if (responseType) {
		xhr.responseType = responseType;
	}
	if (withCredentials) {
		xhr.withCredentials = true;
	}
	if (onerror && "onerror" in xhr) {
		xhr.onerror = onerror;
	}
	if (onprogress && xhr.upload && "onprogress" in xhr.upload) {
		if (data) {
			xhr.upload.onprogress = function(event) {
				onprogress.call(xhr, event, (event as any).loaded / (event as any).total);
			};
		} else {
			xhr.addEventListener("progress", function(evt) {
				let totalBytes = 0;
				if (evt.lengthComputable) {
					totalBytes = evt.total;
				} else if ((xhr as any).totalBytes) {
					totalBytes = (xhr as any).totalBytes;
				} else {
					const rawBytes = parseInt(xhr.getResponseHeader("Content-Length-Raw"));
					if (isFinite(rawBytes)) {
						(xhr as any).totalBytes = totalBytes = rawBytes;
					} else {
						return;
					}
				}
				onprogress.call(xhr, evt, evt.loaded / totalBytes);
			});
		}
	}

	xhr.onreadystatechange = (evt) => {
		if (xhr.readyState === 4) { // The request is complete
			if (xhr.status === 200 || // Response OK
				xhr.status === 304 || // Not Modified
				xhr.status === 308 || // Permanent Redirect
				xhr.status === 0 && (window as any).cordova // Cordova quirk
			) {
				if (onsuccess) {
					let res;
					if (format === "xml") {
						res = (evt.target as any).responseXML;
					} else if (format === "text") {
						res = (evt.target as any).responseText;
					} else if (format === "json") {
						try {
							res = JSON.parse((evt.target as any).response);
						} catch (err) {
							onerror && onerror.call(xhr, evt);
						}
					}
					///
					onsuccess.call(xhr, evt, res);
				}
			} else {
				onerror && onerror.call(xhr, evt);
			}
		}
	};
	xhr.send(data);
	return xhr;
};

export default XHRequest;
