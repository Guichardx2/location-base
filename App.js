import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import openDatabase from "./database/db";

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações
  const [status, requestPermission] = Location.useForegroundPermissions(); // hook para solicitar permissão de localização
  const db = openDatabase(); // abre o banco de dados

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  async function storeDarkMode(value) {
    try {
      await AsyncStorage.setItem("darkMode", JSON.stringify(value));
    } catch (error) {
      console.error("Error saving dark mode preference:", error);
    }
  }

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    try {
      const value = await AsyncStorage.getItem("darkMode");
      if (value !== null) {
        setIsSwitchOn(JSON.parse(value));
      }
    } catch (error) {
      console.error("Error loading dark mode preference:", error);
    }
  }

  // darkMode switch event
  async function onToggleSwitch() {
    setIsSwitchOn(!isSwitchOn);
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    try {
      // Solicita permissão, se necessário
      if (!status?.granted) {
        const newStatus = await requestPermission();
        if (!newStatus.granted) {
          alert("Permissão de localização negada.");
          return;
        }
      }

      // Captura a localização
      const { coords } = await Location.getCurrentPositionAsync({});

      if (!coords) {
        alert("Não foi possível obter a localização.");
        return;
      }

      console.log("Status da permissão:", status);
      console.log("Coordenadas:", coords);

      // Insere no banco
      const result = db.runSync(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?)",
        [coords.latitude, coords.longitude]
      );

      const newLocation = {
        id: result.lastInsertRowId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setLocations((prev) => [newLocation, ...prev]);
    } catch (error) {
      console.error("Erro ao capturar localização:", error);
      alert("Erro ao capturar localização.");
    } finally {
      setIsLoading(false);
    }
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);

    try {
      const data = db.getAllSync("SELECT * FROM locations ORDER BY id DESC");
      setLocations(data);
      console.log("Localizações carregadas:", data);
    } catch (error) {
      console.error("Erro ao carregar localizações:", error);
    } finally {
      setIsLoading(false);
    }

  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
      storeDarkMode(true);
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  useEffect(() => {
    if (status === null) {
      requestPermission();
    }
  }, [status]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
