import { Buffer } from "buffer"
import { SkynetClient, MySky, JsonData } from "skynet-js";
import { ChildHandshake, Connection, WindowMessenger } from "post-me";
import { IContentInfo, skappActionType, IPublishedApp, IIndex, IPage, IContentPersistence, INewContentPersistence, EntryType, IDACResponse, IDictionary, IContentRecordDAC, IFilePaths, IAppComments, IAppInfo, IAppStats, IDeployedApp } from "./types";

// DAC consts
const DATA_DOMAIN = "skapps.hns";

//const urlParams = new URLSearchParams(window.location.search);
const DEBUG_ENABLED =  true;
const DEV_ENABLED = true;

// page consts
const ENTRY_MAX_SIZE = 1 << 12; // 4kib
const PAGE_REF = '[NUM]';

// index consts
const INDEX_DEFAULT_PAGE_SIZE = 1000;
const INDEX_VERSION = 1;

// ContentRecordDAC is a DAC that allows recording user interactions with pieces
// of content. There are two types of interactions which are:
// - content creation
// - content interaction (can be anything)
//
// The DAC will store these interactions across a fanout data structure that
// consists of an index file that points to multiple page files.
export default class ContentRecordDAC implements IContentRecordDAC {
  protected connection: Promise<Connection>;

  private client: SkynetClient
  private mySky: MySky;
  private paths: IFilePaths;
  private skapp: string;
  private skappDict : any={};
  public constructor(
  ) {
    // create client
    this.client = new SkynetClient();

    // define API
    const methods = {
      init: this.init.bind(this),
      onUserLogin: this.onUserLogin.bind(this),
      skappAction: this.skappAction.bind(this),
      getPublishedApps: this.getPublishedApps.bind(this),
      getSkappsInfo: this.getSkappsInfo.bind(this),
      getSkappStats: this.getSkappStats.bind(this),
      getSkappComments: this.getSkappComments.bind(this),
      getDeployedApps: this.getDeployedApps.bind(this)

    };

    // create connection
    this.connection = ChildHandshake(
      new WindowMessenger({
        localWindow: window,
        remoteWindow: window.parent,
        remoteOrigin: "*",
      }),
      methods,
    );
  }
  public async skappAction(action: skappActionType, appId: string, data: any): Promise<IDACResponse> {
    let result:IDACResponse = {
      submitted:false,
      
    };
    try{
    switch(action){
        case skappActionType.DEPLOY:
        case skappActionType.REDEPLOY:
          await this.setDeployedAppInfo(appId,data)
          await this.updateDeployedIndex(appId);
          result.submitted=true
          break; 
        case skappActionType.PUBLISH:
          let appstats:IAppStats={
            id:appId,
            version:'1',
            prevSkylink:'',
            ts: (new Date()).toUTCString(),
            content : {
              favorite : 0,
              viewed: 0, // counter increments everytime card is clicked to view details
              liked : 0,
              accessed : 0
            }
          }
          await this.setPublishedAppStats(appId,appstats)
          let appcomments:IAppComments={
            id:appId,
            version:'1',
            prevSkylink:'',
            ts: (new Date()).toUTCString(),
            content:{
              comments:[]
            }
          }
          await this.setPublishedAppComments(appId,appcomments)
        case skappActionType.REPUBLISH:
          await this.setPublishedAppInfo(appId,data)
          await this.updatePublisedIndex(appId);
          result.submitted=true
          break;
        case skappActionType.LIKED:
        case skappActionType.UNLIKED:
          if(await this.checkPublishedApp(appId)){
          let like:IAppStats = await this.getPublishedAppStats(appId);
          like.ts= (new Date()).toUTCString();
          like.content.liked=action==skappActionType.LIKED?1:0;
          await this.setPublishedAppStats(appId,like);
          }
          break;       
        case skappActionType.FAVORITE:
        case skappActionType.UNFAVORITE:
          if(await this.checkPublishedApp(appId)){
          let fav:IAppStats = await this.getPublishedAppStats(appId);
          fav.ts= (new Date()).toUTCString();
          fav.content.favorite=action==skappActionType.FAVORITE?1:0;
          await this.setPublishedAppStats(appId,fav);
          }
          break; 
        case skappActionType.VIEWED:
          if(await this.checkPublishedApp(appId)){
          let view:IAppStats = await this.getPublishedAppStats(appId);
          view.ts= (new Date()).toUTCString();
          view.content.viewed+=1;
          await this.setPublishedAppStats(appId,view);
          }
          break;
        case skappActionType.ACCESSED:
          if(await this.checkPublishedApp(appId)){
          let access:IAppStats = await this.getPublishedAppStats(appId);
          access.ts= (new Date()).toUTCString();
          access.content.accessed+=1;
          await this.setPublishedAppStats(appId,access);
          }
          break;
        case skappActionType.ADD_COMMENT:
          if( await this.checkPublishedApp(appId)){
          let comment:IAppComments = await this.getPublishedAppComments(appId);
          comment.ts= (new Date()).toUTCString();
          comment.content.comments.push({timestamp:(new Date()).toUTCString(), comment:data.comment})
          await this.setPublishedAppComments(appId,comment);
          }
          break;  
      default:
        this.log('No such Implementation');
    }
  }catch(error){
    result.error=error;
  }
  return result;
  }

  private async checkPublishedApp(appId:string){
    let indexData:any ={};
    try{
      indexData=await this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
    }catch(error){
      throw Error('NO Index present')
    }
    if(indexData.published.includes(appId)){
      return true;
    }
    else{
      return false;
    }
  }

  private async updatePublisedIndex(appId:string){
    let indexData:any ={};
    try{
      indexData=await this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
    }catch(error){
      indexData['published']=[]
    }
    if(indexData==null || indexData==undefined ||indexData.published==null ||indexData.published==undefined)
    {indexData={}
    indexData['published']=[]}
    if(!indexData.published.includes(appId)){
      indexData.published.push(appId);
      this.mySky.setJSON(this.paths.PUBLISHED_INDEX_PATH,indexData);
    }
  }
  private async updateDeployedIndex(appId:string){
    let indexData:any ={};
    try{
      indexData=await this.mySky.getJSON(this.paths.DEPLOYED_INDEX_PATH);
    }catch(error){
      indexData['deployed']=[]
    }
    if(indexData==null || indexData==undefined ||indexData.deployed==null ||indexData.deployed==undefined)
    {indexData={}
    indexData['deployed']=[]}
    if(!indexData.deployed.includes(appId)){
      indexData.deployed.push(appId);
      this.mySky.setJSON(this.paths.DEPLOYED_INDEX_PATH,indexData);
    }
  }

  public async init() {
    try {
      // extract the skappname and use it to set the filepaths
      const hostname = new URL(document.referrer).hostname
      const skapp = await this.client.extractDomain(hostname)
      this.log("loaded from skapp", skapp)
      this.skapp = skapp;

      this.paths = {
        SKAPPS_DICT_PATH: `${DATA_DOMAIN}/skapp-dict.json`,//{skapp_name:true/false}
        PUBLISHED_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/published/index.json`,
        ///JSON Data: [appId1, AppId2....]
        //PATH_Example: /skyapps.hns/skapp.hns/published/index.json, /skyapps.hns/anotherAppStore.hns/published/index.json..etc
        PUBLISHED_APP_INFO_PATH:`${DATA_DOMAIN}/${skapp}/published/`,
        PUBLISHED_APP_COMMENT_PATH: `${DATA_DOMAIN}/${skapp}/published/`,//app-comments.json
        PUBLISHED_APP_STATS_PATH: `${DATA_DOMAIN}/${skapp}/published/`,//app-stats.json
        DEPLOYED_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/deployed/index.json`,
        //JSON Data: [appId1, AppId2....]
        DEPLOYED_APP_INFO_PATH: `${DATA_DOMAIN}/${skapp}/deployed/`,
      }

      // load mysky
      const opts = { dev: DEV_ENABLED }
      this.mySky = await this.client.loadMySky(DATA_DOMAIN, opts)


    } catch (error) {
      this.log('Failed to load MySky, err: ', error)
      throw error;
    }

    try{
     this.skappDict= await this.mySky.getJSON(this.paths.SKAPPS_DICT_PATH)
    }catch(error){
      this.log('Failed to load skappDict, err: ', error)
      this.skappDict[this.skapp]=true;
      this.mySky.setJSON(this.paths.SKAPPS_DICT_PATH,this.skappDict);
      this.log('updated current skapp to skapp dict');
    }
  }

  public async getPublishedApps(appIds: string[]): Promise<any[]> {
    let indexData:any ={};
    let results:any[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=await this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO PUBLISHED APP");
     } 
     appIds = indexData.published;
    }
    for(let appid of appIds){
      let appData :any;
      try{
        appData= await this.getPublishedAppInfo(appid);
      results.push(appData);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }

  public async getSkappsInfo(appIds: string[]): Promise<any[]> {
    let indexData:any ={};
    let results:any[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=await this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO PUBLISHED APP");
     } 
     appIds = indexData.published;
    }
    for(let appid of appIds){
      let appMaster:any={};
      let appData :any;
      let appStats :any;
      let appComments :any;
      try{
        appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appInfo.json');
        appStats= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appStats.json');
        appComments= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appComments.json');
        appMaster={
          appdata:appData,
          appstats: appStats,
          appcomments: appComments
        }
        results.push(appMaster);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }
  public async getSkappStats(appId: string): Promise<any> {
    let appData :any;
    try{
      appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appStats.json');
    
    }catch(error){
      this.log('missing json for appid :',appId);
      throw new Error("missing json for appid :"+appId);
    }
    return appData;
  }
  public async getSkappComments(appId: string): Promise<any> {
    let appData :any;
    try{
      appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appComments.json');
    }catch(error){
      this.log('missing json for appid :',appId);
      throw new Error("missing json for appid :"+appId);
    }
    return appData;
  }
  public async getDeployedApps(appIds: string[]): Promise<any[]> {
    let indexData:any ={};
    let results:IDeployedApp[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=await this.mySky.getJSON(this.paths.DEPLOYED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO DEPLOYED APP");
     } 
     appIds = indexData.deployed;
    }
    for(let appid of appIds){
      let appData :any;
      try{
        appData= await this.getDeployedAppInfo(appid);
      results.push(appData);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }
  private async getPublishedAppInfo(appId:string):Promise<any>{
    return await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appInfo.json');
  }
  private async getPublishedAppStats(appId:string):Promise<any>{
    return (await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'app-stats.json'));
  }
  private async setPublishedAppStats(appId:string,data:any){
    return await this.mySky.setJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'app-stats.json',data);
  }
  private async getPublishedAppComments(appId:string):Promise<any>{
    return await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'app-comments.json');
  }
  private async setPublishedAppComments(appId:string,data:any){
    return await this.mySky.setJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'app-comments.json',data);
  }
  private async setPublishedAppInfo(appId:string, appData:any){
    return await this.mySky.setJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appInfo.json',appData);
  }
  private async getDeployedAppInfo(appId:string){
    return await this.mySky.getJSON(this.paths.DEPLOYED_APP_INFO_PATH+appId+'/'+'appInfo.json');
  }
  private async setDeployedAppInfo(appId:string, appData:any){
    return await this.mySky.setJSON(this.paths.DEPLOYED_APP_INFO_PATH+appId+'/'+'appInfo.json',appData);
  }
  // onUserLogin is called by MySky when the user has logged in successfully
  public async onUserLogin() {
    // Register the skapp name in the dictionary
    
  }


  // registerSkappName is called on init and ensures this skapp name is
  // registered in the skapp name dictionary.
  private async registerSkappName() {
    const { SKAPPS_DICT_PATH } = this.paths;
    let skapps = await this.downloadFile<IDictionary>(SKAPPS_DICT_PATH);
    if (!skapps) {
      skapps = {};
    }
    skapps[this.skapp] = true;
    await this.updateFile(SKAPPS_DICT_PATH, skapps);
  }


  // downloadFile merely wraps getJSON but is typed in a way that avoids
  // repeating the awkward "as unknown as T" everywhere
  private async downloadFile<T>(path: string): Promise<T | null> {
    this.log('downloading file at path', path)
    const { data } = await this.mySky.getJSON(path)
    if (!data) {
      this.log('no data found at path', path)
      return null;
    }
    this.log('data found at path', path, data)
    return data as unknown as T
  }

  // updateFile merely wraps setJSON but is typed in a way that avoids repeating
  // the awkwars "as unknown as JsonData" everywhere
  private async updateFile<T>(path: string, data: T) {
    this.log('updating file at path', path, data)
    await this.mySky.setJSON(path, data as unknown as JsonData)
  }



  // toPersistence turns content info into a content persistence object
  private toPersistence(data: IContentInfo): IContentPersistence {
    const persistence = {
      timestamp: Math.floor(Date.now() / 1000),
      ...data,
    }

    if (persistence.metadata === undefined) {
      persistence.metadata = {};
    }
    
    // validate the given data does not exceed max size
    const size = Buffer.from(JSON.stringify(persistence)).length
    if (size > ENTRY_MAX_SIZE) {
      throw new Error(`Entry exceeds max size, ${length}>${ENTRY_MAX_SIZE}`)
    }

    return persistence;
  }

  // log prints to stdout only if DEBUG_ENABLED flag is set
  private log(message: string, ...optionalContext: any[]) {
    if (DEBUG_ENABLED) {
      console.log(message, ...optionalContext)
    }
  }
}
