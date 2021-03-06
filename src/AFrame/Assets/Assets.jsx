import React from 'react';
import PropTypes from 'prop-types';
import ConsoleLogger from '../../Helper/ConsoleLogger';

/**
 * NOTE: <a-assets> must be a child of a <a-scene>.
 * So that I create this component to manage all assets
 *
 * TODO: Change to redux, can bind asset into this asset component
 * TODO: Build an NPM aframe asset management base on redux
 */
export default class Assets extends React.Component {
  static propTypes = {
    assets: PropTypes.object,
    timeout: PropTypes.number,
    interval: PropTypes.number,
    loadingStatusHandle: PropTypes.func,
    currentInfoHandle: PropTypes.func,
    loadingInfoHandle: PropTypes.func,
    debug: PropTypes.bool,
  };
  
  assetsInstance = null;
  //assetItemInstances = {}; // ref to all asset items
  
  total = 0;
  current = 0;
  assetCurrentItem;
  
  //timeoutInstance;
  idleMilisecs = 0;
  defaultInterval = 200;
  
  shouldComponentUpdate() {
    // Because we bind event to element so that do not re-render this component
    return false;
  }
  
  componentDidMount() {
    ConsoleLogger.log('Assets Component mounted', 'Assets');
    //console.log('assetsInstance.fileLoader: ', this.assetsInstance.fileLoader);
    //if (this.assetsInstance.fileLoader) {
    //  const mng = this.assetsInstance.fileLoader.manager;
    //
    //  mng.onError = function (a, b) {
    //    console.log("mng onError a, b: ", a, b);
    //  }
    //  mng.onLoad = function (a, b) {
    //    console.log("mng onLoad a, b: ", a, b);
    //  }
    //  mng.onProgress = function (a, b) {
    //    console.log("mng onProgress a, b: ", a, b);
    //  }
    //  mng.onStart = function (a, b) {
    //    console.log("mng onStart a, b: ", a, b);
    //  }
    //}
    
    this.assetsInstance.addEventListener('loaded', () => {
      // Force too complete
      this.props.loadingInfoHandle({
        assetLoaded: this.total,
        assetTotal: this.total,
        assetCurrentItem: this.assetCurrentItem,
      });
      setTimeout(this.props.loadingStatusHandle(false), 1000);
      
      
      ConsoleLogger.log('All assets were loaded', 'Assets');
      //console.info('And THREE.Cache', THREE.Cache);
    });
  }

  componentWillUnmount() {
    // Make sure to remove the DOM listener when the component is unmounted.
    //this.nv.removeEventListener("nv-enter", this.handleNvEnter);
  }
  
  static getCurrUnixMili() {
    return (new Date()).getTime();
  }
  
  countLoadedAssetItem = (e) => {
    //return;
    
    //console.log('countLoadedAssetItem this.current: ', this.current, e, e.target);
  
    this.current++;
    this.assetCurrentItem = e.target;
    
    if (this.props.debug && e.target) {
        console.info('[Assets] loaded: ', e.target);
    }
  
    let currentUnix = Assets.getCurrUnixMili();
    const {interval = this.defaultInterval} = this.props;
    if (currentUnix - interval > this.idleMilisecs) {
      this.idleMilisecs = currentUnix;
      
      //clearTimeout(this.timeoutInstance);
      //this.timeoutInstance = setTimeout(() => {
      if (this.props.debug) {
        ConsoleLogger.log('Attempt to updateAssetsLoadingInfo', 'Assets');
      }
      
      this.props.loadingInfoHandle({
        assetLoaded: this.current,
        assetTotal: this.total,
        assetCurrentItem: this.assetCurrentItem,
      })
    //}, 200);
    }
  }
  
  updateProgress = (e) => {
    //console.log('xhr: ', e);
    
    //this.timeoutInstance = setTimeout(() => {
    let currentUnix = Assets.getCurrUnixMili();
    const {interval = this.defaultInterval} = this.props;
    if (currentUnix - interval > this.idleMilisecs) {
      this.idleMilisecs = currentUnix;
      this.props.currentInfoHandle({
        assetCurrentLoadedBytes: e.detail.loadedBytes,
        assetCurrentTotalBytes:  e.detail.totalBytes ? e.detail.totalBytes : e.detail.loadedBytes
      })
    }
    //}), 200);
  }
  
  /**
   * Try to Attach "loaded" event listener foreach asset items.
   * Each item type has 1 method to attach
   *
   * @param item
   * @returns {*}
   */
  getBindingProps = (item) => {
    // console.log("item: ", item);
    // obj_3DProjector_TurnOn_obj
    
    let eventName;

    switch(item.type){
      case 'a-asset-item':
        eventName = 'loaded'; // aframe / threejs event
        return {
          // NOTE: This case is an react component, not a pure HTML so that we need to pass eventListener to `ref`
          ref: ele => {
            ele.addEventListener(eventName, this.countLoadedAssetItem);
            //ele.addEventListener('progress', this.updateProgress);
          },
        };
        
      case 'img':
        eventName = 'onLoad'; // js event
        return {
          [eventName]: this.countLoadedAssetItem,
          //ref: ele => this.assetItemInstances[getId(item)] = ele,
        };
        
      case 'audio':
      case 'video':
        eventName = 'onLoadeddata'; // js event
        //eventName = 'loadeddata'; // aframe event
        return {
          [eventName]: this.countLoadedAssetItem,
          //ref: ele => this.assetItemInstances[getId(item)] = ele,
        };
      
      default:
        console.warn('Un-recognize asset type: ', item.type);
        return {}
    }
  }
  
  // TODO: Support asset management with lazy load
  getAssetsList = () => {
    const assetItemComponents = Object.keys(this.props.assets).map((key) => {
      const componentAssets = this.props.assets[key];
      this.total += componentAssets.length;
    
      return <a-entity key={key}>
        {componentAssets.map(item => React.cloneElement(
          item,
          {
            key: item.props.id ? item.props.id : ConsoleLogger.getUnix(),
            //ref: ele => this.assetItems.push(ele),
            ...this.getBindingProps(item), // Bind event listener for this elements
          }
        ))}
      </a-entity>
    });
  
    if (this.props.debug) {
      console.log('Component list to add assets: ', assetItemComponents);
    }
    
    return assetItemComponents;
  }
  
  render() {
    const {timeout} = this.props;
    
    return (
      <a-assets {...{timeout}} ref={ele => this.assetsInstance = ele}>
        {this.getAssetsList()}
      </a-assets>
    );
  }

  render2() {
    return (
      <a-assets timeout="30000" ref={ele => this.assetsInstance = ele}>
        <a-entity position="" rotation="" scale="" visible="">
          <img id="sky" src="/static/media/sky.d51d2dc1.jpg"
               alt="sky"/>
        </a-entity>
        <a-entity position="" rotation="" scale="" visible="">
          <img id="floorWooden"
               src="/static/media/wooden_panels-1280x720.19bd4d73.jpg"
               alt="floorWooden"/>
          <img id="imgBronze"
               src="/static/media/bronze.81c25958.jpg"
               alt="imgBronze"/>
          <img id="imgMetalSheetDecor" src="/static/media/metal-sheet-decor.f1582fc9.jpg" alt="imgMetalSheetDecor"/>
          <img id="imgCarbonYellow" src="/static/media/carbon-yellow.19a5d0b5.jpg" alt="imgCarbonYellow"/>
        </a-entity>
        <a-entity position="" rotation="" scale="" visible="">
          <a-asset-item id="obj_3DProjector_TurnOn_obj"
                        src="/static/media/3DProjector_turn_on.a41f1e12.obj"></a-asset-item>
          <a-asset-item id="obj_3DProjector_TurnOn_mtl"
                        src="data:application/octet-stream;base64,IyBCbGVuZGVyIE1UTCBGaWxlOiAnM0RQcm9qZWN0b3JfdHVybl9vbi5ibGVuZCcKIyBNYXRlcmlhbCBDb3VudDogNgoKbmV3bXRsIE1hdApOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC4wMDAwMDAgMC4wNTM1NzEgMC44MDAwMDAKS3MgMC44MDAwMDAgMC44MDAwMDAgMC44MDAwMDAKS2UgMC4wMDAwMDAgMC4wMzM0ODIgMC41MDAwMDAKTmkgLTEuMDAwMDAwCmQgMS4wMDAwMDAKaWxsdW0gMgoKbmV3bXRsIE1hdGVyaWFsLjAwNApOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC44MDAwMDAgMC4wMzQzNDAgMC4wMDAwMDAKS3MgMC41MDAwMDAgMC41MDAwMDAgMC41MDAwMDAKS2UgMC41MDAwMDAgMC4wMjE0NjMgMC4wMDAwMDAKTmkgMS4wMDAwMDAKZCAwLjYwMDAwMAppbGx1bSAyCgpuZXdtdGwgTWF0ZXJpYWwuMDA2Ck5zIDk2LjA3ODQzMQpLYSAwLjAwMDAwMCAwLjAwMDAwMCAwLjAwMDAwMApLZCAwLjAwMDAwMCAwLjQ1MDY3NCAwLjY0MDAwMApLcyAwLjUwMDAwMCAwLjUwMDAwMCAwLjUwMDAwMApLZSAwLjAwMDAwMCAwLjU2MzM0MyAwLjgwMDAwMApOaSAxLjAwMDAwMApkIDAuNDAwMDAwCmlsbHVtIDAKCm5ld210bCBNYXRlcmlhbC4wMDgKTnMgOTYuMDc4NDMxCkthIDEuMDAwMDAwIDEuMDAwMDAwIDEuMDAwMDAwCktkIDAuMDAwMDAwIDAuMDAwMDAwIDAuMDAwMDAwCktzIDAuNTAwMDAwIDAuNTAwMDAwIDAuNTAwMDAwCktlIDAuMDAwMDAwIDAuMDAwMDAwIDAuMDAwMDAwCk5pIDEuMDAwMDAwCmQgMS4wMDAwMDAKaWxsdW0gMgoKbmV3bXRsIE1hdGVyaWFsLjAwOQpOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC42NDAwMDAgMC4zODk4MTcgMC4wMDAwMDAKS3MgMC41MDAwMDAgMC41MDAwMDAgMC41MDAwMDAKS2UgMC40MDAwMDAgMC4yNDM2MzYgMC4wMDAwMDAKTmkgMS4wMDAwMDAKZCAxLjAwMDAwMAppbGx1bSAyCgpuZXdtdGwgVGhlM0RfcHJvamVjdG9yX2xlbnMKTnMgOTYuMDc4NDMxCkthIDAuNDAwMDAwIDAuNDAwMDAwIDAuNDAwMDAwCktkIDAuMDAwMDAwIDAuNDUwNjc0IDAuNjQwMDAwCktzIDAuNTAwMDAwIDAuNTAwMDAwIDAuNTAwMDAwCktlIDAuMDAwMDAwIDEuMTI2Njg2IDEuNjAwMDAwCk5pIDEuMDAwMDAwCmQgMC4yMDAwMDAKaWxsdW0gMAo="></a-asset-item>
          <a-asset-item id="obj_3DProjector_TurnOff_dae"
                        src="/static/media/3DProjector_turned_off.cfa054cf.dae"></a-asset-item>
          <a-asset-item id="obj_Ironman_dae" src="/static/media/IronMan2.2442be1d.dae"></a-asset-item>
          <a-asset-item id="obj_CircleTable_dae" src="/static/media/CircleTable.a93f86d6.dae"></a-asset-item>
          <a-asset-item id="obj_Monitor_obj" src="/static/media/my_moninitor.cd9b5f7f.obj"></a-asset-item>
          <a-asset-item id="obj_Monitor_mtl"
                        src="data:application/octet-stream;base64,IyBCbGVuZGVyIE1UTCBGaWxlOiAnbXlfbW9uaW5pdG9yLmJsZW5kJwojIE1hdGVyaWFsIENvdW50OiA2CgpuZXdtdGwgQmxhY2tDYXJib24KTnMgOTYuMDc4NDMxCkthIDEuMDAwMDAwIDEuMDAwMDAwIDEuMDAwMDAwCktkIDAuMDAwMDAwIDAuMDAwMDAwIDAuMDAwMDAwCktzIDAuNTAwMDAwIDAuNTAwMDAwIDAuNTAwMDAwCktlIDAuMDAwMDAwIDAuMDAwMDAwIDAuMDAwMDAwCk5pIDEuMDAwMDAwCmQgMS4wMDAwMDAKaWxsdW0gMgoKbmV3bXRsIEJsYWNrQ2FyYm9uLjAwMQpOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC4wMDAwMDAgMC4wMDAwMDAgMC4wMDAwMDAKS3MgMC41MDAwMDAgMC41MDAwMDAgMC41MDAwMDAKS2UgMC4wMDAwMDAgMC4wMDAwMDAgMC4wMDAwMDAKTmkgMS4wMDAwMDAKZCAxLjAwMDAwMAppbGx1bSAyCgpuZXdtdGwgU2NyZWVuQmx1ZV9BbWJpZW5fTGlnaHRlcgpOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC4wMDY2MjkgMC4yMDMwNDYgMS4wMDAwMDAKS3MgMC41MDAwMDAgMC40MzgwNTQgMC40ODQwNjUKS2UgMC4wMDY2MjkgMC4yMDMwNDYgMS4wMDAwMDAKTmkgMS4wMDAwMDAKZCAwLjUwMDAwMAppbGx1bSAyCgpuZXdtdGwgU2NyZWVuQmx1ZV9BbWJpZW50Ck5zIDk2LjA3ODQzMQpLYSAxLjAwMDAwMCAxLjAwMDAwMCAxLjAwMDAwMApLZCAwLjAwNjYyOSAwLjIwMzA0NiAxLjAwMDAwMApLcyAwLjUwMDAwMCAwLjQzODA1NCAwLjQ4NDA2NQpLZSAwLjAwMzk3NyAwLjEyMTgyOCAwLjYwMDAwMApOaSAxLjAwMDAwMApkIDAuNTAwMDAwCmlsbHVtIDIKCm5ld210bCBTY3JlZW5NYXRlcmlhbApOcyA5Ni4wNzg0MzEKS2EgMS4wMDAwMDAgMS4wMDAwMDAgMS4wMDAwMDAKS2QgMC4wMDAwMDAgMC4wMDAwMDAgMC4wMDAwMDAKS3MgMC41MDAwMDAgMC41MDAwMDAgMC41MDAwMDAKS2UgMC4wMDAwMDAgMC4wMDAwMDAgMC4wMDAwMDAKTmkgMS4wMDAwMDAKZCAwLjcwMDAwMAppbGx1bSAyCgpuZXdtdGwgV2hpdGVJbm94TWFydGVyaWFsCk5zIDk2LjA3ODQzMQpLYSAxLjAwMDAwMCAxLjAwMDAwMCAxLjAwMDAwMApLZCAwLjU1OTU5MyAwLjU1OTU5MyAwLjU1OTU5MwpLcyAwLjUwMDAwMCAwLjQ2Njc1NiAwLjQ4MTMxMQpLZSAwLjI3OTc5NiAwLjI3OTc5NiAwLjI3OTc5NgpOaSAxLjAwMDAwMApkIDEuMDAwMDAwCmlsbHVtIDIK"></a-asset-item>
          <a-asset-item id="obj_Monitor_dae" src="/static/media/my_moninitor.ec07b1a6.dae"></a-asset-item>
          <a-asset-item id="obj_Keyboard_obj" src="/static/media/my_keyboard.d1a105ad.obj"></a-asset-item>
          <a-asset-item id="obj_Keyboard_mtl"
                        src="data:application/octet-stream;base64,IyBCbGVuZGVyIE1UTCBGaWxlOiAnbXlfa2V5Ym9hcmQuYmxlbmQnCiMgTWF0ZXJpYWwgQ291bnQ6IDEKCm5ld210bCBTY3JlZW5CbHVlX0FtYmllbl9MaWdodGVyCk5zIDk2LjA3ODQzMQpLYSAxLjAwMDAwMCAxLjAwMDAwMCAxLjAwMDAwMApLZCAwLjAwMDAwMCAwLjkyNzU2OSAxLjAwMDAwMApLcyAwLjUwMDAwMCAwLjUwMDAwMCAwLjUwMDAwMApLZSAwLjAwMDAwMCAwLjA5Mjc1NyAwLjEwMDAwMApOaSAxLjAwMDAwMApkIDAuNTAwMDAwCmlsbHVtIDAK"></a-asset-item>
          <a-mixin id="yellow" material="color: #FFF88E;"></a-mixin>
        </a-entity>
        <a-entity position="" rotation="" scale="" visible=""><img id="obj_Drone166_img"
                                                                   src="/static/media/Drone1.4c574242.png"
                                                                   alt="obj_Drone166_img"/></a-entity>
        <a-entity position="" rotation="" scale="" visible="">
          <a-asset-item id="obj_E45_dae" src="/static/media/E 45 Aircraft_Luat.9b23b10c.dae"></a-asset-item>
        </a-entity>
        <a-entity position="" rotation="" scale="" visible="">
          <a-asset-item id="obj_Drone166_dae" src="/static/media/Drone166x.ef4457d1.dae"></a-asset-item>
        </a-entity>
        <a-entity position="" rotation="" scale="" visible="">
          <a-asset-item id="obj_StreetLamp_dae" src="/static/media/StreetLamp.cfef1171.dae"></a-asset-item>
        </a-entity>
      </a-assets>
    );
  }
}
