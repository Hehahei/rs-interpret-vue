
function initMap() {
    const imageURL = 'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=f15764f2eacdcbfa69d2435342416ea8'
    let layer = new T.TileLayer(imageURL, {minZoom: 1, maxZoom: 18});
    let zoom = 18;
    let map = new T.Map('mapDiv', {layers: [layer], maxZoom: 18, minZoom: 15});
    map.centerAndZoom(new T.LngLat(116.40969, 39.89945), zoom);
    return map;
}


function mapFunction() {
    debugger;
}

export {
    mapFunction,
    initMap,
}