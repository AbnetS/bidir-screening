const CBS = require("./lib/cbs");
const config = require("./config");

const fs = require('fs');

(async function(){
  let cbs = new CBS(config.ABACUS);

  await cbs.initialize()

  let imgRes = await cbs.uploadPicture("/home/lestoni/Pictures/fff.svg")
  let idRes = await cbs.uploadID("/home/lestoni/Pictures/fff.svg")

  let cbsClient = await cbs.createClient({
      cardId: idRes.pictureId,
      imgId: imgRes.pictureId,
      branchId: 1,
      title: 0
    });
  
  fs.writeFileSync("./cbs.json", JSON.stringify(cbsClient));

})().catch((err)=> {
    console.log(err.message)
  })