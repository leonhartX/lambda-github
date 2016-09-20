"use strict";
$(() => {
  $('.message a').click(function(){
   $('.error').hide();
   $('.login-container').animate({height: "toggle", opacity: "toggle"}, "slow");
  });
  $('#login').click((e) => {
  	loginGithub(getGithubParam());
  });
  $('#ghe-login').click((e) => {
  	loginGithub(getGHEParam());
  });
  $('#logout').click((e) => {
  	logoutGithub();
  });

  checkToken()
  .then((item) => {
  	$('.login-container').hide();
  	$('.logout-container').show();
  	let domain = "@Github.com";
  	let userLink = `https://github.com/${item.user}`;
    let tokenLink = 'https://github.com/settings/tokens';
  	if (item.baseUrl !== "https://api.github.com") {
  	  let match = item.baseUrl.match(/:\/\/(.*)\/api\/v3/);
  	  if (!match || !match[1]) {
  	  	domain = "";
  	  	userLink = "";
        tokenLink = "";
  	  } else {
  	  	domain = `@${match[1]}`;
  	  	userLink = `https://${match[1]}/${item.user}`;
        tokenLink = `https://${match[1]}/settings/tokens`;
  	  }
  	}
  	$('#login-user').text(`${item.user}${domain}`).attr("href", userLink);
    $('#token').attr("href", tokenLink);
  })
  .catch((err) => {
  	//not logged in
  })
})

function getGithubParam() {
  const username = $('#username').val();
  const password = $('#password').val();
  const baseUrl = `https://api.github.com`;
  return {
  	username,
  	password,
  	baseUrl
  };
}

function getGHEParam() {
  const username = $('#ghe-username').val();
  const password = $('#ghe-password').val();
  const baseUrl = $('#ghe-url').val() + "/api/v3";
  return {
  	username,
  	password,
  	baseUrl
  };
}

function loginGithub(param) {
  const username = param.username;
  const password = param.password;
  const baseUrl = param.baseUrl;
  if(username === "" || password === "") {
  	return;
  }
  const payload = {
  	scopes: [
  	  "public_repo"
  	],
  	note: "lambda-hub_" + Date.now()
  }
  $.ajax({
  	url: `${baseUrl}/authorizations`,
  	headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
    },
   	method: "POST",
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(payload)
  })
  .done((response) => {
  	chrome.storage.sync.set({ user: username, token: response.token, id: response.id, baseUrl: baseUrl}, () => {
  	  location.reload();
  	});
    chrome.storage.local.get("tab", (item) => {
      if(item.tab) {
        chrome.tabs.reload(item.tab);     
      }
    });
  })
  .fail((err) => {
    $('.error').show();
  })
}

function logoutGithub() {
  chrome.storage.sync.remove(["token", "user", "id", "baseUrl"], () => {
  	location.reload();
  });
  chrome.storage.local.get("tab", (item) => {
    if(item.tab) {
      chrome.tabs.reload(item.tab);          
    }
  });
}

function checkToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["token", "user", "id", "baseUrl"], (item) => {
      if (item.token && item.token !== ""){
        resolve(item);
      }
      else reject(new Error("can not get access token"));
    });
  })
}