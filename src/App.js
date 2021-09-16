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
import { UserProfileDAC } from '@skynethub/userprofile-library';
/*****/

/************************************************/
/*        Step 1.2 Code goes here               */
/************************************************/
// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
const portal = 'https://siasky.net';

// Initiate the SkynetClient
const client = new SkynetClient(portal);
/*****/

/************************************************/
/*        Step 4.3 Code goes here               */
/************************************************/
const userprofile = new UserProfileDAC();

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

  const dataDomain = 'localhost';

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
        const mySky = await client.loadMySky(dataDomain, { dev: true, debug: true });

        // load necessary DACs and permissions
        await mySky.loadDacs(userprofile);

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

  const test_user_ids = ["570980a7f24391a9ced450cd8f22a9d78229c650ad24b7c2686b5bb86915418e",
    "3d4e50cfe857d94403c21f38be21073ecc42c7c828101e26c7628fd0b6fad67f",
    "8b8544d54ecf56da6be887232361eec9f524429c1bd523f4778b20fb9945d15c",
    "d21eb9d8d38e7b495cc47b94a046eab710edf7f1b19d42d5f1b201feb3406a2a",
    "22f91386b2e341edb046ff880a2e817b3b70fdd958113dc93b9b1375880dd5d2",
    "c25858373033e730a5e592cb5fd5b5fa90657da06210886c1f30552796973cb9",
    "73a83de68f07d77a75f3e8d7534f58c2d0a613aeffa2ec4f53238ee5af5a3379",
    "4294b7224a3d19a75abf7970f1bf3213c0370ea36d36a689cbd39e53333ec7f4",
    "5dc982eed6290fbe02f7781ec92051ef12e835a0565885eacfc94a9ee07686f0",
    "b85e1cd34633297d6004446f935d220918a8e2c5b98a5f5cc32c3c6c93f72d6b",
    "2b02efca9ed51cfed5c645eb3c1513d9343207a9e843454de72771e57c805d48",
    "403a35ed6b473518a213d514c3d105471d4bb454b67e4c4db106f061c13cb9a3",
    "dfa6e4e25be41cfe27a4457fab9a162db425cc7d230ff14370f9ae2a86f3a0ec",
    "c4b99808f188174c54edcc3cb1f2b864966911f15682d6fcdf728657c7813a30",
    "ce2df8006eb4a0179a5b1f85a59688b3749bffca91984614b40454dfa7ce3d3c"];

  const handleMySkyWrite = async (jsonData) => {
    /************************************************/
    /*        Step 3.7 Code goes here              */
    /************************************************/
    // Use setJSON to save the user's information to MySky file
    try {
      console.log('userID', userID);
      console.log('filePath', filePath);
      const result = await mySky.setJSON(filePath, jsonData);
      console.log(` setJSON:data ${result.data}`);
      console.log(`setJSON:skylink ${result.skylink}`);
    } catch (error) {
      console.log(`error with setJSON: ${error.message}`);
    }
    /*****/
    /************************************************/
    /*        Step 4.7 Code goes here              */
    /************************************************/
    try {
      console.log("Workshop :: ######### USER PROFILE DAC :: START #########  ");
     
      
      console.log(">>>>>>>>>>>>>>>>>>>>>> getProfile(userID) FIRST_TIME ##############################");
      let profileObj = await userprofile.getProfile(userID);
      console.log("#### getProfile(userID) FIRST_TIME ", profileObj);
      let profile = {
        version: 1,
        username: "ROCK",
        emailID: "skynethub.io@gmail.com",
        firstName: "skynet",
        lastName: "hub",
        contact: "911",
        aboutMe: "SkynetHub Founder",
        location: "USA",
        // topicsHidden: [
        //   "Fighter"
        // ],
        // topicsDiscoverable: [
        //   "Bond"
        // ],
        topics: ['Skynet', 'SkyDB'],
        avatar: [
          {
            "ext": "jpeg",
            "w": 300,
            "h": 300,
            "url": "sia://RABycdgWznT8YeIk57CDE9w0CiwWeHi7JoYOyTwq_UaSXQ/49/300"
          }
        ]
      }
      console.log(">>>>>>>>>>>>>>>>>>>>>> setProfile(profile) SET HARDCODED PROFILE DATA ##############################");
      await userprofile.setProfile(profile);
      console.log('setProfile(profile) SET HARDCODED PROFILE DATA : DONE !!');
      let prof = await userprofile.getProfile(userID);
      console.log('getProfile(userID) GET NEWLY SET PROFILE DATA '+prof);
      
      profile = {
        version: 1,
        username: "SkyHUB",
        emailID: "skynethub.io@gmail.com",
        firstName: "Sky",
        lastName: "hub",
        contact: "007",
        aboutMe: "SkynetHub Founder and Product Architect",
        location: "Virginia",
        // topicsHidden: [
        //   "Fighter"
        // ],
        // topicsDiscoverable: [
        //   "Bond"
        // ],
        topics: ['Skynet', 'SkyDB'],
        avatar: [
          {
            "ext": "jpeg",
            "w": 300,
            "h": 300,
            "url": "sia://RABycdgWznT8YeIk57CDE9w0CiwWeHi7JoYOyTwq_UaSXQ/23/300"
          }
        ]
      }

      console.log(">>>>>>>>>>>>>>>>>>>>>> updateProfile(profile) UPDATE  PROFILE DATA ##############################");
      await userprofile.updateProfile(profile);
      console.log('setProfile(profile) UPDATE PROFILE DATA : DONE !!');
      prof = await userprofile.getProfile(userID);
      console.log('getProfile(userID) GET UPDATED PROFILE DATA '+prof);

      console.log(">>>>>>>>>>>>>>>>>>>>>> GET HISTORY ##############################");

      let profileHistoryObj = await userprofile.getProfileHistory(userID);
      console.log("Workshop :: getProfileHistory() = ", profileHistoryObj);


      console.log(">>>>>>>>>>>>>>>>>>>>>> setPreferences(pref) SET HARDCODED PREFERENCES DATA ##############################");
      let pref = {
        version: 1,
        darkmode: true,
        portal: "siasky.net"
      }
      await userprofile.setPreferences(pref);
      console.log('setPreferences(pref) SET HARDCODED PREFERENCES DATA : DONE !!');
      let prefrencesObj = await userprofile.getPreferences(userID);
      console.log('setPreferences(pref) GET NEWLY SET PREFERENCES DATA '+prefrencesObj);

     console.log(">>>>>>>>>>>>>>>>>>>>>> GET HISTORY ##############################");
      let preferencesHistoryObj = await userprofile.getPreferencesHistory(userID);
      console.log("Workshop :: getPreferencesHistory() = ", preferencesHistoryObj);


      console.log(">>>>>>>>>>>>>>>>>>>>>> getProfile(userID) already created ##############################");
      SKyIdProf = await userprofile.getProfile("b85e1cd34633297d6004446f935d220918a8e2c5b98a5f5cc32c3c6c93f72d6b");
      console.log("#### getProfile(userID) already created " + SKyIdProf);

      console.log("Workshop :: ######### getProfile () : FETCH SKYID Profile #########  ");
      let SKyIdProf = await userprofile.getProfile("99efce9ce56128c1ecbbf094e59b716c4eecbad607e20b1593589d271c0e66cd");
      console.log("#### FETCH SKYID Result : " + SKyIdProf);

    } catch (error) {
      console.log(`Workshop :: error with userprofile DAC: ${error.message}`);
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
        username: "kushal"

      }

      await userprofile.createProfile(profile);
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
