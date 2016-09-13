chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  if(msg.from === "sql"){
    $('.sqlButtons').show();
    $('.sqlProgressing').hide();
  }
});

function handleError(msg) {
    chrome.tabs.executeScript({
      code: 'alert("' + msg + '");'
    }); 
}

function changeTab(e) {
  $(".tab").hide();
  $(".tabTitle").removeClass("select");
  e.addClass("select");
  $(e.attr('href')).show();
}

window.onload = function() {
  //init
  $.ajaxSetup({ cache: false });
  $.getJSON(
    'https://ghe.rjbdev.jp/api/v3/users/k-kyo/repos',
    { access_token: "8ce96018903bcc20f01de9693b02cbeaa9715d08" }
  ).done(function(res) {
    console.log(res);
    $("#scenarioList").empty();
    $.each(res, function(key, val){
      $("#scenarioList").append($("<option></option>").val(val.url).text(val.name));
    });
  }).fail(function(e) {
    console.log(e);
    handleError('シナリオ一覧取得失敗');
  });

  $("#loadScenario").click(function(){
    let cookieStr = "";
    chrome.cookies.getAll({}, (cookies) => {
      cookies.forEach((cookie) => {
        cookieStr += cookie.name + "=" + cookie.value + ";";
      })
    })
    console.log(cookieStr);
    let csrf = "";
    new Promise((resolve, reject) => {
      chrome.storage.sync.get("csrf", (item) => {
        if (item.csrf && item.csrf !== "") resolve(item.csrf);
      });
    })
    .then((csrf) =>{
      let json = {"functionName":"attendance","qualifier":"$LATEST","operation":"getFunctionCode"};
      $.ajax({
        url: 'https://ap-northeast-1.console.aws.amazon.com/lambda/services/ajax?operation=getFunctionCode',
        headers: {
          "X-Csrf-Token" : csrf
        },
        type: 'post',
        crossDomain: true,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(json)
      }).done(function(res) {
        console.log(res);
        alert('作成完了');
      }).fail(function(e) {
        console.log(e);
        alert('データエクステンション作成失敗');
      })     
    })
  });

  $("#fill").click(function(){
    $('.sqlButtons').hide();
    $('.sqlProgressing').show();
    var url = $("#sqlList option:selected").val();
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { url: url, cmd: "sql"});
    });
  });

  $(".tabTitle").click(function(e){
    changeTab($(e.target));
  });
};