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
import { UserProfileDAC , LastSeenPrivacyType,PrivacyType} from '@skynethub/userprofile-library';
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
    // call helper function for MySky Write
    await handleMySkyWrite();
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

  const handleMySkyWrite = async () => {
    /************************************************/
    /*        Step 4.7 Code goes here              */
    /************************************************/
    try {
      console.log("Workshop :: ######### USER PROFILE DAC :: START #########  ");
      console.log(">>>>>>>>>>>>>>>>>>>>>> USER STATUS (onLogin) ##############################");
      let userStatus = await userprofile.getUserStatus(userID);
      console.log(`getUserStatus(${userID}) onlogin : ${JSON.stringify(userStatus)}`);

      let statusresponse = await userprofile.setUserStatus("Online");
      console.log(`-->>>> setUserStatus("online") : ${JSON.stringify(statusresponse)}`);

      userStatus = await userprofile.getUserStatus(userID);
      console.log(`getUserStatus(${userID}) onlogin : ${JSON.stringify(userStatus)}`);

      userStatus = await userprofile.getUserStatus(userID,{skapp: "localhost"});
      console.log(`getUserStatus(${userID}, localhost) onlogin : ${JSON.stringify(userStatus)}`);

      console.log(">>>>>>>>>>>>>>>>>>>>>> USER PREFERENCES ##############################");
      let globalPreference = await userprofile.getGlobalPreferences();
      console.log(`getGlobalPreferences()  : ${JSON.stringify(globalPreference)}`);
      let skappPreference = await userprofile.getSkappPreferences();
      console.log(`getSkappPreferences()  : ${JSON.stringify(skappPreference)}`);
      let pref = {
        version: 1,
        darkmode: true,
        portal: "siasky.net",
        userStatus: {
          statusPrivacy: PrivacyType.PUBLIC,
          lastSeenPrivacy: LastSeenPrivacyType.PUBLIC_TS,
          updatefrequency: 0 // 0,1,5,10,15
        }
      }
      let result = await userprofile.setPreferences(pref);
      console.log(`setPreferences()  : ${JSON.stringify(result)}`);
      pref = {
        version: 1,
        darkmode: true,
        portal: "siasky.net",
        userStatus: {
          statusPrivacy: PrivacyType.PUBLIC,
          lastSeenPrivacy: LastSeenPrivacyType.PUBLIC_TS,
          updatefrequency: 0 // 0,1,5,10,15
        }
      }
      result = await userprofile.setGlobalPreferences(pref);
      console.log(`setPreferences()  : ${JSON.stringify(result)}`);
      globalPreference = await userprofile.getGlobalPreferences();
      console.log(`getGlobalPreferences()  : ${JSON.stringify(globalPreference)}`);
      skappPreference = await userprofile.getSkappPreferences();
      console.log(`getSkappPreferences()  : ${JSON.stringify(skappPreference)}`);

      console.log(">>>>>>>>>>>>>>>>>>>>>> USER STATUS (After change in preferences)  ##############################");
      userStatus = await userprofile.getUserStatus(userID);
      console.log(`getUserStatus(${userID}) onlogin : ${JSON.stringify(userStatus)}`);

      statusresponse = await userprofile.setUserStatus("Online");
      console.log(`-->>>> setUserStatus("online") : ${JSON.stringify(statusresponse)}`);

      userStatus = await userprofile.getUserStatus(userID);
      console.log(`getUserStatus(${userID}) onlogin : ${JSON.stringify(userStatus)}`);

      userStatus = await userprofile.getUserStatus(userID,{skapp: "localhost"});
      console.log(`getUserStatus(${userID}, localhost) onlogin : ${JSON.stringify(userStatus)}`);

      console.log(">>>>>>>>>>>>>>>>>>>>>> USER PROFILE  ##############################");
      
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

      //   console.log(">>>>>>>>>>>>>>>>>>>>>> GET HISTORY ##############################");

        let profileHistoryObj = await userprofile.getProfileHistory(userID);
        console.log("Workshop :: getProfileHistory() = ", profileHistoryObj);


      //   console.log(">>>>>>>>>>>>>>>>>>>>>> setPreferences(pref) SET HARDCODED PREFERENCES DATA ##############################");
        pref = {
          version: 1,
          darkmode: true,
          portal: "https://siasky.net/",
          userStatus: {
            statusPrivacy: "Private",
            lastSeenPrivacy: "Private",
            updatefrequency: 0
          }
        }
        await userprofile.setPreferences(pref);
        console.log('setPreferences(pref) SET HARDCODED PREFERENCES DATA : DONE !!');
        let prefrencesObj = await userprofile.getPreferences(userID);
        console.log('setPreferences(pref) GET NEWLY SET PREFERENCES DATA '+prefrencesObj);

       console.log(">>>>>>>>>>>>>>>>>>>>>> GET HISTORY ##############################");
        let preferencesHistoryObj = await userprofile.getPreferencesHistory(userID);
        console.log("Workshop :: getPreferencesHistory() = ", preferencesHistoryObj);

      //   console.log(">>>>>>>>>>>>>>>>>>>>>> getProfile(userID) already created ##############################");
      //   SKyIdProf = await userprofile.getProfile("b85e1cd34633297d6004446f935d220918a8e2c5b98a5f5cc32c3c6c93f72d6b");
      //   console.log("#### getProfile(userID) already created " + SKyIdProf);

      //   console.log("Workshop :: ######### getProfile () : FETCH SKYID Profile #########  ");
      //   let SKyIdProf = await userprofile.getProfile("99efce9ce56128c1ecbbf094e59b716c4eecbad607e20b1593589d271c0e66cd");
      //   console.log("#### FETCH SKYID Result : " + SKyIdProf);

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
    userprofile,
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
