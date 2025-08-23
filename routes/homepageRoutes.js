const router = require("express").Router();
const { uploadImage } = require("../middleware/uploadImage");

const sliderController = require("../controller/home/slider");
const midInfoController = require("../controller/home/midInfoSection");
const headerInfoController = require("../controller/home/headerInfoSection");
const imgSectionController = require("../controller/home/imgSection");
const newProductSectionController = require("../controller/home/newProductSection");
const bannerController = require("../controller/home/bannerSection");
const imgChangerController = require("../controller/home/imgChanger");
const imgGridController = require("../controller/home/imgGrid");
const staticSectionController = require("../controller/home/staticSection");
const categoyDescriptionController = require("../controller/home/categoryDescription");
const ProfileContentController = require("../controller/home/profileContent");

// -----------------------------------🧨-------------------------------------

// Slider
router
  .post(
    "/createImgCricle",
    uploadImage.fields([
      { name: "desktopImgSrc", maxCount: 1},
      { name: "mobileImgSrc", maxCount: 1 }
    ]),
    sliderController.createImgCircle
  )
  .get("/getImgCircle", sliderController.getSliderCircle)
  .delete("/deleteSliderCircle/:circleId", sliderController.deleteSliderCircle);

// Middle Information section
router
  .post("/createMidInfoSection", midInfoController.createMidInfoSection)
  .get("/getMidInfoSection", midInfoController.getMidInfoSection)
  .delete(
    "/deleteMidSection/:midInfoId",
    midInfoController.deleteMidInfoSection
  );

// header information section
router
  .post(
    "/createHeaderInfoSection", uploadImage.array("icon", 1),
    headerInfoController.createHeaderInfoSection
  )
  .get("/getHeaderInfoSection", headerInfoController.getHeaderInfoSection)
  .delete(
    "/deleteHeaderInfoSection/:headerId",
    headerInfoController.deleteHeaderInfoSection
  );

// image section
router
  .post(
    "/createImgSection",
    uploadImage.array("image", 1),
    imgSectionController.createImgSection
  )
  .get("/getImgSection", imgSectionController.getImgSection)
  .delete("/deleteImgSection/:imgId", imgSectionController.deleteImgSection);

  //poster section
  router
  .post(
    "/createPosterSection",
    uploadImage.fields([
      { name: "desktopImgSrc", maxCount: 1},
      { name: "mobileImgSrc", maxCount: 1 }
    ]),
    imgSectionController.createPosterSection
  )
  .get("/getPosterSection", imgSectionController.getPosterSection)
  .delete("/deletePosterSection/:posterId", imgSectionController.deletePosterSection);


// New Product Section
router
  .post(
    "/createnewProductSection",
    uploadImage.array("image", 5),
    newProductSectionController.createProductSection
  )
  .get(
    "/getnewProductSection",
    newProductSectionController.getNewProductSection     
  )
  .delete(
    "/deletenewProductSection/:imgId",
    newProductSectionController.deletenewProductSection
  );

// Banner Section
router
  .post(
    "/createBannerSection",
    uploadImage.array("image", 1),
    bannerController.createBannerSection
  )
  .get("/getBannerSection", bannerController.getBannerSection)
  .delete("/deleteBannerSection/:imgId", bannerController.deleteBannerSection);

// imgChanger
router
  .post(
    "/createImgChanger",
    uploadImage.array("image", 4),
    imgChangerController.createImgChanger
  )
  .get("/getImgChanger", imgChangerController.getImgChanger)
  .delete(
    "/deleteImgChanger/:imgChangerId",
    imgChangerController.deleteImgChanger
  );

// image grid (which is at bottom of the page)
router
  .post(
    "/gridImg",
    uploadImage.array("image", 1),
    imgGridController.createImgGrid
  )
  .get("/gridImg", imgGridController.getImgGrid)
  .delete("/gridImg/:imgGridId", imgGridController.deleteImgGrid);

// static Section
router
  .post(
    "/createStaticSection",
    uploadImage.array("image", 4),
    staticSectionController.createStaticSection
  )
  .get("/getStaticSection", staticSectionController.getStaticSection)
  .delete(
    "/deleteStaticSection/:staticId",
    staticSectionController.deleteStaticSection
  );

// profileContent
router
  .post(
    "/createProfileContent",
    uploadImage.array("image", 1),
    ProfileContentController.createProfileContent
  )
  .get("/profileContent", ProfileContentController.getProfileContent)
  .delete(
    "/profileContent/:profileId",
    ProfileContentController.deleteProfileById
  );

// category description
router
  .post(
    "/categorydescription",
    uploadImage.array("image", 2),
    categoyDescriptionController.create_categoryDescription
  )
  .get(
    "/categorydescription",
    categoyDescriptionController.getCategoryDescription
  )
  .delete(
    "/categorydescription/:id",
    categoyDescriptionController.deleteCategoryDescription
  );

module.exports = router;
