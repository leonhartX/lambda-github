# lambda-github
Chrome-extension for manage lambda inline code with github/github enterprise.

#Install
Install this extension from [chrome web store](https://chrome.google.com/webstore/detail/bmjcibkkmbmabejialhgnnmhpmdmijij).

#Usage
After install, when you open AWS Lambda console, a new button will appear to ask you login in to Github/Github Enterprise.

![alt button](http://gdurl.com/wYoF)

##Login
Login to your Github/Github Enterprise account, with Two-factor authentication support.

Actually, this is not a login action, but to create the `access token` which will be used for the extension
>Note: the access token will be stored in `chrome.storage.sync`(password will not be stored), if you take this as a security hole, pleast **DO NOT** use this extension.

##Bind
After login, you can bind your lambda function with Github repo and branch, or create a new one. and decide which file to sync.
![alt login](http://gdurl.com/lnc1)

##Manage
Manage your code with the similar `Push` and `Pull`.

**The code will sync to Github's repo, with a default file named `index.js`(nodejs) or `index.py`(python) under the root path.**

- `Pull` only works for lambda's `$LATEST` version, since published version or alias is readonly.
- `Push` will commit your current shown code(work for any qualifier) to the binding repo/branch.
- A diff dialog will shown before you confirm to `Push` or `Pull`.
- `Push` must have a commit comment which will be asked at the diff dialog.

##Logout
You can logout from the extension's option page any time. After logout, the  access token stored in extension will be deleted, 
but you will need to delete the token it self from Github/Github Enterprise's settins page.

#Support
please create an issue for any question or bug report.
