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

  useEffect(() => {
    setUploadPreview(props.fileSkylink);
  }, [props.fileSkylink]);

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
