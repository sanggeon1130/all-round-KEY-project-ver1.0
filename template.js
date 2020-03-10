var template = {
    html:function(title, list, body, control, authStatusUI){
      return `
      <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
  ${authStatusUI}
    <h1><a href="/">All-round KEY service</a></h1>
    ${list}
    ${control}
    <h3>${title}</h3>
    ${body}
    </p>
  </body>
  </html>

      `;
    },
    list:function(accounts){
      var list = "<ul>"
      var i = 0;
      while(i < accounts.length){
        list = list + `<li><a href = "/accounts/${accounts[i].site_name}">${accounts[i].site_name}</a></li>`
        i = i + 1;
      }
      list = list + "</ul>"
      return list;
    }
  }
  module.exports = template;