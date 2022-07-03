<script>
import { ref } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";

// Import Swiper styles
import "swiper/css";

import "swiper/css/pagination";

// import required modules
import { Mousewheel, Pagination } from "swiper";

import axios from "axios";

import {
  Location,
  Menu as IconMenu,
  Document,
  Setting,
  Plus,
  ArrowUp,
  DArrowLeft,
  ElemeFilled,
  Lollipop,
  Tools,
} from "@element-plus/icons-vue";

import { Map, View } from "ol";
import "ol/ol.css";
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Image as ImageLayer,
} from "ol/layer";
import { OverviewMap } from "ol/control";
import { XYZ, Vector as VectorSource, ImageStatic } from "ol/source";
import Draw, { createBox } from "ol/interaction/Draw";
import { getTopLeft, getWidth, getHeight } from "ol/extent";
import { Circle, Fill, Stroke, Style } from "ol/style";

export default {
  components: {
    Swiper,
    SwiperSlide,
    Location,
    IconMenu,
    Document,
    Setting,
    Plus,
    ArrowUp,
    DArrowLeft,
    ElemeFilled,
    Lollipop,
    Tools,
  },
  setup() {
    const baseUrl = "http://106.13.199.229:8887";
    let mainSlideSwiperRef = null;
    let firstSlideSwiperRef = null;
    let secondSlideSwiperRef = null;
    let thirdSlideSwiperRef = null;

    let mainSwiperIndex = 0;

    let firstSlideSwiperIndex = 0;

    let secondSlideSwiperIndex = 0;

    let activeStep = ref(0);

    const uploadUrl = baseUrl + "/utils/upload";

    let imageUrl = ref("");
    let imageUrl2 = ref("");

    let imgName = ref("");
    let imgName2 = ref("");

    let resultFileName = "";

    // let oEResultUrl = ref("");

    let predictStatus = ref("");

    let resultImageUrl = ref("");

    let mainMap = ref(null);

    let finishMapPredict = ref(false);

    let imageLayerVisible = ref(true);

    let imageLayerOpacity = ref(100);

    let hMap;

    let activeTool = ref(0);

    const vectorSource = new VectorSource();

    // 绘制图框存放于该图层
    const vectorLayer = new VectorLayer({
      className: "draw-layer",
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: "#ffffff00",
        }),
        stroke: new Stroke({
          color: "#0099ff",
          width: 3,
        }),
      }),
    });
    // window.vectorLayer = vectorLayer;

    let mapContext;

    const getContext = (event) => {
      mapContext = event.context;
    };

    const tDTLayer = new TileLayer({
      name: "天地图影像",
      source: new XYZ({
        url: "http://t0.tianditu.com/DataServer?T=img_w&tk=f15764f2eacdcbfa69d2435342416ea8&x={x}&y={y}&l={z}",
        crossOrigin: "Anonymous",
      }),
    });
    tDTLayer.on("postrender", getContext);

    let mapDrawer;

    // 生成图片链接
    const toImage = (name, data) => {
      let ext = name.split(".")[1];
      let s = "data:image/";
      if (ext == "jpg") {
        s = s + "jpeg;base64," + data;
      } else {
        s = s + ext + ";base64," + data;
      }
      return s;
    };

    const setMainSlideSwiperRef = (swiper) => {
      mainSlideSwiperRef = swiper;
    };

    const setFirstSlideSwiperRef = (swiper) => {
      firstSlideSwiperRef = swiper;
    };

    const setSecondSlideSwiperRef = (swiper) => {
      secondSlideSwiperRef = swiper;
    };

    const handleOpen = (key, keyPath) => {
      firstSlideSwiperRef.slideTo(key - 1, 500);
      firstSlideSwiperIndex = key - 1;
    };

    const handleSelect = (key, keyPath) => {
      secondSlideSwiperRef.slideTo(key - 1, 500);
      secondSlideSwiperIndex = key - 1;
      // 待确定
      clearData();
    };

    // 上传图片
    const handleAvatarSuccess = (response, uploadFile) => {
      if (response.success) {
        ElMessage.success("上传成功！");
        imageUrl.value = URL.createObjectURL(uploadFile.raw);
        imgName.value = response.result;
      } else {
        ElMessage.error(response.msg);
        imgName.value = "";
        imageUrl.value = "";
      }
    };
    const handleAvatarError = (error, uploadFile) => {
      ElMessage.error("上传失败！");
      imgName.value = "";
      imageUrl.value = "";
    };

    const handleAvatarSuccess2 = (response, uploadFile) => {
      if (response.success) {
        ElMessage.success("上传成功！");
        imageUrl2.value = URL.createObjectURL(uploadFile.raw);
        imgName2.value = response.result;
      } else {
        ElMessage.error(response.msg);
        imgName2.value = "";
        imageUrl2.value = "";
      }
    };
    const handleAvatarError2 = (error, uploadFile) => {
      ElMessage.error("上传失败！");
      imgName2.value = "";
      imageUrl2.value = "";
    };

    // 预测
    const predict = (type) => {
      let url = "";
      let param = Object.create(null);
      let successHandle = null;
      let errorHandle = null;
      switch (type) {
        case "oe":
          url = baseUrl + "/extraction/predict";
          param.fileName = imgName.value;
          successHandle = oESuccessHandle;
          errorHandle = oEErrorHandle;
          break;
        case "cd":
          url = baseUrl + "/change/predict";
          param.formerFileName = imgName.value;
          param.latterFileName = imgName2.value;
          successHandle = cDSuccessHandle;
          errorHandle = cDErrorHandle;
          break;
        case "od":
          url = baseUrl + "/detection/predict";
          param.fileName = imgName.value;
          successHandle = oDSuccessHandle;
          errorHandle = oDErrorHandle;
        case "tc":
          url = baseUrl + "/classify/predict";
          param.fileName = imgName.value;
          successHandle = tCSuccessHandle;
          errorHandle = tCErrorHandle;
        default:
          break;
      }

      resultFileName = "";
      predictStatus.value = "finish";
      activeStep.value = 1;

      axios({
        headers: { "Content-Type": "application/json" },
        url: url,
        method: "post",
        data: JSON.stringify(param),
      })
        .then(successHandle)
        .catch(errorHandle);
    };

    // 目标提取处理
    const oESuccessHandle = (res) => {
      activeStep.value = 2;
      if (res.data.success) {
        resultFileName = res.data.result.fileName;
        resultImageUrl.value = toImage(resultFileName, res.data.result.data);
        predictStatus.value = "success";
      } else {
        resultFileName = "";
        resultImageUrl.value = "";
        predictStatus.value = "error";
        activeStep.value = 0;
        ElMessage.error(res.data.result.msg);
      }
    };

    const oEErrorHandle = (err) => {
      activeStep.value = 0;
      ElMessage.error("网络错误！");
    };

    // 变化检测处理
    const cDSuccessHandle = (res) => {
      activeStep.value = 2;
      if (res.data.success) {
        resultFileName = res.data.result.fileName;
        resultImageUrl.value = toImage(resultFileName, res.data.result.data);
        predictStatus.value = "success";
      } else {
        resultFileName = "";
        resultImageUrl.value = "";
        predictStatus.value = "error";
        activeStep.value = 0;
        ElMessage.error(res.data.result.msg);
      }
    };

    const cDErrorHandle = (err) => {
      activeStep.value = 0;
      ElMessage.error("网络错误！");
    };

    // 目标检测处理
    const oDSuccessHandle = (res) => {
      activeStep.value = 2;
      if (res.data.success) {
        resultFileName = res.data.result.fileName;
        resultImageUrl.value = toImage(resultFileName, res.data.result.data);
        predictStatus.value = "success";
      } else {
        resultFileName = "";
        resultImageUrl.value = "";
        predictStatus.value = "error";
        activeStep.value = 0;
        ElMessage.error(res.data.result.msg);
      }
    };

    const oDErrorHandle = (err) => {
      activeStep.value = 0;
      ElMessage.error("网络错误！");
    };

    // 地物分类处理
    const tCSuccessHandle = (res) => {
      activeStep.value = 2;
      if (res.data.success) {
        resultFileName = res.data.result.fileName;
        resultImageUrl.value = toImage(resultFileName, res.data.result.data);
        predictStatus.value = "success";
      } else {
        resultFileName = "";
        resultImageUrl.value = "";
        predictStatus.value = "error";
        activeStep.value = 0;
        ElMessage.error(res.data.result.msg);
      }
    };

    const tCErrorHandle = (err) => {
      activeStep.value = 0;
      ElMessage.error("网络错误！");
    };

    // 重新上传方法
    const backToFirst = () => {
      activeStep.value = 0;
      clearData();
    };

    // 下载结果
    const downloadResult = () => {
      let a = document.createElement("a");
      a.style.display = "none";
      a.download = resultFileName;
      a.href = baseUrl + "/utils/download?fileName=" + resultFileName;
      a.click();
    };

    const clearData = () => {
      imageUrl.value = "";
      imgName.value = "";
      imageUrl2.value = "";
      imgName2.value = "";
      predictStatus.value = "";
      resultImageUrl.value = "";
      activeStep.value = 0;
    };

    const initMap = () => {
      let overviewMapControl = new OverviewMap({
        collapsible: false,
        collapsed: false,
        layers: [
          new TileLayer({
            name: "天地图影像-鹰眼",
            source: new XYZ({
              url: "http://t0.tianditu.com/DataServer?T=img_w&tk=f15764f2eacdcbfa69d2435342416ea8&x={x}&y={y}&l={z}",
            }),
          }),
        ],
        // view: new View({
        //   projection: "EPSG:4326",
        //   maxZoom: 18,
        //   minZoom: 1,
        //   zoom: 1,
        // })
      });
      hMap = new Map({
        target: "mapDiv",
        layers: [tDTLayer, vectorLayer],
        // layers: [tDTLayer],
        view: new View({
          // 地图视图
          projection: "EPSG:4326", // 坐标系，有EPSG:4326和EPSG:3857
          center: [114.064839, 22.548857], // 深圳坐标
          maxZoom: 18,
          minZoom: 15, // 地图缩放最小级别
          zoom: 15, // 地图缩放级别（打开页面时默认级别）
        }),
        controls: [overviewMapControl],
      });
      mainMap.value = hMap;
    };

    const loadMap = () => {
      mainSlideSwiperRef.mousewheel.disable();
      if (hMap != null) {
        return;
      }
      setTimeout(function () {
        initMap();
      }, 500);
    };

    const backToSecond = () => {
      mainSlideSwiperRef.mousewheel.enable();
      mainSlideSwiperRef.slideTo(1, 500);
    };

    let mapAction = "";

    const drawendHandle = (e) => {
      // debugger;
      hMap.removeInteraction(mapDrawer);
      let geom = e.feature.getGeometry();
      setTimeout(function () {
        clipImage(geom);
      }, 50);
      // clipImage(geom);
    };

    const mapPredict = (type) => {
      claerMapData();
      switch (type) {
        case "oe":
          activeTool.value = 1;
          mapAction = "oe";
          break;
        case "od":
          activeTool.value = 3;
          mapAction = "od";
          break;
        case "tc":
          activeTool.value = 4;
          mapAction = "tc";
          break;

        default:
          activeTool.value = 0;
          mapAction = "";
          return;
      }
      // hMap.removeInteraction(mapDrawer);
      // vectorSource.clear();
      mapDrawer = new Draw({
        source: vectorSource,
        type: "Circle",
        geometryFunction: createBox(),
      });
      mapDrawer.on("drawend", drawendHandle);
      hMap.addInteraction(mapDrawer);
    };

    let geometry;

    const clipImage = (geom) => {
      geometry = geom;
      let extent = geom.getExtent();
      let [x, y] = hMap.getPixelFromCoordinate(getTopLeft(extent));
      let currentPixelZoom = hMap.getView().getZoom();
      let resolution = hMap.getView().getResolutionForZoom(currentPixelZoom);
      let w = getWidth(extent) / resolution;
      let h = getHeight(extent) / resolution;
      vectorLayer.setVisible(false);
      let imageData = mapContext.getImageData(x, y, w, h);
      vectorLayer.setVisible(true);
      let newCanvas = document.createElement("canvas");
      // let newCanvas = document.getElementById("ttttttt");
      newCanvas.width = w;
      newCanvas.height = h;
      let newCtx = newCanvas.getContext("2d");
      newCtx.putImageData(imageData, 0, 0);

      let requestUrl = "";
      switch (mapAction) {
        case "oe":
          requestUrl = baseUrl + "/extraction/predict";
          break;
        case "od":
          requestUrl = baseUrl + "/detection/predict";
          break;
        case "tc":
          requestUrl = baseUrl + "/classify/predict";
          break;

        default:
          activeTool.value = 0;
          break;
      }

      axios({
        headers: { "Content-Type": "application/json" },
        url: requestUrl,
        method: "post",
        data: JSON.stringify({ imageData: newCanvas.toDataURL("image/jpeg") }),
      })
        .then(mapSuccessHandle)
        .catch(mapErrorHandle);
    };

    let imageLayer = null;

    const mapSuccessHandle = (res) => {
      if (!res.data.success) {
        ElMessage.error(res.data.result.msg);
        return;
      }
      let msg = "";
      switch (mapAction) {
        case "oe":
          msg = "目标提取预测成功！";
          break;
        case "od":
          msg = "目标检测预测成功！";
          break;
        case "tc":
          msg = "地物分类预测成功！";
          break;

        default:
          msg = "";
          break;
      }
      ElMessage.success(msg);
      let mapResultFileName = res.data.result.fileName;
      let type = "";
      let ext = mapResultFileName.split(".")[1];
      if (ext == "jpg") {
        type = "image/jpeg";
      } else {
        type = "image/" + ext;
      }

      // 转为ascii码
      let resultImageString = atob(res.data.result.data);

      // 处理异常,将ascii码小于0的转换为大于0
      let len = resultImageString.length;
      let newArr = new Uint8Array(len);
      while (len--) {
        newArr[len] = resultImageString.charCodeAt(len);
      }

      let imageBlob = new Blob([newArr], { type: type });
      let resultImageUrl = URL.createObjectURL(imageBlob);
      let imageStatic = new ImageStatic({
        url: resultImageUrl,
        imageExtent: geometry.getExtent(),
      });
      imageLayer = new ImageLayer({ source: imageStatic });
      hMap.addLayer(imageLayer);
      finishMapPredict.value = true;

      // let imgdiv = document.getElementById("ttttttt");
      // imgdiv.src = resultImageUrl;
      // debugger;
      // console.log(resultImageUrl);
      // debugger;
    };

    const mapErrorHandle = (err) => {
      ElMessage.error("网络错误！");
    };

    const changeOpacity = () => {
      activeTool.value = 5;
    };

    // 修改图片是否可见
    const changeImageLayerVisible = (val) => {
      imageLayer.setVisible(val);
    }

    const formatTooltip = (val) => {
      return val / 100
    }

    // 修改图片透明度
    const changeImageLayerOpacity = (val) => {
      imageLayer.setOpacity(val / 100);
    }

    const claerMapData = () => {
      if (imageLayer != null){
        hMap.removeLayer(imageLayer);
      }
      imageLayer = null;
      if (mapDrawer != null) {
        hMap.removeInteraction(mapDrawer);
      }
      mapDrawer = null;
      geometry = null;
      mapAction = '';
      vectorSource.clear();
      imageLayerVisible.value = true;
      imageLayerOpacity.value = 100;
      activeTool.value = 0;
      finishMapPredict.value = false;
    }

    // // 目标提取处理
    // const oEMapSuccessHandle = (res) => {
    //   if (res.data.success) {
    //     ElMessage.success("目标提取预测成功！");
    //     resultFileName2 = res.data.result.fileName;
    //     resultImage = toImage(resultFileName2, res.data.result.data);
    //     // predictStatus.value = "success";
    //   } else {
    //     resultFileName2 = "";
    //     ElMessage.error(res.data.result.msg);
    //   }
    // };

    // const oEMapErrorHandle = (err) => {
    //   ElMessage.error("网络错误！");
    // };

    // // 目标检测处理
    // const oDMapSuccessHandle = (res) => {
    //   if (res.data.success) {
    //     ElMessage.success("目标检测预测成功！");
    //     resultFileName2 = res.data.result.fileName;
    //   } else {
    //     resultFileName2 = "";
    //     ElMessage.error(res.data.result.msg);
    //   }
    // };

    // const oDMapErrorHandle = (err) => {
    //   ElMessage.error("网络错误！");
    // };

    // // 地物分类处理
    // const tCMapSuccessHandle = (res) => {
    //   if (res.data.success) {
    //     ElMessage.success("目标检测预测成功！");
    //     resultFileName2 = res.data.result.fileName;
    //   } else {
    //     resultFileName2 = "";
    //     ElMessage.error(res.data.result.msg);
    //   }
    // };

    // const tCMapErrorHandle = (err) => {
    //   ElMessage.error("网络错误！");
    // };

    return {
      modules: [Mousewheel, Pagination],
      handleOpen,
      setMainSlideSwiperRef,
      setFirstSlideSwiperRef,
      setSecondSlideSwiperRef,
      handleSelect,
      activeStep,
      uploadUrl,
      handleAvatarSuccess,
      handleAvatarError,
      handleAvatarSuccess2,
      handleAvatarError2,
      imageUrl,
      imageUrl2,
      imgName,
      imgName2,
      predict,
      // oEResultUrl,
      predictStatus,
      resultImageUrl,
      backToFirst,
      downloadResult,
      mainMap,
      loadMap,
      backToSecond,
      activeTool,
      mapPredict,
      finishMapPredict,
      changeOpacity,
      imageLayerVisible,
      imageLayerOpacity,
      changeImageLayerVisible,
      formatTooltip,
      changeImageLayerOpacity,
      claerMapData,
    };
  },
};
</script>

<template>
  <!-- 主界面swiper -->
  <swiper
    :direction="'vertical'"
    :slidesPerView="1"
    :spaceBetween="10"
    :mousewheel="true"
    :pagination="{
      clickable: false,
    }"
    :modules="modules"
    :allowTouchMove="false"
    class="mySwiper"
    @swiper="setMainSlideSwiperRef"
    @reachEnd="loadMap"
  >
    <swiper-slide class="first-swiper">
      <div class="swiper-first-menu">
        <el-menu
          mode="horizontal"
          @open="handleOpen"
          :ellipsis="false"
          :unique-opened="true"
        >
          <el-sub-menu index="1">
            <template #title>目标提取</template>
            <!-- <el-menu-item index="1-1">目标提取</el-menu-item> -->
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>变化检测</template>
            <!-- <el-menu-item index="2-1">变化检测</el-menu-item> -->
          </el-sub-menu>
          <el-sub-menu index="3">
            <template #title>目标检测</template>
            <!-- <el-menu-item index="3-1">目标检测</el-menu-item> -->
          </el-sub-menu>
          <el-sub-menu index="4">
            <template #title>地物分类</template>
            <!-- <el-menu-item index="4-1">地物分类</el-menu-item> -->
          </el-sub-menu>
        </el-menu>
      </div>

      <swiper
        class="subSwiper"
        :allowTouchMove="false"
        @swiper="setFirstSlideSwiperRef"
      >
        <swiper-slide>
          <div
            class="swiper-slide-background"
            :style="{
              'background-image':
                'url(https://swiperjs.com/demos/images/nature-1.jpg)',
            }"
          >
            <p>
              目标提取目标提取目标提取目标提取目标提取目标提取目标提取目标提取目标提取目标提取
            </p>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div
            class="swiper-slide-background"
            :style="{
              'background-image':
                'url(https://swiperjs.com/demos/images/nature-2.jpg)',
            }"
          >
            <p>
              变化检测变化检测变化检测变化检测变化检测变化检测变化检测变化检测
            </p>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div
            class="swiper-slide-background"
            :style="{
              'background-image':
                'url(https://swiperjs.com/demos/images/nature-3.jpg)',
            }"
          >
            <p>目标检测目标检测目标检测目标检测目标检测目标检测</p>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div
            class="swiper-slide-background"
            :style="{
              'background-image':
                'url(https://swiperjs.com/demos/images/nature-4.jpg)',
            }"
          >
            <p>
              地物分类地物分类地物分类地物分类地物分类地物分类地物分类地物分类
            </p>
          </div>
        </swiper-slide>
      </swiper>
    </swiper-slide>

    <!-- 用户上传swiper -->
    <swiper-slide class="second-swiper">
      <div class="swiper-second-menu">
        <el-menu
          default-active="1"
          class="el-menu-vertical"
          :collapse="true"
          @select="handleSelect"
          :ellipsis="false"
          :unique-opened="true"
        >
          <el-menu-item index="1">
            <el-icon><location /></el-icon>
            <template #title>目标提取</template>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><icon-menu /></el-icon>
            <template #title>变化检测</template>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><document /></el-icon>
            <template #title>目标检测</template>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><setting /></el-icon>
            <template #title>地物分类</template>
          </el-menu-item>
        </el-menu>
      </div>

      <swiper
        :direction="'vertical'"
        class="subSwiper"
        :allowTouchMove="false"
        :modules="modules"
        @swiper="setSecondSlideSwiperRef"
        :spaceBetween="10"
      >
        <!-- 目标提取 -->
        <swiper-slide>
          <div class="second-swiper-content oe">
            <div class="step-header">
              <el-steps :active="activeStep" finish-status="success" simple>
                <el-step
                  title="上传图片"
                  :status="imgName == '' ? '' : 'success'"
                />
                <el-step
                  :title="activeStep == 1 ? '预测中...' : '预测'"
                  :status="predictStatus"
                />
                <el-step
                  title="完成"
                  :status="activeStep == 2 ? 'success' : ''"
                />
              </el-steps>
            </div>
            <div class="steps-content">
              <!-- 图片上传 -->
              <div class="steps-content-sub" v-if="activeStep == 0">
                <div class="content-img">
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :on-error="handleAvatarError"
                    accept=".jpg,.png,.tif"
                    name="imgFile"
                  >
                    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"
                      ><Plus
                    /></el-icon>
                  </el-upload>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="predict('oe')"
                    >预测</el-button
                  >
                </div>
              </div>
              <!-- 预测过程 -->
              <div class="steps-content-sub" v-if="activeStep == 1">
                <div class="content-img">
                  <div class="avatar-uploader">
                    <div class="el-upload el-upload--text">
                      <img class="avatar" v-if="imageUrl" :src="imageUrl" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- 结果展示 -->
              <div class="steps-content-sub" v-if="activeStep == 2">
                <div class="content-img">
                  <el-result
                    title="Success"
                    sub-title="预测成功！"
                    icon="success"
                  >
                    <template #icon>
                      <div class="result-imgs">
                        <div class="result-img">
                          <el-image :src="imageUrl" />
                        </div>
                        <div class="result-img">
                          <el-image :src="resultImageUrl" />
                        </div>
                      </div>
                    </template>
                  </el-result>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="backToFirst"
                    >重新上传</el-button
                  >
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="downloadResult"
                    >下载结果</el-button
                  >
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
        <!-- 变化检测 -->
        <swiper-slide>
          <div class="second-swiper-content cd">
            <div class="step-header">
              <el-steps :active="activeStep" finish-status="success" simple>
                <el-step
                  title="上传图片"
                  :status="imgName == '' && imgName2 == '' ? '' : 'success'"
                />
                <el-step
                  :title="activeStep == 1 ? '预测中...' : '预测'"
                  :status="predictStatus"
                />
                <el-step
                  title="完成"
                  :status="activeStep == 2 ? 'success' : ''"
                />
              </el-steps>
            </div>
            <div class="steps-content">
              <!-- 图片上传 -->
              <div class="steps-content-sub" v-if="activeStep == 0">
                <div class="content-img">
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :on-error="handleAvatarError"
                    accept=".jpg,.png,.tif"
                    name="imgFile"
                  >
                    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"
                      ><Plus
                    /></el-icon>
                  </el-upload>
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess2"
                    :on-error="handleAvatarError2"
                    accept=".jpg,.png,.tif"
                    name="imgFile"
                  >
                    <img v-if="imageUrl2" :src="imageUrl2" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"
                      ><Plus
                    /></el-icon>
                  </el-upload>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == '' || imgName2 == ''"
                    @click="predict('cd')"
                    >预测</el-button
                  >
                </div>
              </div>
              <!-- 预测过程 -->
              <div class="steps-content-sub" v-if="activeStep == 1">
                <div class="content-img">
                  <div class="avatar-uploader">
                    <div class="el-upload el-upload--text">
                      <img class="avatar" v-if="imageUrl" :src="imageUrl" />
                    </div>
                  </div>
                  <div class="avatar-uploader">
                    <div class="el-upload el-upload--text">
                      <img class="avatar" v-if="imageUrl2" :src="imageUrl2" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- 结果展示 -->
              <div class="steps-content-sub" v-if="activeStep == 2">
                <div class="content-img">
                  <el-result
                    title="Success"
                    sub-title="预测成功！"
                    icon="success"
                  >
                    <template #icon>
                      <div class="result-imgs">
                        <div class="result-img">
                          <el-image :src="imageUrl" />
                        </div>
                        <div class="result-img">
                          <el-image :src="imageUrl2" />
                        </div>
                        <div class="result-img">
                          <el-image :src="resultImageUrl" />
                        </div>
                      </div>
                    </template>
                  </el-result>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="backToFirst"
                    >重新上传</el-button
                  >
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="downloadResult"
                    >下载结果</el-button
                  >
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
        <!-- 目标检测 -->
        <swiper-slide>
          <div class="second-swiper-content od">
            <div class="step-header">
              <el-steps :active="activeStep" finish-status="success" simple>
                <el-step
                  title="上传图片"
                  :status="imgName == '' ? '' : 'success'"
                />
                <el-step
                  :title="activeStep == 1 ? '预测中...' : '预测'"
                  :status="predictStatus"
                />
                <el-step
                  title="完成"
                  :status="activeStep == 2 ? 'success' : ''"
                />
              </el-steps>
            </div>
            <div class="steps-content">
              <!-- 图片上传 -->
              <div class="steps-content-sub" v-if="activeStep == 0">
                <div class="content-img">
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :on-error="handleAvatarError"
                    accept=".jpg,.png,.tif"
                    name="imgFile"
                  >
                    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"
                      ><Plus
                    /></el-icon>
                  </el-upload>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="predict('od')"
                    >预测</el-button
                  >
                </div>
              </div>
              <!-- 预测过程 -->
              <div class="steps-content-sub" v-if="activeStep == 1">
                <div class="content-img">
                  <div class="avatar-uploader">
                    <div class="el-upload el-upload--text">
                      <img class="avatar" v-if="imageUrl" :src="imageUrl" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- 结果展示 -->
              <div class="steps-content-sub" v-if="activeStep == 2">
                <div class="content-img">
                  <el-result
                    title="Success"
                    sub-title="预测成功！"
                    icon="success"
                  >
                    <template #icon>
                      <div class="result-imgs">
                        <div class="result-img">
                          <el-image :src="imageUrl" />
                        </div>
                        <div class="result-img">
                          <el-image :src="resultImageUrl" />
                        </div>
                      </div>
                    </template>
                  </el-result>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="backToFirst"
                    >重新上传</el-button
                  >
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="downloadResult"
                    >下载结果</el-button
                  >
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
        <!-- 地物分类 -->
        <swiper-slide>
          <div class="second-swiper-content tc">
            <div class="step-header">
              <el-steps :active="activeStep" finish-status="success" simple>
                <el-step
                  title="上传图片"
                  :status="imgName == '' ? '' : 'success'"
                />
                <el-step
                  :title="activeStep == 1 ? '预测中...' : '预测'"
                  :status="predictStatus"
                />
                <el-step
                  title="完成"
                  :status="activeStep == 2 ? 'success' : ''"
                />
              </el-steps>
            </div>
            <div class="steps-content">
              <!-- 图片上传 -->
              <div class="steps-content-sub" v-if="activeStep == 0">
                <div class="content-img">
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :on-error="handleAvatarError"
                    accept=".jpg,.png,.tif"
                    name="imgFile"
                  >
                    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"
                      ><Plus
                    /></el-icon>
                  </el-upload>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="predict('tc')"
                    >预测</el-button
                  >
                </div>
              </div>
              <!-- 预测过程 -->
              <div class="steps-content-sub" v-if="activeStep == 1">
                <div class="content-img">
                  <div class="avatar-uploader">
                    <div class="el-upload el-upload--text">
                      <img class="avatar" v-if="imageUrl" :src="imageUrl" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- 结果展示 -->
              <div class="steps-content-sub" v-if="activeStep == 2">
                <div class="content-img">
                  <el-result
                    title="Success"
                    sub-title="预测成功！"
                    icon="success"
                  >
                    <template #icon>
                      <div class="result-imgs">
                        <div class="result-img">
                          <el-image :src="imageUrl" />
                        </div>
                        <div class="result-img">
                          <el-image :src="resultImageUrl" />
                        </div>
                      </div>
                    </template>
                  </el-result>
                </div>
                <div class="content-btn">
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="backToFirst"
                    >重新上传</el-button
                  >
                  <el-button
                    type="primary"
                    :disabled="imgName == ''"
                    @click="downloadResult"
                    >下载结果</el-button
                  >
                </div>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
    </swiper-slide>

    <!-- 地图截图swiper -->
    <swiper-slide class="third-swiper">
      <div class="map-content">
        <el-icon color="#dce5eebd" :size="60" @click="backToSecond"
          ><DArrowLeft
        /></el-icon>
        <div class="toolbox" v-if="mainMap">
          <el-icon
            color="#292a2bbd"
            :size="40"
            :class="{ active: activeTool == 1 }"
            @click="mapPredict('oe')"
            ><ElemeFilled
          /></el-icon>
          <el-icon color="#b0b2b4ad" :size="40" class="map-cd"
            ><ElemeFilled
          /></el-icon>
          <el-icon
            color="#292a2bbd"
            :size="40"
            :class="{ active: activeTool == 3 }"
            @click="mapPredict('od')"
            ><ElemeFilled
          /></el-icon>
          <el-icon
            color="#292a2bbd"
            :size="40"
            :class="{ active: activeTool == 4 }"
            @click="mapPredict('tc')"
            ><ElemeFilled
          /></el-icon>
          <el-popover
            placement="right"
            :width="200"
            trigger="click"
            :disabled="!finishMapPredict"
          >
            <template #reference>
              <el-icon
                color="#b0b2b4ad"
                :size="40"
                class="change-opacity"
                :class="{
                  disable: !finishMapPredict,
                  active: finishMapPredict && activeTool == 5,
                }"
                @click="changeOpacity"
                ><Tools
              /></el-icon>
            </template>
            <template #default>
              <div class="change-opacity-context">
                <div class="change-visible">
                  <span>显示结果</span>
                  <el-switch
                    inline-prompt
                    v-model="imageLayerVisible"
                    active-text="是"
                    inactive-text="否"
                    @change="changeImageLayerVisible"
                  />
                </div>
                <div class="change-opacity-div">
                  <span>透明度</span>
                  <div class="opacity-slider">
                    <el-slider v-model="imageLayerOpacity" :disabled="!imageLayerVisible" @change="changeImageLayerOpacity" :format-tooltip="formatTooltip"/>
                  </div>
                </div>
              </div>
            </template>
          </el-popover>
          <el-icon color="#292a2bbd" :size="40" @click="claerMapData()"
            ><Lollipop
          /></el-icon>
        </div>
        <!-- <div id="testDiv" @click="Test"></div> -->
        <div id="mapDiv"></div>
        <!-- <img id="ttttttt" /> -->
      </div>
    </swiper-slide>
  </swiper>
</template>

<style>
#app {
  height: 100%;
}
html,
body {
  position: relative;
  height: 100%;
}

body {
  background: #eee;
  font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #000;
  margin: 0;
  padding: 0;
}

.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  text-align: center;
  font-size: 18px;
  background: #fff;

  /* Center slide text vertically */
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}

/* .swiper-slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
} */

.swiper-pagination.swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination-horizontal {
  top: 2%;
}

.mySwiper .first-swiper {
  display: block;
}

.mySwiper .first-swiper .swiper-first-menu {
  position: absolute;
  top: 0px;
  z-index: 999;
  display: flex;
  width: 100%;
  justify-content: center;
  background: #ffffffd9;
}

.mySwiper .first-swiper .swiper-first-menu > ul {
  background: none;
}

.mySwiper .first-swiper .swiper-first-menu .el-icon.el-sub-menu__icon-arrow {
  display: none;
}

* .el-popper.is-pure.is-light {
  display: none;
}

.swiper-slide-background {
  height: 100%;
  width: 100%;
}

.swiper-slide-background > p {
  top: 10%;
  left: 5%;
  position: absolute;
  max-width: 40%;
  font-size: 41px;
  font-weight: 300;
  text-align: start;
  background: #ffffff30;
}

.mySwiper .second-swiper .swiper-second-menu {
  /* position: absolute; */
  top: 0%;
  left: 0%;
  z-index: 999;
  display: flex;
  height: 100%;
  /* width: 100%; */
  align-items: center;
  background: #ffffffd9;
}

.mySwiper .second-swiper .swiper-second-menu > ul {
  background: none;
}

.second-swiper-content {
  text-align: justify;
  width: 100%;
  height: 93%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 2% 2% 1% 2%;
}

.second-swiper-content .step-header {
  height: 5%;
}

.second-swiper-content .steps-content {
  height: 95%;
  margin-top: 1%;
}

.second-swiper-content .steps-content .steps-content-sub {
  height: 100%;
  /* padding: 1% 2%; */
  display: flex;
  flex-direction: column;
  margin: 0% 2%;
}

.content-img {
  width: 100%;
  height: 92%;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.content-btn {
  width: 100%;
  height: 8%;
  display: flex;
  justify-content: center;
}
.content-btn > button {
  margin: 1%;
}

.avatar-uploader {
  width: 43%;
  height: 98%;
}

.avatar-uploader .avatar {
  max-width: 100%;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  height: 100%;
  width: 100%;
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader .el-upload__input {
  height: 100%;
  width: 100%;
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  zoom: 3;
}

.process-img {
  max-width: 43%;
  max-height: 98%;
}

.el-result {
  padding: 0px;
  margin: 1%;
  height: 98%;
  max-width: 79%;
}

.el-result .el-result__icon {
  height: 90%;
  /* margin: 1%; */
  max-width: 100%;
}

.el-result .el-result__icon .el-image {
  height: 100%;
  max-width: 100%;
}

.result-imgs {
  display: flex;
  height: 100%;
  max-width: 100%;
  justify-content: center;
}

.result-img {
  margin: 0 1%;
  height: 100%;
  width: 50%;
}

.cd .content-img {
  flex-direction: row;
}
.cd .avatar-uploader {
  margin: 0 2%;
}

.cd .result-img {
  width: 33%;
}

.cd .el-result {
  max-width: 100%;
  max-height: 83%;
}

.map-content {
  width: 100%;
  height: 100%;
}

.map-content > .el-icon {
  position: absolute;
  top: 1%;
  right: 50%;
  transform: rotate(90deg);
  z-index: 99;
}

.map-content > .el-icon:hover {
  /* color: #409efc; */
  transform: translate(0, -5%) scale(1.2) rotate(90deg);
  transition: 0.2s;
}

.map-content .el-icon:hover {
  color: #409efc;
}

#mapDiv {
  width: 100%;
  height: 100%;
}

/* 天地图右下角版权 */
#mapDiv .tdt-control-copyright.tdt-control > div {
  display: none;
}

.ol-overviewmap {
  left: unset !important;
  right: 0;
  height: 26%;
  width: 17%;
}

.ol-overviewmap-map {
  width: 100% !important;
  height: 100% !important;
}

.map-content .toolbox {
  display: flex;
  height: 300px;
  width: 50px;
  position: absolute;
  top: 5%;
  left: 5%;
  background-color: #ffffffcc;
  /* transform: rotate(90deg); */
  z-index: 99;
  border-radius: 15px;
  border: 2px solid #787777;
  flex-direction: column;
  align-items: center;
}

.toolbox .map-cd.el-icon {
  cursor: not-allowed;
}

.toolbox .map-cd.el-icon:hover {
  color: #b0b2b4ad;
  cursor: not-allowed;
}

.toolbox .el-icon {
  margin: 5px;
}

.toolbox .el-icon.active {
  color: #409efc !important;
}

.toolbox .change-opacity.el-icon {
  color: #292a2bbd;
}

.toolbox .change-opacity.el-icon:hover {
  color: #409efc;
}

.toolbox .change-opacity.disable.el-icon {
  color: #b0b2b4ad;
  cursor: not-allowed;
}

.toolbox .change-opacity.disable.el-icon:hover {
  color: #b0b2b4ad;
  cursor: not-allowed;
}

.change-opacity-context {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.change-opacity-context span {
  margin: 10px;
}

.change-opacity-context .change-opacity-div {
  display: flex;
  flex-direction: column;
}

.change-opacity-context .change-opacity-div .opacity-slider {
  margin: 0 15px;
}

.map-content > #testDiv {
  height: 65%;
  width: 50%;
  position: absolute;
  z-index: 999;
  top: 20%;
  left: 20%;
  border: 2px solid #409efc;
}

#ttttttt {
  position: absolute;
  top: 0;
  left: 0;
  border: 3px solid #0b4be0;
}
</style>
