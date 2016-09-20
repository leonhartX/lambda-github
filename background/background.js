chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
	chrome.declarativeContent.onPageChanged.addRules([
	  {
		conditions: [
		  new chrome.declarativeContent.PageStateMatcher({
			pageUrl: { urlContains: 'console.aws.amazon.com' }
		  })
		],
		actions: [ new chrome.declarativeContent.ShowPageAction() ]
	  }
	]);
  });
});

chrome.webRequest.onCompleted.addListener((details) => {
  chrome.storage.local.set({ tab: details.tabId} );
  chrome.tabs.sendMessage(details.tabId, {cmd: "init"});
},
{ 
  urls: [ 
    "https://*.console.aws.amazon.com/lambda/services/ajax?operation=getFunctionCode"
  ],
  types: ["xmlhttprequest"]
},
[
  "responseHeaders"
]
)

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  details.requestHeaders.forEach((header) => {
  	if(header.name == 'X-Csrf-Token' && header.value !== "") {
  		chrome.storage.sync.set({ csrf: header.value} );
  	}
  })
},
{ 
  urls: [ "https://*.console.aws.amazon.com/lambda/services/ajax?operation=getFunctionCode" ],
  types: ["xmlhttprequest"]
},
[
  "requestHeaders"
]);