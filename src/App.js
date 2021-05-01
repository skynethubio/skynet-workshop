// Import react components
import { useState, useEffect } from 'react';

// Import App Component & helper
import WorkshopForm from './components/Form';
import generateWebPage from './helpers/generateWebPage';

// Import UI Components
import { Header, Tab, Container } from 'semantic-ui-react';
import { SkynetClient } from 'skynet-js';
/************************************************/
/*        Step 4.2 Code goes here               */
/************************************************/
//import { UserProfileDAC } from '@kbiswas/userprofile-record-library';
import { SkappDAC } from '@kbiswas/skapps-record-library';
/*****/

/************************************************/
/*        Step 1.2 Code goes here               */
/************************************************/
// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
const portal = 'https://siasky.net/';

// Initiate the SkynetClient
const client = new SkynetClient(portal);
/*****/

/************************************************/
/*        Step 4.3 Code goes here               */
/************************************************/
const contentRecord = new SkappDAC();

/*****/

function App() {
  // Define app state helpers
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Step 1 Helpers
  const [file, setFile] = useState();
  const [fileSkylink, setFileSkylink] = useState('');

  // Step 2 Helpers
  const [name, setName] = useState('');
  const [webPageSkylink, setWebPageSkylink] = useState('');

  // Step 3 Helpers
  const [dataKey, setDataKey] = useState('');
  const [userColor, setUserColor] = useState('#000000');
  const [filePath, setFilePath] = useState();
  const [userID, setUserID] = useState();
  const [mySky, setMySky] = useState();
  const [loggedIn, setLoggedIn] = useState(null);

  // When dataKey changes, update FilePath state.
  useEffect(() => {
    setFilePath(dataDomain + '/' + dataKey);
  }, [dataKey]);

  /************************************************/
  /*        Step 3.1 Code goes here               */
  /************************************************/

  const dataDomain = '';

  /*****/

  // On initial run, start initialization of MySky
  useEffect(() => {
    /************************************************/
    /*        Step 3.2 Code goes here               */
    /************************************************/
    async function initMySky() {
      try {
        // load invisible iframe and define app's data domain
        // needed for permissions write
        const mySky = await client.loadMySky(dataDomain,{dev:true, debug: true});
    
        // load necessary DACs and permissions
         await mySky.loadDacs(contentRecord);
    
        // check if user is already logged in with permissions
        const loggedIn = await mySky.checkLogin();
    
        // set react state for login status and
        // to access mySky in rest of app
        setMySky(mySky);
        setLoggedIn(loggedIn);
        if (loggedIn) {
          setUserID(await mySky.userID());
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // call async setup function
    initMySky();
    /*****/
  }, []);

  // Handle form submission. This is where the bulk of the workshop logic is
  // handled
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('form submitted');
    setLoading(true);

    /************************************************/
    /*        Part 1: Upload a file                */
    /************************************************/
     console.log('Uploading file...');

    /************************************************/
    /*        Step 1.3 Code goes here               */
    /************************************************/
// Upload user's file and get backs descriptor for our Skyfile
const { skylink } = await client.uploadFile(file);

// skylinks start with 'sia://' and don't specify a portal URL
// we can generate URLs for our current portal though.
const skylinkUrl = await client.getSkylinkUrl(skylink);

console.log('File Uploaded:', skylinkUrl);

// To use this later in our React app, save the URL to the state.
setFileSkylink(skylinkUrl);
    /************************************************/
    /*        Part 2: Upload a Web Page             */
    /************************************************/
    // console.log('Uploading web page...');

    /************************************************/
    /*        Step 2.1 Code goes here               */
    /************************************************/
// Create the text of an html file what will be uploaded to Skynet
// We'll use the skylink from Part 1 in the file to load our Skynet-hosted image.
const webPage = generateWebPage(name, skylinkUrl, userID, filePath);

// Build our directory object, we're just including the file for our webpage.
const webDirectory = {
  'index.html': webPage,
  // 'couldList.jpg': moreFiles,
};

// Upload user's webpage
const { skylink: dirSkylink } = await client.uploadDirectory(
  webDirectory,
  'certificate'
);

// generate a URL for our current portal
const dirSkylinkUrl = await client.getSkylinkUrl(dirSkylink);

console.log('Web Page Uploaded:', dirSkylinkUrl);

// To use this later in our React app, save the URL to the state.
setWebPageSkylink(dirSkylinkUrl);
    /************************************************/
    /*        Part 3: MySky                         */
    /************************************************/
    console.log('Saving user data to MySky file...');

    /************************************************/
    /*        Step 3.6 Code goes here              */
    /************************************************/
// create JSON data to write to MySky
const jsonData = {
  name,
  skylinkUrl,
  dirSkylinkUrl,
  color: userColor,
};

// call helper function for MySky Write
await handleMySkyWrite(jsonData);
    /*****/

    setLoading(false);
  };

  const handleMySkyLogin = async () => {
    /************************************************/
    /*        Step 3.3 Code goes here               */
    /************************************************/
    // Try login again, opening pop-up. Returns true if successful
const status = await mySky.requestLoginAccess();

// set react state
setLoggedIn(status);

if (status) {
  setUserID(await mySky.userID());
}
    /*****/
  };

  const handleMySkyLogout = async () => {
    /************************************************/
    /*        Step 3.4 Code goes here              */
    /************************************************/
    // call logout to globally logout of mysky
await mySky.logout();

//set react state
setLoggedIn(false);
setUserID('');
    /*****/
  };

  const handleMySkyWrite = async (jsonData) => {
    /************************************************/
    /*        Step 3.7 Code goes here              */
    /************************************************/
    // Use setJSON to save the user's information to MySky file
try {
  console.log('userID', userID);
  console.log('filePath', filePath);
  const result = await mySky.setJSON(filePath, jsonData);
  console.log(` setJSON:data ${JSON.stringify(result)}`);
      console.log(`setJSON:skylink ${result.skylink}`);
} catch (error) {
  console.log(`error with setJSON: ${error.message}`);
}
    /*****/
    /************************************************/
    /*        Step 4.7 Code goes here              */
    /************************************************/
    try {
      // let profp = await contentRecord.getProfile();
      // console.log("original Profile",profp);     
      // let profile = {
      //   username:"c3po",
      //   aboutMe:"is a droid programmed for etiquette and protocol, built by the heroic Jedi Anakin Skywalker, and a constant companion to astromech R2-D2",
      //   location:"Tatooine",
      //   topics:['War','Games']
      // }
      // console.log('In the method');
      // await contentRecord.setProfile(profile);
      // let prof = await contentRecord.getProfile();
      // console.log("Updated Profile",prof);
      // let pref = {
      //   darkmode:true,
      //   portal:"siasky.net"
      // }
      // await contentRecord.setPreference(pref);
      // let prefr = await contentRecord.getPreference();
      // console.log("preferance",prefr);
      // let proHist = await contentRecord.getProfileHistory();
      // console.log("profileHistory",proHist);
      // let prefHist = await contentRecord.getPreferenceHistory();
      // console.log("getPreferanceHistory",prefHist);

      let deployApp={
       id: 'kbiswasDeploy1',
       version:'1',
       previousSkylink:'delta',
       ts: (new Date()).toUTCString(),
       content:{
        storageGateway:"storage",
        hns:"string",
        skylink:"string" ,
        defaultPath:"string",
        portalMinVersion:"string",
        sourceCode:"string",
        history: ["test1","test2"]
       }
      }
      let publishedApp={
        id: 'kbiswasPublish2',
        version:'7',
        previousSkylink:'delta',
        ts: (new Date()).toUTCString(),
        content:{
         storageGateway:"storage",
         hns:"string",
         skylink:"string" ,
         defaultPath:"string",
         portalMinVersion:"string",
         sourceCode:"string",
         history: ["test1","test2"]
        }
       }
       console.log('DEPLOY APP')
      await contentRecord.deployApp('kbiswasDeploy1',deployApp)
      console.log("deployedApps kbiswasDeploy1");
      deployApp.id='kbiswasDeploy3';
      await contentRecord.deployApp('kbiswasDeploy3',deployApp)
      console.log("deployedApps kbiswasDeploy3");
      await contentRecord.publishApp('kbiswasPublish2',publishedApp)
      console.log("publishApp kbiswasPublish2");

      let deployedApps= await contentRecord.getDeployedApps([]);
      console.log(deployedApps);
      let publishedApps= await contentRecord.getPublishedApps(['kbiswasPublish2','kbiswasPublish1']);
      console.log(publishedApps);
      await contentRecord.likeApp('kbiswasPublish2');
      await contentRecord.viewedApp('kbiswasPublish2');
      await contentRecord.favouriteApp('kbiswasPublish2');
       let stats = await contentRecord.getSkappStats('kbiswasPublish2');
       console.log(stats);
    } catch (error) {
      console.log(`error with CR DAC: ${error.message}`);
    }
    /*****/
  };

  
    
  

  // loadData will load the users data from SkyDB
  const loadData = async (event) => {
    event.preventDefault();
    setLoading(true);
    console.log('Loading user data from SkyDB');

    /************************************************/
    /*        Step 4.5 Code goes here              */
    /************************************************/
// Use getJSON to load the user's information from SkyDB
const { data } = await mySky.getJSON(filePath);

// To use this elsewhere in our React app, save the data to the state.
if (data) {
  setName(data.name);
  setFileSkylink(data.skylinkUrl);
  setWebPageSkylink(data.dirSkylinkUrl);
  setUserColor(data.color);
  console.log('User data loaded from SkyDB!');
} else {
  console.error('There was a problem with getJSON');
}
    /*****/

    setLoading(false);
  };

  const handleSaveAndRecord = async (event) => {
    event.preventDefault();
    setLoading(true);

    /************************************************/
    /*        Step 4.6 Code goes here              */
    /************************************************/
    console.log('Saving user data to MySky');

    const jsonData = {
      name,
      skylinkUrl: fileSkylink,
      dirSkylinkUrl: webPageSkylink,
      color: userColor,
    };
    
    try {
      // write data with MySky
      await mySky.setJSON(filePath, jsonData);
    
      // Tell contentRecord we updated the color
      // await contentRecord.recordInteraction({
      //   skylink: webPageSkylink,
      //   metadata: { action: 'updatedColorOf' },
      // });

      let profile = {
        username:"kushal"

      }
      
      await contentRecord.createProfile(profile);
    } catch (error) {
      console.log(`error with setJSON: ${error.message}`);
    }
    /*****/

    setLoading(false);
  };

  // define args passed to form
  const formProps = {
    mySky,
    handleSubmit,
    handleMySkyLogin,
    handleMySkyLogout,
    handleSaveAndRecord,
    loadData,
    name,
    dataKey,
    userColor,
    activeTab,
    fileSkylink,
    webPageSkylink,
    loading,
    loggedIn,
    dataDomain,
    userID,
    setLoggedIn,
    setDataKey,
    setFile,
    setName,
    setUserColor,
  };

  // handleSelectTab handles selecting the part of the workshop
  const handleSelectTab = (e, { activeIndex }) => {
    setActiveTab(activeIndex);
  };

  const panes = [
    {
      menuItem: 'Part 1: File Upload',
      render: () => (
        <Tab.Pane>
          <WorkshopForm {...formProps} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Part 2: Folder Upload',
      render: () => (
        <Tab.Pane>
          <WorkshopForm {...formProps} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Part 3: MySky',
      render: () => (
        <Tab.Pane>
          <WorkshopForm {...formProps} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Part 4: Content Record DAC',
      render: () => (
        <Tab.Pane>
          <WorkshopForm {...formProps} />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <Container>
      <Header
        as="h1"
        content="Skynet Workshop App"
        textAlign="center"
        style={{ marginTop: '1em', marginBottom: '1em' }}
      />
      <Tab
        menu={{ fluid: true, vertical: true, tabular: true }}
        panes={panes}
        onTabChange={handleSelectTab}
        activeIndex={activeTab}
      />
    </Container>
  );
}

export default App;