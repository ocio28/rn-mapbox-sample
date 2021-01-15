import React, { Component } from "react";
import { StyleSheet, View, PermissionsAndroid, TouchableOpacity, Text } from "react-native";

import MapboxGL from "@react-native-mapbox-gl/maps";
import BackgroundGeolocation from "react-native-background-geolocation";

import { mapboxgltoken } from "./config.json";

MapboxGL.setAccessToken(mapboxgltoken);
MapboxGL.setTelemetryEnabled(false);

/*const shape = 
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [
              -70.6693, -33.4489
                  ],
            [
              -70.6683, -33.4489
            ],
            [
              -70.6683, -33.4495
            ],[
              -70.6693, -33.4495
            ],
            [
              -70.6693, -33.4489
            ]
                ]
              }
            }
          ]
        }*/

class App extends Component {
  state = {
    latitude: 0,
    longitude: 0,
    current: {
      latitude: 0,
      longitude: 0,
    },
    polygon: [],
    record: false
  }

  componentDidMount() {
    console.log('[componentDidMount]')
    PermissionsAndroid.requestMultiple(
      [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION],
      {
        title: 'Give Location Permission',
        message: 'App needs location permission to find your position.'
      }
    ).then(granted => {
      console.log(granted);
      if (granted) {
        this.configureBackgroundLocation()
      }
    }).catch(err => {
      console.warn(err);
    });
  }

  configureBackgroundLocation = () => {
    console.log('[configureBackgroundLocation]')
    ////
    // 1.  Wire up event-listeners
    //

    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.onLocation(this.onLocation, this.onError);

    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.onMotionChange(this.onMotionChange);

    // This event fires when a change in motion activity is detected
    BackgroundGeolocation.onActivityChange(this.onActivityChange);

    // This event fires when the user toggles location-services authorization
    BackgroundGeolocation.onProviderChange(this.onProviderChange);

    ////
    // 2.  Execute #ready method (required)
    //
    BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 5,
      // Activity Recognition
      stopTimeout: 1,
      // Application config
      //debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
    }, (state) => {
      console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);

      if (!state.enabled) {
        ////
        // 3. Start tracking!
        //
        BackgroundGeolocation.start(() => {
          console.log("- Start success");
          this.currentLocation()
        });
      } else {
        this.currentLocation()
      }
    });
  }

  componentWillUnmount() {
    BackgroundGeolocation.removeListeners();
  }
  onLocation = (location) => {
    console.log('[location] -', location);
    const coords = location.coords
    const position = {
      latitude: coords.latitude,
      longitude: coords.longitude
    }
    this.setState(position)

    if (this.state.record) {
      this.setState({
        polygon: [ ...this.state.polygon, position]
      })
    }
  }
  onError(error) {
    console.warn('[location] ERROR -', error);
  }
  onActivityChange(event) {
    console.log('[activitychange] -', event);  // eg: 'on_foot', 'still', 'in_vehicle'
  }
  onProviderChange(provider) {
    console.log('[providerchange] -', provider.enabled, provider.status);
  }
  onMotionChange(event) {
    console.log('[motionchange] -', event.isMoving, event.location);
  }

  currentLocation = () => {
    BackgroundGeolocation.getCurrentPosition().then(location => {
      console.log('[LOCATION]', location)
      const coords = location.coords
      this.setState({
        current: {
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      })
    })
  }

  grabar = () => {
    this.setState({ record: true, polygon: [] })
  }

  stop = () => {
    this.setState({ record: false })
  }

  render () {
    const { latitude, longitude, polygon, record, current } = this.state
    const polygonShape = 
      {
      "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "LineString",
              "coordinates": polygon.map(location => [location.longitude, location.latitude])
            }
          }
        ]
    }
    
    //[-70.6693, -33.4489]
    return (
      <View style={{flex:1}}>
        <View>
          <Text style={styles.text}>{latitude}, {longitude}</Text>
        </View>
        <MapboxGL.MapView style={styles.map}>
          <MapboxGL.Camera zoomLevel={16} centerCoordinate={[current.longitude, current.latitude]} />
          <MapboxGL.UserLocation />
          <MapboxGL.ShapeSource id='line1' shape={polygonShape}>
            <MapboxGL.FillLayer id='linelayer1' style={{ fillOpacity: 0.4 }} />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>
        <View style={{ flexDirection: 'row'}}>
          <TouchableOpacity onPress={this.currentLocation} style={styles.boton}>
            <Text style={styles.text}>Ubicacion actual</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={record ? this.stop : this.grabar} style={styles.boton}>
            <Text style={styles.text}>{record ? 'Detener' : 'Grabar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  },
  boton: {
    padding: 16,
    flex: 1
  },
  text: {
    fontSize: 16,
    textAlign: 'center'
  }
});


export default App;
