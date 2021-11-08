import { useState, useEffect } from 'react';
import {
  Button,
  Form,
  Input,
  Header,
  Image,
  Loader,
  Dimmer,
  Segment,
  Divider,
  Label,
} from 'semantic-ui-react';
import { PopoverPicker } from './PopoverPicker';
import Links from './Links';
import FileDrop from './Filedrop';

// WorkshopForm is a simple form used for the Skynet Workshop
const WorkshopForm = (props) => {
  const [uploadPreview, setUploadPreview] = useState(props.fileSkylink);
  const [userID, setUserID] = useState(props.fileSkylink);
  const [globalUserStatus, setGlobalUserStatus] = useState(null);
  const [skappUserStatus, setSkappUserStatus] = useState(null);
  const [globalUserPref, setGlobalUserPref] = useState(null);
  const [skappUserPref, setSkappUserPref] = useState(null);

  useEffect(() => {
    setUploadPreview(props.fileSkylink);
    setUserID(props.userID)
  }, [props.fileSkylink, props.userID]);

  useEffect(() => {
    getUserStatus();
    getUserPref();
    const interval = setInterval(() => {
      getUserStatus();
      getUserPref();
      if (!userID) return;
    }, 60000);
    return () => clearInterval(interval);
  }, [userID]);

  const getUserStatus = async () => {
    if (userID) {
      //console.log("### props.userID "+userID);
      let userStatus = await props.userprofile.getUserStatus(userID);
      //console.log(`### Date.now() ${Date.now()} ### userStatus.lastSeen ${userStatus.lastSeen}`);
      let ts = new Date(Number(userStatus.lastSeen));
      //console.log("### ts (global)"+ts.toUTCString());
      setGlobalUserStatus(userStatus.status + "|" + userStatus.lastSeen && userStatus.lastSeen !== 0 ? ts.toLocaleString() : 0);
      //console.log("### userstatus"+userStatus.lastSeen);
      userStatus = await props.userprofile.getUserStatus(userID, { skapp: "localhost" });
      ts = new Date(Number(userStatus.lastSeen));
      //console.log("### ts (Skapp)"+ts.toUTCString());
      setSkappUserStatus(userStatus.status + "|" + ts.toLocaleString());
      //console.log("### userstatus"+userStatus.lastSeen);
    }
    else {
      return;
    }
  }
  const getUserPref = async () => {
    if (userID) {
      //console.log("### props.userID "+userID);
      const globalUserPref = await props.userprofile.getGlobalPreferences();
      console.log("### globalUserPref " + JSON.stringify(globalUserPref));
      setGlobalUserPref(globalUserPref.preferences.userStatus.statusPrivacy + "|" + globalUserPref.preferences.userStatus.lastSeenPrivacy + "|" + globalUserPref.preferences.userStatus.updatefrequency);
      const skappUserPref = await props.userprofile.getSkappPreferences();
      console.log("### skappUserPref " + JSON.stringify(skappUserPref));
      setSkappUserPref(skappUserPref.userStatus.statusPrivacy + "|" + skappUserPref.userStatus.lastSeenPrivacy + "|" + skappUserPref.userStatus.updatefrequency);
      //console.log("### userstatus"+userStatus.lastSeen);
    }
    else {
      return;
    }
  }
  return (
    <>
      <Segment>
        <Dimmer active={props.loading}>
          <Loader active={props.loading} />
        </Dimmer>

        {props.activeTab > 1 && (
          <>
            {props.loggedIn === true && (
              <Button onClick={props.handleMySkyLogout}>
                Log Out of MySky
              </Button>
            )}
            {props.loggedIn === false && (
              <Button color="green" onClick={props.handleMySkyLogin}>
                Login with MySky
              </Button>
            )}
            {props.loggedIn === null && <Button>Loading MySky...</Button>}
            {props.activeTab === 2 && (
              <Label pointing="left" color="green" basic>
                Once logged into MySky, we can save and load data in "files".
              </Label>
            )}
            <Divider />
          </>
        )}

        <Form onSubmit={props.handleSubmit}>
          {props.activeTab > 1 && (
            <>
              <Header as="h4">MySky File Data</Header>

              <Form.Field>
                <label>
                  Discoverable UserID <i>(Shared across MySky)</i>
                </label>
                <Input
                  placeholder="You must Login with MySky..."
                  value={props.userID}
                  icon="user circle"
                  iconPosition="left"
                />
              </Form.Field>
              <Form.Field>
                <label>
                  Golabal : UserStatus
                </label>
                <Input
                  placeholder="You must Login with MySky..."
                  value={globalUserStatus}
                />
              </Form.Field>
              <Form.Field>
                <label>
                  Skapp : UserStatus
                </label>
                <Input
                  placeholder="You must Login with MySky..."
                  value={skappUserStatus}
                />
              </Form.Field>
              <Divider />
              <Form.Field>
                <label>
                  Global : User Preferences
                </label>
                <Input
                  placeholder="You must Login with MySky..."
                  value={globalUserPref}
                />
              </Form.Field>
              <Form.Field>
                <label>
                  Skapp : User Preferences
                </label>
                <Input
                  placeholder="You must Login with MySky..."
                  value={skappUserPref}
                />
              </Form.Field>
            </>

          )}
          {/* Input for file */}
          <Button primary type="submit">
            Test UserProfile
          </Button>
        </Form>
      </Segment>
      <Links
        fileSkylink={props.fileSkylink}
        webPageSkylink={props.webPageSkylink}
      />
    </>
  );
};

export default WorkshopForm;
