const CBS = require("./lib/cbs");
const config = require("./config");

(async function(){
  let cbs = new CBS(config.ABACUS);

  await cbs.initialize()

  let imgRes = await cbs.uploadPicture("/home/lestoni/Pictures/fff.svg")
  let idRes = await cbs.uploadId("/home/lestoni/Pictures/fff.svg")

  let cbsClient = await cbs.createClient({
      cardId: idRes,
      imgId: imgRes,
      branchId: 1,
      title: 0
    });
  console.log(cbsClient)

})().catch((err)=> {
    console.log(err.message)
  })