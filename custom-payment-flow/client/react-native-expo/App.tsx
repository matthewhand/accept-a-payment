import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StripeProvider, useStripe} from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import HomeScreen from './HomeScreen';
import Card from './Card';
import {colors} from './colors';
import {fetchPublishableKey} from './helpers';

export type RootStackParamList = {
  Home: undefined;
  Card: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const stripeUrlScheme = 'accept-a-payment';

function PaymentNavigation() {
  const {handleURLCallback} = useStripe();
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (url?.startsWith(stripeUrlScheme + '://safepay')) {
      void handleURLCallback(url);
    }
  }, [url, handleURLCallback]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.white,
          headerStyle: {backgroundColor: colors.blurple},
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Card" component={Card} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [publishableKey, setPublishableKey] = useState<string | null>();

  useEffect(() => {
    void fetchPublishableKey().then(setPublishableKey);
  }, []);

  if (!publishableKey) {
    return (
      <View style={styles.center}>
        {publishableKey === null ? (
          <Text>Unable to load the Stripe publishable key. Check that the sample server is running.</Text>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading the payment sample" />
        )}
      </View>
    );
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme={stripeUrlScheme}
      setReturnUrlSchemeOnAndroid
    >
      <StatusBar barStyle="light-content" />
      <PaymentNavigation />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
