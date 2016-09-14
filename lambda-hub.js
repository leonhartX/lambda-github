let functionList = {};
const baseUrl = "https://ghe.rjbdev.jp/api/v3/repos/k-kyo/lambdaTest";
const accessToken = "8ce96018903bcc20f01de9693b02cbeaa9715d08";

chrome.runtime.onMessage.addListener(() => {
  const div = $('.awsmob-button-group');
  if($('.github').length === 0 && div.children().length > 2) {
    initButton();
  }
});

$(() => {
  $.ajaxSetup({ cache: false });
  getRequestParameter(true)
  .then((param) => {
    return $.ajax({
        url: 'https://' + param.endpoint + '/lambda/services/ajax?operation=listFunctions',
        headers: {
          "X-Csrf-Token" : param.csrf
        },
        method: 'POST',
        crossDomain: true,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({operation: "listFunctions"})
      });
  })
  .then((lambdas) => {
    lambdas.forEach((lambda) => {
      functionList[lambda.name] = lambda
    })
    console.log(functionList);
  })

  $(document).on('click', '.github-button', (event) => {
    $('.github-dropdown').show();
  });

  $(document).on('click', '#github-pull', gitPull);
  $(document).on('click', '#github-push', gitPush);
  $(document).on('click', '#github-config', (event) => {
    getRequestParameter()
    .then((param) =>{
      let json = {
        functionName: param.functionName,
        qualifier: param.qualifier,
        operation: "getFunctionCode"
      };
      return $.ajax({
        url: 'https://' + param.endpoint + '/lambda/services/ajax?operation=getFunctionCode',
        headers: {
          "X-Csrf-Token" : param.csrf
        },
        method: 'POST',
        crossDomain: true,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(json)
      });
    })
    .then((data) => {
      console.log(data.code);
      $('.github-dropdown').hide();
    })
    .catch((err) => {
      console.log(err);
      $('.github-dropdown').hide();
    });
  })

  $(document).mouseup((event) => {
      let container = $('.github-dropdown');
      if (!container.is(event.target) 
        && !$('.github-button').is(event.target)
        && container.has(event.target).length === 0)
      {
          container.hide();
      }
  });
});


function gitPull() {
  Promise.all([
    getGithubCode(),
    getRequestParameter()
  ])
  .then((param) => {
    const functionName = param[1].functionName;
    const payload = {
      operation: "updateFunctionCode",
      codeSource: "inline",
      functionName: functionName,
      handler: functionList[functionName].handler,
      runtime: functionList[functionName].runtime,
      inline: param[0]
    };
    return $.ajax({
      url: 'https://' + param[1].endpoint + '/lambda/services/ajax?operation=updateFunctionCode',
      headers: {
        "X-Csrf-Token" : param[1].csrf
      },
      method: 'POST',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then(console.log)
  .catch(console.log);
}

function gitPush() {
  getRequestParameter()
  .then((param) =>{
    const payload = {
      functionName: param.functionName,
      qualifier: param.qualifier,
      operation: "getFunctionCode"
    };
    return $.ajax({
      url: 'https://' + param.endpoint + '/lambda/services/ajax?operation=getFunctionCode',
      headers: {
        "X-Csrf-Token" : param.csrf
      },
      method: 'POST',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then((data) => {
    console.log(data.code);
    const payload = {
      content: data.code,
      encoding: "utf-8"
    };
    return $.ajax({
      url: `${baseUrl}/git/blobs`,
      headers: {
        "Authorization": `token ${accessToken}`
      },
      method: 'POST',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then((response) => {
    console.log(response);
    const payload = {
      tree : [{
        path: "index.js",
        mode: "100644",
        type: "blob",
        sha: response.sha
      }]
    };
    return $.ajax({
      url: `${baseUrl}/git/trees`,
      headers: {
        "Authorization": `token ${accessToken}`
      },
      method: 'POST',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then((response) => {
    return $.getJSON(
      'https://ghe.rjbdev.jp/api/v3/repos/k-kyo/lambdaTest/branches/master',
      { access_token: accessToken }
    )
    .then((branch) => {
      return Object.assign(response, { parent: branch.commit.sha})
    });
  })
  .then((response) => {
    console.log(response);
    const payload = {
      message: "commit from lambda",
      tree: response.sha,
      parents: [
        response.parent
      ]
    };
    return $.ajax({
      url: `${baseUrl}/git/commits`,
      headers: {
        "Authorization": `token ${accessToken}`
      },
      method: 'POST',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then((response) => {
    console.log(response);
     const payload = {
      force: true,
      sha: response.sha
    };
    return $.ajax({
      url: `${baseUrl}/git/refs/heads/master`,
      headers: {
        "Authorization": `token ${accessToken}`
      },
      method: 'PATCH',
      crossDomain: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    });
  })
  .then((response) => {
    console.log(response);
  })
}


function getGithubCode() {
  return $.getJSON(
    'https://ghe.rjbdev.jp/api/v3/repos/k-kyo/lambdaTest/contents/index.js?ref=master',
    { access_token: accessToken }
  )
  .then((data) =>  {
    return $.get(data.download_url);
  })
}

function getRequestParameter(simple) {
  let param;
  if (simple) {
    const match = window.location.href.match(/https:\/\/(.*?)\//);
    if (!match) return null;
    param = {
      endpoint : match[1]
    };    
  } else {
    const match = window.location.href.match(/https:\/\/(.*?)\/.*functions\/(\w*)(\?|\/)((.*)\?)?/);
    if (!match) return null;
    param = {
      endpoint : match[1],
      functionName : match[2],
      qualifier : match[5]? match[5] : "$LATEST"
    };
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("csrf", (item) => {
      if (item.csrf && item.csrf !== ""){
        param.csrf = item.csrf;
        resolve(param);
      }
      else throw new Error("can not get csrf token");
    });
  })
}

function initButton() {
  const div = $('.awsmob-button-group');
  if (div.length === 0) return;
  const button = 
    '<span class="github">\
      <div class="awsmob-dropdown">\
        <span>\
          <awsui-button>\
            <button class="github-button awsui-button awsui-button-size-normal awsui-button-variant-normal awsui-hover-child-icons" type="submit">Github\
              <span class="github-caret awsui-button-icon awsui-button-icon-right awsui-icon caret-down"></span>\
            </button>\
          </awsui-button>\
        </span>\
        <ul class="awsmob-dropdown-menu github-dropdown" style="display: none">\
          <li><a id="github-config"><span>Configure Github</span></a></li>\
          <li><a id="github-pull"><span>Pull</span></a></li>\
          <li><a id="github-push"><span>Push</span></a></li>\
        </ul>\
      </div>\
    </span>';
  div.children().last().after(button);
}