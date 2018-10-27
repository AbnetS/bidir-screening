const CBS = require("./lib/cbs");
const config = require("./config");

(async function(){
  let cbs = new CBS(config.ABACUS);

  await cbs.initialize()

  let imgRes = await cbs.uploadImage("/home/lestoni/Pictures/fff.svg")

  console.log(imgRes)

})().catch((err)=> {
    console.log(err.message)
  })