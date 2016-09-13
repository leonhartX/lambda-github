chrome.runtime.onMessage.addListener(() => {
  let div = $('.awsmob-button-group');
  if($('.github').length === 0) {
    initButton();
  }
});

$(() => {
  $.ajaxSetup({ cache: false });
  $(document).on('click', '.github-button', (event) => {
    $('.github-dropdown').show();
  });

  $(document).on('click', '#github-config', (event) => {
    let url = window.location.href;
    let match = url.match(/https:\/\/(.*?)\/.*functions\/(\w*)(\?|\/)((.*)\?)?/);
    let endpoint, functionName, qualifier;
    if (!match) {
      return;
    }
    endpoint = match[1];
    functionName = match[2];
    qualifier = match[5]? match[5] : "$LATEST";
    new Promise((resolve, reject) => {
      chrome.storage.sync.get("csrf", (item) => {
        if (item.csrf && item.csrf !== "") resolve(item.csrf);
        else throw new Error("can not get csrf token");
      });
    })
    .then((csrf) =>{
      let json = {
        functionName: functionName,
        qualifier: qualifier,
        operation: "getFunctionCode"
      };
      return $.ajax({
        url: 'https://' + endpoint + '/lambda/services/ajax?operation=getFunctionCode',
        headers: {
          "X-Csrf-Token" : csrf
        },
        type: 'post',
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

function initButton() {
  let div = $('.awsmob-button-group');
  let button = 
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