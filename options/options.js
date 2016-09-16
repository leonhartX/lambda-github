"use strict";
$(() => {
  $('.message a').click(function(){
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
  	let link = `https://github.com/${item.user}`;
  	if (item.baseUrl !== "https://api.github.com") {
  	  let match = item.baseUrl.match(/:\/\/(.*)\/api\/v3/);
  	  if (!match || !match[1]) {
  	  	domain = "";
  	  	link = "";
  	  } else {
  	  	domain = `@${match[1]}`;
  	  	link = `https://${match[1]}/${item.user}`;
  	  }
  	}
  	$('#login-user').text(`${item.user}${domain}`).attr("href", link);
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
  	note: "lambda-hub"
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
  })
  .fail((err) => {
  	console.log(err);
  })
}

function logoutGithub() {
  chrome.storage.sync.remove(["token", "user", "id", "baseUrl"], () => {
  	location.reload();
  })
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